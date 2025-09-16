/**
 * 운영 모니터링 및 로깅 설정
 */

export interface MonitoringConfig {
  logging: {
    level: string;
    format: string;
    enableConsole: boolean;
    enableFile: boolean;
    enableDatabase: boolean;
    filePath?: string;
    maxFileSize: string;
    maxFiles: number;
    enableJson: boolean;
  };
  metrics: {
    enableCollection: boolean;
    collectionInterval: number;
    retentionDays: number;
    enableAggregation: boolean;
    aggregationWindow: number;
  };
  alerts: {
    enableEmail: boolean;
    enableSlack: boolean;
    enableSms: boolean;
    emailRecipients: string[];
    slackWebhook?: string;
    thresholds: {
      errorRate: number;
      responseTime: number;
      memoryUsage: number;
      cpuUsage: number;
      diskUsage: number;
      databaseConnections: number;
    };
  };
  healthChecks: {
    enableEndpoint: boolean;
    interval: number;
    timeout: number;
    checks: {
      database: boolean;
      redis: boolean;
      externalAPIs: boolean;
      diskSpace: boolean;
      memory: boolean;
    };
  };
  performance: {
    enableTracking: boolean;
    slowQueryThreshold: number;
    slowRequestThreshold: number;
    enableProfiling: boolean;
    sampleRate: number;
  };
  audit: {
    enableLogging: boolean;
    logLevel: string;
    includeBody: boolean;
    includeHeaders: boolean;
    excludePaths: string[];
    retentionDays: number;
  };
}

/**
 * 환경별 모니터링 설정
 */
const getMonitoringConfig = (): MonitoringConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    logging: {
      level: isProduction ? 'info' : 'debug',
      format: isProduction ? 'json' : 'simple',
      enableConsole: true,
      enableFile: isProduction,
      enableDatabase: isProduction,
      filePath: isProduction ? '/var/log/onetime' : './logs',
      maxFileSize: '50MB',
      maxFiles: 10,
      enableJson: isProduction
    },
    metrics: {
      enableCollection: true,
      collectionInterval: isProduction ? 60000 : 30000, // 1분 vs 30초
      retentionDays: isProduction ? 30 : 7,
      enableAggregation: isProduction,
      aggregationWindow: 300000 // 5분
    },
    alerts: {
      enableEmail: isProduction,
      enableSlack: isProduction,
      enableSms: false,
      emailRecipients: process.env.ALERT_EMAILS?.split(',') || [],
      slackWebhook: process.env.SLACK_WEBHOOK_URL,
      thresholds: {
        errorRate: isProduction ? 5 : 20, // 5% vs 20%
        responseTime: isProduction ? 2000 : 5000, // 2초 vs 5초
        memoryUsage: 85, // 85%
        cpuUsage: 80, // 80%
        diskUsage: 90, // 90%
        databaseConnections: isProduction ? 80 : 95 // 80% vs 95%
      }
    },
    healthChecks: {
      enableEndpoint: true,
      interval: 30000, // 30초
      timeout: 5000, // 5초
      checks: {
        database: true,
        redis: false, // Redis 사용 시 true로 변경
        externalAPIs: isProduction,
        diskSpace: isProduction,
        memory: true
      }
    },
    performance: {
      enableTracking: true,
      slowQueryThreshold: isProduction ? 1000 : 2000, // 1초 vs 2초
      slowRequestThreshold: isProduction ? 2000 : 5000, // 2초 vs 5초
      enableProfiling: isDevelopment,
      sampleRate: isProduction ? 0.1 : 1.0 // 10% vs 100%
    },
    audit: {
      enableLogging: true,
      logLevel: 'info',
      includeBody: !isProduction, // 개발환경에서만 body 포함
      includeHeaders: !isProduction,
      excludePaths: ['/health', '/metrics', '/favicon.ico'],
      retentionDays: isProduction ? 90 : 30
    }
  };
};

export const monitoringConfig = getMonitoringConfig();

/**
 * 로그 레벨 정의
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

/**
 * 메트릭 타입 정의
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer'
}

/**
 * 알림 심각도 레벨
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 시스템 메트릭 인터페이스
 */
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  application: {
    uptime: number;
    restarts: number;
    activeConnections: number;
    requestsPerSecond: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

/**
 * 애플리케이션 메트릭 인터페이스
 */
export interface ApplicationMetrics {
  timestamp: Date;
  requests: {
    total: number;
    success: number;
    errors: number;
    rate: number;
  };
  responses: {
    averageTime: number;
    p95Time: number;
    p99Time: number;
    slowQueries: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
    errors: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  users: {
    active: number;
    sessions: number;
    registrations: number;
  };
}

/**
 * 비즈니스 메트릭 인터페이스
 */
export interface BusinessMetrics {
  timestamp: Date;
  jobs: {
    created: number;
    completed: number;
    cancelled: number;
    active: number;
  };
  users: {
    workers: number;
    employers: number;
    verified: number;
    online: number;
  };
  matching: {
    generated: number;
    applied: number;
    accepted: number;
    successRate: number;
  };
  revenue: {
    total: number;
    transactions: number;
    averageValue: number;
  };
}

/**
 * 알림 구성 인터페이스
 */
export interface AlertConfig {
  name: string;
  condition: string;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  cooldown: number; // 연속 알림 방지 (ms)
  recipients: string[];
  template: string;
}

/**
 * 기본 알림 설정들
 */
export const defaultAlerts: AlertConfig[] = [
  {
    name: 'High Error Rate',
    condition: 'error_rate > threshold',
    threshold: monitoringConfig.alerts.thresholds.errorRate,
    severity: AlertSeverity.HIGH,
    enabled: true,
    cooldown: 300000, // 5분
    recipients: monitoringConfig.alerts.emailRecipients,
    template: 'error_rate_alert'
  },
  {
    name: 'Slow Response Time',
    condition: 'avg_response_time > threshold',
    threshold: monitoringConfig.alerts.thresholds.responseTime,
    severity: AlertSeverity.MEDIUM,
    enabled: true,
    cooldown: 300000,
    recipients: monitoringConfig.alerts.emailRecipients,
    template: 'slow_response_alert'
  },
  {
    name: 'High Memory Usage',
    condition: 'memory_usage > threshold',
    threshold: monitoringConfig.alerts.thresholds.memoryUsage,
    severity: AlertSeverity.HIGH,
    enabled: true,
    cooldown: 600000, // 10분
    recipients: monitoringConfig.alerts.emailRecipients,
    template: 'memory_usage_alert'
  },
  {
    name: 'Database Connection Pool Full',
    condition: 'db_connections > threshold',
    threshold: monitoringConfig.alerts.thresholds.databaseConnections,
    severity: AlertSeverity.CRITICAL,
    enabled: true,
    cooldown: 120000, // 2분
    recipients: monitoringConfig.alerts.emailRecipients,
    template: 'database_alert'
  },
  {
    name: 'Application Down',
    condition: 'health_check_failed',
    threshold: 1,
    severity: AlertSeverity.CRITICAL,
    enabled: true,
    cooldown: 60000, // 1분
    recipients: monitoringConfig.alerts.emailRecipients,
    template: 'application_down_alert'
  }
];

/**
 * 로그 포맷터
 */
export const logFormats = {
  simple: '${timestamp} [${level}] ${message}',
  detailed: '${timestamp} [${level}] [${service}] ${message} ${meta}',
  json: {
    timestamp: '${timestamp}',
    level: '${level}',
    service: '${service}',
    message: '${message}',
    meta: '${meta}',
    trace: '${trace}'
  }
};

/**
 * 메트릭 라벨 표준화
 */
export const metricLabels = {
  service: 'onetime-api',
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  region: process.env.REGION || 'unknown',
  instance: process.env.INSTANCE_ID || 'local'
};