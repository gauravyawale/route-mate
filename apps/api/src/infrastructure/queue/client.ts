import { config } from "../../config/index.js";

// Parse host and port from REDIS_URL for BullMQ
// BullMQ 5.x does not accept a url string — needs host/port directly
// REDIS_URL format: redis://localhost:6379
const redisUrl = new URL(config.REDIS_URL);

export const bullMQConnection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || "6379"),
  maxRetriesPerRequest: null as null, // required by BullMQ
  enableReadyCheck: false, // required by BullMQ
  lazyConnect: false,
};
