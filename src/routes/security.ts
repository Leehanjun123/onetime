import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { recordSecurityEvent } from '../middleware/security';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * 사용자의 보안 이벤트 조회
 */
router.get('/events',
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('제한 개수는 1-100 사이여야 합니다'),
    query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('올바른 심각도를 선택하세요')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: '유효하지 않은 요청입니다', 
          details: errors.array() 
        });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const severity = req.query.severity as string;

      const whereClause: any = {
        userId: req.user!.id
      };

      if (severity) {
        whereClause.severity = severity;
      }

      const events = await prisma.securityEvent.findMany({
        where: whereClause,
        orderBy: {
          timestamp: 'desc'
        },
        take: limit,
        select: {
          id: true,
          eventType: true,
          severity: true,
          timestamp: true,
          ipAddress: true,
          resolved: true,
          details: true
        }
      });

      res.json({ events });

    } catch (error) {
      logger.error('Error fetching security events:', error);
      res.status(500).json({ error: '보안 이벤트 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 활성 세션 조회
 */
router.get('/sessions',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sessions = await prisma.sessionToken.findMany({
        where: {
          userId: req.user!.id,
          expiresAt: {
            gt: new Date()
          },
          revokedAt: null
        },
        orderBy: {
          lastUsedAt: 'desc'
        },
        select: {
          id: true,
          tokenId: true,
          deviceId: true,
          ipAddress: true,
          location: true,
          trustScore: true,
          lastUsedAt: true,
          createdAt: true,
          multiFactorAuth: true
        }
      });

      res.json({ sessions });

    } catch (error) {
      logger.error('Error fetching user sessions:', error);
      res.status(500).json({ error: '세션 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 특정 세션 해제
 */
router.delete('/sessions/:sessionId',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;

      const session = await prisma.sessionToken.findFirst({
        where: {
          tokenId: sessionId,
          userId: req.user!.id
        }
      });

      if (!session) {
        return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
      }

      await prisma.sessionToken.update({
        where: {
          id: session.id
        },
        data: {
          revokedAt: new Date()
        }
      });

      await recordSecurityEvent(
        'SESSION_REVOKED',
        'LOW',
        { sessionId, reason: 'User requested' },
        req.user!.id,
        req.ip,
        req.headers['user-agent']
      );

      logger.info(`Session revoked by user: ${sessionId}`);
      res.json({ message: '세션이 해제되었습니다' });

    } catch (error) {
      logger.error('Error revoking session:', error);
      res.status(500).json({ error: '세션 해제 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 모든 다른 세션 해제 (현재 세션 제외)
 */
router.delete('/sessions',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const currentTokenId = req.headers['authorization']?.split(' ')[1];
      
      const revokedSessions = await prisma.sessionToken.updateMany({
        where: {
          userId: req.user!.id,
          tokenId: {
            not: currentTokenId
          },
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });

      await recordSecurityEvent(
        'ALL_SESSIONS_REVOKED',
        'MEDIUM',
        { 
          reason: 'User requested',
          revokedCount: revokedSessions.count
        },
        req.user!.id,
        req.ip,
        req.headers['user-agent']
      );

      logger.info(`All sessions revoked by user: ${req.user!.id}, count: ${revokedSessions.count}`);
      res.json({ 
        message: '모든 다른 세션이 해제되었습니다',
        revokedCount: revokedSessions.count
      });

    } catch (error) {
      logger.error('Error revoking all sessions:', error);
      res.status(500).json({ error: '세션 해제 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 의심스러운 활동 신고
 */
router.post('/report-suspicious',
  authenticateToken,
  [
    body('type').isString().withMessage('신고 유형이 필요합니다'),
    body('description').isString().withMessage('신고 내용이 필요합니다'),
    body('evidence').optional().isObject().withMessage('증거는 객체 형태여야 합니다')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: '유효하지 않은 요청입니다', 
          details: errors.array() 
        });
      }

      const { type, description, evidence } = req.body;

      await prisma.suspiciousActivity.create({
        data: {
          userId: req.user!.id,
          type: `USER_REPORTED_${type}`,
          details: {
            description,
            evidence,
            reportedAt: new Date().toISOString(),
            reporterIP: req.ip,
            reporterAgent: req.headers['user-agent']
          }
        }
      });

      await recordSecurityEvent(
        'SUSPICIOUS_ACTIVITY_REPORTED',
        'MEDIUM',
        {
          type,
          description: description.substring(0, 100) // 처음 100자만 로그
        },
        req.user!.id,
        req.ip,
        req.headers['user-agent']
      );

      logger.info(`Suspicious activity reported by user: ${req.user!.id}, type: ${type}`);
      res.json({ message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.' });

    } catch (error) {
      logger.error('Error reporting suspicious activity:', error);
      res.status(500).json({ error: '신고 처리 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 계정 보안 점수 조회
 */
router.get('/trust-score',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const trustScore = await prisma.trustScore.findUnique({
        where: {
          userId: req.user!.id
        }
      });

      if (!trustScore) {
        // 기본 점수로 생성
        const newTrustScore = await prisma.trustScore.create({
          data: {
            userId: req.user!.id,
            score: 50,
            deviceTrust: 50,
            behaviorTrust: 50,
            locationTrust: 50,
            networkTrust: 50
          }
        });
        
        return res.json({ trustScore: newTrustScore });
      }

      res.json({ trustScore });

    } catch (error) {
      logger.error('Error fetching trust score:', error);
      res.status(500).json({ error: '신뢰 점수 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 디바이스 등록
 */
router.post('/devices',
  authenticateToken,
  [
    body('fingerprint').isString().withMessage('디바이스 지문이 필요합니다'),
    body('deviceInfo').isObject().withMessage('디바이스 정보가 필요합니다')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: '유효하지 않은 요청입니다', 
          details: errors.array() 
        });
      }

      const { fingerprint, deviceInfo } = req.body;

      // 기존 디바이스 확인
      const existingDevice = await prisma.deviceFingerprint.findUnique({
        where: {
          userId_fingerprint: {
            userId: req.user!.id,
            fingerprint
          }
        }
      });

      if (existingDevice) {
        // 기존 디바이스 업데이트
        const updatedDevice = await prisma.deviceFingerprint.update({
          where: {
            id: existingDevice.id
          },
          data: {
            deviceInfo,
            lastSeen: new Date()
          }
        });

        return res.json({ 
          message: '디바이스 정보가 업데이트되었습니다',
          device: updatedDevice
        });
      }

      // 새 디바이스 등록
      const newDevice = await prisma.deviceFingerprint.create({
        data: {
          userId: req.user!.id,
          fingerprint,
          deviceInfo,
          trusted: false // 처음에는 신뢰하지 않음
        }
      });

      await recordSecurityEvent(
        'NEW_DEVICE_REGISTERED',
        'MEDIUM',
        {
          fingerprint: fingerprint.substring(0, 10) + '...', // 부분만 로그
          deviceInfo
        },
        req.user!.id,
        req.ip,
        req.headers['user-agent']
      );

      logger.info(`New device registered for user: ${req.user!.id}`);
      res.json({ 
        message: '새 디바이스가 등록되었습니다',
        device: newDevice
      });

    } catch (error) {
      logger.error('Error registering device:', error);
      res.status(500).json({ error: '디바이스 등록 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 등록된 디바이스 목록 조회
 */
router.get('/devices',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const devices = await prisma.deviceFingerprint.findMany({
        where: {
          userId: req.user!.id
        },
        orderBy: {
          lastSeen: 'desc'
        },
        select: {
          id: true,
          fingerprint: true,
          deviceInfo: true,
          trusted: true,
          firstSeen: true,
          lastSeen: true
        }
      });

      res.json({ devices });

    } catch (error) {
      logger.error('Error fetching devices:', error);
      res.status(500).json({ error: '디바이스 목록 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 디바이스 신뢰 설정
 */
router.patch('/devices/:deviceId/trust',
  authenticateToken,
  [
    body('trusted').isBoolean().withMessage('신뢰 설정은 boolean 값이어야 합니다')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: '유효하지 않은 요청입니다', 
          details: errors.array() 
        });
      }

      const { deviceId } = req.params;
      const { trusted } = req.body;

      const device = await prisma.deviceFingerprint.findFirst({
        where: {
          id: deviceId,
          userId: req.user!.id
        }
      });

      if (!device) {
        return res.status(404).json({ error: '디바이스를 찾을 수 없습니다' });
      }

      const updatedDevice = await prisma.deviceFingerprint.update({
        where: {
          id: deviceId
        },
        data: {
          trusted
        }
      });

      await recordSecurityEvent(
        'DEVICE_TRUST_CHANGED',
        'LOW',
        {
          deviceId,
          trusted,
          previousTrusted: device.trusted
        },
        req.user!.id,
        req.ip,
        req.headers['user-agent']
      );

      logger.info(`Device trust changed: ${deviceId}, trusted: ${trusted}`);
      res.json({ 
        message: '디바이스 신뢰 설정이 변경되었습니다',
        device: updatedDevice
      });

    } catch (error) {
      logger.error('Error updating device trust:', error);
      res.status(500).json({ error: '디바이스 신뢰 설정 변경 중 오류가 발생했습니다' });
    }
  }
);

export default router;