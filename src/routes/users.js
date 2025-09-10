const express = require('express');
const { prisma } = require('../config/database');
const router = express.Router();

// 모든 사용자 조회 (관리자용)
router.get('/', async (req, res) => {
  try {
    const { userType, limit = 10, offset = 0 } = req.query;
    
    const where = {};
    if (userType) where.userType = userType.toUpperCase();
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        verified: true,
        rating: true,
        totalEarned: true,
        createdAt: true,
        _count: {
          select: {
            jobs: true,
            applications: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({ 
      message: '사용자 정보를 불러오는데 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 특정 사용자 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        userType: true,
        verified: true,
        rating: true,
        totalEarned: true,
        createdAt: true,
        jobs: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        applications: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            job: {
              select: {
                id: true,
                title: true,
                category: true,
                wage: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: {
              select: {
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    res.json({ user });
  } catch (error) {
    console.error('사용자 상세 조회 오류:', error);
    res.status(500).json({ 
      message: '사용자 정보를 불러오는데 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 새 사용자 생성
router.post('/', async (req, res) => {
  try {
    const {
      email,
      phone,
      name,
      userType = 'WORKER',
      avatar
    } = req.body;

    // 필수 필드 검증
    if (!email || !name) {
      return res.status(400).json({ 
        message: '필수 정보가 누락되었습니다',
        required: ['email', 'name']
      });
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다' });
    }

    // 전화번호 중복 확인 (제공된 경우)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone }
      });

      if (existingPhone) {
        return res.status(400).json({ message: '이미 존재하는 전화번호입니다' });
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name,
        userType: userType.toUpperCase(),
        avatar
      },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        verified: true,
        rating: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: '사용자가 성공적으로 생성되었습니다',
      user
    });
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    res.status(500).json({ 
      message: '사용자 생성에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 사용자 정보 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, avatar } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        userType: true,
        verified: true,
        rating: true,
        updatedAt: true
      }
    });

    res.json({
      message: '사용자 정보가 성공적으로 수정되었습니다',
      user
    });
  } catch (error) {
    console.error('사용자 수정 오류:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    res.status(500).json({ 
      message: '사용자 정보 수정에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 사용자 통계 조회
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { userType: true }
    });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    let stats = {};

    if (user.userType === 'WORKER') {
      // 근로자 통계
      const applications = await prisma.jobApplication.findMany({
        where: { workerId: id },
        include: { job: true }
      });

      const workSessions = await prisma.workSession.findMany({
        where: { workerId: id }
      });

      stats = {
        totalApplications: applications.length,
        acceptedApplications: applications.filter(app => app.status === 'ACCEPTED').length,
        completedJobs: workSessions.filter(session => session.status === 'COMPLETED').length,
        totalEarned: workSessions
          .filter(session => session.totalPay)
          .reduce((sum, session) => sum + session.totalPay, 0),
        averageRating: user.rating
      };
    } else {
      // 고용주 통계
      const jobs = await prisma.job.findMany({
        where: { employerId: id },
        include: { applications: true }
      });

      stats = {
        totalJobsPosted: jobs.length,
        activeJobs: jobs.filter(job => job.status === 'OPEN').length,
        completedJobs: jobs.filter(job => job.status === 'COMPLETED').length,
        totalApplications: jobs.reduce((sum, job) => sum + job.applications.length, 0)
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('사용자 통계 조회 오류:', error);
    res.status(500).json({ 
      message: '사용자 통계를 불러오는데 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;