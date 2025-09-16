/**
 * 메트릭 수집 및 관리 서비스
 */

import { PrismaClient } from '@prisma/client';
import * as os from 'os';
import * as fs from 'fs';
import { 
  SystemMetrics, 
  ApplicationMetrics, 
  BusinessMetrics, 
  MetricType,
  monitoringConfig,
  metricLabels
} from '../config/monitoring';
import { logger } from '../utils/logger';

interface MetricEntry {
  name: string;
  type: MetricType;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
  help?: string;
}

/**
 * 메트릭 수집기 클래스
 */
export class MetricsCollector {
  private prisma: PrismaClient;
  private metrics: Map<string, MetricEntry> = new Map();
  private timers: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
    this.startCollection();
  }

  /**
   * 메트릭 수집 시작
   */
  private startCollection(): void {
    if (!monitoringConfig.metrics.enableCollection) return;

    setInterval(() => {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
      this.collectBusinessMetrics();
    }, monitoringConfig.metrics.collectionInterval);

    logger.info('Metrics collection started', {
      interval: monitoringConfig.metrics.collectionInterval,
      retention: monitoringConfig.metrics.retentionDays
    });
  }

  /**
   * 카운터 메트릭 증가
   */
  incrementCounter(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    const key = this.getMetricKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.setMetric(name, MetricType.COUNTER, current + value, labels);
  }

  /**
   * 게이지 메트릭 설정
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.setMetric(name, MetricType.GAUGE, value, labels);
  }

  /**
   * 히스토그램 메트릭 관찰
   */
  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.getMetricKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);

    this.setMetric(name, MetricType.HISTOGRAM, value, labels);
  }

  /**
   * 타이머 시작
   */
  startTimer(name: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.observeHistogram(`${name}_duration_ms`, duration);
      return duration;
    };
  }

  /**
   * 메트릭 설정
   */
  private setMetric(
    name: string, 
    type: MetricType, 
    value: number, 
    labels: Record<string, string> = {}
  ): void {
    const key = this.getMetricKey(name, labels);
    const metric: MetricEntry = {
      name,
      type,
      value,
      labels: { ...metricLabels, ...labels },
      timestamp: new Date()
    };

    this.metrics.set(key, metric);
  }

  /**
   * 메트릭 키 생성
   */
  private getMetricKey(name: string, labels: Record<string, string>): string {
    const sortedLabels = Object.keys(labels)
      .sort()
      .map(key => `${key}="${labels[key]}"`)
      .join(',');
    return `${name}{${sortedLabels}}`;
  }

  /**
   * 시스템 메트릭 수집
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const loadAvg = os.loadavg();

      // CPU 메트릭
      this.setGauge('system_cpu_cores', cpus.length);
      this.setGauge('system_load_average_1m', loadAvg[0]);
      this.setGauge('system_load_average_5m', loadAvg[1]);
      this.setGauge('system_load_average_15m', loadAvg[2]);

      // 메모리 메트릭
      this.setGauge('system_memory_total_bytes', totalMem);
      this.setGauge('system_memory_used_bytes', usedMem);
      this.setGauge('system_memory_free_bytes', freeMem);
      this.setGauge('system_memory_usage_percent', (usedMem / totalMem) * 100);

      // 디스크 메트릭 (간단한 구현)
      if (monitoringConfig.healthChecks.checks.diskSpace) {
        const stats = await this.getDiskUsage();
        this.setGauge('system_disk_total_bytes', stats.total);
        this.setGauge('system_disk_used_bytes', stats.used);
        this.setGauge('system_disk_free_bytes', stats.free);
        this.setGauge('system_disk_usage_percent', (stats.used / stats.total) * 100);
      }

      // 프로세스 메트릭
      const memUsage = process.memoryUsage();
      this.setGauge('process_memory_rss_bytes', memUsage.rss);
      this.setGauge('process_memory_heap_total_bytes', memUsage.heapTotal);
      this.setGauge('process_memory_heap_used_bytes', memUsage.heapUsed);
      this.setGauge('process_memory_external_bytes', memUsage.external);
      this.setGauge('process_uptime_seconds', process.uptime());

    } catch (error) {
      logger.error('Failed to collect system metrics', { error });
    }
  }

  /**
   * 애플리케이션 메트릭 수집
   */
  private async collectApplicationMetrics(): Promise<void> {
    try {
      // 데이터베이스 연결 수 (Prisma 메트릭)
      const dbMetrics = await this.getDatabaseMetrics();
      this.setGauge('database_connections_active', dbMetrics.connections);
      this.setGauge('database_queries_total', dbMetrics.queries);
      this.setGauge('database_slow_queries_total', dbMetrics.slowQueries);

      // HTTP 요청 메트릭 (글로벌 카운터에서 가져오기)
      const httpMetrics = this.getHttpMetrics();
      this.setGauge('http_requests_total', httpMetrics.total);
      this.setGauge('http_requests_success_total', httpMetrics.success);
      this.setGauge('http_requests_error_total', httpMetrics.errors);
      this.setGauge('http_request_duration_avg_ms', httpMetrics.avgDuration);

    } catch (error) {
      logger.error('Failed to collect application metrics', { error });
    }
  }

  /**
   * 비즈니스 메트릭 수집
   */
  private async collectBusinessMetrics(): Promise<void> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 일자리 메트릭
      const jobMetrics = await this.prisma.job.groupBy({
        by: ['status'],
        _count: true,
        where: {
          createdAt: {
            gte: today
          }
        }
      });

      jobMetrics.forEach(metric => {
        this.setGauge(`jobs_${metric.status.toLowerCase()}_today`, metric._count);
      });

      // 사용자 메트릭
      const userMetrics = await this.prisma.user.groupBy({
        by: ['userType'],
        _count: true,
        where: {
          status: 'ACTIVE'
        }
      });

      userMetrics.forEach(metric => {
        this.setGauge(`users_${metric.userType.toLowerCase()}_active`, metric._count);
      });

      // 온라인 사용자 수
      const onlineUsers = await this.prisma.user.count({
        where: {
          isOnline: true,
          lastSeenAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000) // 10분 내
          }
        }
      });
      this.setGauge('users_online_total', onlineUsers);

      // 매칭 메트릭
      const matchingMetrics = await this.prisma.jobMatch.groupBy({
        by: ['status'],
        _count: true,
        where: {
          createdAt: {
            gte: today
          }
        }
      });

      matchingMetrics.forEach(metric => {
        this.setGauge(`matching_${metric.status.toLowerCase()}_today`, metric._count);
      });

    } catch (error) {
      logger.error('Failed to collect business metrics', { error });
    }
  }

  /**
   * 디스크 사용량 조회
   */
  private async getDiskUsage(): Promise<{ total: number; used: number; free: number }> {
    return new Promise((resolve, reject) => {
      fs.stat('.', (err, stats) => {
        if (err) {
          reject(err);
          return;
        }

        // 간단한 디스크 사용량 (실제로는 statvfs 등을 사용해야 함)
        const total = 100 * 1024 * 1024 * 1024; // 100GB 가정
        const free = 20 * 1024 * 1024 * 1024;  // 20GB 가정
        const used = total - free;

        resolve({ total, used, free });
      });
    });
  }

  /**
   * 데이터베이스 메트릭 조회
   */
  private async getDatabaseMetrics(): Promise<{
    connections: number;
    queries: number;
    slowQueries: number;
  }> {
    // 실제 구현에서는 Prisma 또는 데이터베이스 모니터링 도구를 사용
    return {
      connections: 10, // 현재 연결 수
      queries: this.counters.get('database_queries_total') || 0,
      slowQueries: this.counters.get('database_slow_queries_total') || 0
    };
  }

  /**
   * HTTP 메트릭 조회
   */
  private getHttpMetrics(): {
    total: number;
    success: number;
    errors: number;
    avgDuration: number;
  } {
    const total = this.counters.get('http_requests_total') || 0;
    const success = this.counters.get('http_requests_success_total') || 0;
    const errors = this.counters.get('http_requests_error_total') || 0;
    
    const durations = this.histograms.get('http_request_duration_ms') || [];
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    return { total, success, errors, avgDuration };
  }

  /**
   * 모든 메트릭 조회
   */
  getAllMetrics(): MetricEntry[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Prometheus 형식으로 메트릭 내보내기
   */
  exportPrometheusFormat(): string {
    const lines: string[] = [];
    const groupedMetrics = new Map<string, MetricEntry[]>();

    // 메트릭을 이름별로 그룹화
    for (const metric of this.metrics.values()) {
      if (!groupedMetrics.has(metric.name)) {
        groupedMetrics.set(metric.name, []);
      }
      groupedMetrics.get(metric.name)!.push(metric);
    }

    // Prometheus 형식으로 변환
    for (const [name, metrics] of groupedMetrics) {
      const firstMetric = metrics[0];
      
      // HELP 라인
      if (firstMetric.help) {
        lines.push(`# HELP ${name} ${firstMetric.help}`);
      }
      
      // TYPE 라인
      lines.push(`# TYPE ${name} ${firstMetric.type}`);
      
      // 메트릭 값들
      for (const metric of metrics) {
        const labels = Object.entries(metric.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',');
        
        const labelStr = labels ? `{${labels}}` : '';
        lines.push(`${name}${labelStr} ${metric.value} ${metric.timestamp.getTime()}`);
      }
      
      lines.push(''); // 빈 줄
    }

    return lines.join('\n');
  }

  /**
   * 메트릭 정리 (오래된 데이터 삭제)
   */
  async cleanupOldMetrics(): Promise<void> {
    const cutoffDate = new Date(
      Date.now() - monitoringConfig.metrics.retentionDays * 24 * 60 * 60 * 1000
    );

    // 메모리에서 오래된 메트릭 제거
    for (const [key, metric] of this.metrics) {
      if (metric.timestamp < cutoffDate) {
        this.metrics.delete(key);
      }
    }

    // 데이터베이스에서 오래된 로그 제거
    try {
      await this.prisma.securityEvent.deleteMany({
        where: {
          eventType: 'APPLICATION_LOG',
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      logger.info('Old metrics cleaned up', { 
        cutoffDate,
        retentionDays: monitoringConfig.metrics.retentionDays
      });
    } catch (error) {
      logger.error('Failed to cleanup old metrics', { error });
    }
  }

  /**
   * 메트릭 요약 통계
   */
  getMetricsSummary(): {
    totalMetrics: number;
    counters: number;
    gauges: number;
    histograms: number;
    timers: number;
    lastUpdate: Date;
  } {
    const metrics = Array.from(this.metrics.values());
    const typeCount = metrics.reduce((acc, metric) => {
      acc[metric.type] = (acc[metric.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lastUpdate = metrics.reduce((latest, metric) => 
      metric.timestamp > latest ? metric.timestamp : latest
    , new Date(0));

    return {
      totalMetrics: metrics.length,
      counters: typeCount[MetricType.COUNTER] || 0,
      gauges: typeCount[MetricType.GAUGE] || 0,
      histograms: typeCount[MetricType.HISTOGRAM] || 0,
      timers: typeCount[MetricType.TIMER] || 0,
      lastUpdate
    };
  }
}

// 전역 메트릭 수집기 인스턴스
export const metricsCollector = new MetricsCollector();

// 편의 함수들
export const incrementCounter = (name: string, value?: number, labels?: Record<string, string>) =>
  metricsCollector.incrementCounter(name, value, labels);

export const setGauge = (name: string, value: number, labels?: Record<string, string>) =>
  metricsCollector.setGauge(name, value, labels);

export const observeHistogram = (name: string, value: number, labels?: Record<string, string>) =>
  metricsCollector.observeHistogram(name, value, labels);

export const startTimer = (name: string) =>
  metricsCollector.startTimer(name);