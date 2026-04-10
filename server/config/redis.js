const Redis = require("ioredis");
const env = require("./env");

const redisConfig = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
};

const redis = new Redis(env.REDIS_URL, redisConfig);

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

module.exports = redis;
