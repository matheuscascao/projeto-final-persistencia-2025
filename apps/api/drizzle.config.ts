import type { Config } from "drizzle-kit";
import { readFileSync } from "fs";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
    ssl: {
      ca: readFileSync("./ca.pem").toString(),
      rejectUnauthorized: true,
    },
  },
} satisfies Config;


