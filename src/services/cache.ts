import { getRedisClient } from '@/config/database';
import { logger } from '@/utils/logger';
import { CacheService as ICacheService } from '@/types/services';
import { JobFilters } from '@/types/job';

class CacheService implements ICacheService {
  private client: any = null;
  private readonly defaultTTL: number = 3600; // 1시간

  async init() {
    this.client = getRedisClient();
    return this.client;
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.client) await this.init();
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set<T = any>(key: string, value: T, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      if (!this.client) await this.init();
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.client) await this.init();
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    try {
      if (!this.client) await this.init();
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  // 일자리 관련 캐시 키 생성
  getJobsKey(filters: JobFilters = {}): string {
    const { category, location, urgent, limit, offset } = filters;
    return `jobs:${category || 'all'}:${location || 'all'}:${urgent || 'all'}:${limit || 10}:${offset || 0}`;
  }

  getJobKey(jobId: string): string {
    return `job:${jobId}`;
  }

  getUserKey(userId: string): string {
    return `user:${userId}`;
  }

  getUserStatsKey(userId: string): string {
    return `user:${userId}:stats`;
  }

  // 패턴으로 키 삭제
  async deletePattern(pattern: string): Promise<boolean> {
    try {
      if (!this.client) await this.init();
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // 일자리 관련 캐시 무효화
  async invalidateJobCaches(jobId?: string): Promise<void> {
    const patterns = ['jobs:*'];
    if (jobId) {
      patterns.push(`job:${jobId}`);
    }

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }
  }

  // 사용자 관련 캐시 무효화
  async invalidateUserCaches(userId: string): Promise<void> {
    await this.deletePattern(`user:${userId}*`);
  }
}

export default new CacheService();