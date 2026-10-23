import bcrypt from 'bcrypt';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { configs } from '../../configs/index.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app_error.js';
import { type TokenUser } from '../../utils/JWT.js';
import { hashRefreshToken, readRefreshToken } from '../../utils/session.js';

// cheap hashes under tests, the real cost everywhere else
const BCRYPT_ROUNDS = configs.is_test ? 4 : 12;

// a rotated refresh token that comes back within this window is most likely a
// parallel refresh (two tabs at once), not theft, so it doesn't end the session
const REFRESH_REUSE_GRACE_MS = 30 * 1000;

// a valid hash to compare against when the account doesn't exist, so login takes
// the same time either way (prevents finding registered emails by timing)
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_ROUNDS);

const toTokenUser = (account: {
  id: string;
  email: string;
  role: TokenUser['role'];
  tokenVersion: number;
}): TokenUser => ({
  accountId: account.id,
  email: account.email,
  role: account.role,
  tokenVersion: account.tokenVersion,
});

const create_account_into_db = async (req: Request) => {
  const payload: { email: string; password: string; fullName: string } = req.body;

  const exists = await prisma.account.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });
  if (exists) {
    throw new AppError('An account with this email already exists', 409);
  }

  const account = await prisma.account.create({
    data: {
      id: randomUUID(),
      email: payload.email,
      fullName: payload.fullName,
      password: await bcrypt.hash(payload.password, BCRYPT_ROUNDS),
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  return account;
};

const login_user_into_db = async (req: Request): Promise<TokenUser> => {
  const payload: { email: string; password: string } = req.body;
  const invalid = new AppError('Invalid email or password', 401);

  const account = await prisma.account.findUnique({ where: { email: payload.email } });

  // always run bcrypt, and never skip the password check so timing stays constant
  const isPasswordMatch = await bcrypt.compare(payload.password, account?.password ?? DUMMY_HASH);
  if (!account || !account.password || !isPasswordMatch) {
    throw invalid;
  }

  if (account.isDeleted) {
    throw new AppError('Account is deleted', 401);
  }

  return toTokenUser(account);
};

const get_user_account_from_db = async (req: Request) => {
  return prisma.account.findUnique({
    where: { id: req.user!.accountId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isDeleted: true,
    },
  });
};

/** Changes the password and revokes every other session. Returns the user for a new token. */
const change_password_into_db = async (req: Request): Promise<TokenUser> => {
  const payload: { oldPassword: string; newPassword: string } = req.body;

  if (payload.oldPassword === payload.newPassword) {
    throw new AppError('New password must be different from the old password', 400);
  }

  const account = await prisma.account.findUnique({ where: { id: req.user!.accountId } });
  if (!account) {
    throw new AppError('Account not found', 404);
  }
  if (!account.password) {
    throw new AppError('Account has no password set', 400);
  }

  const isPasswordMatch = await bcrypt.compare(payload.oldPassword, account.password);
  if (!isPasswordMatch) {
    throw new AppError('Incorrect password', 401);
  }

  const updated = await prisma.account.update({
    where: { id: account.id },
    data: {
      password: await bcrypt.hash(payload.newPassword, BCRYPT_ROUNDS),
      tokenVersion: { increment: 1 },
    },
  });
  await prisma.refreshToken.deleteMany({ where: { accountId: account.id } });
  return toTokenUser(updated);
};

/** Revokes every access and refresh token issued for the account. */
const sign_out_everywhere_from_db = async (req: Request) => {
  const accountId = req.user!.accountId;
  await prisma.account.update({
    where: { id: accountId },
    data: { tokenVersion: { increment: 1 } },
  });
  await prisma.refreshToken.deleteMany({ where: { accountId } });
  return null;
};

/** Ends the session the refresh token belongs to (this device only). */
const sign_out_from_db = async (req: Request) => {
  const token = readRefreshToken(req);
  if (!token) return null;
  const row = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(token) },
    select: { familyId: true },
  });
  if (row) await prisma.refreshToken.deleteMany({ where: { familyId: row.familyId } });
  return null;
};

/**
 * Validates and uses up a refresh token. Returns the user and the session it
 * belongs to, so the controller can issue the next token of that session.
 */
const refresh_session_from_db = async (
  req: Request,
): Promise<{ user: TokenUser; familyId: string }> => {
  const invalid = new AppError('Invalid or expired refresh token', 401);
  const token = readRefreshToken(req);
  if (!token) throw invalid;

  const tokenHash = hashRefreshToken(token);
  const row = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      account: {
        select: { id: true, email: true, role: true, tokenVersion: true, isDeleted: true },
      },
    },
  });
  if (!row) throw invalid;

  const endSession = () => prisma.refreshToken.deleteMany({ where: { familyId: row.familyId } });

  if (row.usedAt) {
    // An already rotated token came back. Outside the grace window that means two
    // parties hold this session (the token was stolen), so end the whole session.
    if (Date.now() - row.usedAt.getTime() > REFRESH_REUSE_GRACE_MS) await endSession();
    throw invalid;
  }

  const isStale =
    row.expiresAt.getTime() < Date.now() ||
    row.account.isDeleted ||
    row.account.tokenVersion !== row.tokenVersion; // password changed / signed out everywhere
  if (isStale) {
    await endSession();
    throw invalid;
  }

  // mark it used atomically, so of two parallel refreshes only one gets a new token
  const used = await prisma.refreshToken.updateMany({
    where: { tokenHash, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (!used.count) throw invalid;

  return { user: toTokenUser(row.account), familyId: row.familyId };
};

export const account_services = {
  create_account_into_db,
  login_user_into_db,
  get_user_account_from_db,
  change_password_into_db,
  sign_out_everywhere_from_db,
  sign_out_from_db,
  refresh_session_from_db,
};
