import { createClient } from 'redis'
import { config } from '../../config/index.js'

// ─── Redis Client ──────────────────────────────────────────
const redis = createClient({
  url: config.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis reconnection failed after 10 attempts')
        process.exit(1)
      }
      // exponential backoff — wait longer between each retry
      // 100ms, 200ms, 400ms... up to 3 seconds max
      return Math.min(retries * 100, 3000)
    }
  }
})

redis.on('error', (err) => {
  console.error('Redis client error:', err)
})

redis.on('connect', () => {
  console.log('✅ Redis connected')
})

redis.on('reconnecting', () => {
  console.log('⚠️  Redis reconnecting...')
})

/**
 * Connect to Redis on startup
 * Called from app.ts before accepting requests
 */
export async function connectRedis(): Promise<void> {
  await redis.connect()
}

export default redis
