const { getRedisClient } = require('../config/database');

class CacheService {
  constructor() {
    this.client = null;
    this.defaultTTL = 3600; // 1시간
  }

  async init() {
    this.client = getRedisClient();
    return this.client;
  }

  async get(key) {
    try {
      if (!this.client) await this.init();
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.client) await this.init();
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.client) await this.init();
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async flush() {
    try {
      if (!this.client) await this.init();
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // 일자리 관련 캐시 키 생성
  getJobsKey(filters = {}) {
    const { category, location, urgent, limit, offset } = filters;
    return `jobs:${category || 'all'}:${location || 'all'}:${urgent || 'all'}:${limit || 10}:${offset || 0}`;
  }

  getJobKey(jobId) {
    return `job:${jobId}`;
  }

  getUserKey(userId) {
    return `user:${userId}`;
  }

  getUserStatsKey(userId) {
    return `user:${userId}:stats`;
  }

  // 패턴으로 키 삭제
  async deletePattern(pattern) {
    try {
      if (!this.client) await this.init();
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // 일자리 관련 캐시 무효화
  async invalidateJobCaches(jobId = null) {
    const patterns = ['jobs:*'];
    if (jobId) {
      patterns.push(`job:${jobId}`);
    }

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }
  }

  // 사용자 관련 캐시 무효화
  async invalidateUserCaches(userId) {
    await this.deletePattern(`user:${userId}*`);
  }
}

module.exports = new CacheService();