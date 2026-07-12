// Runs Prisma migrations during the Vercel build, but only once DATABASE_URL exists —
// keeps the static-site build working even before the Postgres database is provisioned.
import { execSync } from 'node:child_process';

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL found — running prisma migrate deploy...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} else {
  console.log('No DATABASE_URL set yet — skipping database migration for this build.');
}
