const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logger } = require('../utils/logger');

class ChatService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socketId mapping
  }

  // Socket.IO 서버 초기화
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('Chat service initialized');
  }

  // 인증 미들웨어
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { 
            id: true, 
            name: true, 
            userType: true,
            avatar: true
          }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        
        next();
      } catch (error) {
        logger.error('Socket authentication failed', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  // 이벤트 핸들러 설정
  setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      logger.info('User connected', { userId: socket.userId });
      
      // 사용자 소켓 매핑 저장
      this.userSockets.set(socket.userId, socket.id);
      
      // 사용자를 채팅방에 참여시키기
      await this.joinUserRooms(socket);
      
      // 온라인 상태 업데이트
      await this.updateOnlineStatus(socket.userId, true);
      
      // 이벤트 리스너 등록
      socket.on('join-room', (roomId) => this.handleJoinRoom(socket, roomId));
      socket.on('leave-room', (roomId) => this.handleLeaveRoom(socket, roomId));
      socket.on('send-message', (data) => this.handleSendMessage(socket, data));
      socket.on('typing', (data) => this.handleTyping(socket, data));
      socket.on('stop-typing', (data) => this.handleStopTyping(socket, data));
      socket.on('mark-read', (data) => this.handleMarkRead(socket, data));
      socket.on('get-messages', (data) => this.handleGetMessages(socket, data));
      socket.on('get-rooms', () => this.handleGetRooms(socket));
      
      // 연결 해제 처리
      socket.on('disconnect', async () => {
        logger.info('User disconnected', { userId: socket.userId });
        this.userSockets.delete(socket.userId);
        await this.updateOnlineStatus(socket.userId, false);
      });
    });
  }

  // 사용자를 관련 채팅방에 참여시키기
  async joinUserRooms(socket) {
    try {
      const rooms = await prisma.chatRoom.findMany({
        where: {
          participants: {
            some: { userId: socket.userId }
          }
        },
        select: { id: true }
      });

      for (const room of rooms) {
        socket.join(`room-${room.id}`);
      }
    } catch (error) {
      logger.error('Failed to join user rooms', error);
    }
  }

  // 채팅방 참여
  async handleJoinRoom(socket, roomId) {
    try {
      // 권한 확인
      const participant = await prisma.chatParticipant.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId: socket.userId
          }
        }
      });

      if (!participant) {
        socket.emit('error', { message: '채팅방 접근 권한이 없습니다' });
        return;
      }

      socket.join(`room-${roomId}`);
      
      // 다른 참여자들에게 알림
      socket.to(`room-${roomId}`).emit('user-joined', {
        userId: socket.userId,
        userName: socket.user.name
      });

      socket.emit('joined-room', { roomId });
    } catch (error) {
      logger.error('Failed to join room', error);
      socket.emit('error', { message: '채팅방 참여 실패' });
    }
  }

  // 채팅방 나가기
  handleLeaveRoom(socket, roomId) {
    socket.leave(`room-${roomId}`);
    
    socket.to(`room-${roomId}`).emit('user-left', {
      userId: socket.userId,
      userName: socket.user.name
    });
  }

  // 메시지 전송
  async handleSendMessage(socket, data) {
    try {
      const { roomId, content, type = 'TEXT', attachments = [] } = data;

      // 권한 확인
      const participant = await prisma.chatParticipant.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId: socket.userId
          }
        }
      });

      if (!participant) {
        socket.emit('error', { message: '메시지 전송 권한이 없습니다' });
        return;
      }

      // 메시지 저장
      const message = await prisma.chatMessage.create({
        data: {
          roomId,
          senderId: socket.userId,
          content,
          type,
          attachments,
          metadata: data.metadata || {}
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // 채팅방 최근 메시지 업데이트
      await prisma.chatRoom.update({
        where: { id: roomId },
        data: {
          lastMessage: content,
          lastMessageAt: new Date()
        }
      });

      // 읽지 않은 메시지 카운트 증가
      await prisma.chatParticipant.updateMany({
        where: {
          roomId,
          userId: { not: socket.userId }
        },
        data: {
          unreadCount: { increment: 1 }
        }
      });

      // 모든 참여자에게 메시지 전송
      this.io.to(`room-${roomId}`).emit('new-message', message);

      // 오프라인 사용자에게 푸시 알림
      await this.sendPushNotifications(roomId, socket.userId, content);

    } catch (error) {
      logger.error('Failed to send message', error);
      socket.emit('error', { message: '메시지 전송 실패' });
    }
  }

  // 타이핑 상태 알림
  handleTyping(socket, data) {
    const { roomId } = data;
    
    socket.to(`room-${roomId}`).emit('user-typing', {
      userId: socket.userId,
      userName: socket.user.name
    });
  }

  // 타이핑 중지 알림
  handleStopTyping(socket, data) {
    const { roomId } = data;
    
    socket.to(`room-${roomId}`).emit('user-stop-typing', {
      userId: socket.userId
    });
  }

  // 메시지 읽음 처리
  async handleMarkRead(socket, data) {
    try {
      const { roomId, messageId } = data;

      // 읽음 처리
      await prisma.chatMessage.updateMany({
        where: {
          roomId,
          id: { lte: messageId },
          senderId: { not: socket.userId }
        },
        data: {
          readBy: {
            push: socket.userId
          }
        }
      });

      // 읽지 않은 메시지 카운트 초기화
      await prisma.chatParticipant.update({
        where: {
          roomId_userId: {
            roomId,
            userId: socket.userId
          }
        },
        data: {
          unreadCount: 0,
          lastReadAt: new Date()
        }
      });

      // 다른 사용자에게 읽음 상태 알림
      socket.to(`room-${roomId}`).emit('message-read', {
        userId: socket.userId,
        messageId
      });

    } catch (error) {
      logger.error('Failed to mark message as read', error);
    }
  }

  // 메시지 목록 조회
  async handleGetMessages(socket, data) {
    try {
      const { roomId, limit = 50, before } = data;

      // 권한 확인
      const participant = await prisma.chatParticipant.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId: socket.userId
          }
        }
      });

      if (!participant) {
        socket.emit('error', { message: '메시지 조회 권한이 없습니다' });
        return;
      }

      const where = { roomId };
      if (before) {
        where.createdAt = { lt: new Date(before) };
      }

      const messages = await prisma.chatMessage.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      socket.emit('messages', {
        roomId,
        messages: messages.reverse()
      });

    } catch (error) {
      logger.error('Failed to get messages', error);
      socket.emit('error', { message: '메시지 조회 실패' });
    }
  }

  // 채팅방 목록 조회
  async handleGetRooms(socket) {
    try {
      const rooms = await prisma.chatRoom.findMany({
        where: {
          participants: {
            some: { userId: socket.userId }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  userType: true
                }
              }
            }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      // 읽지 않은 메시지 수 포함
      const roomsWithUnread = rooms.map(room => {
        const participant = room.participants.find(p => p.userId === socket.userId);
        return {
          ...room,
          unreadCount: participant?.unreadCount || 0
        };
      });

      socket.emit('rooms', roomsWithUnread);

    } catch (error) {
      logger.error('Failed to get rooms', error);
      socket.emit('error', { message: '채팅방 목록 조회 실패' });
    }
  }

  // 채팅방 생성 (외부에서 호출)
  async createChatRoom(participants, type = 'DIRECT', metadata = {}) {
    try {
      const room = await prisma.chatRoom.create({
        data: {
          type,
          metadata,
          participants: {
            create: participants.map(userId => ({
              userId
            }))
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      // 참여자들을 채팅방에 참여시키기
      for (const userId of participants) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.join(`room-${room.id}`);
            socket.emit('new-room', room);
          }
        }
      }

      return room;
    } catch (error) {
      logger.error('Failed to create chat room', error);
      throw error;
    }
  }

  // 온라인 상태 업데이트
  async updateOnlineStatus(userId, isOnline) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isOnline,
          lastSeenAt: new Date()
        }
      });

      // 관련 채팅방의 사용자들에게 알림
      const rooms = await prisma.chatRoom.findMany({
        where: {
          participants: {
            some: { userId }
          }
        },
        select: { id: true }
      });

      for (const room of rooms) {
        this.io.to(`room-${room.id}`).emit('user-status-changed', {
          userId,
          isOnline
        });
      }
    } catch (error) {
      logger.error('Failed to update online status', error);
    }
  }

  // 푸시 알림 전송
  async sendPushNotifications(roomId, senderId, content) {
    try {
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: {
          participants: {
            where: {
              userId: { not: senderId }
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  pushToken: true,
                  isOnline: true
                }
              }
            }
          }
        }
      });

      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { name: true }
      });

      for (const participant of room.participants) {
        if (!participant.user.isOnline && participant.user.pushToken) {
          // 푸시 알림 전송 (실제 구현은 FCM 등 사용)
          logger.info('Sending push notification', {
            userId: participant.userId,
            message: `${sender.name}: ${content}`
          });
        }
      }
    } catch (error) {
      logger.error('Failed to send push notifications', error);
    }
  }

  // 시스템 메시지 전송
  async sendSystemMessage(roomId, content) {
    try {
      const message = await prisma.chatMessage.create({
        data: {
          roomId,
          content,
          type: 'SYSTEM',
          isSystem: true
        }
      });

      this.io.to(`room-${roomId}`).emit('new-message', message);
    } catch (error) {
      logger.error('Failed to send system message', error);
    }
  }
}

module.exports = new ChatService();