const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middlewares/auth');
const { logger } = require('../utils/logger');
const router = express.Router();

// 일자리 저장하기
router.post('/jobs/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // 이미 저장했는지 확인
    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ 
        message: '이미 저장한 일자리입니다' 
      });
    }

    // 일자리 존재 확인
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ 
        message: '일자리를 찾을 수 없습니다' 
      });
    }

    // 저장
    const saved = await prisma.savedJob.create({
      data: {
        userId,
        jobId
      },
      include: {
        job: {
          include: {
            employer: {
              select: {
                id: true,
                name: true,
                rating: true,
                verified: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: '일자리가 저장되었습니다',
      data: saved
    });
  } catch (error) {
    logger.error('일자리 저장 오류:', error);
    res.status(500).json({ 
      message: '일자리 저장에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 저장 취소
router.delete('/jobs/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const deleted = await prisma.savedJob.deleteMany({
      where: {
        userId,
        jobId
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ 
        message: '저장된 일자리를 찾을 수 없습니다' 
      });
    }

    res.json({
      message: '저장이 취소되었습니다'
    });
  } catch (error) {
    logger.error('저장 취소 오류:', error);
    res.status(500).json({ 
      message: '저장 취소에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 저장된 일자리 목록
router.get('/jobs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [saved, total] = await Promise.all([
      prisma.savedJob.findMany({
        where: { userId },
        include: {
          job: {
            include: {
              employer: {
                select: {
                  id: true,
                  name: true,
                  rating: true,
                  verified: true,
                  avatar: true
                }
              },
              _count: {
                select: {
                  applications: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.savedJob.count({ where: { userId } })
    ]);

    // employer를 company로 매핑
    const mappedSaved = saved.map(item => ({
      ...item,
      job: {
        ...item.job,
        company: item.job.employer,
        employer: undefined,
        applicationCount: item.job._count.applications
      }
    }));

    res.json({
      data: mappedSaved,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('저장 목록 조회 오류:', error);
    res.status(500).json({ 
      message: '저장 목록 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 저장 여부 확인
router.get('/jobs/:jobId/check', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const saved = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      }
    });

    res.json({
      saved: !!saved
    });
  } catch (error) {
    logger.error('저장 확인 오류:', error);
    res.status(500).json({ 
      message: '저장 확인에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 회사 저장하기
router.post('/companies/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;

    // 이미 저장했는지 확인
    const existing = await prisma.savedCompany.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ 
        message: '이미 저장한 회사입니다' 
      });
    }

    // 회사(사용자) 존재 확인
    const company = await prisma.user.findUnique({
      where: { 
        id: companyId,
        userType: 'EMPLOYER'
      }
    });

    if (!company) {
      return res.status(404).json({ 
        message: '회사를 찾을 수 없습니다' 
      });
    }

    // 저장
    const saved = await prisma.savedCompany.create({
      data: {
        userId,
        companyId
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            rating: true,
            verified: true,
            avatar: true,
            _count: {
              select: {
                jobs: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: '회사가 저장되었습니다',
      data: saved
    });
  } catch (error) {
    logger.error('회사 저장 오류:', error);
    res.status(500).json({ 
      message: '회사 저장에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 저장된 회사 목록
router.get('/companies', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [saved, total] = await Promise.all([
      prisma.savedCompany.findMany({
        where: { userId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              rating: true,
              verified: true,
              avatar: true,
              _count: {
                select: {
                  jobs: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.savedCompany.count({ where: { userId } })
    ]);

    res.json({
      data: saved,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('저장된 회사 조회 오류:', error);
    res.status(500).json({ 
      message: '저장된 회사 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;