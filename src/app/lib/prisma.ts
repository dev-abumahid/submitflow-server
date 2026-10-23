import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { configs } from '../configs/index.js';
import { logger } from './logger.js';

// opening a connection to a remote database takes seconds (TCP + TLS + auth), so keep
// idle connections around instead of pg's default of closing them after 10 seconds
const adapter = new PrismaPg(
  {
    connectionString: configs.db_url as string,
    idleTimeoutMillis: 5 * 60 * 1000,
    // stops routers / NAT from silently dropping the idle connections
    keepAlive: true,
  },
  {
    // the server closed an idle connection (e.g. Neon suspended): the pool drops it
    // and opens a new one on the next query, so this is only worth a warning
    onPoolError: (err) => logger.warn({ err }, 'Idle database connection closed'),
  },
);
const prisma = new PrismaClient({ adapter });

export { prisma };
