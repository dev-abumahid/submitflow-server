import { defineConfig } from 'vitest/config';

const secret = (name: string) => `${name}-test-secret-0123456789abcdefghijklmnop`;

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    // every test starts with fresh mocks
    mockReset: true,
    // set before the app reads its config; values in .env don't override these
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      ACCESS_TOKEN: secret('access'),
      FRONT_END_URL: 'http://localhost:5173',
      CORS_ORIGINS: 'http://localhost:5173',
      ENABLE_SWAGGER: 'false',
    },
  },
});
