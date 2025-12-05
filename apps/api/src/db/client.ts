import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { env } from "../config/env";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes("sslmode=require") 
    ? { rejectUnauthorized: false } 
    : undefined,
});

// Test connection
pool.on("connect", () => {
  console.log("✓ PostgreSQL connected successfully");
});

pool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err);
});

export const db = drizzle(pool, { schema });

export type DbClient = typeof db;


