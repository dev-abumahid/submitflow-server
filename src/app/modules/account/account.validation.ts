import z from 'zod';

const email = z.email('A valid email is required.').transform((e) => e.toLowerCase());
const password = z
  .string('Password is required.')
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.'); // bcrypt ignores bytes past 72

const sign_up = z.object({
  email,
  password,
  fullName: z.string('Full name is required.').trim().min(1).max(100),
});

const sign_in = z.object({
  email,
  password: z.string('Password is required.').max(72),
});

const change_password = z.object({
  oldPassword: z.string('Old Password is required').max(72),
  newPassword: password,
});

// optional: browsers send the refresh token as a cookie instead
const refresh_token = z.object({ refreshToken: z.string().min(1).max(256).optional() }).optional();

export const account_validation = {
  sign_up,
  sign_in,
  change_password,
  refresh_token,
};
