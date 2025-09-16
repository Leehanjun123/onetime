import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { 
  securityConfig, 
  securityHeaders, 
  isValidIP, 
  isValidUserAgent,
  isValidRequestTime,
  sanitizeLogData
} from '../config/security';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * CORS 설정
 */
export const corsMiddleware = cors({
  origin: securityConfig.cors.origin,
  credentials: securityConfig.cors.credentials,
  methods: securityConfig.cors.methods,
  allowedHeaders: securityConfig.cors.allowedHeaders,
  optionsSuccessStatus: 200
});

/**
 * Helmet 보안 헤더 설정
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: securityConfig.helmet.contentSecurityPolicy,
  hsts: securityConfig.helmet.hsts,
  crossOriginEmbedderPolicy: false, // 개발 편의를 위해 비활성화
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

/**
 * 일반 API 레이트 리미터
 */
export const generalRateLimit = rateLimit({
  windowMs: securityConfig.rateLimit.windowMs,
  max: securityConfig.rateLimit.maxRequests,
  message: {
    error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
    retryAfter: Math.ceil(securityConfig.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 개발 환경에서는 localhost 요청 제외
    if (process.env.NODE_ENV === 'development') {
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1' || ip?.includes('localhost');
    }
    return false;
  }
});

/**
 * 인증 관련 레이트 리미터 (더 엄격)
 */
export const authRateLimit = rateLimit({
  windowMs: securityConfig.rateLimit.authWindowMs,
  max: securityConfig.rateLimit.authMaxRequests,
  message: {
    error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: Math.ceil(securityConfig.rateLimit.authWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // 성공한 요청은 카운트하지 않음
});

/**
 * 보안 헤더 추가 미들웨어
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 기본 보안 헤더 추가
  Object.entries(securityHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });

  // 요청별 추가 헤더
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || 'unknown');
  res.setHeader('X-API-Version', '1.0.0');
  
  next();
};

/**
 * IP 검증 미들웨어
 */
export const ipValidationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    // IP 형식 검증
    if (clientIP !== 'unknown' && !isValidIP(clientIP)) {
      logger.warn('Invalid IP format detected', { ip: clientIP, userAgent: req.headers['user-agent'] });
      return res.status(400).json({ error: '잘못된 요청입니다' });
    }

    // IP 블랙리스트 확인
    if (securityConfig.monitoring.ipBlacklist.includes(clientIP)) {
      logger.warn('Blocked IP detected', { ip: clientIP });
      return res.status(403).json({ error: '접근이 거부되었습니다' });
    }

    // 의심스러운 활동 확인
    const suspiciousCount = await prisma.suspiciousActivity.count({
      where: {
        details: {
          path: ['ip'],
          equals: clientIP
        },
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24시간 내
        }
      }
    });

    if (suspiciousCount >= securityConfig.monitoring.suspiciousActivityThreshold) {
      logger.warn('Suspicious activity threshold exceeded', { 
        ip: clientIP, 
        count: suspiciousCount 
      });
      
      // 자동으로 블랙리스트에 추가 (실제 운영에서는 신중하게 고려)
      if (process.env.NODE_ENV === 'production') {
        await recordSuspiciousActivity(clientIP, 'AUTO_BLOCKED', {
          reason: 'Threshold exceeded',
          count: suspiciousCount
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Error in IP validation middleware', error);
    next();
  }
};

/**
 * User-Agent 검증 미들웨어
 */
export const userAgentValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'];
  
  if (!userAgent) {
    logger.warn('Missing User-Agent header', { ip: req.ip });
    return res.status(400).json({ error: '잘못된 요청입니다' });
  }

  if (!isValidUserAgent(userAgent)) {
    logger.warn('Suspicious User-Agent detected', { 
      userAgent: sanitizeLogData({ userAgent }),
      ip: req.ip 
    });
    
    // 봇이나 스크래퍼로 의심되는 경우
    return res.status(403).json({ error: '접근이 거부되었습니다' });
  }

  next();
};

/**
 * 요청 크기 제한 미들웨어
 */
export const requestSizeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = parseInt(securityConfig.validation.maxRequestSize.replace('mb', '')) * 1024 * 1024;
  
  if (contentLength > maxSize) {
    logger.warn('Request size exceeded', { 
      contentLength, 
      maxSize, 
      ip: req.ip 
    });
    return res.status(413).json({ error: '요청 크기가 너무 큽니다' });
  }

  next();
};

/**
 * API 키 검증 미들웨어 (선택적)
 */
export const apiKeyValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 공개 엔드포인트는 스킵
  const publicPaths = ['/health', '/metrics', '/api/auth/login', '/api/auth/register'];
  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  // API 키가 설정되어 있고, 헤더에 없는 경우
  if (validApiKey && !apiKey) {
    logger.warn('Missing API key', { path: req.path, ip: req.ip });
    return res.status(401).json({ error: 'API 키가 필요합니다' });
  }

  // API 키가 잘못된 경우
  if (validApiKey && apiKey !== validApiKey) {
    logger.warn('Invalid API key', { 
      path: req.path, 
      ip: req.ip,
      providedKey: apiKey ? '[PROVIDED]' : '[MISSING]'
    });
    return res.status(401).json({ error: '잘못된 API 키입니다' });
  }

  next();
};

/**
 * 타임스탬프 검증 미들웨어 (리플레이 공격 방지)
 */
export const timestampValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = req.headers['x-timestamp'];
  
  if (timestamp) {
    const timestampNum = parseInt(timestamp as string, 10);
    
    if (isNaN(timestampNum) || !isValidRequestTime(timestampNum)) {
      logger.warn('Invalid or expired timestamp', { 
        timestamp, 
        ip: req.ip,
        path: req.path
      });
      return res.status(400).json({ error: '잘못된 타임스탬프입니다' });
    }
  }

  next();
};

/**
 * 의심스러운 활동 기록
 */
export async function recordSuspiciousActivity(
  identifier: string,
  type: string,
  details: any,
  userId?: string
): Promise<void> {
  try {
    await prisma.suspiciousActivity.create({
      data: {
        userId,
        type,
        details: {
          identifier,
          ...details,
          timestamp: new Date().toISOString(),
          userAgent: details.userAgent || 'unknown'
        }
      }
    });
  } catch (error) {
    logger.error('Failed to record suspicious activity', error);
  }
}

/**
 * 보안 이벤트 기록
 */
export async function recordSecurityEvent(
  eventType: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  details: any,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType,
        severity,
        source: 'API',
        details: sanitizeLogData(details),
        ipAddress,
        userAgent
      }
    });

    // 중요한 보안 이벤트는 즉시 알림
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      logger.error('Critical security event', { 
        eventType, 
        severity, 
        userId, 
        ipAddress 
      });
      
      // 여기에 알림 로직 추가 (이메일, 슬랙 등)
    }
  } catch (error) {
    logger.error('Failed to record security event', error);
  }
}

/**
 * 실패한 로그인 시도 추적
 */
export async function trackFailedLogin(
  identifier: string, // 이메일 또는 사용자명
  ipAddress: string,
  userAgent?: string
): Promise<boolean> {
  try {
    const key = `failed_login_${identifier}_${ipAddress}`;
    const windowMs = securityConfig.monitoring.lockoutDuration;
    const maxAttempts = securityConfig.monitoring.maxFailedLogins;
    
    // 현재 실패 횟수 확인 (간단한 메모리 캐시 대신 데이터베이스 사용)
    const recentFailures = await prisma.suspiciousActivity.count({
      where: {
        type: 'FAILED_LOGIN',
        details: {
          path: ['identifier'],
          equals: identifier
        },
        timestamp: {
          gte: new Date(Date.now() - windowMs)
        }
      }
    });

    // 실패 기록
    await recordSuspiciousActivity(identifier, 'FAILED_LOGIN', {
      ipAddress,
      userAgent,
      attemptNumber: recentFailures + 1
    });

    // 제한 횟수 초과 확인
    if (recentFailures >= maxAttempts) {
      await recordSecurityEvent(
        'ACCOUNT_LOCKOUT',
        'HIGH',
        {
          identifier,
          ipAddress,
          failureCount: recentFailures + 1
        },
        undefined,
        ipAddress,
        userAgent
      );
      
      return true; // 계정 잠김
    }

    return false; // 계속 허용
  } catch (error) {
    logger.error('Error tracking failed login', error);
    return false;
  }
}

/**
 * 통합 보안 미들웨어 (모든 보안 검사를 한 번에)
 */
export const comprehensiveSecurityMiddleware = [
  corsMiddleware,
  helmetMiddleware,
  securityHeadersMiddleware,
  requestSizeMiddleware,
  ipValidationMiddleware,
  userAgentValidationMiddleware,
  timestampValidationMiddleware
  // apiKeyValidationMiddleware는 필요에 따라 추가
];