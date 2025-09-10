const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// 인증 관련 Rate Limiting (더 엄격하게)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 시도
  message: {
    success: false,
    message: '인증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 회원가입
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - userType
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *                 minLength: 2
 *               phone:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [WORKER, EMPLOYER]
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *       400:
 *         description: 잘못된 요청
 *       409:
 *         description: 이미 존재하는 사용자
 */
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 최소 8자 이상이어야 합니다')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다'),
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2-50자 사이여야 합니다')
    .matches(/^[가-힣a-zA-Z\s]+$/)
    .withMessage('이름은 한글 또는 영문만 가능합니다'),
  body('phone')
    .optional()
    .matches(/^010-\d{4}-\d{4}$/)
    .withMessage('전화번호 형식이 올바르지 않습니다 (010-0000-0000)'),
  body('userType')
    .isIn(['WORKER', 'EMPLOYER'])
    .withMessage('사용자 유형은 WORKER 또는 EMPLOYER여야 합니다')
], authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
router.post('/login', authLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요'),
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요')
], authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 */
router.post('/logout', authMiddleware.verifyToken, authController.logout);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: 토큰 갱신
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *       401:
 *         description: 유효하지 않은 토큰
 */
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('리프레시 토큰이 필요합니다')
], authController.refreshToken);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: 비밀번호 재설정 요청
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 이메일 발송
 */
router.post('/forgot-password', authLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요')
], authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: 비밀번호 재설정
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 성공
 */
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('재설정 토큰이 필요합니다'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 최소 8자 이상이어야 합니다')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다')
], authController.resetPassword);

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: 이메일 인증
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 이메일 인증 성공
 *       400:
 *         description: 잘못된 토큰
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: 인증 이메일 재발송
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 인증 이메일 발송 성공
 */
router.post('/resend-verification', 
  authMiddleware.verifyToken, 
  authController.resendVerification
);

module.exports = router;