const express = require('express');
const { prisma } = require('../config/database');
const { generateToken, verifyToken } = require('../utils/jwt');
const { hashPassword, comparePassword, validatePassword } = require('../utils/password');
const { authenticateToken, optionalAuth } = require('../middlewares/auth');
const router = express.Router();

// 이메일/전화번호로 회원가입
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      phone,
      name,
      password,
      userType = 'WORKER',
      avatar
    } = req.body;

    // 필수 필드 검증
    if (!email || !name || !password) {
      return res.status(400).json({ 
        message: '필수 정보가 누락되었습니다',
        required: ['email', 'name', 'password']
      });
    }

    // 비밀번호 강도 검증
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: '비밀번호가 규칙에 맞지 않습니다',
        errors: passwordValidation.errors
      });
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: '이미 존재하는 이메일입니다' 
      });
    }

    // 전화번호 중복 확인 (제공된 경우)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone }
      });

      if (existingPhone) {
        return res.status(400).json({ 
          message: '이미 존재하는 전화번호입니다' 
        });
      }
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name,
        password: hashedPassword,
        userType: userType.toUpperCase(),
        avatar
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        userType: true,
        verified: true,
        rating: true,
        createdAt: true
      }
    });

    // JWT 토큰 생성
    const token = generateToken({
      id: user.id,
      email: user.email,
      userType: user.userType
    });

    res.status(201).json({
      message: '회원가입이 완료되었습니다',
      user,
      token,
      expiresIn: '7d'
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ 
      message: '회원가입에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        message: '비밀번호를 입력해주세요' 
      });
    }

    if (!email && !phone) {
      return res.status(400).json({ 
        message: '이메일 또는 전화번호를 입력해주세요' 
      });
    }

    // 사용자 찾기
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    });

    if (!user) {
      return res.status(401).json({ 
        message: '이메일 또는 비밀번호가 올바르지 않습니다' 
      });
    }

    if (!user.password) {
      return res.status(401).json({ 
        message: '소셜 로그인 사용자입니다. 소셜 로그인을 이용해주세요' 
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: '이메일 또는 비밀번호가 올바르지 않습니다' 
      });
    }

    // 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // JWT 토큰 생성
    const token = generateToken({
      id: user.id,
      email: user.email,
      userType: user.userType
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: '로그인 성공',
      user: userWithoutPassword,
      token,
      expiresIn: '7d'
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ 
      message: '로그인에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 프로필 조회 (인증 필요)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        userType: true,
        verified: true,
        rating: true,
        totalEarned: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            jobs: true,
            applications: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ 
        message: '사용자를 찾을 수 없습니다' 
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({ 
      message: '프로필 정보를 불러오는데 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 토큰 검증
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    if (!token) {
      return res.status(401).json({ 
        valid: false,
        message: '토큰이 없습니다' 
      });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        userType: true,
        verified: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        valid: false,
        message: '사용자를 찾을 수 없습니다' 
      });
    }

    res.json({ 
      valid: true,
      user 
    });
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    
    if (error.message === 'Invalid token' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        valid: false,
        message: '유효하지 않은 토큰입니다' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        valid: false,
        message: '토큰이 만료되었습니다',
        code: 'TOKEN_EXPIRED'
      });
    }

    res.status(500).json({ 
      valid: false,
      message: '토큰 검증에 실패했습니다'
    });
  }
});

// 로그아웃 (토큰 무효화는 클라이언트에서 처리)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.json({ 
      message: '로그아웃 되었습니다' 
    });
  } catch (error) {
    console.error('로그아웃 오류:', error);
    res.status(500).json({ 
      message: '로그아웃 처리에 실패했습니다' 
    });
  }
});

// 비밀번호 변경
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요' 
      });
    }

    // 새 비밀번호 강도 검증
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: '새 비밀번호가 규칙에 맞지 않습니다',
        errors: passwordValidation.errors
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user || !user.password) {
      return res.status(400).json({ 
        message: '비밀번호를 변경할 수 없습니다' 
      });
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        message: '현재 비밀번호가 올바르지 않습니다' 
      });
    }

    // 새 비밀번호 해싱 및 업데이트
    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({ 
      message: '비밀번호가 성공적으로 변경되었습니다' 
    });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    res.status(500).json({ 
      message: '비밀번호 변경에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;