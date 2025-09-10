const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');
const { prisma } = require('./database');

let io;

// 연결된 사용자들을 관리하는 Map
const connectedUsers = new Map();

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // 인증 미들웨어
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          verified: true
        }
      });

      if (!user) {
        return next(new Error('Invalid user'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // 소켓 연결 처리
  io.on('connection', (socket) => {
    console.log(`사용자 연결됨: ${socket.user.name} (${socket.userId})`);
    
    // 사용자 연결 정보 저장
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // 사용자 방에 참여 (개인 알림용)
    socket.join(`user-${socket.userId}`);

    // 사용자 타입별 방에 참여
    socket.join(`${socket.user.userType.toLowerCase()}s`);

    // 연결 확인 응답
    socket.emit('connected', {
      message: '실시간 알림 연결 완료',
      userId: socket.userId,
      user: socket.user
    });

    // 새로운 일자리 알림 구독 (WORKER만)
    socket.on('subscribe-job-notifications', async (data) => {
      if (socket.user.userType === 'WORKER') {
        const { categories, locations } = data;
        
        // 필터 기반으로 룸 생성
        if (categories && categories.length > 0) {
          categories.forEach(category => {
            socket.join(`jobs-category-${category}`);
          });
        }
        
        if (locations && locations.length > 0) {
          locations.forEach(location => {
            socket.join(`jobs-location-${location}`);
          });
        }

        socket.emit('subscription-confirmed', {
          message: '일자리 알림 구독이 완료되었습니다',
          categories,
          locations
        });
      }
    });

    // 지원 상태 업데이트 알림
    socket.on('subscribe-application-updates', (data) => {
      const { jobId } = data;
      if (jobId) {
        socket.join(`job-${jobId}-applications`);
      }
    });

    // 작업 세션 상태 알림
    socket.on('subscribe-work-session', (data) => {
      const { sessionId } = data;
      if (sessionId) {
        socket.join(`work-session-${sessionId}`);
      }
    });

    // 채팅 메시지 (향후 구현)
    socket.on('join-chat', (data) => {
      const { jobId } = data;
      socket.join(`chat-${jobId}`);
      socket.emit('joined-chat', { jobId });
    });

    socket.on('send-message', (data) => {
      const { jobId, message } = data;
      // 해당 채팅방의 모든 사용자에게 메시지 전송
      socket.to(`chat-${jobId}`).emit('new-message', {
        jobId,
        message,
        sender: socket.user,
        timestamp: new Date()
      });
    });

    // 연결 해제 처리
    socket.on('disconnect', (reason) => {
      console.log(`사용자 연결 해제됨: ${socket.user.name} (${socket.userId}) - ${reason}`);
      connectedUsers.delete(socket.userId);
    });

    // 에러 처리
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

// 알림 전송 헬퍼 함수들
const sendNotification = {
  // 특정 사용자에게 알림
  toUser: (userId, type, data) => {
    if (io) {
      io.to(`user-${userId}`).emit('notification', {
        type,
        data,
        timestamp: new Date()
      });
    }
  },

  // 새로운 일자리 알림 (WORKER들에게)
  newJob: (job) => {
    if (io) {
      // 모든 WORKER에게
      io.to('workers').emit('new-job', {
        type: 'NEW_JOB',
        job,
        message: `새로운 ${job.category} 일자리가 등록되었습니다`,
        timestamp: new Date()
      });

      // 카테고리별 구독자에게
      io.to(`jobs-category-${job.category}`).emit('new-job-filtered', {
        type: 'NEW_JOB_FILTERED',
        job,
        message: `관심 분야의 새로운 일자리가 등록되었습니다`,
        timestamp: new Date()
      });

      // 지역별 구독자에게
      io.to(`jobs-location-${job.location}`).emit('new-job-filtered', {
        type: 'NEW_JOB_FILTERED',
        job,
        message: `관심 지역의 새로운 일자리가 등록되었습니다`,
        timestamp: new Date()
      });
    }
  },

  // 지원 상태 업데이트
  applicationUpdate: (application) => {
    if (io) {
      // 지원자에게 알림
      sendNotification.toUser(application.workerId, 'APPLICATION_UPDATE', {
        application,
        message: `지원하신 일자리의 상태가 ${application.status}로 변경되었습니다`
      });

      // 고용주에게 알림 (새로운 지원인 경우)
      if (application.status === 'PENDING') {
        sendNotification.toUser(application.job.employerId, 'NEW_APPLICATION', {
          application,
          message: `새로운 지원자가 있습니다`
        });
      }
    }
  },

  // 작업 세션 업데이트
  workSessionUpdate: (session, message) => {
    if (io) {
      io.to(`work-session-${session.id}`).emit('work-session-update', {
        type: 'WORK_SESSION_UPDATE',
        session,
        message,
        timestamp: new Date()
      });
    }
  },

  // 리뷰 알림
  newReview: (review) => {
    if (io) {
      sendNotification.toUser(review.revieweeId, 'NEW_REVIEW', {
        review,
        message: `새로운 리뷰가 작성되었습니다`
      });
    }
  }
};

// 연결된 사용자 정보 조회
const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

const getConnectedUserCount = () => {
  return connectedUsers.size;
};

const isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};

module.exports = {
  initializeSocket,
  sendNotification,
  getConnectedUsers,
  getConnectedUserCount,
  isUserConnected
};