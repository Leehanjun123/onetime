const axios = require('axios');
const { prisma } = require('../config/database');
const { logger } = require('../utils/logger');

class PaymentService {
  constructor() {
    this.tossSecretKey = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
    this.apiUrl = 'https://api.tosspayments.com/v1/payments';
    
    // Base64 인코딩된 시크릿 키
    this.authHeader = `Basic ${Buffer.from(this.tossSecretKey + ':').toString('base64')}`;
  }

  // 결제 요청 생성
  async createPaymentRequest(data) {
    try {
      const {
        userId,
        jobId,
        amount,
        orderId,
        orderName,
        customerName,
        customerEmail,
        customerMobilePhone,
        successUrl,
        failUrl
      } = data;

      // 결제 정보 DB 저장
      const payment = await prisma.payment.create({
        data: {
          orderId,
          userId,
          jobId,
          amount,
          status: 'PENDING',
          method: 'CARD',
          orderName,
          customerName,
          customerEmail,
          customerMobilePhone
        }
      });

      logger.info('Payment request created', { 
        paymentId: payment.id, 
        orderId,
        amount 
      });

      return {
        success: true,
        payment,
        paymentData: {
          amount,
          orderId,
          orderName,
          customerName,
          customerEmail,
          customerMobilePhone,
          successUrl: successUrl || `${process.env.FRONTEND_URL}/payment/success`,
          failUrl: failUrl || `${process.env.FRONTEND_URL}/payment/fail`
        }
      };
    } catch (error) {
      logger.error('Payment request creation failed', error);
      throw error;
    }
  }

  // 결제 승인
  async confirmPayment(paymentKey, orderId, amount) {
    try {
      // 토스페이먼츠 API 호출
      const response = await axios.post(
        `${this.apiUrl}/${paymentKey}`,
        {
          orderId,
          amount
        },
        {
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/json'
          }
        }
      );

      const tossPayment = response.data;

      // DB 업데이트
      const payment = await prisma.payment.update({
        where: { orderId },
        data: {
          status: 'COMPLETED',
          paymentKey,
          approvedAt: new Date(tossPayment.approvedAt),
          receipt: tossPayment.receipt,
          transactionKey: tossPayment.transactionKey,
          metadata: tossPayment
        }
      });

      // 근로자 수입 업데이트
      if (payment.userId) {
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            totalEarned: { increment: amount }
          }
        });
      }

      logger.info('Payment confirmed', {
        paymentKey,
        orderId,
        amount
      });

      return {
        success: true,
        payment,
        tossPayment
      };
    } catch (error) {
      logger.error('Payment confirmation failed', error);
      
      // 실패 시 DB 업데이트
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: 'FAILED',
          failReason: error.response?.data?.message || error.message
        }
      });

      throw error;
    }
  }

  // 결제 취소
  async cancelPayment(paymentKey, cancelReason, cancelAmount) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${paymentKey}/cancel`,
        {
          cancelReason,
          cancelAmount
        },
        {
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/json'
          }
        }
      );

      const cancelData = response.data;

      // DB 업데이트
      const payment = await prisma.payment.update({
        where: { paymentKey },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason,
          cancelAmount: cancelAmount || payment.amount
        }
      });

      logger.info('Payment cancelled', {
        paymentKey,
        cancelReason,
        cancelAmount
      });

      return {
        success: true,
        payment,
        cancelData
      };
    } catch (error) {
      logger.error('Payment cancellation failed', error);
      throw error;
    }
  }

  // 결제 상태 조회
  async getPaymentStatus(paymentKeyOrOrderId) {
    try {
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { paymentKey: paymentKeyOrOrderId },
            { orderId: paymentKeyOrOrderId }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          job: {
            select: {
              id: true,
              title: true,
              wage: true
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // 토스페이먼츠에서 최신 상태 조회
      if (payment.paymentKey) {
        try {
          const response = await axios.get(
            `${this.apiUrl}/${payment.paymentKey}`,
            {
              headers: {
                Authorization: this.authHeader
              }
            }
          );

          return {
            success: true,
            payment,
            tossPayment: response.data
          };
        } catch (error) {
          // 토스페이먼츠 조회 실패 시 DB 정보만 반환
          return {
            success: true,
            payment,
            tossPayment: null
          };
        }
      }

      return {
        success: true,
        payment
      };
    } catch (error) {
      logger.error('Payment status check failed', error);
      throw error;
    }
  }

  // 정산 처리
  async processSettlement(jobId) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          workSession: true,
          applications: {
            where: { status: 'ACCEPTED' },
            include: {
              worker: true
            }
          }
        }
      });

      if (!job || !job.workSession || job.workSession.status !== 'COMPLETED') {
        throw new Error('Job not ready for settlement');
      }

      const settlements = [];

      // 각 근로자별 정산 생성
      for (const application of job.applications) {
        const workerWage = job.workSession.totalPay / job.applications.length;
        
        const settlement = await prisma.settlement.create({
          data: {
            workerId: application.workerId,
            jobId,
            amount: Math.floor(workerWage),
            status: 'PENDING',
            scheduledDate: new Date()
          }
        });

        settlements.push(settlement);

        // 정산 알림
        await prisma.notification.create({
          data: {
            userId: application.workerId,
            type: 'SETTLEMENT',
            title: '정산 예정 알림',
            message: `${job.title} 근무에 대한 정산이 처리될 예정입니다.`,
            relatedId: settlement.id
          }
        });
      }

      logger.info('Settlement processed', {
        jobId,
        settlementCount: settlements.length
      });

      return {
        success: true,
        settlements
      };
    } catch (error) {
      logger.error('Settlement processing failed', error);
      throw error;
    }
  }

  // 일일 정산 배치
  async processDailySettlements() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 어제 완료된 작업 세션 조회
      const completedSessions = await prisma.workSession.findMany({
        where: {
          status: 'COMPLETED',
          endTime: {
            gte: yesterday,
            lt: today
          }
        },
        include: {
          job: true
        }
      });

      const results = [];
      
      for (const session of completedSessions) {
        try {
          const result = await this.processSettlement(session.jobId);
          results.push(result);
        } catch (error) {
          logger.error(`Settlement failed for job ${session.jobId}`, error);
        }
      }

      logger.info('Daily settlements completed', {
        processedCount: results.length,
        date: yesterday
      });

      return {
        success: true,
        processedCount: results.length,
        results
      };
    } catch (error) {
      logger.error('Daily settlement batch failed', error);
      throw error;
    }
  }

  // 수수료 계산
  calculateFee(amount, userType) {
    const feeRates = {
      WORKER: 0.033, // 3.3% 근로자 수수료
      EMPLOYER: 0.055 // 5.5% 고용주 수수료
    };

    const feeRate = feeRates[userType] || 0.033;
    const fee = Math.floor(amount * feeRate);
    const netAmount = amount - fee;

    return {
      originalAmount: amount,
      fee,
      feeRate,
      netAmount
    };
  }

  // 환불 처리
  async processRefund(paymentKey, refundReason, refundAmount) {
    try {
      // 결제 정보 조회
      const payment = await prisma.payment.findUnique({
        where: { paymentKey }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Only completed payments can be refunded');
      }

      const refundAmountFinal = refundAmount || payment.amount;

      // 토스페이먼츠 환불 API 호출
      const response = await axios.post(
        `${this.apiUrl}/${paymentKey}/cancel`,
        {
          cancelReason: refundReason,
          cancelAmount: refundAmountFinal,
          refundReceiveAccount: payment.refundAccount // 환불 계좌 정보
        },
        {
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/json'
          }
        }
      );

      // 환불 정보 저장
      const refund = await prisma.refund.create({
        data: {
          paymentId: payment.id,
          amount: refundAmountFinal,
          reason: refundReason,
          status: 'COMPLETED',
          refundedAt: new Date()
        }
      });

      // 결제 상태 업데이트
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: refundAmountFinal === payment.amount ? 'REFUNDED' : 'PARTIAL_REFUNDED',
          refundedAmount: { increment: refundAmountFinal }
        }
      });

      logger.info('Refund processed', {
        paymentKey,
        refundAmount: refundAmountFinal,
        refundReason
      });

      return {
        success: true,
        refund,
        tossRefund: response.data
      };
    } catch (error) {
      logger.error('Refund processing failed', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();