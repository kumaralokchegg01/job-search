import { Redis } from 'ioredis';
import Debug from 'debug';

const log = Debug('jobintel:redis');

let redisClient: Redis | null = null;

/**
 * Initialize Redis connection
 */
export async function initRedis(): Promise<Redis> {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: true,
      lazyConnect: false,
    });

    redisClient.on('connect', () => {
      log('✓ Connected to Redis');
    });

    redisClient.on('error', (err) => {
      log('✗ Redis error:', err.message);
    });

    redisClient.on('reconnecting', () => {
      log('⟳ Reconnecting to Redis...');
    });

    return redisClient;
  } catch (err) {
    log('Failed to initialize Redis:', err);
    throw err;
  }
}

/**
 * Get Redis client
 */
export function getRedis(): Redis {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initRedis() first.');
  }
  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    log('✓ Disconnected from Redis');
  }
}

/**
 * Health check for Redis
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (!redisClient) {
      return false;
    }

    const result = await redisClient.ping();
    return result === 'PONG';
  } catch (err) {
    log('Redis health check failed:', err);
    return false;
  }
}

export default getRedis;
