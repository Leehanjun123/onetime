const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.prisma = new PrismaClient();
    this.tossPaymentsApiUrl = 'https://api.tosspayments.com/v1';
    this.secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
    this.encodedKey = Buffer.from(this.secretKey + ':').toString('base64');
  }

  // 결제 생성
  async createPayment({
    jobId,
    workerId,
    businessId,
    amount,
    orderName,
    customerName,
    customerEmail,
    customerMobilePhone
  }) {
    try {
      const orderId = this.generateOrderId();
      const feeAmount = this.calculateFee(amount);
      const netAmount = amount - feeAmount;

      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          amount,
          feeAmount,
          netAmount,
          orderName,
          customerName,
          customerEmail,
          customerMobilePhone,
          status: 'PENDING',
          method: 'CARD',
          pgProvider: 'TOSS_PAYMENTS',
          jobId,
          workerId,
          businessId,
        },
        include: {
          job: true,
          worker: true,
          business: true,
        }
      });

      // 결제 트랜잭션 기록
      await this.createTransaction({
        paymentId: payment.id,
        userId: businessId,
        type: 'PAYMENT',
        amount,
        description: `일자리 결제: ${orderName}`,
        referenceId: jobId,
      });

      logger.info(`Payment created: ${payment.id}`, { paymentId: payment.id, orderId });
      return payment;
    } catch (error) {
      logger.error('Payment creation failed:', error);
      throw new Error('결제 생성에 실패했습니다.');
    }
  }

  // 토스페이먼츠로 결제 승인 요청
  async confirmPayment(paymentKey, orderId, amount) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { orderId },
        include: { job: true, worker: true, business: true }
      });

      if (!payment) {
        throw new Error('결제 정보를 찾을 수 없습니다.');
      }

      if (payment.amount !== amount) {
        throw new Error('결제 금액이 일치하지 않습니다.');
      }

      // 토스페이먼츠 API 호출
      const response = await axios.post(
        `${this.tossPaymentsApiUrl}/payments/confirm`,
        {
          paymentKey,
          orderId,
          amount,
        },
        {
          headers: {
            Authorization: `Basic ${this.encodedKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const paymentData = response.data;

      // 결제 정보 업데이트
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentKey,
          pgTransactionId: paymentData.transactionKey,
          status: 'COMPLETED',
          approvedAt: new Date(paymentData.approvedAt),
          receipt: paymentData,
        },
      });

      // 워커 지갑 업데이트 (보류 잔액으로)
      await this.updateWorkerWallet(payment.workerId, payment.netAmount, 'PENDING');

      // 결제 완료 트랜잭션 기록
      await this.createTransaction({
        paymentId: payment.id,
        userId: payment.workerId,
        type: 'PAYMENT',
        amount: payment.netAmount,
        description: `결제 완료: ${payment.orderName}`,
        referenceId: payment.jobId,
      });

      // 수수료 트랜잭션 기록
      if (payment.feeAmount > 0) {
        await this.createTransaction({
          paymentId: payment.id,
          userId: payment.businessId,
          type: 'FEE',
          amount: payment.feeAmount,
          description: `수수료: ${payment.orderName}`,
          referenceId: payment.jobId,
        });
      }

      logger.info(`Payment confirmed: ${updatedPayment.id}`, { 
        paymentId: updatedPayment.id, 
        paymentKey, 
        orderId 
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Payment confirmation failed:', error);
      
      // 결제 실패 처리
      if (orderId) {
        await this.prisma.payment.updateMany({
          where: { orderId },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failReason: error.response?.data?.message || error.message,
          },
        });
      }

      throw new Error(error.response?.data?.message || '결제 승인에 실패했습니다.');
    }
  }

  // 결제 취소
  async cancelPayment(paymentId, cancelReason, cancelAmount) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { worker: true }
      });

      if (!payment) {
        throw new Error('결제 정보를 찾을 수 없습니다.');
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('완료된 결제만 취소할 수 있습니다.');
      }

      const actualCancelAmount = cancelAmount || payment.amount;

      // 토스페이먼츠 취소 API 호출
      const response = await axios.post(
        `${this.tossPaymentsApiUrl}/payments/${payment.paymentKey}/cancel`,
        {
          cancelReason,
          cancelAmount: actualCancelAmount,
        },
        {
          headers: {
            Authorization: `Basic ${this.encodedKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const cancelData = response.data;

      // 결제 정보 업데이트
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: actualCancelAmount === payment.amount ? 'CANCELLED' : 'PARTIAL_REFUNDED',
          cancelledAt: new Date(),
          cancelReason,
          cancelAmount: actualCancelAmount,
          refundedAmount: actualCancelAmount,
        },
      });

      // 워커 지갑에서 차감 (보류 잔액에서)
      const refundNetAmount = actualCancelAmount - this.calculateFee(actualCancelAmount);
      await this.updateWorkerWallet(payment.workerId, -refundNetAmount, 'PENDING');

      // 환불 트랜잭션 기록
      await this.createTransaction({
        paymentId: paymentId,
        userId: payment.workerId,
        type: 'REFUND',
        amount: -refundNetAmount,
        description: `결제 취소: ${cancelReason}`,
        referenceId: payment.jobId,
      });

      logger.info(`Payment cancelled: ${paymentId}`, { 
        paymentId, 
        cancelReason, 
        cancelAmount: actualCancelAmount 
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Payment cancellation failed:', error);
      throw new Error(error.response?.data?.message || '결제 취소에 실패했습니다.');
    }
  }

  // 워커 지갑 업데이트
  async updateWorkerWallet(workerId, amount, type = 'AVAILABLE') {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId: workerId },
      update: {},
      create: {
        userId: workerId,
        balance: 0,
        pendingBalance: 0,
        withdrawableBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      },
    });

    const updateData = {};
    
    if (type === 'PENDING') {
      updateData.pendingBalance = wallet.pendingBalance + amount;
      if (amount > 0) {
        updateData.totalEarned = wallet.totalEarned + amount;
      }
    } else if (type === 'AVAILABLE') {
      updateData.withdrawableBalance = wallet.withdrawableBalance + amount;
      updateData.balance = wallet.balance + amount;
    }

    updateData.lastUpdatedAt = new Date();

    return await this.prisma.wallet.update({
      where: { userId: workerId },
      data: updateData,
    });
  }

  // 트랜잭션 기록 생성
  async createTransaction(transactionData) {
    return await this.prisma.transaction.create({
      data: {
        ...transactionData,
        createdAt: new Date(),
      },
    });
  }

  // 수수료 계산 (5%)
  calculateFee(amount) {
    const feeRate = parseFloat(process.env.PAYMENT_FEE_RATE) || 0.05;
    return Math.floor(amount * feeRate);
  }

  // 주문 ID 생성
  generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORDER_${timestamp}_${random}`;
  }

  // 결제 내역 조회
  async getPaymentHistory(userId, options = {}) {
    const { page = 1, limit = 20, status, method } = options;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { workerId: userId },
        { businessId: userId },
        { userId: userId },
      ],
    };

    if (status) where.status = status;
    if (method) where.method = method;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          job: true,
          worker: { select: { id: true, name: true, email: true } },
          business: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 결제 통계
  async getPaymentStats(userId, period = '30d') {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const stats = await this.prisma.payment.aggregate({
      where: {
        workerId: userId,
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
        netAmount: true,
        feeAmount: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      period,
      totalPayments: stats._count.id || 0,
      totalAmount: stats._sum.amount || 0,
      totalNetAmount: stats._sum.netAmount || 0,
      totalFees: stats._sum.feeAmount || 0,
    };
  }
}

module.exports = PaymentService;