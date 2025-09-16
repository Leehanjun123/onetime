import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import {
  responseTimeTracker,
  requestSizeLimiter,
  cacheHeaders,
  requestTimeout,
  memoryMonitor,
  cpuMonitor,
  compressionMiddleware,
  requestIdGenerator,
  metricsCollector,
  healthMetrics
} from './middleware/performance';
import { exec } from 'child_process';
import { promisify } from 'util';

// Router imports
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import userRoutes from './routes/users';
import matchingRoutes from './routes/matching';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Prisma client with better error handling
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Database connection interface
interface DatabaseStatus {
  connected: boolean;
  userCount?: number;
  error?: string;
}

// Test database connection on startup
async function testDatabaseConnection(): Promise<DatabaseStatus> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test if tables exist
    const userCount = await prisma.user.count();
    console.log(`📊 Database schema is ready. Users: ${userCount}`);
    
    return { connected: true, userCount };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Database connection failed:', errorMessage);
    console.log('🔧 Database may need migration deployment');
    return { connected: false, error: errorMessage };
  }
}

// Performance middleware (applied first)
app.use(requestIdGenerator);
app.use(compressionMiddleware);
app.use(responseTimeTracker);
app.use(metricsCollector);
app.use(memoryMonitor);
app.use(cpuMonitor);
app.use(requestTimeout(30000)); // 30 second timeout
app.use(requestSizeLimiter('10mb'));
app.use(cacheHeaders);

// Security and logging middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);  
app.use('/api/users', userRoutes);
app.use('/api/matching', matchingRoutes);

// Health check endpoint with enhanced information
app.get('/health', async (req: Request, res: Response) => {
  const dbStatus = await testDatabaseConnection();
  
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus.connected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// Performance metrics endpoint
app.get('/metrics', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    ...healthMetrics,
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000) + 'ms',
      system: Math.round(cpuUsage.system / 1000) + 'ms'
    },
    nodejs: {
      version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  });
});

// Database status endpoint
app.get('/db-status', async (req: Request, res: Response) => {
  const dbStatus = await testDatabaseConnection();
  
  if (dbStatus.connected) {
    res.json({
      status: 'OK',
      message: 'Database connected',
      userCount: dbStatus.userCount,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: dbStatus.error,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual migration trigger (emergency use only)
interface DeployRequest extends Request {
  body: {
    secret: string;
    reset?: boolean;
  };
}

app.post('/deploy-db', async (req: DeployRequest, res: Response) => {
  const { secret, reset = false } = req.body;
  
  // Security check
  if (secret !== process.env.JWT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const execAsync = promisify(exec);
    let output = '';
    
    if (reset) {
      console.log('🔄 Resetting database schema...');
      const { stdout: pushOutput } = await execAsync('npx prisma db push --force-reset');
      output += 'Schema push output:\n' + pushOutput + '\n\n';
    } else {
      console.log('🚀 Starting manual database migration...');
      
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
    const dbStatus = await testDatabaseConnection();
    
    res.json({
      status: 'SUCCESS',
      message: 'Database setup completed',
      output,
      userCount: dbStatus.userCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Database setup failed:', errorMessage);
    res.status(500).json({
      status: 'ERROR',
      message: 'Database setup failed',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Enhanced error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({ 
    error: 'Internal Server Error',
    ...(isDevelopment && { details: error.message, stack: error.stack }),
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  const dbStatus = await testDatabaseConnection();
  if (dbStatus.connected) {
    console.log('🎉 Application is ready with database connection');
  } else {
    console.log('⚠️  Application running but database connection failed');
  }
});

export default app;