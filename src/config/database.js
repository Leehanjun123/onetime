const { PrismaClient } = require('@prisma/client');
const redis = require('redis');
const { logger } = require('../utils/logger');

// Prisma Client 초기화
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Redis Client 초기화
let redisClient = null;

const initRedis = async () => {
  if (!redisClient) {
    try {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      redisClient.on('error', (err) => {
        logger.error('Redis 연결 오류:', err);
      });

      redisClient.on('connect', () => {
        logger.info('✅ Redis 연결 성공');
      });

      await redisClient.connect();
    } catch (error) {
      logger.error('Redis 초기화 실패:', error);
    }
  }
  return redisClient;
};

// 데이터베이스 연결 테스트
const testConnection = async () => {
  try {
    // PostgreSQL 연결 테스트
    await prisma.$connect();
    logger.info('✅ PostgreSQL 연결 성공');
    
    // Redis는 선택적으로 연결 (실패해도 서버는 계속 실행)
    try {
      await initRedis();
    } catch (redisError) {
      logger.warn('⚠️ Redis 연결 실패 (선택적 서비스):', redisError.message);
    }
    
    return { success: true };
  } catch (error) {
    logger.error('❌ PostgreSQL 연결 실패:', error);
    logger.warn('⚠️ 데이터베이스 없이 기본 API만 제공합니다.');
    return { success: false, error };
  }
};

// 앱 종료 시 연결 정리
const disconnect = async () => {
  try {
    await prisma.$disconnect();
    if (redisClient) {
      await redisClient.quit();
    }
    logger.info('🔌 데이터베이스 연결 해제 완료');
  } catch (error) {
    logger.error('데이터베이스 연결 해제 오류:', error);
  }
};

module.exports = {
  prisma,
  initRedis,
  getRedisClient: () => redisClient,
  testConnection,
  disconnect
};