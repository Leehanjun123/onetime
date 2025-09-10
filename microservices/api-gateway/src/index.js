const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const serviceDiscovery = require('./services/serviceDiscovery');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// 보안 미들웨어
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://onetime-frontend.vercel.app'
  ],
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// JSON 파싱
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substring(7);
  req.requestId = requestId;
  
  logger.info(`[${requestId}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next();
});

// 헬스체크
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: serviceDiscovery.getServiceStatus()
  });
});

// 서비스별 프록시 라우팅
const createServiceProxy = (serviceName, targetUrl, authRequired = true) => {
  const proxyOptions = {
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: {
      [`^/${serviceName}`]: ''
    },
    onProxyReq: (proxyReq, req) => {
      // 요청 ID와 사용자 정보를 헤더에 추가
      proxyReq.setHeader('X-Request-ID', req.requestId);
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.userType);
        proxyReq.setHeader('X-User-Email', req.user.email);
      }
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${serviceName}:`, err);
      res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable',
        service: serviceName
      });
    }
  };

  if (authRequired) {
    return [authMiddleware.verifyToken, createProxyMiddleware(proxyOptions)];
  } else {
    return [createProxyMiddleware(proxyOptions)];
  }
};

// 서비스 라우팅 설정
app.use('/api/users', ...createServiceProxy('users', 'http://localhost:3001', false)); // 인증은 서비스에서 처리
app.use('/api/jobs', ...createServiceProxy('jobs', 'http://localhost:3002', false));
app.use('/api/payments', ...createServiceProxy('payments', 'http://localhost:3003', true));
app.use('/api/search', ...createServiceProxy('search', 'http://localhost:3004', false));
app.use('/api/notifications', ...createServiceProxy('notifications', 'http://localhost:3005', true));
app.use('/api/chat', ...createServiceProxy('chat', 'http://localhost:3006', true));

// 관리자 전용 라우팅
app.use('/api/admin', authMiddleware.verifyToken, authMiddleware.requireAdmin, 
  createProxyMiddleware({
    target: 'http://localhost:3001', // User Service가 관리자 기능 처리
    changeOrigin: true,
    pathRewrite: {
      '^/api/admin': '/admin'
    }
  })
);

// API 문서 라우팅 (개발 환경에서만)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/docs', createProxyMiddleware({
    target: 'http://localhost:3001', // User Service에서 통합 문서 제공
    changeOrigin: true,
    pathRewrite: {
      '^/api/docs': '/docs'
    }
  }));
}

// WebSocket 프록시 (Chat Service용)
const { createProxyServer } = require('http-proxy');
const httpProxy = createProxyServer();

app.use('/socket.io', (req, res, next) => {
  httpProxy.web(req, res, {
    target: 'http://localhost:3006',
    ws: true
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  logger.warn(`[${req.requestId}] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  logger.error(`[${req.requestId}] Unhandled error:`, error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    requestId: req.requestId
  });
});

// 서버 시작
const server = app.listen(PORT, async () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
  
  try {
    await serviceDiscovery.initialize();
    logger.info('✅ Service discovery initialized');
  } catch (error) {
    logger.error('❌ Service discovery initialization failed:', error);
  }
});

// WebSocket 프록시 설정
server.on('upgrade', (request, socket, head) => {
  httpProxy.ws(request, socket, head, {
    target: 'http://localhost:3006'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('API Gateway shut down');
    process.exit(0);
  });
});

module.exports = app;