const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const logger = require('./utils/logger');
const { connectDatabase } = require('./services/database');
const eventPublisher = require('./services/eventPublisher');
const serviceRegistry = require('./services/serviceRegistry');

const app = express();
const PORT = process.env.PORT || 3001;

// 보안 미들웨어
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
app.use(limiter);

// Body 파싱
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);
  req.requestId = requestId;
  
  // API Gateway에서 전달받은 사용자 정보
  if (req.headers['x-user-id']) {
    req.user = {
      id: req.headers['x-user-id'],
      email: req.headers['x-user-email'],
      userType: req.headers['x-user-role']
    };
  }
  
  logger.info(`[${requestId}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  next();
});

// 헬스체크
app.get('/health', async (req, res) => {
  try {
    // 데이터베이스 연결 확인
    const { prisma } = require('./services/database');
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      service: 'user-service',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'user-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// API 라우트
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);

// API 문서 (개발 환경에서만)
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerDocument = require('./docs/swagger.json');
  
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: '원데이 User Service API',
    customCss: '.swagger-ui .topbar { display: none }'
  }));
}

// 404 핸들러
app.use('*', (req, res) => {
  logger.warn(`[${req.requestId}] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    service: 'user-service'
  });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  logger.error(`[${req.requestId}] Unhandled error:`, error);
  
  // Prisma 에러 처리
  if (error.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: '중복된 데이터가 존재합니다',
      field: error.meta?.target
    });
  }
  
  // 유효성 검사 에러
  if (error.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: '입력 데이터가 올바르지 않습니다',
      errors: error.errors
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    service: 'user-service',
    requestId: req.requestId
  });
});

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결
    await connectDatabase();
    logger.info('✅ Database connected');
    
    // 이벤트 퍼블리셔 초기화
    await eventPublisher.initialize();
    logger.info('✅ Event publisher initialized');
    
    // 서비스 레지스트리에 등록
    await serviceRegistry.register('user-service', `http://localhost:${PORT}`);
    logger.info('✅ Service registered');
    
    // 서버 시작
    const server = app.listen(PORT, () => {
      logger.info(`🚀 User Service running on port ${PORT}`);
    });
    
    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down User Service...');
      
      server.close(async () => {
        await serviceRegistry.deregister('user-service');
        await eventPublisher.disconnect();
        
        const { prisma } = require('./services/database');
        await prisma.$disconnect();
        
        logger.info('User Service shut down gracefully');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error('Failed to start User Service:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;