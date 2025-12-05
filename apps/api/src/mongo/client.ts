import { MongoClient, Db, ServerApiVersion } from "mongodb";
import { env } from "../config/env";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();
    // Ping to confirm connection
    await client.db("admin").command({ ping: 1 });
    console.log("✓ MongoDB connected successfully");
  }
  return client;
}

export async function getMongoDb(): Promise<Db> {
  if (!db) {
    const c = await getMongoClient();
    db = c.db(env.MONGODB_DB_NAME);
  }
  return db;
}


