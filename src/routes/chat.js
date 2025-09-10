const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middlewares/auth');
const chatService = require('../services/chat');
const { logger } = require('../utils/logger');

// 대화 목록 조회
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await chatService.getConversations(userId);
    
    res.json({
      data: conversations
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({
      message: '대화 목록 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 특정 대화의 메시지 조회
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    const messages = await chatService.getMessages(
      conversationId, 
      userId, 
      parseInt(page), 
      parseInt(limit)
    );

    res.json({
      data: messages
    });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({
      message: '메시지 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 메시지 전송 (REST API 버전)
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { receiverId, content, type = 'TEXT' } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content) {
      return res.status(400).json({
        message: '수신자와 메시지 내용을 입력해주세요'
      });
    }

    const message = await chatService.createMessage({
      senderId,
      receiverId,
      content,
      type
    });

    // Socket.IO로 실시간 전송
    if (chatService.io) {
      chatService.io.to(`user-${receiverId}`).emit('new_message', message);
    }

    res.json({
      message: '메시지가 전송되었습니다',
      data: message
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      message: '메시지 전송에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 메시지 읽음 처리
router.patch('/messages/read', authenticateToken, async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.id;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        message: '메시지 ID 목록을 제공해주세요'
      });
    }

    await chatService.markMessagesAsRead(messageIds, userId);

    res.json({
      message: '메시지를 읽음 처리했습니다'
    });
  } catch (error) {
    logger.error('Mark messages as read error:', error);
    res.status(500).json({
      message: '읽음 처리에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 읽지 않은 메시지 수 조회
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await chatService.getUnreadCount(userId);

    res.json({
      data: { count }
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({
      message: '읽지 않은 메시지 수 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 대화방 생성 또는 조회
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.user.id;

    if (!otherUserId) {
      return res.status(400).json({
        message: '상대방 ID를 제공해주세요'
      });
    }

    // 기존 대화방 찾기
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: userId }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // 없으면 생성
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: userId,
          user2Id: otherUserId
        },
        include: {
          user1: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          user2: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });
    }

    res.json({
      data: conversation
    });
  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(500).json({
      message: '대화방 생성에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 대화방 삭제
router.delete('/conversations/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await chatService.deleteConversation(conversationId, userId);

    res.json({
      message: '대화방이 삭제되었습니다'
    });
  } catch (error) {
    logger.error('Delete conversation error:', error);
    res.status(500).json({
      message: '대화방 삭제에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 특정 사용자와의 대화 조회
router.get('/conversations/user/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: userId }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isOnline: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isOnline: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({
        message: '대화방을 찾을 수 없습니다'
      });
    }

    res.json({
      data: conversation
    });
  } catch (error) {
    logger.error('Get conversation with user error:', error);
    res.status(500).json({
      message: '대화방 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;