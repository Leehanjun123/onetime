const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment');
const { authenticateToken } = require('../middlewares/auth');
const { v4: uuidv4 } = require('uuid');

// 결제 요청 생성
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const {
      jobId,
      amount,
      orderName,
      successUrl,
      failUrl
    } = req.body;

    if (!amount || !orderName) {
      return res.status(400).json({
        message: '필수 정보가 누락되었습니다'
      });
    }

    // 주문 ID 생성 (UUID)
    const orderId = `ORDER_${Date.now()}_${uuidv4().substring(0, 8)}`;

    const result = await paymentService.createPaymentRequest({
      userId: req.user.id,
      jobId,
      amount,
      orderId,
      orderName,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerMobilePhone: req.user.phone,
      successUrl,
      failUrl
    });

    res.json({
      message: '결제 요청이 생성되었습니다',
      data: result
    });
  } catch (error) {
    console.error('결제 요청 생성 오류:', error);
    res.status(500).json({
      message: '결제 요청 생성에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 결제 승인
router.post('/confirm', async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;

    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({
        message: '필수 정보가 누락되었습니다'
      });
    }

    const result = await paymentService.confirmPayment(
      paymentKey,
      orderId,
      amount
    );

    res.json({
      message: '결제가 승인되었습니다',
      data: result
    });
  } catch (error) {
    console.error('결제 승인 오류:', error);
    
    const errorMessage = error.response?.data?.message || error.message;
    const statusCode = error.response?.status || 500;
    
    res.status(statusCode).json({
      message: '결제 승인에 실패했습니다',
      error: errorMessage
    });
  }
});

// 결제 취소
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const { paymentKey, cancelReason, cancelAmount } = req.body;

    if (!paymentKey || !cancelReason) {
      return res.status(400).json({
        message: '필수 정보가 누락되었습니다'
      });
    }

    const result = await paymentService.cancelPayment(
      paymentKey,
      cancelReason,
      cancelAmount
    );

    res.json({
      message: '결제가 취소되었습니다',
      data: result
    });
  } catch (error) {
    console.error('결제 취소 오류:', error);
    res.status(500).json({
      message: '결제 취소에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 결제 상태 조회
router.get('/status/:paymentKeyOrOrderId', authenticateToken, async (req, res) => {
  try {
    const { paymentKeyOrOrderId } = req.params;

    const result = await paymentService.getPaymentStatus(paymentKeyOrOrderId);

    res.json({
      message: '결제 상태 조회 성공',
      data: result
    });
  } catch (error) {
    console.error('결제 상태 조회 오류:', error);
    res.status(500).json({
      message: '결제 상태 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 환불 요청
router.post('/refund', authenticateToken, async (req, res) => {
  try {
    const { paymentKey, refundReason, refundAmount } = req.body;

    if (!paymentKey || !refundReason) {
      return res.status(400).json({
        message: '필수 정보가 누락되었습니다'
      });
    }

    const result = await paymentService.processRefund(
      paymentKey,
      refundReason,
      refundAmount
    );

    res.json({
      message: '환불이 처리되었습니다',
      data: result
    });
  } catch (error) {
    console.error('환불 처리 오류:', error);
    res.status(500).json({
      message: '환불 처리에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 정산 처리 (관리자 전용)
router.post('/settlement/:jobId', authenticateToken, async (req, res) => {
  try {
    // 관리자 권한 체크
    if (req.user.userType !== 'ADMIN') {
      return res.status(403).json({
        message: '관리자 권한이 필요합니다'
      });
    }

    const { jobId } = req.params;

    const result = await paymentService.processSettlement(jobId);

    res.json({
      message: '정산이 처리되었습니다',
      data: result
    });
  } catch (error) {
    console.error('정산 처리 오류:', error);
    res.status(500).json({
      message: '정산 처리에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 수수료 계산
router.post('/calculate-fee', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        message: '금액을 입력해주세요'
      });
    }

    const feeInfo = paymentService.calculateFee(amount, req.user.userType);

    res.json({
      message: '수수료 계산 완료',
      data: feeInfo
    });
  } catch (error) {
    console.error('수수료 계산 오류:', error);
    res.status(500).json({
      message: '수수료 계산에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 결제 내역 조회
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id };
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              wage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('결제 내역 조회 오류:', error);
    res.status(500).json({
      message: '결제 내역 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 정산 내역 조회
router.get('/settlements', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { workerId: req.user.id };
    if (status) where.status = status;

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              workDate: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.settlement.count({ where })
    ]);

    res.json({
      data: settlements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('정산 내역 조회 오류:', error);
    res.status(500).json({
      message: '정산 내역 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;