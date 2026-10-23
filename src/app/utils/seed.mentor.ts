import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { configs } from '../configs/index.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { account_validation } from '../modules/account/account.validation.js';

// same cost as account.service so seeded passwords verify the same way
const BCRYPT_ROUNDS = configs.is_test ? 4 : 12;

// reuse the sign-up rules so the seeded mentor can't have a weaker password than a real user
const mentorEnv = account_validation.sign_up.pick({ email: true, password: true });

const seed_mentor = async () => {
  const parsed = mentorEnv.safeParse({
    email: process.env.DEFAULT_MENTOR_EMAIL,
    password: process.env.DEFAULT_MENTOR_PASSWORD,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(
      `Invalid DEFAULT_MENTOR_EMAIL / DEFAULT_MENTOR_PASSWORD:\n${issues.join('\n')}`,
    );
  }
  const { email, password } = parsed.data;

  const existing = await prisma.account.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existing) {
    // never silently promote a student account to mentor
    if (existing.role !== 'MENTOR') {
      throw new Error(`An account with ${email} already exists with role ${existing.role}`);
    }
    logger.info(`Mentor ${email} already exists, skipping`);
    return;
  }

  await prisma.account.create({
    data: {
      id: randomUUID(),
      email,
      fullName: 'Mentor',
      role: 'MENTOR',
      password: await bcrypt.hash(password, BCRYPT_ROUNDS),
    },
  });
  logger.info(`Mentor ${email} created`);
};

seed_mentor()
  .catch((error) => {
    logger.error(error, 'Failed to seed mentor');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
