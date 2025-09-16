/**
 * 모니터링 관련 API 엔드포인트
 */

import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { metricsCollector } from '../services/metricsService';
import { healthCheckService } from '../services/healthCheckService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * 헬스체크 엔드포인트 (public)
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await healthCheckService.runAllChecks();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date()
    });
  }
});

/**
 * Liveness 프로브 (Kubernetes 용)
 */
router.get('/health/live', async (req: Request, res: Response) => {
  try {
    const result = await healthCheckService.liveness();
    res.json(result);
  } catch (error) {
    logger.error('Liveness check failed', { error });
    res.status(503).json({ status: 'error' });
  }
});

/**
 * Readiness 프로브 (Kubernetes 용)
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const result = await healthCheckService.readiness();
    const statusCode = result.status === 'ready' ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({ status: 'not-ready', error: 'Readiness check failed' });
  }
});

/**
 * 특정 헬스체크 실행
 */
router.get('/health/:checkName',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 관리자 권한 확인
      if (req.user!.userType !== 'ADMIN') {
        return res.status(403).json({ error: '관리자 권한이 필요합니다' });
      }

      const { checkName } = req.params;
      const result = await healthCheckService.runCheck(checkName);
      
      if (!result) {
        return res.status(404).json({ error: '헬스체크를 찾을 수 없습니다' });
      }

      res.json(result);
    } catch (error) {
      logger.error('Individual health check failed', { checkName: req.params.checkName, error });
      res.status(500).json({ error: '헬스체크 실행 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 메트릭 엔드포인트 (Prometheus 형식)
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const prometheusFormat = metricsCollector.exportPrometheusFormat();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(prometheusFormat);
  } catch (error) {
    logger.error('Metrics export failed', { error });
    res.status(500).send('# Metrics export failed\n');
  }
});

/**
 * JSON 형식 메트릭 조회
 */
router.get('/metrics/json',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 관리자 권한 확인
      if (req.user!.userType !== 'ADMIN') {
        return res.status(403).json({ error: '관리자 권한이 필요합니다' });
      }

      const metrics = metricsCollector.getAllMetrics();
      const summary = metricsCollector.getMetricsSummary();

      res.json({
        summary,
        metrics: metrics.slice(0, 100) // 최대 100개만 반환
      });
    } catch (error) {
      logger.error('JSON metrics export failed', { error });
      res.status(500).json({ error: '메트릭 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 시스템 정보 조회
 */
router.get('/system',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 관리자 권한 확인
      if (req.user!.userType !== 'ADMIN') {
        return res.status(403).json({ error: '관리자 권한이 필요합니다' });
      }

      const os = require('os');
      const process = require('process');

      const systemInfo = {
        system: {
          platform: os.platform(),
          arch: os.arch(),
          release: os.release(),
          hostname: os.hostname(),
          uptime: os.uptime()
        },
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          version: process.version,
          versions: process.versions,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        },
        application: {
          version: process.env.APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          nodeEnv: process.env.NODE_ENV,
          port: process.env.PORT || 3000
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model,
          loadAverage: os.loadavg()
        }
      };

      res.json(systemInfo);
    } catch (error) {
      logger.error('System info retrieval failed', { error });
      res.status(500).json({ error: '시스템 정보 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 로그 조회 (최근 로그)
 */
router.get('/logs',
  authenticateToken,
  [
    query('level').optional().isIn(['error', 'warn', 'info', 'http', 'debug']).withMessage('올바른 로그 레벨을 선택하세요'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('제한 개수는 1-1000 사이여야 합니다'),
    query('service').optional().isString().withMessage('서비스명은 문자열이어야 합니다')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 관리자 권한 확인
      if (req.user!.userType !== 'ADMIN') {
        return res.status(403).json({ error: '관리자 권한이 필요합니다' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: '유효하지 않은 요청입니다', 
          details: errors.array() 
        });
      }

      const level = req.query.level as string;
      const limit = parseInt(req.query.limit as string) || 100;
      const service = req.query.service as string;

      // 실제 구현에서는 로그 파일이나 로그 수집 시스템에서 조회
      // 여기서는 간단한 예시
      const logs = [
        {
          timestamp: new Date(),
          level: 'info',
          service: 'api',
          message: 'Application started',
          meta: {}
        }
      ];

      res.json({
        total: logs.length,
        logs: logs.slice(0, limit)
      });
    } catch (error) {
      logger.error('Log retrieval failed', { error });
      res.status(500).json({ error: '로그 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 성능 통계 조회
 */
router.get('/performance',
  authenticateToken,
  [
    query('timeRange').optional().isInt({ min: 1, max: 168 }).withMessage('시간 범위는 1-168시간 사이여야 합니다')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 관리자 권한 확인
      if (req.user!.userType !== 'ADMIN') {
        return res.status(403).json({ error: '관리자 권한이 필요합니다' });
      }

      const timeRange = parseInt(req.query.timeRange as string) || 24; // 기본 24시간

      const performanceStats = {
        timeRange: `${timeRange} hours`,
        summary: {
          averageResponseTime: 150, // ms
          totalRequests: 10000,
          errorRate: 0.5, // %
          throughput: 100, // requests/minute
          uptime: 99.9 // %
        },
        breakdown: {
          endpoints: [
            { path: '/api/jobs', avgResponseTime: 120, requests: 5000, errors: 10 },
            { path: '/api/auth', avgResponseTime: 80, requests: 2000, errors: 5 },
            { path: '/api/users', avgResponseTime: 200, requests: 3000, errors: 15 }
          ],
          statusCodes: {
            '200': 9500,
            '400': 300,
            '401': 100,
            '500': 50,
            '404': 50
          }
        }
      };

      res.json(performanceStats);
    } catch (error) {
      logger.error('Performance stats retrieval failed', { error });
      res.status(500).json({ error: '성능 통계 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 알림 설정 조회
 */
router.get('/alerts',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 관리자 권한 확인
      if (req.user!.userType !== 'ADMIN') {
        return res.status(403).json({ error: '관리자 권한이 필요합니다' });
      }

      // 실제 구현에서는 데이터베이스에서 알림 설정 조회
      const alerts = [
        {
          id: '1',
          name: 'High Error Rate',
          condition: 'error_rate > 5%',
          enabled: true,
          lastTriggered: new Date('2024-01-15T10:30:00Z'),
          severity: 'high'
        },
        {
          id: '2',
          name: 'Slow Response Time',
          condition: 'avg_response_time > 2000ms',
          enabled: true,
          lastTriggered: null,
          severity: 'medium'
        }
      ];

      res.json({ alerts });
    } catch (error) {
      logger.error('Alert retrieval failed', { error });
      res.status(500).json({ error: '알림 조회 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 메트릭 정리 (수동 트리거)
 */
router.post('/metrics/cleanup',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 관리자 권한 확인
      if (req.user!.userType !== 'ADMIN') {
        return res.status(403).json({ error: '관리자 권한이 필요합니다' });
      }

      await metricsCollector.cleanupOldMetrics();
      
      logger.info('Metrics cleanup triggered manually', { userId: req.user!.id });
      res.json({ message: '오래된 메트릭이 정리되었습니다' });
    } catch (error) {
      logger.error('Manual metrics cleanup failed', { error });
      res.status(500).json({ error: '메트릭 정리 중 오류가 발생했습니다' });
    }
  }
);

/**
 * 애플리케이션 상태 요약
 */
router.get('/status',
  async (req: Request, res: Response) => {
    try {
      const health = await healthCheckService.runAllChecks();
      const metricsSummary = metricsCollector.getMetricsSummary();
      
      const status = {
        service: 'onetime-api',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        status: health.status,
        uptime: process.uptime(),
        timestamp: new Date(),
        health: {
          status: health.status,
          checksTotal: health.checks.length,
          checksHealthy: health.checks.filter(c => c.status === 'healthy').length
        },
        metrics: {
          total: metricsSummary.totalMetrics,
          lastUpdate: metricsSummary.lastUpdate
        }
      };

      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(status);
    } catch (error) {
      logger.error('Status retrieval failed', { error });
      res.status(503).json({
        service: 'onetime-api',
        status: 'error',
        error: 'Status check failed',
        timestamp: new Date()
      });
    }
  }
);

export default router;