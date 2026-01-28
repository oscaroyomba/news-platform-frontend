import { Pool } from "pg";

const connectionString = process.env.ANALYTICS_DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing ANALYTICS_DATABASE_URL in environment.");
}

// Reuse pool across hot reloads (dev)
declare global {
  // eslint-disable-next-line no-var
  var __analyticsPool: Pool | undefined;
}

export const pool =
  global.__analyticsPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  global.__analyticsPool = pool;
}