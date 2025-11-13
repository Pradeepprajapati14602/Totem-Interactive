import Redis from 'ioredis';

let redis: Redis | null = null;

const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

if (REDIS_ENABLED && process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    redis = null;
  }
}


export class CacheService {
  private memoryCache = new Map<string, { value: unknown; expiry: number }>();

  async get<T>(key: string): Promise<T | null> {
    if (redis) {
      try {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }

    const cached = this.memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value as T;
    }
    return null;
  }

  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    if (redis) {
      try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
        return;
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }

    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(key);
        return;
      } catch (error) {
        console.error('Redis del error:', error);
      }
    }

    this.memoryCache.delete(key);
  }

  async clearPattern(pattern: string): Promise<void> {
    if (redis) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        return;
      } catch (error) {
        console.error('Redis clearPattern error:', error);
      }
    }

    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const cache = new CacheService();

export default redis;
