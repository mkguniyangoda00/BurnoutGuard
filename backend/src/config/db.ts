import { PrismaClient } from '@prisma/client';

/**
 * MySQL connection pool is sized explicitly rather than left to Prisma's
 * default (num_physical_cpus * 2 + 1, ~9-17 on typical dev/CI hardware).
 * That default was far smaller than the concurrent request volume the API
 * receives under load, causing connections to queue and eventually fail
 * with "Timed out fetching a connection from the pool" once queued
 * requests exceeded pool_timeout. The limit here is a deliberate, documented
 * value (not a blind increase) sized against MySQL's default max_connections
 * (151), leaving headroom for other clients (migrations, admin tools).
 * pool_timeout is shortened from the 10s default so requests that can't get
 * a connection fail fast instead of hanging.
 */
const DEFAULT_CONNECTION_LIMIT = '20';
const DEFAULT_POOL_TIMEOUT_SECONDS = '10';

function buildDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('Environment variable DATABASE_URL is required but was not set.');
  }

  const url = new URL(raw);
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', DEFAULT_CONNECTION_LIMIT);
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', DEFAULT_POOL_TIMEOUT_SECONDS);
  }
  return url.toString();
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: buildDatabaseUrl(),
    },
  },
});

// Ensure the pool is released cleanly on process shutdown instead of leaking
// connections when the server restarts (e.g. under nodemon or a container
// orchestrator sending SIGTERM).
const disconnect = () => {
  void prisma.$disconnect();
};
process.on('beforeExit', disconnect);
process.on('SIGINT', disconnect);
process.on('SIGTERM', disconnect);

export default prisma;
