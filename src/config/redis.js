const redis = require('redis');
const { logger } = require('../utils/logger');

class RedisManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Redis 클라이언트 생성
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis: Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            const delay = Math.min(retries * 100, 3000);
            logger.info(`Redis: Reconnecting in ${delay}ms...`);
            return delay;
          }
        }
      });

      // 에러 핸들링
      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis: Connected successfully');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis: Ready to accept commands');
      });

      // 연결
      await this.client.connect();
      
      return this.client;
    } catch (error) {
      logger.error('Redis connection failed:', error);
      // Redis 연결 실패해도 앱은 동작하도록 함
      this.isConnected = false;
      return null;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis: Disconnected');
    }
  }

  // 캐시 헬퍼 메서드들
  async get(key) {
    if (!this.isConnected) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isConnected) return false;
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async flush() {
    if (!this.isConnected) return false;
    try {
      await this.client.flushAll();
      logger.info('Redis: Cache flushed');
      return true;
    } catch (error) {
      logger.error('Redis FLUSH error:', error);
      return false;
    }
  }

  // 패턴으로 키 삭제
  async delPattern(pattern) {
    if (!this.isConnected) return false;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Redis DEL pattern error for ${pattern}:`, error);
      return false;
    }
  }

  // 캐시 미들웨어
  cacheMiddleware(keyGenerator, ttl = 3600) {
    return async (req, res, next) => {
      if (!this.isConnected) {
        return next();
      }

      const key = typeof keyGenerator === 'function' 
        ? keyGenerator(req) 
        : `cache:${req.originalUrl}`;

      try {
        const cached = await this.get(key);
        if (cached) {
          logger.debug(`Cache hit for ${key}`);
          return res.json(cached);
        }
      } catch (error) {
        logger.error('Cache middleware error:', error);
      }

      // 원래 res.json을 오버라이드하여 응답 캐싱
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // 성공 응답만 캐싱
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(key, data, ttl).catch(err => {
            logger.error('Cache set error:', err);
          });
        }
        return originalJson(data);
      };

      next();
    };
  }

  // 사용자별 캐시 무효화
  async invalidateUserCache(userId) {
    if (!this.isConnected) return;
    
    const patterns = [
      `user:${userId}:*`,
      `jobs:user:${userId}:*`,
      `applications:user:${userId}:*`
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
    
    logger.info(`Cache invalidated for user ${userId}`);
  }

  // 일자리별 캐시 무효화
  async invalidateJobCache(jobId) {
    if (!this.isConnected) return;
    
    const patterns = [
      `job:${jobId}:*`,
      `jobs:*` // 목록 캐시도 무효화
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
    
    logger.info(`Cache invalidated for job ${jobId}`);
  }
}

module.exports = new RedisManager();