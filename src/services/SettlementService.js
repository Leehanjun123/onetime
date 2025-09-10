const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const logger = require('../utils/logger');

class SettlementService {
  constructor() {
    this.prisma = new PrismaClient();
    this.initializeScheduler();
  }

  // 정산 스케줄러 초기화
  initializeScheduler() {
    // 매일 오전 9시에 정산 처리
    cron.schedule('0 9 * * *', async () => {
      try {
        await this.processScheduledSettlements();
        logger.info('Scheduled settlements processed successfully');
      } catch (error) {
        logger.error('Scheduled settlement processing failed:', error);
      }
    });

    // 매주 월요일 오전 10시에 주간 정산 생성
    cron.schedule('0 10 * * 1', async () => {
      try {
        await this.createWeeklySettlements();
        logger.info('Weekly settlements created successfully');
      } catch (error) {
        logger.error('Weekly settlement creation failed:', error);
      }
    });
  }

  // 정산 생성 (일자리 완료 후 자동 호출)
  async createSettlement(jobId) {
    try {
      // 완료된 일자리 정보 조회
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        include: {
          workSession: true,
          payments: {
            where: { status: 'COMPLETED' },
          },
        },
      });

      if (!job || job.status !== 'COMPLETED') {
        throw new Error('완료된 일자리가 아닙니다.');
      }

      if (!job.workSession) {
        throw new Error('작업 세션이 없습니다.');
      }

      const completedPayments = job.payments;
      if (completedPayments.length === 0) {
        throw new Error('완료된 결제가 없습니다.');
      }

      // 정산 금액 계산
      const totalAmount = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalFee = completedPayments.reduce((sum, payment) => sum + payment.feeAmount, 0);
      const netAmount = totalAmount - totalFee;

      // 정산일 계산 (일자리 완료 후 3일 후)
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 3);

      // 정산 생성
      const settlement = await this.prisma.settlement.create({
        data: {
          workerId: job.workSession.workerId,
          jobId: job.id,
          amount: totalAmount,
          feeAmount: totalFee,
          netAmount: netAmount,
          status: 'PENDING',
          scheduledAt,
        },
      });

      // 정산 항목 생성
      for (const payment of completedPayments) {
        await this.prisma.settlementItem.create({
          data: {
            settlementId: settlement.id,
            paymentId: payment.id,
            jobId: job.id,
            amount: payment.amount,
            feeAmount: payment.feeAmount,
            netAmount: payment.netAmount,
          },
        });
      }

      // 워커 지갑에서 보류 잔액을 인출 가능 잔액으로 이동
      await this.moveToWithdrawableBalance(job.workSession.workerId, netAmount);

      logger.info(`Settlement created: ${settlement.id}`, { 
        settlementId: settlement.id, 
        jobId, 
        netAmount 
      });

      return settlement;
    } catch (error) {
      logger.error('Settlement creation failed:', error);
      throw error;
    }
  }

  // 예약된 정산 처리
  async processScheduledSettlements() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const settlements = await this.prisma.settlement.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: {
          lte: today,
        },
      },
      include: {
        worker: true,
        items: {
          include: {
            payment: true,
            job: true,
          },
        },
      },
    });

    for (const settlement of settlements) {
      try {
        await this.processSettlement(settlement.id);
      } catch (error) {
        logger.error(`Settlement processing failed: ${settlement.id}`, error);
      }
    }

    return settlements.length;
  }

  // 개별 정산 처리
  async processSettlement(settlementId) {
    try {
      const settlement = await this.prisma.settlement.findUnique({
        where: { id: settlementId },
        include: {
          worker: true,
          items: true,
        },
      });

      if (!settlement) {
        throw new Error('정산 정보를 찾을 수 없습니다.');
      }

      if (settlement.status !== 'PENDING') {
        throw new Error('처리할 수 없는 정산 상태입니다.');
      }

      // 정산 상태를 처리중으로 변경
      await this.prisma.settlement.update({
        where: { id: settlementId },
        data: { status: 'PROCESSING' },
      });

      // 은행 송금 시뮬레이션 (실제로는 은행 API 연동)
      const transferResult = await this.transferToBank({
        amount: settlement.netAmount,
        bankAccount: settlement.bankAccount || '기본계좌',
        accountHolder: settlement.accountHolder || settlement.worker.name,
        memo: `원데이 정산 - ${settlement.id}`,
      });

      if (transferResult.success) {
        // 정산 완료 처리
        await this.prisma.settlement.update({
          where: { id: settlementId },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });

        // 정산 트랜잭션 기록
        await this.prisma.transaction.create({
          data: {
            userId: settlement.workerId,
            type: 'SETTLEMENT',
            amount: settlement.netAmount,
            description: `정산 완료 - ${settlement.id}`,
            referenceId: settlementId,
          },
        });

        logger.info(`Settlement completed: ${settlementId}`, { 
          settlementId, 
          amount: settlement.netAmount 
        });
      } else {
        // 정산 실패 처리
        await this.prisma.settlement.update({
          where: { id: settlementId },
          data: {
            status: 'FAILED',
            failReason: transferResult.error,
          },
        });

        logger.error(`Settlement failed: ${settlementId}`, transferResult.error);
      }

      return settlement;
    } catch (error) {
      // 정산 실패 처리
      await this.prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: 'FAILED',
          failReason: error.message,
        },
      });

      logger.error(`Settlement processing error: ${settlementId}`, error);
      throw error;
    }
  }

  // 은행 송금 (시뮬레이션)
  async transferToBank({ amount, bankAccount, accountHolder, memo }) {
    // 실제 환경에서는 은행 API 연동
    try {
      // 송금 시뮬레이션 (랜덤 성공/실패)
      const isSuccess = Math.random() > 0.1; // 90% 성공률

      if (isSuccess) {
        return {
          success: true,
          transactionId: `BANK_${Date.now()}`,
          message: '송금이 완료되었습니다.',
        };
      } else {
        return {
          success: false,
          error: '은행 시스템 오류로 송금에 실패했습니다.',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 보류 잔액을 인출 가능 잔액으로 이동
  async moveToWithdrawableBalance(workerId, amount) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: workerId },
    });

    if (!wallet) {
      throw new Error('지갑 정보를 찾을 수 없습니다.');
    }

    await this.prisma.wallet.update({
      where: { userId: workerId },
      data: {
        pendingBalance: wallet.pendingBalance - amount,
        withdrawableBalance: wallet.withdrawableBalance + amount,
        lastUpdatedAt: new Date(),
      },
    });
  }

  // 주간 정산 생성 (완료된 일자리들에 대해)
  async createWeeklySettlements() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 지난 주에 완료된 일자리들 중 정산이 아직 안 된 것들
    const completedJobs = await this.prisma.job.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: oneWeekAgo,
        },
        settlements: {
          none: {},
        },
      },
      include: {
        workSession: true,
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    let createdCount = 0;

    for (const job of completedJobs) {
      try {
        await this.createSettlement(job.id);
        createdCount++;
      } catch (error) {
        logger.error(`Failed to create settlement for job ${job.id}:`, error);
      }
    }

    logger.info(`Created ${createdCount} settlements from ${completedJobs.length} completed jobs`);
    return createdCount;
  }

  // 정산 내역 조회
  async getSettlementHistory(workerId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where = { workerId };
    if (status) where.status = status;

    const [settlements, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        include: {
          job: {
            select: { id: true, title: true, orderName: true },
          },
          items: {
            include: {
              payment: {
                select: { id: true, orderId: true, amount: true },
              },
              job: {
                select: { id: true, title: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      settlements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 정산 통계
  async getSettlementStats(workerId, period = '30d') {
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

    const stats = await this.prisma.settlement.aggregate({
      where: {
        workerId,
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
      totalSettlements: stats._count.id || 0,
      totalAmount: stats._sum.amount || 0,
      totalNetAmount: stats._sum.netAmount || 0,
      totalFees: stats._sum.feeAmount || 0,
    };
  }

  // 정산 재시도
  async retrySettlement(settlementId) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new Error('정산 정보를 찾을 수 없습니다.');
    }

    if (settlement.status !== 'FAILED') {
      throw new Error('실패한 정산만 재시도할 수 있습니다.');
    }

    // 상태를 PENDING으로 변경
    await this.prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'PENDING',
        failReason: null,
      },
    });

    // 즉시 처리 시도
    return await this.processSettlement(settlementId);
  }
}

module.exports = SettlementService;