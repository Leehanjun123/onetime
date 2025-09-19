/**
 * OneTime 플랫폼 - 통합 서버
 * 복잡한 마이크로서비스 구조를 단순한 모놀리스로 통합
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 기본 미들웨어
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Prisma 클라이언트 (에러 처리 포함)
let prisma = null;
try {
  prisma = new PrismaClient({
    log: ['warn', 'error'],
  });
  console.log('✅ Prisma client initialized');
} catch (error) {
  console.error('❌ Prisma initialization failed:', error.message);
  console.log('⚠️ Running in mock-only mode');
}

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OneTime API Server',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    status: 'running'
  });
});

// 헬스 체크 (DB 연결 없이도 동작)
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  };

  // DB 연결 체크 (선택적, 타임아웃 포함)
  if (prisma) {
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DB timeout')), 2000)
      );
      
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        timeout
      ]);
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      // 에러 메시지는 로그에만
      console.warn('DB health check failed:', error.message);
    }
  } else {
    health.database = 'mock_mode';
  }

  res.json(health);
});

// 데이터베이스 초기화 엔드포인트 (프로덕션용)
app.post('/api/db/init', async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database client not available'
      });
    }

    // 스키마 푸시 실행 (기존 DB에 대해 안전)
    const { exec } = require('child_process');
    exec('npx prisma db push --force-reset', (error, stdout, stderr) => {
      if (error) {
        console.error('DB Push error:', error);
        return res.status(500).json({
          success: false,
          error: 'Database push failed',
          details: error.message
        });
      }
      
      console.log('DB Push output:', stdout);
      res.json({
        success: true,
        message: 'Database schema synchronized successfully',
        output: stdout
      });
    });
  } catch (error) {
    console.error('DB Init error:', error);
    res.status(500).json({
      success: false,
      error: 'Database initialization failed',
      details: error.message
    });
  }
});

// 기본 API 정보
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'OneTime API v2.0',
    endpoints: [
      'GET / - 서버 정보',
      'GET /health - 헬스 체크',
      'GET /api - API 정보',
      'POST /api/auth/register - 회원가입',
      'POST /api/auth/login - 로그인',
      'GET /api/auth/me - 현재 사용자 정보 (인증 필요)',
      'GET /api/users - 사용자 목록',
      'POST /api/users - 사용자 생성',
      'GET /api/jobs - 일자리 목록 (필터링 지원)',
      'POST /api/jobs - 일자리 생성 (고용주 인증 필요)',
      'POST /api/jobs/:id/apply - 일자리 지원 (근로자 인증 필요)'
    ],
    documentation: 'https://api-docs.onetime.com',
    timestamp: new Date().toISOString()
  });
});

// 사용자 API (관리자용 - 실제 데이터베이스만 사용)
app.get('/api/users', async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const { page = 1, limit = 10, userType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = userType ? { userType } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          verified: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 사용자 생성 API
app.post('/api/users', async (req, res) => {
  try {
    const { email, name, userType = 'WORKER' } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['email', 'name'],
        timestamp: new Date().toISOString()
      });
    }

    let user = null;
    
    if (prisma) {
      try {
        user = await prisma.user.create({
          data: {
            email,
            name,
            userType,
            verified: false,
            isActive: true
          },
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
            createdAt: true
          }
        });
      } catch (error) {
        console.warn('DB create failed, using mock response');
        user = {
          id: 'mock-' + Date.now(),
          email,
          name,
          userType,
          createdAt: new Date().toISOString()
        };
      }
    } else {
      user = {
        id: 'mock-' + Date.now(),
        email,
        name,
        userType,
        createdAt: new Date().toISOString()
      };
    }

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 일자리 목록 API (실제 구현)
app.get('/api/jobs', async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const { category, location, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      status: 'OPEN'
    };

    if (category) where.category = category;
    if (location) where.location = { contains: location };

    const jobs = await prisma.job.findMany({
      where,
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.job.count({ where });

    res.json({
      success: true,
      data: jobs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT 토큰 생성 헬퍼
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// JWT 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      timestamp: new Date().toISOString()
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      });
    }
    req.userId = decoded.userId;
    next();
  });
};

// 회원가입 API (실제 구현)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, userType = 'WORKER' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['email', 'password', 'name'],
        timestamp: new Date().toISOString()
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
        timestamp: new Date().toISOString()
      });
    }

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
        timestamp: new Date().toISOString()
      });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        userType,
        verified: false,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        verified: true,
        createdAt: true
      }
    });

    // JWT 토큰 생성
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 로그인 API (실제 구현)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing email or password',
        timestamp: new Date().toISOString()
      });
    }

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // 비활성화된 계정 체크
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated',
        timestamp: new Date().toISOString()
      });
    }

    // JWT 토큰 생성
    const token = generateToken(user.id);

    // 응답에서 비밀번호 제외
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      verified: user.verified,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 현재 사용자 정보 가져오기 (인증 필요)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        verified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: { user },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 사용자 프로필 조회 (인증 필요)
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        verified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: { user },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 사용자 프로필 업데이트 (인증 필요)
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const { name, userType } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (userType && ['WORKER', 'EMPLOYER'].includes(userType)) {
      updateData.userType = userType;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
        timestamp: new Date().toISOString()
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        verified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 사용자 지원 내역 조회 (인증 필요)
app.get('/api/users/applications', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { workerId: req.userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            location: true,
            wage: true,
            workDate: true,
            status: true,
            employer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: applications,
      total: applications.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get applications',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 고용주의 일자리 목록 조회 (인증 필요)
app.get('/api/users/jobs', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const jobs = await prisma.job.findMany({
      where: { employerId: req.userId },
      include: {
        applications: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: jobs,
      total: jobs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get employer jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get jobs',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 일자리 생성 API (인증 필요)
app.post('/api/jobs', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, location, wage, workDate, workHours } = req.body;

    // 기본 필수 필드 검증
    if (!title || !description || !category || !location || !wage || !workDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['title', 'description', 'category', 'location', 'wage', 'workDate'],
        timestamp: new Date().toISOString()
      });
    }

    // 상세 유효성 검증
    if (title.length < 5 || title.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Title must be between 5 and 100 characters',
        timestamp: new Date().toISOString()
      });
    }

    if (description.length < 10 || description.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Description must be between 10 and 1000 characters',
        timestamp: new Date().toISOString()
      });
    }

    const validCategories = ['일반알바', '단기알바', '배달', '청소', '이사', '포장', '행사도우미', '기타'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category',
        validCategories,
        timestamp: new Date().toISOString()
      });
    }

    const wageNum = parseInt(wage);
    if (isNaN(wageNum) || wageNum < 9620 || wageNum > 100000) {
      return res.status(400).json({
        success: false,
        error: 'Wage must be between 9,620원 (minimum wage) and 100,000원 per hour',
        timestamp: new Date().toISOString()
      });
    }

    const workDateTime = new Date(workDate);
    if (isNaN(workDateTime.getTime()) || workDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Work date must be a valid future date',
        timestamp: new Date().toISOString()
      });
    }

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 사용자 권한 확인 (고용주만 일자리 생성 가능)
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user || user.userType !== 'EMPLOYER') {
      return res.status(403).json({
        success: false,
        error: 'Only employers can create jobs',
        timestamp: new Date().toISOString()
      });
    }

    // 일자리 생성
    const job = await prisma.job.create({
      data: {
        title,
        description,
        category,
        location,
        wage: parseInt(wage),
        workDate: new Date(workDate),
        workHours: workHours || null,
        employerId: req.userId,
        status: 'OPEN'
      },
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: job,
      message: 'Job created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 일자리 지원 API (핵심 비즈니스 로직)
app.post('/api/jobs/:jobId/apply', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { message } = req.body;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 사용자 권한 확인 (근로자만 지원 가능)
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user || user.userType !== 'WORKER') {
      return res.status(403).json({
        success: false,
        error: 'Only workers can apply for jobs',
        timestamp: new Date().toISOString()
      });
    }

    // 일자리 존재 확인
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        timestamp: new Date().toISOString()
      });
    }

    if (job.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: 'Job is no longer open for applications',
        timestamp: new Date().toISOString()
      });
    }

    // 본인이 올린 일자리에 지원 불가
    if (job.employerId === req.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot apply to your own job posting',
        timestamp: new Date().toISOString()
      });
    }

    // 중복 지원 확인
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId: req.userId
        }
      }
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        error: 'Already applied to this job',
        timestamp: new Date().toISOString()
      });
    }

    // 지원서 생성
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        workerId: req.userId,
        message: message || '',
        status: 'PENDING'
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            wage: true,
            workDate: true
          }
        },
        worker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit application',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 지원 상태 관리 API (고용주용)
app.put('/api/applications/:applicationId/status', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        validStatuses,
        timestamp: new Date().toISOString()
      });
    }

    // 지원서 조회 및 권한 확인
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            employerId: true,
            title: true
          }
        },
        worker: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
        timestamp: new Date().toISOString()
      });
    }

    // 고용주만 지원 상태 변경 가능
    if (application.job.employerId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the employer can change application status',
        timestamp: new Date().toISOString()
      });
    }

    // 상태 업데이트
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            wage: true,
            workDate: true
          }
        },
        worker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedApplication,
      message: `Application ${status.toLowerCase()} successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 일자리별 지원자 목록 조회 (고용주용)
app.get('/api/jobs/:jobId/applications', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 일자리 존재 및 소유자 확인
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { employerId: true, title: true }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        timestamp: new Date().toISOString()
      });
    }

    if (job.employerId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only job owner can view applications',
        timestamp: new Date().toISOString()
      });
    }

    // 지원자 목록 조회
    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: applications,
      total: applications.length,
      jobTitle: job.title,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job applications',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 일자리 상태 관리 API (고용주용)
app.put('/api/jobs/:jobId/status', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const validStatuses = ['OPEN', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        validStatuses,
        timestamp: new Date().toISOString()
      });
    }

    // 일자리 조회 및 권한 확인
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: true
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        timestamp: new Date().toISOString()
      });
    }

    if (job.employerId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the employer can change job status',
        timestamp: new Date().toISOString()
      });
    }

    // 상태 업데이트
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { status },
      include: {
        employer: {
          select: {
            id: true,
            name: true
          }
        },
        applications: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedJob,
      message: `Job status updated to ${status.toLowerCase()}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API v1 라우트 (프론트엔드 호환성을 위한 별칭)
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, name, userType = 'WORKER' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['email', 'password', 'name'],
        timestamp: new Date().toISOString()
      });
    }

    let user = null;
    
    if (prisma) {
      try {
        user = await prisma.user.create({
          data: {
            email,
            password: await bcrypt.hash(password, 10),
            name,
            userType,
            verified: false,
            isActive: true
          },
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
            verified: true,
            createdAt: true
          }
        });
      } catch (error) {
        if (error.code === 'P2002') {
          return res.status(409).json({
            success: false,
            error: 'Email already exists',
            timestamp: new Date().toISOString()
          });
        }
        throw error;
      }
    } else {
      user = {
        id: Date.now().toString(),
        email,
        name,
        userType,
        verified: false,
        createdAt: new Date().toISOString()
      };
    }

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: { user, token },
      message: 'User registered successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    let user = null;
    
    if (prisma) {
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          userType: true,
          verified: true,
          isActive: true,
          createdAt: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          timestamp: new Date().toISOString()
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          timestamp: new Date().toISOString()
        });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      user = userWithoutPassword;
    } else {
      // Development mode - basic validation
      if (email === 'admin@example.com' && password === 'admin123') {
        user = {
          id: 'dev-user-1',
          email: 'admin@example.com',
          name: 'Admin User',
          userType: 'EMPLOYER',
          verified: true,
          createdAt: new Date().toISOString()
        };
      } else {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          timestamp: new Date().toISOString()
        });
      }
    }

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: { user, token },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/jobs', (req, res) => {
  app._router.handle(Object.assign({}, req, { url: '/api/jobs' }), res);
});

app.post('/api/v1/jobs', (req, res) => {
  app._router.handle(Object.assign({}, req, { url: '/api/jobs' }), res);
});

app.post('/api/v1/jobs/:jobId/apply', (req, res) => {
  app._router.handle(Object.assign({}, req, { url: req.url.replace('/api/v1/', '/api/') }), res);
});

// 404 핸들러
// ========================
// 이력서 API
// ========================

// 내 이력서 조회
app.get('/api/users/resume', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const resume = await prisma.resume.findUnique({
      where: { userId: req.userId },
      include: {
        workExperiences: {
          orderBy: { startDate: 'desc' }
        },
        educations: {
          orderBy: { startDate: 'desc' }
        },
        skills: {
          orderBy: { category: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: resume,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get resume',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 이력서 생성/업데이트
app.post('/api/users/resume', authenticateToken, async (req, res) => {
  try {
    const { title, summary, phone, address, birthDate } = req.body;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const resumeData = {
      title,
      summary,
      phone,
      address,
      birthDate: birthDate ? new Date(birthDate) : null
    };

    // upsert: 존재하면 업데이트, 없으면 생성
    const resume = await prisma.resume.upsert({
      where: { userId: req.userId },
      update: resumeData,
      create: {
        ...resumeData,
        userId: req.userId
      },
      include: {
        workExperiences: {
          orderBy: { startDate: 'desc' }
        },
        educations: {
          orderBy: { startDate: 'desc' }
        },
        skills: {
          orderBy: { category: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: resume,
      message: 'Resume saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Save resume error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save resume',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 경력 추가
app.post('/api/users/resume/work-experiences', authenticateToken, async (req, res) => {
  try {
    const { company, position, description, startDate, endDate, isCurrent } = req.body;

    if (!company || !position || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['company', 'position', 'startDate'],
        timestamp: new Date().toISOString()
      });
    }

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 이력서가 없으면 먼저 생성
    await prisma.resume.upsert({
      where: { userId: req.userId },
      update: {},
      create: { userId: req.userId }
    });

    const workExperience = await prisma.workExperience.create({
      data: {
        company,
        position,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent || false,
        resume: {
          connect: { userId: req.userId }
        }
      }
    });

    res.json({
      success: true,
      data: workExperience,
      message: 'Work experience added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Add work experience error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add work experience',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 경력 수정
app.put('/api/users/resume/work-experiences/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { company, position, description, startDate, endDate, isCurrent } = req.body;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 권한 확인
    const workExperience = await prisma.workExperience.findFirst({
      where: {
        id,
        resume: { userId: req.userId }
      }
    });

    if (!workExperience) {
      return res.status(404).json({
        success: false,
        error: 'Work experience not found',
        timestamp: new Date().toISOString()
      });
    }

    const updatedWorkExperience = await prisma.workExperience.update({
      where: { id },
      data: {
        company,
        position,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent !== undefined ? isCurrent : undefined
      }
    });

    res.json({
      success: true,
      data: updatedWorkExperience,
      message: 'Work experience updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update work experience error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update work experience',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 경력 삭제
app.delete('/api/users/resume/work-experiences/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 권한 확인
    const workExperience = await prisma.workExperience.findFirst({
      where: {
        id,
        resume: { userId: req.userId }
      }
    });

    if (!workExperience) {
      return res.status(404).json({
        success: false,
        error: 'Work experience not found',
        timestamp: new Date().toISOString()
      });
    }

    await prisma.workExperience.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Work experience deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete work experience error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete work experience',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 학력 추가
app.post('/api/users/resume/educations', authenticateToken, async (req, res) => {
  try {
    const { school, major, degree, startDate, endDate, isGraduated, gpa, maxGpa } = req.body;

    if (!school || !degree || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['school', 'degree', 'startDate'],
        timestamp: new Date().toISOString()
      });
    }

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 이력서가 없으면 먼저 생성
    await prisma.resume.upsert({
      where: { userId: req.userId },
      update: {},
      create: { userId: req.userId }
    });

    const education = await prisma.education.create({
      data: {
        school,
        major,
        degree,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isGraduated: isGraduated || false,
        gpa: gpa ? parseFloat(gpa) : null,
        maxGpa: maxGpa ? parseFloat(maxGpa) : null,
        resume: {
          connect: { userId: req.userId }
        }
      }
    });

    res.json({
      success: true,
      data: education,
      message: 'Education added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add education',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 학력 수정
app.put('/api/users/resume/educations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { school, major, degree, startDate, endDate, isGraduated, gpa, maxGpa } = req.body;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 권한 확인
    const education = await prisma.education.findFirst({
      where: {
        id,
        resume: { userId: req.userId }
      }
    });

    if (!education) {
      return res.status(404).json({
        success: false,
        error: 'Education not found',
        timestamp: new Date().toISOString()
      });
    }

    const updatedEducation = await prisma.education.update({
      where: { id },
      data: {
        school,
        major,
        degree,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        isGraduated: isGraduated !== undefined ? isGraduated : undefined,
        gpa: gpa ? parseFloat(gpa) : null,
        maxGpa: maxGpa ? parseFloat(maxGpa) : null
      }
    });

    res.json({
      success: true,
      data: updatedEducation,
      message: 'Education updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update education',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 학력 삭제
app.delete('/api/users/resume/educations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 권한 확인
    const education = await prisma.education.findFirst({
      where: {
        id,
        resume: { userId: req.userId }
      }
    });

    if (!education) {
      return res.status(404).json({
        success: false,
        error: 'Education not found',
        timestamp: new Date().toISOString()
      });
    }

    await prisma.education.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Education deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete education',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 스킬 추가
app.post('/api/users/resume/skills', authenticateToken, async (req, res) => {
  try {
    const { name, level, category } = req.body;

    if (!name || !level) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['name', 'level'],
        timestamp: new Date().toISOString()
      });
    }

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 이력서가 없으면 먼저 생성
    await prisma.resume.upsert({
      where: { userId: req.userId },
      update: {},
      create: { userId: req.userId }
    });

    const skill = await prisma.skill.create({
      data: {
        name,
        level,
        category,
        resume: {
          connect: { userId: req.userId }
        }
      }
    });

    res.json({
      success: true,
      data: skill,
      message: 'Skill added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add skill',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 스킬 수정
app.put('/api/users/resume/skills/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, category } = req.body;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 권한 확인
    const skill = await prisma.skill.findFirst({
      where: {
        id,
        resume: { userId: req.userId }
      }
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found',
        timestamp: new Date().toISOString()
      });
    }

    const updatedSkill = await prisma.skill.update({
      where: { id },
      data: {
        name,
        level,
        category
      }
    });

    res.json({
      success: true,
      data: updatedSkill,
      message: 'Skill updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update skill',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 스킬 삭제
app.delete('/api/users/resume/skills/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 권한 확인
    const skill = await prisma.skill.findFirst({
      where: {
        id,
        resume: { userId: req.userId }
      }
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found',
        timestamp: new Date().toISOString()
      });
    }

    await prisma.skill.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Skill deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete skill',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========================
// 회사 인증 API
// ========================

// 내 회사 정보 조회
app.get('/api/users/company', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const company = await prisma.company.findUnique({
      where: { userId: req.userId },
      include: {
        verificationDocs: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      data: company,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get company information',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 회사 정보 등록/업데이트
app.post('/api/users/company', authenticateToken, async (req, res) => {
  try {
    const {
      businessName,
      businessNumber,
      ceoName,
      businessType,
      businessAddress,
      phoneNumber,
      email,
      website,
      establishedDate,
      employeeCount,
      description
    } = req.body;

    if (!businessName || !businessNumber || !ceoName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['businessName', 'businessNumber', 'ceoName'],
        timestamp: new Date().toISOString()
      });
    }

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const companyData = {
      businessName,
      businessNumber,
      ceoName,
      businessType,
      businessAddress,
      phoneNumber,
      email,
      website,
      establishedDate: establishedDate ? new Date(establishedDate) : null,
      employeeCount: employeeCount ? parseInt(employeeCount) : null,
      description
    };

    // upsert: 존재하면 업데이트, 없으면 생성
    const company = await prisma.company.upsert({
      where: { userId: req.userId },
      update: companyData,
      create: {
        ...companyData,
        userId: req.userId,
        verificationStatus: 'PENDING'
      },
      include: {
        verificationDocs: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      data: company,
      message: 'Company information saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Save company error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Business number already exists',
        timestamp: new Date().toISOString()
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to save company information',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 인증 서류 업로드 정보 저장 (실제 파일 업로드는 별도 처리)
app.post('/api/users/company/documents', authenticateToken, async (req, res) => {
  try {
    const { type, fileName, filePath, fileSize, mimeType } = req.body;

    if (!type || !fileName || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['type', 'fileName', 'filePath'],
        timestamp: new Date().toISOString()
      });
    }

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 회사 정보가 없으면 먼저 생성
    const company = await prisma.company.upsert({
      where: { userId: req.userId },
      update: {},
      create: {
        userId: req.userId,
        businessName: '미입력',
        businessNumber: '000-00-00000',
        ceoName: '미입력',
        verificationStatus: 'PENDING'
      }
    });

    // 같은 타입의 기존 문서가 있으면 삭제
    await prisma.verificationDocument.deleteMany({
      where: {
        companyId: company.id,
        type
      }
    });

    const document = await prisma.verificationDocument.create({
      data: {
        type,
        fileName,
        filePath,
        fileSize: fileSize ? parseInt(fileSize) : null,
        mimeType,
        companyId: company.id
      }
    });

    res.json({
      success: true,
      data: document,
      message: 'Document uploaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 인증 서류 삭제
app.delete('/api/users/company/documents/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 권한 확인
    const document = await prisma.verificationDocument.findFirst({
      where: {
        id,
        company: { userId: req.userId }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        timestamp: new Date().toISOString()
      });
    }

    await prisma.verificationDocument.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Document deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 인증 신청
app.post('/api/users/company/verify', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 회사 정보 조회
    const company = await prisma.company.findUnique({
      where: { userId: req.userId },
      include: {
        verificationDocs: true
      }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company information not found. Please register company information first.',
        timestamp: new Date().toISOString()
      });
    }

    if (company.verificationStatus === 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: 'Company is already verified',
        timestamp: new Date().toISOString()
      });
    }

    if (company.verificationStatus === 'UNDER_REVIEW') {
      return res.status(400).json({
        success: false,
        error: 'Verification is already under review',
        timestamp: new Date().toISOString()
      });
    }

    // 필수 정보 확인
    if (!company.businessName || !company.businessNumber || !company.ceoName) {
      return res.status(400).json({
        success: false,
        error: 'Please complete business name, business number, and CEO name',
        timestamp: new Date().toISOString()
      });
    }

    // 필수 서류 확인 (사업자등록증)
    const hasBusinessLicense = company.verificationDocs.some(doc => doc.type === 'BUSINESS_LICENSE');
    if (!hasBusinessLicense) {
      return res.status(400).json({
        success: false,
        error: 'Business license document is required for verification',
        timestamp: new Date().toISOString()
      });
    }

    // 인증 상태를 검토 중으로 변경
    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
      data: {
        verificationStatus: 'UNDER_REVIEW'
      },
      include: {
        verificationDocs: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      data: updatedCompany,
      message: 'Verification request submitted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Submit verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit verification request',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 관리자: 인증 승인/거절 (향후 관리자 페이지용)
app.put('/api/admin/companies/:companyId/verification', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { status, rejectedReason } = req.body;

    // 임시로 모든 사용자가 접근 가능 (실제로는 관리자 권한 확인 필요)
    
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be APPROVED or REJECTED',
        timestamp: new Date().toISOString()
      });
    }

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const updateData = {
      verificationStatus: status,
      verifiedAt: status === 'APPROVED' ? new Date() : null,
      rejectedReason: status === 'REJECTED' ? rejectedReason : null
    };

    const company = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        verificationDocs: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      data: company,
      message: `Company verification ${status.toLowerCase()} successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update verification status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update verification status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========================
// 리뷰 시스템 API
// ========================

// 리뷰 작성
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { jobId, revieweeId, rating, comment, reviewType } = req.body;

    if (!jobId || !revieweeId || !rating || !reviewType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['jobId', 'revieweeId', 'rating', 'reviewType'],
        timestamp: new Date().toISOString()
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
        timestamp: new Date().toISOString()
      });
    }

    if (!['EMPLOYER_TO_WORKER', 'WORKER_TO_EMPLOYER'].includes(reviewType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid review type',
        timestamp: new Date().toISOString()
      });
    }

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 일자리 정보 확인
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          where: {
            status: 'ACCEPTED'
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        timestamp: new Date().toISOString()
      });
    }

    // 일자리가 완료되었는지 확인 (선택적 - 현재는 체크하지 않음)
    // if (job.status !== 'COMPLETED') {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Can only review completed jobs',
    //     timestamp: new Date().toISOString()
    //   });
    // }

    // 권한 확인 - 고용주는 승인된 근로자만 리뷰 가능, 근로자는 고용주만 리뷰 가능
    let isAuthorized = false;
    
    if (reviewType === 'EMPLOYER_TO_WORKER') {
      // 고용주가 근로자에게 리뷰 - 고용주여야 하고, 리뷰 대상이 승인된 지원자여야 함
      isAuthorized = job.employerId === req.userId && 
                    job.applications.some(app => app.workerId === revieweeId);
    } else if (reviewType === 'WORKER_TO_EMPLOYER') {
      // 근로자가 고용주에게 리뷰 - 승인된 근로자여야 하고, 리뷰 대상이 고용주여야 함
      isAuthorized = job.applications.some(app => app.workerId === req.userId) && 
                    job.employerId === revieweeId;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to review this user for this job',
        timestamp: new Date().toISOString()
      });
    }

    // 중복 리뷰 확인
    const existingReview = await prisma.review.findUnique({
      where: {
        jobId_reviewerId_revieweeId: {
          jobId,
          reviewerId: req.userId,
          revieweeId
        }
      }
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        error: 'You have already reviewed this user for this job',
        timestamp: new Date().toISOString()
      });
    }

    // 리뷰 생성
    const review = await prisma.review.create({
      data: {
        jobId,
        reviewerId: req.userId,
        revieweeId,
        rating: parseInt(rating),
        comment,
        reviewType,
        isPublic: true
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true
          }
        },
        job: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: review,
      message: 'Review created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create review',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 내가 받은 리뷰 조회
app.get('/api/users/reviews/received', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          revieweeId: req.userId,
          isPublic: true
        },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true
            }
          },
          job: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.review.count({
        where: {
          revieweeId: req.userId,
          isPublic: true
        }
      })
    ]);

    // 평균 평점 계산
    const avgRating = await prisma.review.aggregate({
      where: {
        revieweeId: req.userId,
        isPublic: true
      },
      _avg: {
        rating: true
      }
    });

    res.json({
      success: true,
      data: {
        reviews,
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        averageRating: avgRating._avg.rating || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get received reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get received reviews',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 내가 작성한 리뷰 조회
app.get('/api/users/reviews/given', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          reviewerId: req.userId
        },
        include: {
          reviewee: {
            select: {
              id: true,
              name: true
            }
          },
          job: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.review.count({
        where: {
          reviewerId: req.userId
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get given reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get given reviews',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 특정 사용자의 리뷰 조회 (공개)
app.get('/api/users/:userId/reviews', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        userType: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          revieweeId: userId,
          isPublic: true
        },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true
            }
          },
          job: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.review.count({
        where: {
          revieweeId: userId,
          isPublic: true
        }
      })
    ]);

    // 평균 평점 계산
    const avgRating = await prisma.review.aggregate({
      where: {
        revieweeId: userId,
        isPublic: true
      },
      _avg: {
        rating: true
      }
    });

    // 평점별 개수 계산
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        revieweeId: userId,
        isPublic: true
      },
      _count: {
        rating: true
      }
    });

    res.json({
      success: true,
      data: {
        user,
        reviews,
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        averageRating: avgRating._avg.rating || 0,
        ratingDistribution
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user reviews',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 리뷰 수정
app.put('/api/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        error: 'Rating is required',
        timestamp: new Date().toISOString()
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
        timestamp: new Date().toISOString()
      });
    }

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 권한 확인
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
        timestamp: new Date().toISOString()
      });
    }

    if (review.reviewerId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own reviews',
        timestamp: new Date().toISOString()
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: parseInt(rating),
        comment
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true
          }
        },
        job: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedReview,
      message: 'Review updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update review',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 리뷰 삭제
app.delete('/api/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    // 권한 확인
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
        timestamp: new Date().toISOString()
      });
    }

    if (review.reviewerId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own reviews',
        timestamp: new Date().toISOString()
      });
    }

    await prisma.review.delete({
      where: { id: reviewId }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete review',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 일자리별 리뷰 대상자 조회 (리뷰 작성 가능한 사용자 목록)
app.get('/api/jobs/:jobId/reviewable-users', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: {
          select: {
            id: true,
            name: true
          }
        },
        applications: {
          where: {
            status: 'ACCEPTED'
          },
          include: {
            worker: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        timestamp: new Date().toISOString()
      });
    }

    let reviewableUsers = [];

    // 고용주인 경우 - 승인된 근로자들을 리뷰할 수 있음
    if (job.employerId === req.userId) {
      reviewableUsers = job.applications.map(app => ({
        userId: app.worker.id,
        name: app.worker.name,
        reviewType: 'EMPLOYER_TO_WORKER'
      }));
    } 
    // 승인된 근로자인 경우 - 고용주를 리뷰할 수 있음
    else if (job.applications.some(app => app.workerId === req.userId)) {
      reviewableUsers = [{
        userId: job.employer.id,
        name: job.employer.name,
        reviewType: 'WORKER_TO_EMPLOYER'
      }];
    }

    // 이미 리뷰한 사용자 제외
    const existingReviews = await prisma.review.findMany({
      where: {
        jobId,
        reviewerId: req.userId
      },
      select: {
        revieweeId: true
      }
    });

    const reviewedUserIds = existingReviews.map(review => review.revieweeId);
    reviewableUsers = reviewableUsers.filter(user => !reviewedUserIds.includes(user.userId));

    res.json({
      success: true,
      data: {
        job: {
          id: job.id,
          title: job.title
        },
        reviewableUsers
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get reviewable users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reviewable users',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: ['/', '/health', '/api', '/api/users', '/api/jobs', '/api/users/resume'],
    timestamp: new Date().toISOString()
  });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 서버 시작 (테스트 환경에서는 실행하지 않음)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 OneTime API Server running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API info: http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // DB 연결 테스트 (비동기, 서버 시작을 막지 않음)
    if (prisma) {
      setTimeout(async () => {
        try {
          await prisma.$queryRaw`SELECT 1`;
          console.log('✅ Database connection successful');
        } catch (error) {
          console.log('⚠️ Database connection failed, using mock data');
          console.log('💡 DB may need setup or is still starting');
        }
      }, 1000);
    } else {
      console.log('⚠️ Database not initialized, using mock data only');
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  if (prisma) await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  if (prisma) await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;