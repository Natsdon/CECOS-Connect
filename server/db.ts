import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Check if env is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create standard pg pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Export drizzle instance
export const db = drizzle(pool, { schema });
export const poolInstance = pool;
