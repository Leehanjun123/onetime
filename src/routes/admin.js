const express = require('express');
const router = express.Router();
const adminService = require('../services/admin');
const { authenticateToken } = require('../middlewares/auth');
const { adminValidations } = require('../middlewares/validation');
const { logger } = require('../utils/logger');

// 관리자 권한 체크 미들웨어
const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'ADMIN' && req.user.userType !== 'EMPLOYER') {
    return res.status(403).json({
      message: '관리자 권한이 필요합니다'
    });
  }
  next();
};

// 대시보드 통계
router.get('/dashboard', authenticateToken, requireAdmin, adminValidations.dashboard, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    const stats = await adminService.getDashboardStats(period);
    
    res.json({
      data: stats
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({
      message: '대시보드 통계 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 사용자 목록 조회
router.get('/users', authenticateToken, requireAdmin, adminValidations.users, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      userType,
      verified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const result = await adminService.getUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      userType,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      sortBy,
      sortOrder
    });

    res.json({
      data: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Users list error:', error);
    res.status(500).json({
      message: '사용자 목록 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 사용자 상세 조회
router.get('/users/:userId', authenticateToken, requireAdmin, adminValidations.userDetail, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await adminService.getUserDetail(userId);
    
    res.json({
      data: user
    });
  } catch (error) {
    logger.error('User detail error:', error);
    res.status(500).json({
      message: '사용자 정보 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 사용자 상태 변경
router.patch('/users/:userId/status', authenticateToken, requireAdmin, adminValidations.userStatusUpdate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { verified, isActive } = req.body;

    const status = {};
    if (verified !== undefined) status.verified = verified;
    if (isActive !== undefined) status.isActive = isActive;

    const user = await adminService.updateUserStatus(userId, status);

    res.json({
      message: '사용자 상태가 변경되었습니다',
      data: user
    });
  } catch (error) {
    logger.error('User status update error:', error);
    res.status(500).json({
      message: '사용자 상태 변경에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 일자리 목록 조회
router.get('/jobs', authenticateToken, requireAdmin, adminValidations.jobs, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      category,
      urgent,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const result = await adminService.getJobs({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      category,
      urgent: urgent === 'true' ? true : urgent === 'false' ? false : undefined,
      sortBy,
      sortOrder
    });

    res.json({
      data: result.jobs,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Jobs list error:', error);
    res.status(500).json({
      message: '일자리 목록 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 일자리 상태 변경
router.patch('/jobs/:jobId/status', authenticateToken, requireAdmin, adminValidations.jobStatusUpdate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    const { prisma } = require('../config/database');
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status }
    });

    res.json({
      message: '일자리 상태가 변경되었습니다',
      data: job
    });
  } catch (error) {
    logger.error('Job status update error:', error);
    res.status(500).json({
      message: '일자리 상태 변경에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 결제 목록 조회
router.get('/payments', authenticateToken, requireAdmin, adminValidations.payments, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const result = await adminService.getPayments({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder
    });

    res.json({
      data: result.payments,
      summary: result.summary,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Payments list error:', error);
    res.status(500).json({
      message: '결제 목록 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 정산 목록 조회
router.get('/settlements', authenticateToken, requireAdmin, adminValidations.settlements, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'scheduledDate',
      sortOrder = 'asc'
    } = req.query;

    const result = await adminService.getSettlements({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sortBy,
      sortOrder
    });

    res.json({
      data: result.settlements,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Settlements list error:', error);
    res.status(500).json({
      message: '정산 목록 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 정산 처리
router.post('/settlements/:settlementId/process', authenticateToken, requireAdmin, adminValidations.settlementProcess, async (req, res) => {
  try {
    const { settlementId } = req.params;

    const settlement = await adminService.processSettlement(settlementId);

    res.json({
      message: '정산이 처리되었습니다',
      data: settlement
    });
  } catch (error) {
    logger.error('Settlement process error:', error);
    res.status(500).json({
      message: '정산 처리에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 시스템 공지 발송
router.post('/notifications/broadcast', authenticateToken, requireAdmin, adminValidations.broadcastNotification, async (req, res) => {
  try {
    const { title, message, userFilter = {} } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: '제목과 메시지를 입력해주세요'
      });
    }

    const notificationService = require('../services/notification');
    const result = await notificationService.sendSystemNotification(title, message, userFilter);

    res.json({
      message: '시스템 공지가 발송되었습니다',
      data: result
    });
  } catch (error) {
    logger.error('Broadcast notification error:', error);
    res.status(500).json({
      message: '시스템 공지 발송에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 통계 내보내기 (CSV)
router.get('/export/:type', authenticateToken, requireAdmin, adminValidations.export, async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;

    let data = [];
    let filename = '';

    switch (type) {
      case 'users':
        const users = await adminService.getUsers({ limit: 10000 });
        data = users.users;
        filename = 'users.csv';
        break;
      case 'jobs':
        const jobs = await adminService.getJobs({ limit: 10000 });
        data = jobs.jobs;
        filename = 'jobs.csv';
        break;
      case 'payments':
        const payments = await adminService.getPayments({ 
          limit: 10000,
          startDate,
          endDate
        });
        data = payments.payments;
        filename = 'payments.csv';
        break;
      default:
        return res.status(400).json({
          message: '지원하지 않는 내보내기 타입입니다'
        });
    }

    // CSV 변환 (간단한 구현)
    const csv = convertToCSV(data);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM 추가 (한글 깨짐 방지)
  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({
      message: '데이터 내보내기에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// CSV 변환 헬퍼
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

// 시스템 설정 조회
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 시스템 설정을 환경 변수나 DB에서 조회
    const settings = {
      maxFileSize: process.env.MAX_FILE_SIZE || 10485760,
      maxUserStorage: process.env.MAX_USER_STORAGE || 104857600,
      apiRateLimit: process.env.API_RATE_LIMIT || 100,
      sessionTimeout: process.env.SESSION_TIMEOUT || 86400,
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
    };

    res.json({
      data: settings
    });
  } catch (error) {
    logger.error('Settings error:', error);
    res.status(500).json({
      message: '시스템 설정 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 캐시 초기화
router.post('/cache/clear', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const redis = require('../config/redis');
    await redis.flush();

    res.json({
      message: '캐시가 초기화되었습니다'
    });
  } catch (error) {
    logger.error('Cache clear error:', error);
    res.status(500).json({
      message: '캐시 초기화에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;