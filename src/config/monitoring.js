const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Sentry 초기화
function initSentry(app) {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        new ProfilingIntegration()
      ],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      environment: process.env.NODE_ENV || 'development',
      beforeSend(event, hint) {
        // 민감한 정보 필터링
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.authorization;
        }
        return event;
      }
    });

    // Request Handler는 모든 라우트 전에
    app.use(Sentry.Handlers.requestHandler());
    
    // Tracing Handler
    app.use(Sentry.Handlers.tracingHandler());
    
    logger.info('✅ Sentry monitoring initialized');
  } else {
    logger.info('⚠️  Sentry DSN not configured');
  }
  
  return Sentry;
}

// Winston 로거 설정
function createLogger() {
  const logDir = process.env.LOG_DIR || 'logs';
  
  // 로그 포맷
  const logFormat = winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  // 콘솔 포맷 (개발 환경)
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
      format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
      }
      return msg;
    })
  );

  // 파일 로테이션 설정
  const fileRotateTransport = new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat
  });

  // 에러 전용 파일
  const errorFileTransport = new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat
  });

  const transports = [
    fileRotateTransport,
    errorFileTransport
  ];

  // 개발 환경에서는 콘솔 출력
  if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({
      format: consoleFormat
    }));
  }

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false
  });

  // 스트림 생성 (Morgan과 연동용)
  logger.stream = {
    write: (message) => {
      logger.info(message.trim());
    }
  };

  return logger;
}

// 성능 모니터링
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      responseTimes: []
    };
  }

  startTimer() {
    return process.hrtime();
  }

  endTimer(start) {
    const [seconds, nanoseconds] = process.hrtime(start);
    return seconds * 1000 + nanoseconds / 1000000; // milliseconds
  }

  recordRequest(responseTime, error = false) {
    this.metrics.requests++;
    if (error) this.metrics.errors++;
    
    this.metrics.responseTimes.push(responseTime);
    
    // 최근 1000개 요청만 유지
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }
    
    // 평균 응답 시간 계산
    this.metrics.avgResponseTime = 
      this.metrics.responseTimes.reduce((a, b) => a + b, 0) / 
      this.metrics.responseTimes.length;
  }

  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.requests > 0 
        ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%'
        : '0%',
      avgResponseTime: this.metrics.avgResponseTime.toFixed(2) + 'ms'
    };
  }

  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      responseTimes: []
    };
  }
}

// 성능 모니터링 미들웨어
function performanceMiddleware(monitor) {
  return (req, res, next) => {
    const start = monitor.startTimer();
    
    // Response 완료 시 측정
    res.on('finish', () => {
      const responseTime = monitor.endTimer(start);
      const isError = res.statusCode >= 400;
      
      monitor.recordRequest(responseTime, isError);
      
      // Sentry에 성능 데이터 전송
      if (process.env.SENTRY_DSN) {
        const transaction = Sentry.getCurrentHub().getScope().getTransaction();
        if (transaction) {
          transaction.setMeasurement('response_time', responseTime, 'millisecond');
        }
      }
    });
    
    next();
  };
}

// 헬스체크 엔드포인트
function setupHealthCheck(app, monitor, prisma, redis) {
  app.get('/health/detailed', async (req, res) => {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      performance: monitor.getMetrics(),
      services: {}
    };

    // 데이터베이스 체크
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'healthy';
    } catch (error) {
      health.services.database = 'unhealthy';
      health.status = 'DEGRADED';
    }

    // Redis 체크
    try {
      if (redis && redis.isConnected) {
        health.services.redis = 'healthy';
      } else {
        health.services.redis = 'disconnected';
      }
    } catch (error) {
      health.services.redis = 'unhealthy';
    }

    res.status(health.status === 'OK' ? 200 : 503).json(health);
  });
}

// 에러 핸들러 (Sentry)
function setupErrorHandler(app) {
  // Sentry Error Handler는 모든 미들웨어 후에
  app.use(Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // 400번대 에러는 제외
      if (error.status >= 400 && error.status < 500) {
        return false;
      }
      return true;
    }
  }));

  // 최종 에러 핸들러
  app.use((err, req, res, next) => {
    const logger = req.app.locals.logger || console;
    
    logger.error('Unhandled error:', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    res.status(err.status || 500).json({
      message: process.env.NODE_ENV === 'production' 
        ? '서버 오류가 발생했습니다' 
        : err.message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
}

// 메트릭 수집 스케줄러
function startMetricsCollector(monitor, logger, interval = 60000) {
  setInterval(() => {
    const metrics = monitor.getMetrics();
    
    logger.info('Performance metrics', metrics);
    
    // Sentry에 커스텀 메트릭 전송
    if (process.env.SENTRY_DSN) {
      Sentry.metrics.gauge('app.requests.total', metrics.requests);
      Sentry.metrics.gauge('app.errors.total', metrics.errors);
      Sentry.metrics.gauge('app.response_time.avg', parseFloat(metrics.avgResponseTime));
    }
    
    // 메트릭 리셋 (1시간마다)
    if (metrics.requests > 10000) {
      monitor.reset();
    }
  }, interval);
}

module.exports = {
  initSentry,
  createLogger,
  PerformanceMonitor,
  performanceMiddleware,
  setupHealthCheck,
  setupErrorHandler,
  startMetricsCollector
};