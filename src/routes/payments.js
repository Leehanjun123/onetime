const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const PaymentService = require('../services/PaymentService');
const SettlementService = require('../services/SettlementService');
const logger = require('../utils/logger');

const router = express.Router();
const paymentService = new PaymentService();
const settlementService = new SettlementService();

// 결제 생성
router.post('/create',
  authenticateToken,
  [
    body('jobId').notEmpty().withMessage('일자리 ID는 필수입니다'),
    body('workerId').notEmpty().withMessage('워커 ID는 필수입니다'),
    body('amount').isInt({ min: 1 }).withMessage('결제 금액은 1원 이상이어야 합니다'),
    body('orderName').notEmpty().withMessage('주문명은 필수입니다'),
    body('customerName').notEmpty().withMessage('고객명은 필수입니다'),
    body('customerEmail').isEmail().withMessage('유효한 이메일 주소를 입력해주세요'),
    body('customerMobilePhone').optional().isMobilePhone('ko-KR'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다',
          errors: errors.array()
        });
      }

      const {
        jobId,
        workerId,
        amount,
        orderName,
        customerName,
        customerEmail,
        customerMobilePhone
      } = req.body;

      const payment = await paymentService.createPayment({
        jobId,
        workerId,
        businessId: req.user.userId,
        amount: parseInt(amount),
        orderName,
        customerName,
        customerEmail,
        customerMobilePhone,
      });

      res.json({
        success: true,
        message: '결제가 생성되었습니다',
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          amount: payment.amount,
          customerName: payment.customerName,
        }
      });
    } catch (error) {
      logger.error('Payment creation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '결제 생성에 실패했습니다'
      });
    }
  }
);

// 결제 승인 (토스페이먼츠 웹훅)
router.post('/confirm',
  [
    body('paymentKey').notEmpty().withMessage('결제 키는 필수입니다'),
    body('orderId').notEmpty().withMessage('주문 ID는 필수입니다'),
    body('amount').isInt({ min: 1 }).withMessage('결제 금액은 1원 이상이어야 합니다'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다',
          errors: errors.array()
        });
      }

      const { paymentKey, orderId, amount } = req.body;

      const payment = await paymentService.confirmPayment(
        paymentKey,
        orderId,
        parseInt(amount)
      );

      res.json({
        success: true,
        message: '결제가 승인되었습니다',
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          status: payment.status,
          approvedAt: payment.approvedAt,
        }
      });
    } catch (error) {
      logger.error('Payment confirmation error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '결제 승인에 실패했습니다'
      });
    }
  }
);

// 결제 취소
router.post('/cancel/:paymentId',
  authenticateToken,
  [
    body('cancelReason').notEmpty().withMessage('취소 사유는 필수입니다'),
    body('cancelAmount').optional().isInt({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다',
          errors: errors.array()
        });
      }

      const { paymentId } = req.params;
      const { cancelReason, cancelAmount } = req.body;

      const payment = await paymentService.cancelPayment(
        paymentId,
        cancelReason,
        cancelAmount ? parseInt(cancelAmount) : null
      );

      res.json({
        success: true,
        message: '결제가 취소되었습니다',
        data: {
          paymentId: payment.id,
          status: payment.status,
          cancelledAt: payment.cancelledAt,
          cancelAmount: payment.cancelAmount,
        }
      });
    } catch (error) {
      logger.error('Payment cancellation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '결제 취소에 실패했습니다'
      });
    }
  }
);

// 결제 내역 조회
router.get('/history',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']),
    query('method').optional().isIn(['CARD', 'TRANSFER', 'VIRTUAL_ACCOUNT', 'MOBILE']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '쿼리 매개변수가 올바르지 않습니다',
          errors: errors.array()
        });
      }

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        method: req.query.method,
      };

      const result = await paymentService.getPaymentHistory(req.user.userId, options);

      res.json({
        success: true,
        message: '결제 내역을 성공적으로 조회했습니다',
        data: result
      });
    } catch (error) {
      logger.error('Payment history error:', error);
      res.status(500).json({
        success: false,
        message: '결제 내역 조회에 실패했습니다'
      });
    }
  }
);

// 지갑 정보 조회
router.get('/wallet',
  authenticateToken,
  async (req, res) => {
    try {
      const wallet = await paymentService.prisma.wallet.findUnique({
        where: { userId: req.user.userId },
      });

      if (!wallet) {
        // 지갑이 없으면 생성
        const newWallet = await paymentService.prisma.wallet.create({
          data: {
            userId: req.user.userId,
            balance: 0,
            pendingBalance: 0,
            withdrawableBalance: 0,
            totalEarned: 0,
            totalWithdrawn: 0,
          },
        });

        return res.json({
          success: true,
          message: '지갑 정보를 성공적으로 조회했습니다',
          data: newWallet
        });
      }

      res.json({
        success: true,
        message: '지갑 정보를 성공적으로 조회했습니다',
        data: wallet
      });
    } catch (error) {
      logger.error('Wallet info error:', error);
      res.status(500).json({
        success: false,
        message: '지갑 정보 조회에 실패했습니다'
      });
    }
  }
);

module.exports = router;