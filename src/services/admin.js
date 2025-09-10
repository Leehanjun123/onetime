const { prisma } = require('../config/database');
const { logger } = require('../utils/logger');
const redis = require('../config/redis');

class AdminService {
  // 대시보드 통계
  async getDashboardStats(period = 'week') {
    try {
      // Redis 캐시 확인
      const cacheKey = `admin:dashboard:${period}`;
      const cached = await redis.get(cacheKey);
      if (cached) return cached;

      const now = new Date();
      const startDate = this.getStartDate(period);

      // 병렬로 모든 통계 조회
      const [
        userStats,
        jobStats,
        paymentStats,
        applicationStats,
        activeUsers,
        topEmployers,
        categoryDistribution
      ] = await Promise.all([
        this.getUserStats(startDate),
        this.getJobStats(startDate),
        this.getPaymentStats(startDate),
        this.getApplicationStats(startDate),
        this.getActiveUsers(startDate),
        this.getTopEmployers(startDate),
        this.getCategoryDistribution()
      ]);

      const stats = {
        overview: {
          totalUsers: userStats.total,
          newUsers: userStats.new,
          totalJobs: jobStats.total,
          activeJobs: jobStats.active,
          totalRevenue: paymentStats.total,
          pendingSettlements: paymentStats.pending,
          applicationRate: applicationStats.rate
        },
        userGrowth: await this.getUserGrowthChart(period),
        jobTrends: await this.getJobTrendsChart(period),
        revenueChart: await this.getRevenueChart(period),
        activeUsers,
        topEmployers,
        categoryDistribution,
        lastUpdated: now
      };

      // 캐시에 저장 (5분)
      await redis.set(cacheKey, stats, 300);

      return stats;
    } catch (error) {
      logger.error('Dashboard stats failed:', error);
      throw error;
    }
  }

  // 기간별 시작일 계산
  getStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setDate(now.getDate() - 7));
    }
  }

  // 사용자 통계
  async getUserStats(startDate) {
    const [total, newUsers, workers, employers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.user.count({
        where: { userType: 'WORKER' }
      }),
      prisma.user.count({
        where: { userType: 'EMPLOYER' }
      })
    ]);

    return {
      total,
      new: newUsers,
      workers,
      employers,
      workerRatio: ((workers / total) * 100).toFixed(1)
    };
  }

  // 일자리 통계
  async getJobStats(startDate) {
    const [total, active, completed, cancelled, urgent] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({
        where: { status: 'OPEN' }
      }),
      prisma.job.count({
        where: { 
          status: 'COMPLETED',
          updatedAt: { gte: startDate }
        }
      }),
      prisma.job.count({
        where: { 
          status: 'CANCELLED',
          updatedAt: { gte: startDate }
        }
      }),
      prisma.job.count({
        where: { 
          urgent: true,
          status: 'OPEN'
        }
      })
    ]);

    return {
      total,
      active,
      completed,
      cancelled,
      urgent,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
    };
  }

  // 결제 통계
  async getPaymentStats(startDate) {
    const payments = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      _sum: {
        amount: true
      },
      _count: true
    });

    const pendingSettlements = await prisma.settlement.aggregate({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] }
      },
      _sum: {
        amount: true
      },
      _count: true
    });

    return {
      total: payments._sum.amount || 0,
      count: payments._count,
      average: payments._count > 0 ? Math.floor(payments._sum.amount / payments._count) : 0,
      pending: pendingSettlements._sum.amount || 0,
      pendingCount: pendingSettlements._count
    };
  }

  // 지원 통계
  async getApplicationStats(startDate) {
    const [total, accepted, rejected, pending] = await Promise.all([
      prisma.jobApplication.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.jobApplication.count({
        where: { 
          status: 'ACCEPTED',
          updatedAt: { gte: startDate }
        }
      }),
      prisma.jobApplication.count({
        where: { 
          status: 'REJECTED',
          updatedAt: { gte: startDate }
        }
      }),
      prisma.jobApplication.count({
        where: { status: 'PENDING' }
      })
    ]);

    return {
      total,
      accepted,
      rejected,
      pending,
      rate: total > 0 ? ((accepted / total) * 100).toFixed(1) : 0
    };
  }

  // 활성 사용자
  async getActiveUsers(startDate) {
    const activeUsers = await prisma.user.findMany({
      where: {
        lastLoginAt: { gte: startDate }
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        lastLoginAt: true,
        totalEarned: true
      },
      orderBy: {
        lastLoginAt: 'desc'
      },
      take: 10
    });

    return activeUsers;
  }

  // 상위 고용주
  async getTopEmployers(startDate) {
    const employers = await prisma.user.findMany({
      where: {
        userType: 'EMPLOYER',
        jobs: {
          some: {
            createdAt: { gte: startDate }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            jobs: true
          }
        }
      },
      orderBy: {
        jobs: {
          _count: 'desc'
        }
      },
      take: 5
    });

    return employers.map(e => ({
      ...e,
      jobCount: e._count.jobs
    }));
  }

  // 카테고리별 분포
  async getCategoryDistribution() {
    const categories = await prisma.job.groupBy({
      by: ['category'],
      where: {
        status: 'OPEN'
      },
      _count: true
    });

    const total = categories.reduce((sum, cat) => sum + cat._count, 0);

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count,
      percentage: total > 0 ? ((cat._count / total) * 100).toFixed(1) : 0
    }));
  }

  // 사용자 증가 차트
  async getUserGrowthChart(period) {
    const days = period === 'day' ? 24 : period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const interval = period === 'day' ? 'hour' : 'day';
    
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const startTime = new Date(now);
      const endTime = new Date(now);

      if (interval === 'hour') {
        startTime.setHours(now.getHours() - i - 1);
        endTime.setHours(now.getHours() - i);
      } else {
        startTime.setDate(now.getDate() - i - 1);
        endTime.setDate(now.getDate() - i);
      }

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: startTime,
            lt: endTime
          }
        }
      });

      data.push({
        label: interval === 'hour' ? `${endTime.getHours()}시` : `${endTime.getMonth() + 1}/${endTime.getDate()}`,
        value: count
      });
    }

    return data;
  }

  // 일자리 트렌드 차트
  async getJobTrendsChart(period) {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 7;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const [created, completed] = await Promise.all([
        prisma.job.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        }),
        prisma.job.count({
          where: {
            status: 'COMPLETED',
            updatedAt: {
              gte: date,
              lt: nextDate
            }
          }
        })
      ]);

      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        created,
        completed
      });
    }

    return data;
  }

  // 매출 차트
  async getRevenueChart(period) {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 7;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const revenue = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: date,
            lt: nextDate
          }
        },
        _sum: {
          amount: true
        }
      });

      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        revenue: revenue._sum.amount || 0
      });
    }

    return data;
  }

  // 사용자 관리
  async getUsers(options = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      userType,
      verified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (userType) where.userType = userType;
    if (verified !== undefined) where.verified = verified;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          userType: true,
          verified: true,
          rating: true,
          totalEarned: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              jobs: true,
              applications: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 사용자 상세 정보
  async getUserDetail(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobs: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        applications: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            job: true
          }
        },
        payments: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            jobs: true,
            applications: true,
            payments: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // 사용자 상태 변경
  async updateUserStatus(userId, status) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: status
    });

    // 캐시 무효화
    await redis.invalidateUserCache(userId);

    logger.info('User status updated', { userId, status });
    return user;
  }

  // 일자리 관리
  async getJobs(options = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      category,
      urgent,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;
    if (category) where.category = category;
    if (urgent !== undefined) where.urgent = urgent;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          employer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        }
      }),
      prisma.job.count({ where })
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 결제 관리
  async getPayments(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [payments, total, summary] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
              title: true
            }
          }
        }
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where,
        _sum: {
          amount: true
        }
      })
    ]);

    return {
      payments,
      summary: {
        totalAmount: summary._sum.amount || 0
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 정산 관리
  async getSettlements(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'scheduledDate',
      sortOrder = 'asc'
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          worker: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          job: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }),
      prisma.settlement.count({ where })
    ]);

    return {
      settlements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 정산 처리
  async processSettlement(settlementId) {
    const settlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    logger.info('Settlement processed', { settlementId });
    return settlement;
  }

  // 시스템 로그
  async getSystemLogs(options = {}) {
    const {
      page = 1,
      limit = 50,
      level,
      startDate,
      endDate
    } = options;

    // 실제 로그 시스템과 연동 필요
    // 여기서는 예시 데이터 반환
    return {
      logs: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0
      }
    };
  }

  // 신고 관리
  async getReports(options = {}) {
    const {
      page = 1,
      limit = 20,
      status = 'PENDING',
      type
    } = options;

    // 신고 시스템 구현 필요
    return {
      reports: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0
      }
    };
  }
}

module.exports = new AdminService();