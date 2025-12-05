import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: readFileSync(resolve(__dirname, "../ca.pem")).toString(),
    rejectUnauthorized: true,
  },
});

const db = drizzle(pool);

async function main() {
  console.log("Running migrations...");
  
  await migrate(db, { migrationsFolder: "./drizzle" });
  
  console.log("✓ Migrations completed successfully!");
  
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

