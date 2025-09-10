const { prisma } = require('../config/database');
const { logger } = require('../utils/logger');
const chatService = require('./chat');

class NotificationService {
  constructor() {
    this.io = null;
  }

  // Socket.IO 서버 설정
  setSocketServer(io) {
    this.io = io;
  }

  // 알림 생성 및 전송
  async create(data) {
    try {
      const {
        userId,
        type,
        title,
        message,
        relatedId,
        metadata = {}
      } = data;

      // 알림 저장
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          relatedId,
          metadata
        }
      });

      // 실시간 전송
      this.sendRealtime(userId, notification);

      // 푸시 알림 전송 (사용자가 오프라인인 경우)
      await this.sendPushNotification(userId, notification);

      logger.info('Notification created', {
        notificationId: notification.id,
        userId,
        type
      });

      return notification;
    } catch (error) {
      logger.error('Notification creation failed', error);
      throw error;
    }
  }

  // 실시간 알림 전송
  sendRealtime(userId, notification) {
    if (!this.io) return;

    // 특정 사용자에게 알림 전송
    this.io.to(`user-${userId}`).emit('notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.relatedId,
      createdAt: notification.createdAt,
      read: notification.read
    });
  }

  // 푸시 알림 전송
  async sendPushNotification(userId, notification) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          pushToken: true,
          isOnline: true,
          notificationSettings: true
        }
      });

      // 온라인 사용자는 실시간 알림으로 충분
      if (user.isOnline) return;

      // 푸시 토큰이 없으면 전송 불가
      if (!user.pushToken) return;

      // 사용자 알림 설정 확인
      const settings = user.notificationSettings || {};
      if (!this.shouldSendNotification(notification.type, settings)) {
        return;
      }

      // FCM 푸시 알림 전송 (Firebase Admin SDK 필요)
      // 실제 구현 시 Firebase Admin SDK 사용
      logger.info('Push notification would be sent', {
        userId,
        notificationType: notification.type,
        pushToken: user.pushToken.substring(0, 10) + '...'
      });

    } catch (error) {
      logger.error('Push notification failed', error);
    }
  }

  // 알림 설정에 따른 전송 여부 확인
  shouldSendNotification(type, settings) {
    const defaultSettings = {
      JOB_APPLICATION: true,
      APPLICATION_STATUS: true,
      PAYMENT: true,
      SETTLEMENT: true,
      CHAT: true,
      REVIEW: true,
      JOB_SUGGESTION: true,
      SYSTEM: true
    };

    const userSettings = { ...defaultSettings, ...settings };
    return userSettings[type] !== false;
  }

  // 알림 읽음 처리
  async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId // 본인 알림만 읽음 처리 가능
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      // 실시간 읽음 상태 업데이트
      if (this.io) {
        this.io.to(`user-${userId}`).emit('notification-read', {
          notificationId
        });
      }

      return notification;
    } catch (error) {
      logger.error('Mark as read failed', error);
      throw error;
    }
  }

  // 여러 알림 읽음 처리
  async markMultipleAsRead(notificationIds, userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      // 실시간 읽음 상태 업데이트
      if (this.io) {
        this.io.to(`user-${userId}`).emit('notifications-read', {
          notificationIds
        });
      }

      return result;
    } catch (error) {
      logger.error('Mark multiple as read failed', error);
      throw error;
    }
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      // 실시간 읽음 상태 업데이트
      if (this.io) {
        this.io.to(`user-${userId}`).emit('all-notifications-read');
      }

      return result;
    } catch (error) {
      logger.error('Mark all as read failed', error);
      throw error;
    }
  }

  // 알림 목록 조회
  async getNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        unreadOnly = false
      } = options;

      const skip = (page - 1) * limit;
      
      const where = { userId };
      if (type) where.type = type;
      if (unreadOnly) where.read = false;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: {
            userId,
            read: false
          }
        })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      };
    } catch (error) {
      logger.error('Get notifications failed', error);
      throw error;
    }
  }

  // 알림 삭제
  async deleteNotification(notificationId, userId) {
    try {
      const result = await prisma.notification.delete({
        where: {
          id: notificationId,
          userId
        }
      });

      // 실시간 삭제 알림
      if (this.io) {
        this.io.to(`user-${userId}`).emit('notification-deleted', {
          notificationId
        });
      }

      return result;
    } catch (error) {
      logger.error('Delete notification failed', error);
      throw error;
    }
  }

  // 오래된 알림 정리 (30일 이상)
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          read: true
        }
      });

      logger.info('Old notifications cleaned up', {
        deletedCount: result.count
      });

      return result;
    } catch (error) {
      logger.error('Cleanup old notifications failed', error);
      throw error;
    }
  }

  // 시스템 알림 전체 전송
  async sendSystemNotification(title, message, userFilter = {}) {
    try {
      const users = await prisma.user.findMany({
        where: userFilter,
        select: { id: true }
      });

      const notifications = [];

      for (const user of users) {
        const notification = await this.create({
          userId: user.id,
          type: 'SYSTEM',
          title,
          message
        });
        notifications.push(notification);
      }

      logger.info('System notification sent', {
        userCount: users.length,
        title
      });

      return {
        success: true,
        sentCount: notifications.length
      };
    } catch (error) {
      logger.error('System notification failed', error);
      throw error;
    }
  }

  // 특정 이벤트에 대한 알림 템플릿
  async sendEventNotification(event, data) {
    const templates = {
      JOB_APPLIED: {
        type: 'JOB_APPLICATION',
        title: '새로운 지원자가 있습니다',
        message: `${data.workerName}님이 "${data.jobTitle}" 공고에 지원했습니다.`
      },
      APPLICATION_ACCEPTED: {
        type: 'APPLICATION_STATUS',
        title: '지원이 승인되었습니다',
        message: `축하합니다! "${data.jobTitle}" 지원이 승인되었습니다.`
      },
      APPLICATION_REJECTED: {
        type: 'APPLICATION_STATUS',
        title: '지원 결과 안내',
        message: `아쉽게도 "${data.jobTitle}" 지원이 승인되지 않았습니다.`
      },
      PAYMENT_COMPLETED: {
        type: 'PAYMENT',
        title: '결제 완료',
        message: `${data.amount.toLocaleString()}원 결제가 완료되었습니다.`
      },
      SETTLEMENT_SCHEDULED: {
        type: 'SETTLEMENT',
        title: '정산 예정',
        message: `${data.amount.toLocaleString()}원이 곧 정산될 예정입니다.`
      },
      NEW_MESSAGE: {
        type: 'CHAT',
        title: '새 메시지',
        message: `${data.senderName}: ${data.messagePreview}`
      },
      NEW_REVIEW: {
        type: 'REVIEW',
        title: '새로운 평가',
        message: `${data.reviewerName}님이 ${data.rating}점 평가를 남겼습니다.`
      },
      JOB_RECOMMENDATION: {
        type: 'JOB_SUGGESTION',
        title: '추천 일자리',
        message: `"${data.jobTitle}" 일자리가 회원님께 적합합니다. (매칭률 ${data.matchScore}%)`
      }
    };

    const template = templates[event];
    if (!template) {
      logger.warn('Unknown notification event', { event });
      return;
    }

    return await this.create({
      userId: data.userId,
      type: template.type,
      title: template.title,
      message: template.message,
      relatedId: data.relatedId
    });
  }
}

module.exports = new NotificationService();