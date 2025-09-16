const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Prisma client
const prisma = new PrismaClient();

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test if tables exist
    const userCount = await prisma.user.count();
    console.log(`📊 Database schema is ready. Users: ${userCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('🔧 Database may need migration deployment');
    return false;
  }
}

// 기본 미들웨어
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 기본 라우터
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);  
app.use('/api/users', userRoutes);

// Health check 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0' 
  });
});

// Database status endpoint
app.get('/db-status', async (req, res) => {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    res.json({
      status: 'OK',
      message: 'Database connected',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual migration trigger (emergency use only)
app.post('/deploy-db', async (req, res) => {
  const { secret, reset = false } = req.body;
  
  // Simple security check
  if (secret !== process.env.JWT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    let output = '';
    
    if (reset) {
      console.log('🔄 Resetting database schema...');
      
      // Push schema directly (creates tables without migration history)
      const { stdout: pushOutput } = await execAsync('npx prisma db push --force-reset');
      output += 'Schema push output:\n' + pushOutput + '\n\n';
      
    } else {
      console.log('🚀 Starting manual database migration...');
      
      // Try normal migration first
      try {
        const { stdout } = await execAsync('npx prisma migrate deploy');
        output += 'Migration output:\n' + stdout + '\n\n';
      } catch (migrationError) {
        console.log('⚠️ Migration failed, trying schema push...');
        const { stdout: pushOutput } = await execAsync('npx prisma db push');
        output += 'Schema push output:\n' + pushOutput + '\n\n';
      }
    }
    
    // Test the connection after migration
    await prisma.$connect();
    const userCount = await prisma.user.count();
    
    res.json({
      status: 'SUCCESS',
      message: 'Database setup completed',
      output,
      userCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database setup failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Database setup failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 서버 시작
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    console.log('🎉 Application is ready with database connection');
  } else {
    console.log('⚠️  Application running but database connection failed');
  }
});

module.exports = app;