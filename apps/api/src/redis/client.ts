import { createClient, RedisClientType } from "redis";
import { env } from "../config/env";

const redisClient = createClient({
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  socket: {
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT),
  },
});

// Handle errors - Redis v4+ client is an EventEmitter
(redisClient as any).on?.("error", (err: Error) => {
  console.error("Redis Client Error", err);
});

let isConnected = false;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
      console.log("✓ Redis connected successfully");
    } catch (err) {
      console.error("Failed to connect to Redis:", err);
      throw err;
    }
  }
  return redisClient as RedisClientType;
}


