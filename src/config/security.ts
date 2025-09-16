/**
 * 중앙화된 보안 설정
 */

export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    algorithm: string;
  };
  bcrypt: {
    saltRounds: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    authWindowMs: number;
    authMaxRequests: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: string[];
        scriptSrc: string[];
        styleSrc: string[];
        imgSrc: string[];
        connectSrc: string[];
        fontSrc: string[];
        objectSrc: string[];
        mediaSrc: string[];
        frameSrc: string[];
      };
    };
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
  };
  session: {
    maxSessions: number;
    sessionTimeout: number;
    deviceLimit: number;
  };
  validation: {
    maxRequestSize: string;
    maxFieldSize: string;
    maxFiles: number;
    allowedFileTypes: string[];
    maxFileSize: number;
  };
  monitoring: {
    suspiciousActivityThreshold: number;
    maxFailedLogins: number;
    lockoutDuration: number;
    ipWhitelist: string[];
    ipBlacklist: string[];
  };
}

/**
 * 환경별 보안 설정
 */
const getSecurityConfig = (): SecurityConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    jwt: {
      secret: process.env.JWT_SECRET || 'development-secret-key',
      expiresIn: isProduction ? '15m' : '1h',
      refreshExpiresIn: isProduction ? '7d' : '30d',
      algorithm: 'HS256'
    },
    bcrypt: {
      saltRounds: isProduction ? 12 : 8
    },
    rateLimit: {
      windowMs: isProduction ? 15 * 60 * 1000 : 60 * 1000, // 15분 vs 1분
      maxRequests: isProduction ? 100 : 1000,
      authWindowMs: 15 * 60 * 1000, // 15분
      authMaxRequests: isProduction ? 5 : 20 // 로그인 시도 제한
    },
    cors: {
      origin: isDevelopment 
        ? ['http://localhost:3000', 'http://localhost:3001', 'https://onetime-frontend.vercel.app']
        : ['https://onetime-frontend.vercel.app', 'https://*.vercel.app'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With', 
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Request-ID',
        'X-Device-ID',
        'X-App-Version'
      ]
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'", 
            "'unsafe-inline'", 
            "'unsafe-eval'",
            'https://cdn.jsdelivr.net',
            'https://unpkg.com'
          ],
          styleSrc: [
            "'self'", 
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://cdn.jsdelivr.net'
          ],
          imgSrc: [
            "'self'", 
            'data:', 
            'blob:',
            'https://*.vercel.app',
            'https://*.railway.app',
            'https://images.unsplash.com'
          ],
          connectSrc: [
            "'self'",
            'https://*.railway.app',
            'https://*.vercel.app',
            'wss://*.railway.app'
          ],
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
            'https://cdn.jsdelivr.net'
          ],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", 'blob:', 'data:'],
          frameSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000, // 1년
        includeSubDomains: true,
        preload: true
      }
    },
    session: {
      maxSessions: isProduction ? 3 : 10, // 동시 세션 제한
      sessionTimeout: isProduction ? 15 * 60 * 1000 : 60 * 60 * 1000, // 15분 vs 1시간
      deviceLimit: isProduction ? 5 : 10 // 등록 가능한 디바이스 수
    },
    validation: {
      maxRequestSize: '10mb',
      maxFieldSize: '1mb',
      maxFiles: 10,
      allowedFileTypes: [
        'image/jpeg',
        'image/png', 
        'image/webp',
        'application/pdf',
        'text/plain'
      ],
      maxFileSize: 5 * 1024 * 1024 // 5MB
    },
    monitoring: {
      suspiciousActivityThreshold: 5, // 5회 이상 의심스러운 활동
      maxFailedLogins: isProduction ? 3 : 10,
      lockoutDuration: isProduction ? 30 * 60 * 1000 : 5 * 60 * 1000, // 30분 vs 5분
      ipWhitelist: [], // 허용된 IP 목록
      ipBlacklist: [] // 차단된 IP 목록
    }
  };
};

export const securityConfig = getSecurityConfig();

/**
 * 보안 헤더 설정
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

/**
 * 민감한 정보 로그 필터
 */
export const sensitiveFields = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'credit',
  'card',
  'ssn',
  'phone',
  'email'
];

/**
 * 로그에서 민감한 정보 제거
 */
export function sanitizeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field => 
      lowerKey.includes(field.toLowerCase())
    );
    
    if (isSensitive) {
      (sanitized as any)[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      (sanitized as any)[key] = sanitizeLogData(value);
    } else {
      (sanitized as any)[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * IP 주소 검증
 */
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * 사용자 에이전트 검증
 */
export function isValidUserAgent(userAgent: string): boolean {
  if (!userAgent || userAgent.length < 10 || userAgent.length > 500) {
    return false;
  }
  
  // 의심스러운 패턴 검사
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /http/i
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * 요청 시간 검증 (리플레이 공격 방지)
 */
export function isValidRequestTime(timestamp: number): boolean {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5분
  
  return Math.abs(now - timestamp) <= maxAge;
}

/**
 * 비밀번호 강도 검증
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length < 8) {
    feedback.push('비밀번호는 최소 8자 이상이어야 합니다');
  } else {
    score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    feedback.push('소문자를 포함해야 합니다');
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    feedback.push('대문자를 포함해야 합니다');
  } else {
    score += 1;
  }
  
  if (!/\d/.test(password)) {
    feedback.push('숫자를 포함해야 합니다');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('특수문자를 포함해야 합니다');
  } else {
    score += 1;
  }
  
  // 일반적인 패턴 검사
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /(.)\1{2,}/ // 같은 문자 반복
  ];
  
  if (commonPatterns.some(pattern => pattern.test(password))) {
    feedback.push('일반적인 패턴을 피해주세요');
    score -= 1;
  }
  
  return {
    isValid: score >= 4 && feedback.length === 0,
    score: Math.max(0, score),
    feedback
  };
}