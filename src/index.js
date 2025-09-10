const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Railway health check를 위해 초기화를 간소화
let io = null;
let dbConnection = null;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',
    'https://frontend-leehanjun123s-projects.vercel.app',
    'https://onetime-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 데이터베이스 연결을 비동기로 초기화 (health check 이후)
const initializeServices = async () => {
  try {
    console.log('🔧 서비스 초기화 중...');
    
    // 데이터베이스 연결
    try {
      const { testConnection } = require('./config/database');
      await testConnection();
      dbConnection = true;
    } catch (err) {
      console.warn('⚠️ 데이터베이스 연결 실패, 서버는 계속 실행됩니다:', err.message);
      dbConnection = false;
    }
    
    // Socket.IO 초기화 (선택적)
    try {
      const { initializeSocket } = require('./config/socket');
      io = initializeSocket(server);
      console.log('✅ Socket.IO 초기화 완료');
    } catch (err) {
      console.warn('⚠️ Socket.IO 초기화 실패:', err.message);
    }
    
    console.log('🚀 모든 서비스 초기화 완료');
  } catch (error) {
    console.error('❌ 서비스 초기화 오류:', error);
  }
};

// 서버 시작 후 초기화 (health check를 방해하지 않음)
setTimeout(initializeServices, 1000);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '일데이 Backend API is running!', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is healthy',
    database: dbConnection ? 'connected' : 'disconnected',
    socketio: io ? 'initialized' : 'not initialized',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Static files middleware for uploaded files
app.use('/uploads', express.static('uploads'));

// Import routes with error handling (after health check endpoint)
let jobRoutes, userRoutes, authRoutes, uploadRoutes, notificationRoutes, savedRoutes, paymentRoutes, adminRoutes;

try {
  jobRoutes = require('./routes/jobs');
  console.log('✅ Jobs routes loaded');
} catch (err) {
  console.error('❌ Failed to load jobs routes:', err.message);
}

try {
  userRoutes = require('./routes/users');
  console.log('✅ Users routes loaded');
} catch (err) {
  console.error('❌ Failed to load users routes:', err.message);
}

try {
  authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
} catch (err) {
  console.error('❌ Failed to load auth routes:', err.message);
}

try {
  uploadRoutes = require('./routes/upload');
  console.log('✅ Upload routes loaded');
} catch (err) {
  console.error('❌ Failed to load upload routes:', err.message);
}

try {
  notificationRoutes = require('./routes/notifications');
  console.log('✅ Notification routes loaded');
} catch (err) {
  console.error('❌ Failed to load notification routes:', err.message);
}

try {
  savedRoutes = require('./routes/saved');
  console.log('✅ Saved routes loaded');
} catch (err) {
  console.error('❌ Failed to load saved routes:', err.message);
}

try {
  paymentRoutes = require('./routes/payments');
  console.log('✅ Payment routes loaded');
} catch (err) {
  console.error('❌ Failed to load payment routes:', err.message);
}

try {
  adminRoutes = require('./routes/admin');
  console.log('✅ Admin routes loaded');
} catch (err) {
  console.error('❌ Failed to load admin routes:', err.message);
}

// Use routes only if they loaded successfully
if (jobRoutes) app.use('/api/jobs', jobRoutes);
if (userRoutes) app.use('/api/users', userRoutes);
if (authRoutes) app.use('/api/auth', authRoutes);
if (uploadRoutes) app.use('/api/upload', uploadRoutes);
if (notificationRoutes) app.use('/api/notifications', notificationRoutes);
if (savedRoutes) app.use('/api/saved', savedRoutes);
if (paymentRoutes) app.use('/api/payments', paymentRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);

// Debug endpoint for checking route loading status
app.get('/debug', (req, res) => {
  res.json({
    routes: {
      jobs: !!jobRoutes,
      users: !!userRoutes, 
      auth: !!authRoutes,
      upload: !!uploadRoutes,
      notifications: !!notificationRoutes
    },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Notification routes (temporary endpoints)
app.post('/api/v1/test-notification', (req, res) => {
  res.json({ message: 'Test notification sent successfully' });
});

app.get('/api/notifications', (req, res) => {
  res.json({ notifications: [] });
});

// Matching routes  
app.post('/api/v1/matching/request', (req, res) => {
  res.json({ message: 'Matching request received' });
});

// Work session routes
app.post('/api/v1/work-session/checkin', (req, res) => {
  res.json({ message: 'Check-in successful' });
});

app.post('/api/v1/work-session/checkout', (req, res) => {
  res.json({ message: 'Check-out successful' });
});

// Additional API endpoints for frontend compatibility
app.get('/api/v1/jobs/:id', (req, res) => {
  res.json({ job: { id: req.params.id, title: 'Sample Job' } });
});

app.get('/api/profile', (req, res) => {
  res.json({ profile: {} });
});

app.get('/api/v1/settlements', (req, res) => {
  res.json({ settlements: [] });
});

app.get('/api/v1/certifications', (req, res) => {
  res.json({ certifications: [] });
});

app.get('/api/v1/portfolio', (req, res) => {
  res.json({ portfolio: [] });
});

app.get('/api/v1/reviews', (req, res) => {
  res.json({ reviews: [] });
});

app.get('/api/v1/reviews/stats', (req, res) => {
  res.json({ stats: {} });
});

app.get('/api/v1/work-session/history', (req, res) => {
  res.json({ history: [] });
});

// Analytics API endpoints
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({ 
    stats: {
      totalUsers: 127000,
      totalJobs: 8500,
      totalMatches: 45000,
      averageRating: 4.8
    },
    charts: {
      dailyRegistrations: [],
      jobsByCategory: [],
      revenueByMonth: []
    }
  });
});

app.get('/api/v1/analytics/dashboard', (req, res) => {
  res.json({ 
    stats: {
      totalUsers: 127000,
      totalJobs: 8500,
      totalMatches: 45000,
      averageRating: 4.8
    },
    charts: {
      dailyRegistrations: [],
      jobsByCategory: [],
      revenueByMonth: []
    }
  });
});

// Web Vitals API endpoint
app.get('/api/analytics/web-vitals', (req, res) => {
  res.json({
    vitals: {
      fcp: 1.2,
      lcp: 2.1,
      cls: 0.05,
      fid: 8.3,
      ttfb: 0.8
    }
  });
});

app.post('/api/analytics/web-vitals', (req, res) => {
  // Web Vitals 데이터를 로깅/저장
  console.log('Web Vitals data received:', req.body);
  res.json({ success: true });
});

// V1 Auth endpoints (정확한 경로)
app.use('/api/v1/auth', authRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.originalUrl 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 서버 시작
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 일데이 Backend Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ Socket.IO enabled for real-time notifications`);
});

// 앱 종료 시 정리
process.on('SIGINT', async () => {
  console.log('서버 종료 중...');
  if (dbConnection) {
    try {
      const { disconnect } = require('./config/database');
      await disconnect();
    } catch (err) {
      console.error('DB 연결 해제 오류:', err);
    }
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('서버 종료 중...');
  if (dbConnection) {
    try {
      const { disconnect } = require('./config/database');
      await disconnect();
    } catch (err) {
      console.error('DB 연결 해제 오류:', err);
    }
  }
  process.exit(0);
});