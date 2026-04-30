import { createClient } from "redis";
import { Redis } from "@upstash/redis";
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("✅ Connected to Redis");
});
redisClient.on("ready", () => {
  console.log("🚀 Redis is ready to use");
});
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
  }
})();
export default redisClient;
