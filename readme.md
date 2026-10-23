# SubmitFlow Server

REST API for SubmitFlow: students submit projects, mentors review them.

Built with Express 5, TypeScript, Prisma 7 and PostgreSQL.

## Requirements

- Node.js **22.12+**
- PostgreSQL database (local, or hosted like [Neon](https://neon.tech))

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the `.env` file

```bash
cp .env.example .env
```

Then fill it in:

| Variable                                          | Required | Description                                                                             |
| ------------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                    | yes      | PostgreSQL connection string                                                            |
| `ACCESS_TOKEN`                                    | yes      | JWT secret, 32+ random characters. Generate one with `openssl rand -hex 32`             |
| `FRONT_END_URL`                                   | yes      | Frontend URL, e.g. `http://localhost:5173`                                              |
| `PORT`                                            | no       | Defaults to `5000`                                                                      |
| `NODE_ENV`                                        | no       | `development` (default) / `production` / `test`                                         |
| `ACCESS_EXPIRES`                                  | no       | Access token lifetime, defaults to `15m`                                                |
| `REFRESH_EXPIRES_DAYS`                            | no       | Refresh token lifetime in days, defaults to `30`                                        |
| `CORS_ORIGINS`                                    | no       | Comma separated allowed origins, defaults to `FRONT_END_URL`                            |
| `TRUST_PROXY`                                     | no       | Number of reverse proxies in front of the app (`1` behind Nginx/Caddy), defaults to `0` |
| `DEFAULT_MENTOR_EMAIL`, `DEFAULT_MENTOR_PASSWORD` | for seed | Mentor account created by `npm run db:seed:mentor`. Password must be 8–72 characters    |
| `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` | no       | Cloudinary credentials, only needed for file uploads                                    |
| `ENABLE_SWAGGER`                                  | no       | API docs are on outside production by default. Set `true` to enable them in production  |
| `DEVELOPMENT_BASE_URL`, `PRODUCTION_BASE_URL`     | no       | Server URLs listed in the API docs                                                      |

The server checks these on startup and exits with a clear message if one is missing or invalid.

### 3. Set up the database

Apply the migrations (this also generates the Prisma client):

```bash
npm run db:migrate
```

### 4. Create the mentor account

Sign-up only creates `STUDENT` accounts. Mentors are created with the seed script, using `DEFAULT_MENTOR_EMAIL` and `DEFAULT_MENTOR_PASSWORD` from `.env`:

```bash
npm run db:seed:mentor
```

It's safe to run more than once: it skips the mentor if it already exists.

### 5. Start the server

```bash
npm run dev
```

The server runs on `http://localhost:5000` and restarts when you change a file.

- API: `http://localhost:5000/api`
- API docs (Swagger): `http://localhost:5000/docs`
- Full endpoint reference for the frontend: [`apimap.md`](./apimap.md)

## Scripts

| Command                  | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `npm run dev`            | Start in development mode with auto-reload                |
| `npm run build`          | Compile TypeScript to `dist/`                             |
| `npm test`               | Run the tests once (no database needed, Prisma is mocked) |
| `npm run test:watch`     | Run the tests in watch mode                               |
| `npm run check`          | Type-check without building                               |
| `npm run lint`           | Lint the code (`lint:fix` to fix what it can)             |
| `npm run format`         | Format the code with Prettier                             |
| `npm run db:migrate`     | Create and apply a migration after changing the schema    |
| `npm run db:deploy`      | Apply existing migrations (production)                    |
| `npm run db:seed:mentor` | Create the default mentor account                         |

## Changing the database schema

The schema is split into files in `prisma/schema/`. After editing them:

```bash
npm run db:migrate -- --name describe_your_change
```

Commit the generated folder in `prisma/migrations/`.

## Production

### Without Docker

```bash
npm ci
npx prisma generate
npm run build
npm run db:deploy
NODE_ENV=production node dist/server.js
```

### With Docker

```bash
docker build -t submitflow-server .
docker run -p 5000:5000 --env-file .env -e NODE_ENV=production submitflow-server
```

The image doesn't include the Prisma CLI, so apply migrations separately before starting it (`npm run db:deploy` from your machine or CI, pointed at the production `DATABASE_URL`).

### Notes

- **Put the server in the same region as the database.** Every query is a round trip to the database, so a far-away database makes each request slow (about 400 ms per query when the server is far from the database).
- Hosted databases like Neon's free plan suspend after a few minutes idle, so the first request after a break can take several seconds.
- Behind a reverse proxy (Nginx, Caddy), set `TRUST_PROXY=1` so rate limiting sees the real client IP.

## Project structure

```
prisma/
  schema/           database schema (one file per area)
  migrations/       generated migrations
src/
  server.ts         starts the HTTP server
  app.ts            Express app: middleware, routes, error handling
  routes.ts         mounts the module routers under /api
  app/
    configs/        environment variables (validated on startup)
    lib/            Prisma client, logger
    middlewares/    auth, request validation, rate limiting, errors
    modules/
      account/      sign up / in / out, tokens, password
      project/      project submission and review
    utils/          helpers, mentor seed script
tests/              API tests (Vitest + Supertest)
```
