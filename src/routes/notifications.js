const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const { sendNotification, getConnectedUsers, getConnectedUserCount, isUserConnected } = require('../config/socket');
const { logger } = require('../utils/logger');
const router = express.Router();

// 실시간 알림 상태 확인
router.get('/status', authenticateToken, (req, res) => {
  try {
    const isConnected = isUserConnected(req.user.id);
    const totalConnected = getConnectedUserCount();
    
    res.json({
      status: 'OK',
      user: {
        id: req.user.id,
        connected: isConnected
      },
      stats: {
        totalConnectedUsers: totalConnected
      }
    });
  } catch (error) {
    logger.error('알림 상태 확인 오류:', error);
    res.status(500).json({
      message: '알림 상태 확인에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 연결된 사용자 목록 (관리자용)
router.get('/connected-users', authenticateToken, (req, res) => {
  try {
    // 관리자 권한 확인 (향후 ADMIN 타입 추가 시)
    if (req.user.userType !== 'ADMIN' && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        message: '관리자 권한이 필요합니다'
      });
    }

    const connectedUsers = getConnectedUsers();
    
    res.json({
      totalCount: connectedUsers.length,
      users: connectedUsers.map(user => ({
        id: user.user.id,
        name: user.user.name,
        email: user.user.email,
        userType: user.user.userType,
        connectedAt: user.connectedAt,
        socketId: user.socketId
      }))
    });
  } catch (error) {
    logger.error('연결된 사용자 조회 오류:', error);
    res.status(500).json({
      message: '연결된 사용자 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 테스트 알림 전송
router.post('/test', authenticateToken, (req, res) => {
  try {
    const { message, type = 'TEST' } = req.body;

    if (!message) {
      return res.status(400).json({
        message: '메시지를 입력해주세요'
      });
    }

    // 자신에게 테스트 알림 전송
    sendNotification.toUser(req.user.id, type, {
      message,
      timestamp: new Date(),
      sender: 'System'
    });

    res.json({
      message: '테스트 알림이 전송되었습니다',
      data: {
        type,
        message,
        userId: req.user.id
      }
    });
  } catch (error) {
    logger.error('테스트 알림 전송 오류:', error);
    res.status(500).json({
      message: '테스트 알림 전송에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 일자리 등록 시 알림 전송 (고용주가 사용)
router.post('/job-created', authenticateToken, (req, res) => {
  try {
    const { jobData } = req.body;

    if (!jobData) {
      return res.status(400).json({
        message: '일자리 정보가 필요합니다'
      });
    }

    // 새로운 일자리 알림 전송
    sendNotification.newJob(jobData);

    res.json({
      message: '새로운 일자리 알림이 전송되었습니다',
      jobId: jobData.id
    });
  } catch (error) {
    logger.error('일자리 알림 전송 오류:', error);
    res.status(500).json({
      message: '일자리 알림 전송에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 지원 상태 변경 알림
router.post('/application-update', authenticateToken, (req, res) => {
  try {
    const { applicationData } = req.body;

    if (!applicationData) {
      return res.status(400).json({
        message: '지원 정보가 필요합니다'
      });
    }

    // 지원 상태 업데이트 알림 전송
    sendNotification.applicationUpdate(applicationData);

    res.json({
      message: '지원 상태 알림이 전송되었습니다',
      applicationId: applicationData.id
    });
  } catch (error) {
    logger.error('지원 상태 알림 전송 오류:', error);
    res.status(500).json({
      message: '지원 상태 알림 전송에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 작업 세션 업데이트 알림
router.post('/work-session-update', authenticateToken, (req, res) => {
  try {
    const { sessionData, message } = req.body;

    if (!sessionData) {
      return res.status(400).json({
        message: '작업 세션 정보가 필요합니다'
      });
    }

    // 작업 세션 업데이트 알림 전송
    sendNotification.workSessionUpdate(sessionData, message);

    res.json({
      message: '작업 세션 알림이 전송되었습니다',
      sessionId: sessionData.id
    });
  } catch (error) {
    logger.error('작업 세션 알림 전송 오류:', error);
    res.status(500).json({
      message: '작업 세션 알림 전송에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 리뷰 작성 알림
router.post('/review-created', authenticateToken, (req, res) => {
  try {
    const { reviewData } = req.body;

    if (!reviewData) {
      return res.status(400).json({
        message: '리뷰 정보가 필요합니다'
      });
    }

    // 새로운 리뷰 알림 전송
    sendNotification.newReview(reviewData);

    res.json({
      message: '리뷰 알림이 전송되었습니다',
      reviewId: reviewData.id
    });
  } catch (error) {
    logger.error('리뷰 알림 전송 오류:', error);
    res.status(500).json({
      message: '리뷰 알림 전송에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;