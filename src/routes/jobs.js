const express = require('express');
const { prisma } = require('../config/database');
const cache = require('../services/cache');
const router = express.Router();

// 모든 일자리 조회
router.get('/', async (req, res) => {
  try {
    const { category, location, urgent, limit = 10, offset = 0 } = req.query;
    
    // 캐시 임시 비활성화 - 디버깅용
    // const cacheKey = cache.getJobsKey({ category, location, urgent, limit, offset });
    
    console.log('일자리 목록 조회 시작:', { category, location, urgent, limit, offset });
    
    const where = {};
    if (category) where.category = category.toUpperCase();
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (urgent) where.urgent = urgent === 'true';
    
    const jobs = await prisma.job.findMany({
      where,
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            rating: true,
            verified: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: [
        { urgent: 'desc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.job.count({ where });

    const responseData = {
      jobs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    };

    // 캐시 저장 임시 비활성화
    console.log('조회된 일자리 수:', jobs.length);

    res.json(responseData);
  } catch (error) {
    console.error('일자리 조회 오류:', error);
    res.status(500).json({ 
      message: '일자리를 불러오는데 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 특정 일자리 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await prisma.job.findUnique({
      where: { id },
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
        applications: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                rating: true,
                avatar: true
              }
            }
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ message: '일자리를 찾을 수 없습니다' });
    }

    res.json({ job });
  } catch (error) {
    console.error('일자리 상세 조회 오류:', error);
    res.status(500).json({ 
      message: '일자리 정보를 불러오는데 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 새 일자리 생성 (고용주)
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      wage,
      workDate,
      workHours,
      urgent = false,
      employerId
    } = req.body;

    // 필수 필드 검증
    if (!title || !description || !category || !location || !wage || !workDate || !workHours || !employerId) {
      return res.status(400).json({ 
        message: '필수 정보가 누락되었습니다',
        required: ['title', 'description', 'category', 'location', 'wage', 'workDate', 'workHours', 'employerId']
      });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        category: category.toUpperCase(),
        location,
        wage: parseInt(wage),
        workDate: new Date(workDate),
        workHours: parseInt(workHours),
        urgent,
        employerId
      },
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
    });

    // 실시간 알림 전송 (새로운 일자리)
    try {
      const { sendNotification } = require('../config/socket');
      sendNotification.newJob(job);
    } catch (socketError) {
      console.log('Socket notification failed:', socketError.message);
    }

    res.status(201).json({
      message: '일자리가 성공적으로 등록되었습니다',
      job
    });
  } catch (error) {
    console.error('일자리 생성 오류:', error);
    res.status(500).json({ 
      message: '일자리 등록에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 일자리 지원하기
router.post('/:id/apply', async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { workerId, message } = req.body;

    if (!workerId) {
      return res.status(400).json({ message: '근로자 ID가 필요합니다' });
    }

    // 이미 지원했는지 확인
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId
        }
      }
    });

    if (existingApplication) {
      return res.status(400).json({ message: '이미 지원한 일자리입니다' });
    }

    // 일자리 존재 확인
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return res.status(404).json({ message: '일자리를 찾을 수 없습니다' });
    }

    if (job.status !== 'OPEN') {
      return res.status(400).json({ message: '지원할 수 없는 일자리입니다' });
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        workerId,
        message
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            rating: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      message: '지원이 완료되었습니다',
      application
    });
  } catch (error) {
    console.error('일자리 지원 오류:', error);
    res.status(500).json({ 
      message: '지원에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;