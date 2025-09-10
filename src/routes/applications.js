const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// 지원하기 (근로자만 가능)
router.post('/apply/:jobId', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'WORKER') {
      return res.status(403).json({ error: '근로자만 지원할 수 있습니다' });
    }

    const { jobId } = req.params;
    const { message, portfolio } = req.body;

    // 일자리 확인
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { 
        status: true, 
        workDate: true,
        employerId: true 
      }
    });

    if (!job) {
      return res.status(404).json({ error: '일자리를 찾을 수 없습니다' });
    }

    if (job.status !== 'OPEN') {
      return res.status(400).json({ error: '마감된 공고입니다' });
    }

    if (new Date(job.workDate) < new Date()) {
      return res.status(400).json({ error: '이미 지난 일자리입니다' });
    }

    // 중복 지원 확인
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobId,
        workerId: req.user.id
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: '이미 지원한 일자리입니다' });
    }

    // 지원 생성
    const application = await prisma.application.create({
      data: {
        jobId,
        workerId: req.user.id,
        message,
        portfolio,
        status: 'PENDING'
      },
      include: {
        job: {
          select: {
            title: true,
            employer: {
              select: { name: true }
            }
          }
        }
      }
    });

    // 고용주에게 알림 전송
    await prisma.notification.create({
      data: {
        userId: job.employerId,
        type: 'NEW_APPLICATION',
        title: '새로운 지원자가 있습니다',
        message: `${req.user.name}님이 구인 공고에 지원했습니다`,
        relatedId: application.id
      }
    });

    logger.info('Application created', { 
      applicationId: application.id, 
      workerId: req.user.id,
      jobId 
    });

    res.status(201).json({
      message: '지원이 완료되었습니다',
      data: application
    });
  } catch (error) {
    logger.error('Application failed', error);
    res.status(500).json({ error: '지원에 실패했습니다' });
  }
});

// 내 지원 목록 조회 (근로자)
router.get('/my-applications', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'WORKER') {
      return res.status(403).json({ error: '근로자만 조회할 수 있습니다' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { workerId: req.user.id };
    if (status) where.status = status;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          job: {
            include: {
              employer: {
                select: {
                  id: true,
                  name: true,
                  rating: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.application.count({ where })
    ]);

    res.json({
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('My applications fetch failed', error);
    res.status(500).json({ error: '지원 내역 조회에 실패했습니다' });
  }
});

// 받은 지원 목록 조회 (고용주)
router.get('/received/:jobId', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'EMPLOYER') {
      return res.status(403).json({ error: '고용주만 조회할 수 있습니다' });
    }

    const { jobId } = req.params;
    const { status } = req.query;

    // 권한 확인
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { employerId: true }
    });

    if (!job || job.employerId !== req.user.id) {
      return res.status(403).json({ error: '조회 권한이 없습니다' });
    }

    const where = { jobId };
    if (status) where.status = status;

    const applications = await prisma.application.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            rating: true,
            totalEarned: true,
            verified: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({ data: applications });
  } catch (error) {
    logger.error('Received applications fetch failed', error);
    res.status(500).json({ error: '지원자 목록 조회에 실패했습니다' });
  }
});

// 지원 상태 변경 (고용주)
router.patch('/:applicationId/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'EMPLOYER') {
      return res.status(403).json({ error: '고용주만 변경할 수 있습니다' });
    }

    const { applicationId } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['ACCEPTED', 'REJECTED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '유효하지 않은 상태입니다' });
    }

    // 지원 정보 조회
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            employerId: true,
            title: true,
            requiredWorkers: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: '지원 내역을 찾을 수 없습니다' });
    }

    if (application.job.employerId !== req.user.id) {
      return res.status(403).json({ error: '변경 권한이 없습니다' });
    }

    // 이미 승인된 인원 확인
    if (status === 'ACCEPTED') {
      const acceptedCount = await prisma.application.count({
        where: {
          jobId: application.jobId,
          status: 'ACCEPTED'
        }
      });

      if (acceptedCount >= application.job.requiredWorkers) {
        return res.status(400).json({ error: '모집 인원이 마감되었습니다' });
      }
    }

    // 상태 업데이트
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        statusReason: reason,
        statusChangedAt: new Date()
      },
      include: {
        worker: {
          select: { id: true, name: true }
        }
      }
    });

    // 근로자에게 알림 전송
    const notificationMessages = {
      ACCEPTED: '축하합니다! 지원이 승인되었습니다',
      REJECTED: '아쉽게도 지원이 거절되었습니다',
      CANCELLED: '지원이 취소되었습니다'
    };

    await prisma.notification.create({
      data: {
        userId: updatedApplication.workerId,
        type: 'APPLICATION_STATUS',
        title: `${application.job.title} 지원 결과`,
        message: notificationMessages[status],
        relatedId: applicationId
      }
    });

    logger.info('Application status changed', {
      applicationId,
      status,
      employerId: req.user.id
    });

    res.json({
      message: '지원 상태가 변경되었습니다',
      data: updatedApplication
    });
  } catch (error) {
    logger.error('Application status change failed', error);
    res.status(500).json({ error: '상태 변경에 실패했습니다' });
  }
});

// 지원 취소 (근로자)
router.delete('/:applicationId', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'WORKER') {
      return res.status(403).json({ error: '근로자만 취소할 수 있습니다' });
    }

    const { applicationId } = req.params;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            workDate: true,
            employerId: true,
            title: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: '지원 내역을 찾을 수 없습니다' });
    }

    if (application.workerId !== req.user.id) {
      return res.status(403).json({ error: '취소 권한이 없습니다' });
    }

    if (application.status === 'ACCEPTED') {
      // 승인된 지원은 근무일 24시간 전까지만 취소 가능
      const hoursBefore = (new Date(application.job.workDate) - new Date()) / (1000 * 60 * 60);
      if (hoursBefore < 24) {
        return res.status(400).json({ error: '근무일 24시간 이내에는 취소할 수 없습니다' });
      }
    }

    // 지원 취소
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'CANCELLED',
        statusReason: '근로자가 지원을 취소했습니다',
        statusChangedAt: new Date()
      }
    });

    // 고용주에게 알림
    if (application.status === 'ACCEPTED') {
      await prisma.notification.create({
        data: {
          userId: application.job.employerId,
          type: 'APPLICATION_CANCELLED',
          title: '지원 취소 알림',
          message: `${req.user.name}님이 ${application.job.title} 지원을 취소했습니다`,
          relatedId: applicationId
        }
      });
    }

    logger.info('Application cancelled', {
      applicationId,
      workerId: req.user.id
    });

    res.json({ message: '지원이 취소되었습니다' });
  } catch (error) {
    logger.error('Application cancellation failed', error);
    res.status(500).json({ error: '지원 취소에 실패했습니다' });
  }
});

// 지원자 평가 (고용주)
router.post('/:applicationId/review', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'EMPLOYER') {
      return res.status(403).json({ error: '고용주만 평가할 수 있습니다' });
    }

    const { applicationId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: '평점은 1-5 사이여야 합니다' });
    }

    // 지원 정보 확인
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            employerId: true,
            workDate: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: '지원 내역을 찾을 수 없습니다' });
    }

    if (application.job.employerId !== req.user.id) {
      return res.status(403).json({ error: '평가 권한이 없습니다' });
    }

    if (application.status !== 'ACCEPTED') {
      return res.status(400).json({ error: '승인된 지원자만 평가할 수 있습니다' });
    }

    if (new Date(application.job.workDate) > new Date()) {
      return res.status(400).json({ error: '근무 완료 후 평가할 수 있습니다' });
    }

    // 이미 평가했는지 확인
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: req.user.id,
        revieweeId: application.workerId,
        applicationId
      }
    });

    if (existingReview) {
      return res.status(400).json({ error: '이미 평가를 완료했습니다' });
    }

    // 평가 생성
    const review = await prisma.review.create({
      data: {
        reviewerId: req.user.id,
        revieweeId: application.workerId,
        applicationId,
        rating,
        comment,
        type: 'WORKER_REVIEW'
      }
    });

    // 근로자 평점 업데이트
    const reviews = await prisma.review.findMany({
      where: { revieweeId: application.workerId },
      select: { rating: true }
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.user.update({
      where: { id: application.workerId },
      data: { rating: avgRating }
    });

    logger.info('Worker reviewed', {
      reviewId: review.id,
      applicationId,
      rating
    });

    res.status(201).json({
      message: '평가가 완료되었습니다',
      data: review
    });
  } catch (error) {
    logger.error('Review failed', error);
    res.status(500).json({ error: '평가에 실패했습니다' });
  }
});

module.exports = router;