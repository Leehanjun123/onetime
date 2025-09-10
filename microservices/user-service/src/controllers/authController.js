const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const emailService = require('../services/email');
const eventPublisher = require('../services/eventPublisher');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

class AuthController {
  /**
   * 회원가입
   */
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다',
          errors: errors.array()
        });
      }

      const { email, password, name, phone, userType } = req.body;

      // 중복 사용자 확인
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { phone: phone || '' }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(409).json({
            success: false,
            message: '이미 존재하는 이메일입니다'
          });
        }
        if (existingUser.phone === phone) {
          return res.status(409).json({
            success: false,
            message: '이미 존재하는 전화번호입니다'
          });
        }
      }

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 12);

      // 이메일 인증 토큰 생성
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      // 사용자 생성
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          userType,
          emailVerificationToken,
          verified: false
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          userType: true,
          verified: true,
          createdAt: true
        }
      });

      // JWT 토큰 생성
      const accessToken = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          userType: user.userType,
          verified: user.verified
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
      );

      // 리프레시 토큰 저장
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일
        }
      });

      // 인증 이메일 발송
      try {
        await emailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);
      } catch (emailError) {
        logger.warn('Failed to send verification email:', emailError);
      }

      // 이벤트 발행 (사용자 생성)
      await eventPublisher.publishEvent('user.created', {
        userId: user.id,
        email: user.email,
        userType: user.userType,
        timestamp: new Date()
      });

      logger.info(`[${req.requestId}] User registered successfully: ${user.id}`);

      res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
        data: {
          user,
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      logger.error(`[${req.requestId}] Registration error:`, error);
      res.status(500).json({
        success: false,
        message: '회원가입 중 오류가 발생했습니다'
      });
    }
  }

  /**
   * 로그인
   */
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // 사용자 조회
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          phone: true,
          userType: true,
          verified: true,
          status: true,
          lastLoginAt: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다'
        });
      }

      // 계정 상태 확인
      if (user.status === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          message: '정지된 계정입니다. 관리자에게 문의하세요'
        });
      }

      if (user.status === 'INACTIVE') {
        return res.status(403).json({
          success: false,
          message: '비활성화된 계정입니다'
        });
      }

      // 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다'
        });
      }

      // JWT 토큰 생성
      const accessToken = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          userType: user.userType,
          verified: user.verified
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
      );

      // 리프레시 토큰 저장
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일
        }
      });

      // 마지막 로그인 시간 업데이트
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // 응답 데이터에서 비밀번호 제외
      const { password: _, ...userWithoutPassword } = user;

      logger.info(`[${req.requestId}] User logged in successfully: ${user.id}`);

      res.json({
        success: true,
        message: '로그인이 완료되었습니다',
        data: {
          user: userWithoutPassword,
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      logger.error(`[${req.requestId}] Login error:`, error);
      res.status(500).json({
        success: false,
        message: '로그인 중 오류가 발생했습니다'
      });
    }
  }

  /**
   * 로그아웃
   */
  async logout(req, res) {
    try {
      const token = req.token;
      const userId = req.user?.id;

      if (userId) {
        // 모든 리프레시 토큰 무효화
        await prisma.refreshToken.deleteMany({
          where: { userId }
        });
      }

      // 토큰 블랙리스트 추가 (Redis 사용 시)
      // await redisClient.setEx(`blacklist:${token}`, 24 * 60 * 60, 'true');

      logger.info(`[${req.requestId}] User logged out: ${userId}`);

      res.json({
        success: true,
        message: '로그아웃이 완료되었습니다'
      });

    } catch (error) {
      logger.error(`[${req.requestId}] Logout error:`, error);
      res.status(500).json({
        success: false,
        message: '로그아웃 중 오류가 발생했습니다'
      });
    }
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다',
          errors: errors.array()
        });
      }

      const { refreshToken } = req.body;

      // 리프레시 토큰 검증
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          message: '유효하지 않은 리프레시 토큰입니다'
        });
      }

      // DB에서 리프레시 토큰 확인
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.userId,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              userType: true,
              verified: true,
              status: true
            }
          }
        }
      });

      if (!storedToken || storedToken.user.status !== 'ACTIVE') {
        return res.status(401).json({
          success: false,
          message: '유효하지 않은 리프레시 토큰입니다'
        });
      }

      // 새 액세스 토큰 생성
      const accessToken = jwt.sign(
        { 
          userId: storedToken.user.id,
          email: storedToken.user.email,
          userType: storedToken.user.userType,
          verified: storedToken.user.verified
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      logger.info(`[${req.requestId}] Token refreshed for user: ${storedToken.user.id}`);

      res.json({
        success: true,
        message: '토큰이 갱신되었습니다',
        data: {
          accessToken
        }
      });

    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: '유효하지 않은 리프레시 토큰입니다'
        });
      }

      logger.error(`[${req.requestId}] Token refresh error:`, error);
      res.status(500).json({
        success: false,
        message: '토큰 갱신 중 오류가 발생했습니다'
      });
    }
  }

  /**
   * 비밀번호 재설정 요청
   */
  async forgotPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다',
          errors: errors.array()
        });
      }

      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true }
      });

      // 보안상 사용자 존재 여부를 알려주지 않음
      if (!user) {
        return res.json({
          success: true,
          message: '비밀번호 재설정 링크가 이메일로 발송되었습니다'
        });
      }

      // 재설정 토큰 생성
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1시간

      // 토큰 저장
      await prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt: resetTokenExpiry
        }
      });

      // 재설정 이메일 발송
      await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

      logger.info(`[${req.requestId}] Password reset requested for user: ${user.id}`);

      res.json({
        success: true,
        message: '비밀번호 재설정 링크가 이메일로 발송되었습니다'
      });

    } catch (error) {
      logger.error(`[${req.requestId}] Forgot password error:`, error);
      res.status(500).json({
        success: false,
        message: '비밀번호 재설정 요청 중 오류가 발생했습니다'
      });
    }
  }

  /**
   * 비밀번호 재설정
   */
  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다',
          errors: errors.array()
        });
      }

      const { token, password } = req.body;

      // 재설정 토큰 확인
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() },
          used: false
        },
        include: {
          user: { select: { id: true } }
        }
      });

      if (!resetToken) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않거나 만료된 재설정 토큰입니다'
        });
      }

      // 새 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 12);

      // 비밀번호 업데이트
      await prisma.user.update({
        where: { id: resetToken.user.id },
        data: { password: hashedPassword }
      });

      // 토큰 사용 처리
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      });

      // 모든 리프레시 토큰 무효화
      await prisma.refreshToken.deleteMany({
        where: { userId: resetToken.user.id }
      });

      logger.info(`[${req.requestId}] Password reset completed for user: ${resetToken.user.id}`);

      res.json({
        success: true,
        message: '비밀번호가 성공적으로 재설정되었습니다'
      });

    } catch (error) {
      logger.error(`[${req.requestId}] Reset password error:`, error);
      res.status(500).json({
        success: false,
        message: '비밀번호 재설정 중 오류가 발생했습니다'
      });
    }
  }

  /**
   * 이메일 인증
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: '인증 토큰이 필요합니다'
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          verified: false
        },
        select: { id: true, email: true, name: true }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 인증 토큰입니다'
        });
      }

      // 이메일 인증 완료
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verified: true,
          emailVerificationToken: null,
          verifiedAt: new Date()
        }
      });

      // 이벤트 발행 (사용자 인증 완료)
      await eventPublisher.publishEvent('user.verified', {
        userId: user.id,
        email: user.email,
        timestamp: new Date()
      });

      logger.info(`[${req.requestId}] Email verified for user: ${user.id}`);

      res.json({
        success: true,
        message: '이메일 인증이 완료되었습니다'
      });

    } catch (error) {
      logger.error(`[${req.requestId}] Email verification error:`, error);
      res.status(500).json({
        success: false,
        message: '이메일 인증 중 오류가 발생했습니다'
      });
    }
  }

  /**
   * 인증 이메일 재발송
   */
  async resendVerification(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, verified: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다'
        });
      }

      if (user.verified) {
        return res.status(400).json({
          success: false,
          message: '이미 인증된 계정입니다'
        });
      }

      // 새 인증 토큰 생성
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken }
      });

      // 인증 이메일 발송
      await emailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);

      logger.info(`[${req.requestId}] Verification email resent for user: ${user.id}`);

      res.json({
        success: true,
        message: '인증 이메일이 재발송되었습니다'
      });

    } catch (error) {
      logger.error(`[${req.requestId}] Resend verification error:`, error);
      res.status(500).json({
        success: false,
        message: '인증 이메일 재발송 중 오류가 발생했습니다'
      });
    }
  }
}

module.exports = new AuthController();