import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from './auth';
import { AIMatchingService } from '../services/aiMatching';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const aiMatching = new AIMatchingService(prisma);

/**
 * 워커 프로필 생성/업데이트
 */
router.post('/profile',
  authenticateToken,
  [
    body('skills').isArray().withMessage('기술은 배열 형태여야 합니다'),
    body('experience').isInt({ min: 0 }).withMessage('경력은 0 이상의 숫자여야 합니다'),
    body('preferredLocations').isArray().withMessage('선호 지역은 배열 형태여야 합니다'),
    body('preferredCategories').isArray().withMessage('선호 카테고리는 배열 형태여야 합니다'),
    body('minWage').optional().isInt({ min: 0 }).withMessage('최소 시급은 0 이상이어야 합니다'),
    body('maxDistance').optional().isInt({ min: 1 }).withMessage('최대 거리는 1 이상이어야 합니다')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: '입력 데이터가 유효하지 않습니다', 
          details: errors.array() 
        });
      }

      const { 
        skills, 
        experience, 
        preferredLocations, 
        preferredCategories,
        availableHours,
        minWage,
        maxDistance,
        workStyle,
        certifications,
        bio,
        transportation
      } = req.body;

      const workerProfile = await prisma.workerProfile.upsert({
        where: { userId: req.user!.id },
        update: {
          skills,
          experience,
          preferredLocations,
          preferredCategories,
          availableHours,
          minWage,
          maxDistance,
          workStyle,
          certifications,
          bio,
          transportation,
          updatedAt: new Date()
        },
        create: {
          userId: req.user!.id,
          skills,
          experience,
          preferredLocations,
          preferredCategories,
          availableHours,
          minWage,
          maxDistance,
          workStyle,
          certifications,
          bio,
          transportation
        }
      });

      logger.info(`Worker profile updated for user ${req.user!.id}`);
      res.json({ message: '워커 프로필이 업데이트되었습니다', profile: workerProfile });

    } catch (error) {
      logger.error('Error updating worker profile:', error);
      res.status(500).json({ error: '워커 프로필 업데이트 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 워커 프로필 조회
 */
router.get('/profile',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: req.user!.id }
      });

      if (!workerProfile) {
        return res.status(404).json({ error: '워커 프로필을 찾을 수 없습니다' });
      }

      res.json({ profile: workerProfile });

    } catch (error) {
      logger.error('Error fetching worker profile:', error);
      res.status(500).json({ error: '워커 프로필 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 매칭 선호도 설정 업데이트
 */
router.post('/preferences',
  authenticateToken,
  [
    body('autoMatchEnabled').isBoolean().withMessage('자동 매칭 활성화는 boolean 값이어야 합니다'),
    body('maxMatchesPerDay').isInt({ min: 1, max: 50 }).withMessage('일일 최대 매칭은 1-50 사이여야 합니다'),
    body('minMatchScore').isFloat({ min: 0, max: 1 }).withMessage('최소 매칭 점수는 0-1 사이여야 합니다')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: '입력 데이터가 유효하지 않습니다', 
          details: errors.array() 
        });
      }

      const {
        autoMatchEnabled,
        maxMatchesPerDay,
        minMatchScore,
        preferredNotifyTime,
        enablePushNotify,
        enableEmailNotify,
        enableSmsNotify,
        distanceWeight,
        skillWeight,
        scheduleWeight,
        wageWeight,
        experienceWeight,
        reliabilityWeight
      } = req.body;

      const preferences = await prisma.matchingPreferences.upsert({
        where: { userId: req.user!.id },
        update: {
          autoMatchEnabled,
          maxMatchesPerDay,
          minMatchScore,
          preferredNotifyTime,
          enablePushNotify,
          enableEmailNotify,
          enableSmsNotify,
          distanceWeight,
          skillWeight,
          scheduleWeight,
          wageWeight,
          experienceWeight,
          reliabilityWeight,
          updatedAt: new Date()
        },
        create: {
          userId: req.user!.id,
          autoMatchEnabled,
          maxMatchesPerDay,
          minMatchScore,
          preferredNotifyTime,
          enablePushNotify,
          enableEmailNotify,
          enableSmsNotify,
          distanceWeight,
          skillWeight,
          scheduleWeight,
          wageWeight,
          experienceWeight,
          reliabilityWeight
        }
      });

      logger.info(`Matching preferences updated for user ${req.user!.id}`);
      res.json({ message: '매칭 선호도가 업데이트되었습니다', preferences });

    } catch (error) {
      logger.error('Error updating matching preferences:', error);
      res.status(500).json({ error: '매칭 선호도 업데이트 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 새 일자리에 대한 AI 매칭 생성 (고용주용)
 */
router.post('/generate/:jobId',
  authenticateToken,
  param('jobId').isString().withMessage('올바른 일자리 ID가 필요합니다'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: '유효하지 않은 요청입니다', 
          details: errors.array() 
        });
      }

      const { jobId } = req.params;

      // 일자리가 현재 사용자의 것인지 확인
      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          employerId: req.user!.id
        }
      });

      if (!job) {
        return res.status(404).json({ error: '일자리를 찾을 수 없거나 접근 권한이 없습니다' });
      }

      // AI 매칭 실행
      await aiMatching.generateMatches(jobId);

      logger.info(`AI matching generated for job ${jobId} by user ${req.user!.id}`);
      res.json({ message: 'AI 매칭이 생성되었습니다' });

    } catch (error) {
      logger.error('Error generating AI matches:', error);
      res.status(500).json({ error: 'AI 매칭 생성 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 워커의 매칭된 일자리 조회
 */
router.get('/jobs',
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('제한 개수는 1-50 사이여야 합니다')
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

      const limit = parseInt(req.query.limit as string) || 10;

      const matches = await aiMatching.getMatchesForWorker(req.user!.id, limit);

      res.json({ 
        matches: matches.map(match => ({
          id: match.id,
          matchScore: match.matchScore,
          scoreBreakdown: match.scoreBreakdown,
          job: {
            id: match.job.id,
            title: match.job.title,
            description: match.job.description,
            category: match.job.category,
            location: match.job.location,
            wage: match.job.wage,
            workDate: match.job.workDate,
            workHours: match.job.workHours,
            urgent: match.job.urgent,
            employer: match.job.employer
          },
          createdAt: match.createdAt
        }))
      });

    } catch (error) {
      logger.error('Error fetching worker matches:', error);
      res.status(500).json({ error: '매칭 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 일자리에 대한 매칭 결과 조회 (고용주용)
 */
router.get('/workers/:jobId',
  authenticateToken,
  [
    param('jobId').isString().withMessage('올바른 일자리 ID가 필요합니다'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('제한 개수는 1-50 사이여야 합니다')
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

      const { jobId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      // 일자리 소유권 확인
      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          employerId: req.user!.id
        }
      });

      if (!job) {
        return res.status(404).json({ error: '일자리를 찾을 수 없거나 접근 권한이 없습니다' });
      }

      const matches = await aiMatching.getMatchesForJob(jobId, limit);

      res.json({ 
        matches: matches.map(match => ({
          id: match.id,
          matchScore: match.matchScore,
          scoreBreakdown: match.scoreBreakdown,
          worker: {
            id: match.worker.id,
            name: match.worker.name,
            avatar: match.worker.avatar,
            rating: match.worker.rating,
            profile: match.worker.workerProfile
          },
          createdAt: match.createdAt
        }))
      });

    } catch (error) {
      logger.error('Error fetching job matches:', error);
      res.status(500).json({ error: '매칭 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 매칭 피드백 처리
 */
router.post('/feedback/:jobId/:workerId',
  authenticateToken,
  [
    param('jobId').isString().withMessage('올바른 일자리 ID가 필요합니다'),
    param('workerId').isString().withMessage('올바른 워커 ID가 필요합니다'),
    body('action').isIn(['applied', 'rejected', 'viewed']).withMessage('올바른 액션이 필요합니다')
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

      const { jobId, workerId } = req.params;
      const { action } = req.body;

      // 매칭이 존재하는지 확인
      const match = await prisma.jobMatch.findUnique({
        where: {
          jobId_workerId: {
            jobId,
            workerId
          }
        }
      });

      if (!match) {
        return res.status(404).json({ error: '매칭을 찾을 수 없습니다' });
      }

      // 권한 확인 (워커 본인 또는 해당 일자리의 고용주만 가능)
      if (req.user!.id !== workerId) {
        const job = await prisma.job.findFirst({
          where: {
            id: jobId,
            employerId: req.user!.id
          }
        });

        if (!job) {
          return res.status(403).json({ error: '접근 권한이 없습니다' });
        }
      }

      await aiMatching.handleMatchFeedback(jobId, workerId, action);

      logger.info(`Match feedback processed: ${action} for job ${jobId} by user ${req.user!.id}`);
      res.json({ message: '피드백이 처리되었습니다' });

    } catch (error) {
      logger.error('Error processing match feedback:', error);
      res.status(500).json({ error: '피드백 처리 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 매칭 분석 데이터 조회 (관리자용)
 */
router.get('/analytics',
  authenticateToken,
  [
    query('timeRange').optional().isInt({ min: 1, max: 365 }).withMessage('시간 범위는 1-365일 사이여야 합니다')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 관리자 권한 확인
      if (req.user!.userType !== 'ADMIN') {
        return res.status(403).json({ error: '관리자 권한이 필요합니다' });
      }

      const timeRange = parseInt(req.query.timeRange as string) || 7;
      const analytics = await aiMatching.getMatchingAnalytics(timeRange);

      res.json({ analytics });

    } catch (error) {
      logger.error('Error fetching matching analytics:', error);
      res.status(500).json({ error: '분석 데이터 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 매칭 히스토리 조회
 */
router.get('/history',
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('제한 개수는 1-100 사이여야 합니다'),
    query('action').optional().isIn(['GENERATED', 'VIEWED', 'APPLIED', 'REJECTED', 'EXPIRED', 'FEEDBACK']).withMessage('올바른 액션이 필요합니다')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const action = req.query.action as string;

      const whereClause: any = {
        workerId: req.user!.id
      };

      if (action) {
        whereClause.action = action;
      }

      const history = await prisma.matchingHistory.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              category: true,
              location: true,
              wage: true
            }
          }
        }
      });

      res.json({ history });

    } catch (error) {
      logger.error('Error fetching matching history:', error);
      res.status(500).json({ error: '매칭 히스토리 조회 중 오류가 발생했습니다' });
    }
  }
);

export default router;