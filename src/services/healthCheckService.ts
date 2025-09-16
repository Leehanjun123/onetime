/**
 * 헬스체크 서비스
 */

import { PrismaClient } from '@prisma/client';
import * as os from 'os';
import * as fs from 'fs';
import { monitoringConfig } from '../config/monitoring';
import { logger } from '../utils/logger';
import { incrementCounter, setGauge } from './metricsService';

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  details?: any;
  timestamp: Date;
}

export interface OverallHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: HealthCheckResult[];
  uptime: number;
  timestamp: Date;
  version: string;
  environment: string;
}

/**
 * 개별 헬스체크 인터페이스
 */
interface HealthCheck {
  name: string;
  check(): Promise<HealthCheckResult>;
  timeout: number;
  critical: boolean;
}

/**
 * 헬스체크 서비스 클래스
 */
export class HealthCheckService {
  private prisma: PrismaClient;
  private checks: HealthCheck[] = [];
  private lastResults: Map<string, HealthCheckResult> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
    this.registerDefaultChecks();
    this.startPeriodicChecks();
  }

  /**
   * 기본 헬스체크들 등록
   */
  private registerDefaultChecks(): void {
    if (monitoringConfig.healthChecks.checks.database) {
      this.registerCheck(new DatabaseHealthCheck(this.prisma));
    }

    if (monitoringConfig.healthChecks.checks.memory) {
      this.registerCheck(new MemoryHealthCheck());
    }

    if (monitoringConfig.healthChecks.checks.diskSpace) {
      this.registerCheck(new DiskSpaceHealthCheck());
    }

    if (monitoringConfig.healthChecks.checks.externalAPIs) {
      // 외부 API 헬스체크는 필요에 따라 추가
      // this.registerCheck(new ExternalAPIHealthCheck());
    }

    logger.info('Health checks registered', { 
      totalChecks: this.checks.length,
      checkNames: this.checks.map(c => c.name)
    });
  }

  /**
   * 헬스체크 등록
   */
  registerCheck(check: HealthCheck): void {
    this.checks.push(check);
  }

  /**
   * 주기적 헬스체크 시작
   */
  private startPeriodicChecks(): void {
    if (!monitoringConfig.healthChecks.enableEndpoint) return;

    setInterval(async () => {
      await this.runAllChecks();
    }, monitoringConfig.healthChecks.interval);

    logger.info('Periodic health checks started', {
      interval: monitoringConfig.healthChecks.interval
    });
  }

  /**
   * 모든 헬스체크 실행
   */
  async runAllChecks(): Promise<OverallHealth> {
    const startTime = Date.now();
    const results: HealthCheckResult[] = [];

    // 모든 체크를 병렬로 실행
    const checkPromises = this.checks.map(async (check) => {
      try {
        const timeoutPromise = new Promise<HealthCheckResult>((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), check.timeout);
        });

        const checkPromise = check.check();
        const result = await Promise.race([checkPromise, timeoutPromise]);
        
        this.lastResults.set(check.name, result);
        incrementCounter('health_checks_total', 1, { check: check.name, status: result.status });
        
        return result;
      } catch (error) {
        const errorResult: HealthCheckResult = {
          name: check.name,
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        };
        
        this.lastResults.set(check.name, errorResult);
        incrementCounter('health_checks_total', 1, { check: check.name, status: 'unhealthy' });
        
        return errorResult;
      }
    });

    results.push(...await Promise.all(checkPromises));

    // 전체 상태 결정
    const overallStatus = this.determineOverallStatus(results);
    
    // 메트릭 업데이트
    setGauge('health_checks_status', overallStatus === 'healthy' ? 1 : 0);
    setGauge('health_checks_duration_ms', Date.now() - startTime);

    const health: OverallHealth = {
      status: overallStatus,
      checks: results,
      uptime: process.uptime(),
      timestamp: new Date(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // 비정상 상태일 때 로그 기록
    if (overallStatus !== 'healthy') {
      logger.warn('Health check failed', { 
        status: overallStatus,
        failedChecks: results.filter(r => r.status !== 'healthy').map(r => r.name)
      });
    }

    return health;
  }

  /**
   * 전체 상태 결정
   */
  private determineOverallStatus(results: HealthCheckResult[]): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyChecks = results.filter(r => r.status === 'unhealthy');
    const degradedChecks = results.filter(r => r.status === 'degraded');

    // 중요한 체크가 실패하면 비정상
    const criticalUnhealthy = unhealthyChecks.some(result => {
      const check = this.checks.find(c => c.name === result.name);
      return check?.critical === true;
    });

    if (criticalUnhealthy) {
      return 'unhealthy';
    }

    // 비중요한 체크가 실패하거나 성능 저하가 있으면 성능 저하
    if (unhealthyChecks.length > 0 || degradedChecks.length > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * 특정 헬스체크 실행
   */
  async runCheck(checkName: string): Promise<HealthCheckResult | null> {
    const check = this.checks.find(c => c.name === checkName);
    if (!check) return null;

    try {
      const result = await check.check();
      this.lastResults.set(checkName, result);
      return result;
    } catch (error) {
      const errorResult: HealthCheckResult = {
        name: checkName,
        status: 'unhealthy',
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      this.lastResults.set(checkName, errorResult);
      return errorResult;
    }
  }

  /**
   * 마지막 헬스체크 결과 조회
   */
  getLastResults(): HealthCheckResult[] {
    return Array.from(this.lastResults.values());
  }

  /**
   * 간단한 liveness 체크
   */
  async liveness(): Promise<{ status: 'ok'; uptime: number }> {
    return {
      status: 'ok',
      uptime: process.uptime()
    };
  }

  /**
   * 준비 상태 체크
   */
  async readiness(): Promise<{ status: 'ready' | 'not-ready'; checks: string[] }> {
    const criticalChecks = this.checks.filter(c => c.critical);
    const results = await Promise.all(
      criticalChecks.map(check => this.runCheck(check.name))
    );

    const failedChecks = results
      .filter(result => result && result.status === 'unhealthy')
      .map(result => result!.name);

    return {
      status: failedChecks.length === 0 ? 'ready' : 'not-ready',
      checks: failedChecks
    };
  }
}

/**
 * 데이터베이스 헬스체크
 */
class DatabaseHealthCheck implements HealthCheck {
  name = 'database';
  timeout = 5000;
  critical = true;

  constructor(private prisma: PrismaClient) {}

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // 간단한 쿼리 실행
      await this.prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: this.name,
        status: responseTime > 2000 ? 'degraded' : 'healthy',
        responseTime,
        details: { queryTime: responseTime },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        name: this.name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date()
      };
    }
  }
}

/**
 * 메모리 헬스체크
 */
class MemoryHealthCheck implements HealthCheck {
  name = 'memory';
  timeout = 1000;
  critical = false;

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsagePercent = (usedMem / totalMem) * 100;

      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      
      if (memoryUsagePercent > 90) {
        status = 'unhealthy';
      } else if (memoryUsagePercent > 80) {
        status = 'degraded';
      }

      return {
        name: this.name,
        status,
        responseTime: Date.now() - startTime,
        details: {
          processMemory: {
            rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB'
          },
          systemMemory: {
            total: Math.round(totalMem / 1024 / 1024) + 'MB',
            used: Math.round(usedMem / 1024 / 1024) + 'MB',
            free: Math.round(freeMem / 1024 / 1024) + 'MB',
            usagePercent: Math.round(memoryUsagePercent * 100) / 100
          }
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        name: this.name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Memory check failed',
        timestamp: new Date()
      };
    }
  }
}

/**
 * 디스크 공간 헬스체크
 */
class DiskSpaceHealthCheck implements HealthCheck {
  name = 'disk_space';
  timeout = 2000;
  critical = false;

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const stats = await this.getDiskUsage('.');
      const usagePercent = (stats.used / stats.total) * 100;

      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      
      if (usagePercent > 95) {
        status = 'unhealthy';
      } else if (usagePercent > 85) {
        status = 'degraded';
      }

      return {
        name: this.name,
        status,
        responseTime: Date.now() - startTime,
        details: {
          total: this.formatBytes(stats.total),
          used: this.formatBytes(stats.used),
          free: this.formatBytes(stats.free),
          usagePercent: Math.round(usagePercent * 100) / 100
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        name: this.name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Disk space check failed',
        timestamp: new Date()
      };
    }
  }

  private async getDiskUsage(path: string): Promise<{ total: number; used: number; free: number }> {
    return new Promise((resolve, reject) => {
      fs.stat(path, (err, stats) => {
        if (err) {
          reject(err);
          return;
        }

        // 실제 구현에서는 statvfs 또는 다른 시스템 호출을 사용해야 함
        // 여기서는 임시로 하드코딩된 값 사용
        const total = 100 * 1024 * 1024 * 1024; // 100GB
        const free = 30 * 1024 * 1024 * 1024;  // 30GB
        const used = total - free;

        resolve({ total, used, free });
      });
    });
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// 전역 헬스체크 서비스 인스턴스
export const healthCheckService = new HealthCheckService();