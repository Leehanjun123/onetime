/**
 * 고급 로거 시스템
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { monitoringConfig, LogLevel, metricLabels } from '../config/monitoring';
import { sanitizeLogData } from '../config/security';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  service: string;
  meta?: any;
  trace?: string;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  url?: string;
  error?: Error;
}

interface LogTransport {
  log(entry: LogEntry): Promise<void>;
}

/**
 * 콘솔 로그 트랜스포트
 */
class ConsoleTransport implements LogTransport {
  async log(entry: LogEntry): Promise<void> {
    const { timestamp, level, message, meta, error } = entry;
    
    const colorMap = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      http: '\x1b[35m',
      verbose: '\x1b[37m',
      debug: '\x1b[90m',
      silly: '\x1b[90m'
    };
    
    const reset = '\x1b[0m';
    const color = colorMap[level] || reset;
    
    let logMessage = `${color}[${timestamp.toISOString()}] [${level.toUpperCase()}]${reset} ${message}`;
    
    if (meta && Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(sanitizeLogData(meta))}`;
    }
    
    if (error) {
      logMessage += `\n${error.stack}`;
    }
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }
}

/**
 * 파일 로그 트랜스포트
 */
class FileTransport implements LogTransport {
  private logDir: string;
  private maxFileSize: number;
  private maxFiles: number;

  constructor() {
    this.logDir = monitoringConfig.logging.filePath || './logs';
    this.maxFileSize = this.parseSize(monitoringConfig.logging.maxFileSize);
    this.maxFiles = monitoringConfig.logging.maxFiles;
    
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private parseSize(sizeStr: string): number {
    const units = { KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const match = sizeStr.match(/^(\d+)(KB|MB|GB)$/i);
    if (!match) return 50 * 1024 * 1024; // 기본 50MB
    
    const [, size, unit] = match;
    return parseInt(size) * (units[unit.toUpperCase() as keyof typeof units] || 1);
  }

  private getLogFileName(level: LogLevel): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${level}-${date}.log`);
  }

  private async rotateFile(filePath: string): Promise<void> {
    const stats = fs.statSync(filePath);
    if (stats.size > this.maxFileSize) {
      const timestamp = Date.now();
      const rotatedPath = `${filePath}.${timestamp}`;
      fs.renameSync(filePath, rotatedPath);
      
      // 오래된 파일들 정리
      await this.cleanOldFiles(path.dirname(filePath));
    }
  }

  private async cleanOldFiles(dir: string): Promise<void> {
    const files = fs.readdirSync(dir)
      .filter(file => file.includes('.log.'))
      .map(file => ({
        name: file,
        path: path.join(dir, file),
        mtime: fs.statSync(path.join(dir, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (files.length > this.maxFiles) {
      const filesToDelete = files.slice(this.maxFiles);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
  }

  async log(entry: LogEntry): Promise<void> {
    const filePath = this.getLogFileName(entry.level);
    
    // 파일 크기 확인 및 로테이션
    if (fs.existsSync(filePath)) {
      await this.rotateFile(filePath);
    }

    const logLine = monitoringConfig.logging.enableJson
      ? JSON.stringify({
          ...entry,
          timestamp: entry.timestamp.toISOString(),
          meta: sanitizeLogData(entry.meta)
        }) + '\n'
      : `${entry.timestamp.toISOString()} [${entry.level.toUpperCase()}] ${entry.message}\n`;

    fs.appendFileSync(filePath, logLine);
  }
}

/**
 * 데이터베이스 로그 트랜스포트
 */
class DatabaseTransport implements LogTransport {
  private prisma: PrismaClient;
  private batchBuffer: LogEntry[] = [];
  private batchSize = 100;
  private flushInterval = 30000; // 30초

  constructor() {
    this.prisma = new PrismaClient();
    this.startBatchFlush();
  }

  private startBatchFlush(): void {
    setInterval(() => {
      this.flushBatch();
    }, this.flushInterval);
  }

  private async flushBatch(): Promise<void> {
    if (this.batchBuffer.length === 0) return;

    const logs = this.batchBuffer.splice(0, this.batchSize);
    
    try {
      // 실제 운영에서는 별도 로그 테이블을 만들어 사용
      await this.prisma.securityEvent.createMany({
        data: logs.map(entry => ({
          eventType: 'APPLICATION_LOG',
          severity: this.mapLogLevelToSeverity(entry.level),
          source: 'APPLICATION',
          details: {
            level: entry.level,
            message: entry.message,
            meta: sanitizeLogData(entry.meta),
            service: entry.service,
            requestId: entry.requestId,
            duration: entry.duration,
            statusCode: entry.statusCode,
            method: entry.method,
            url: entry.url
          },
          userId: entry.userId,
          ipAddress: entry.ip,
          userAgent: entry.userAgent
        }))
      });
    } catch (error) {
      console.error('Failed to flush log batch to database:', error);
      // 실패한 로그들을 다시 버퍼에 추가 (메모리 오버플로우 방지를 위해 제한)
      if (this.batchBuffer.length < 1000) {
        this.batchBuffer.unshift(...logs);
      }
    }
  }

  private mapLogLevelToSeverity(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return 'HIGH';
      case LogLevel.WARN:
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  async log(entry: LogEntry): Promise<void> {
    this.batchBuffer.push(entry);
    
    // 버퍼가 가득 차면 즉시 플러시
    if (this.batchBuffer.length >= this.batchSize) {
      await this.flushBatch();
    }
  }
}

/**
 * 고급 로거 클래스
 */
export class AdvancedLogger {
  private transports: LogTransport[] = [];
  private context: string = 'Application';

  constructor() {
    this.setupTransports();
  }

  private setupTransports(): void {
    if (monitoringConfig.logging.enableConsole) {
      this.transports.push(new ConsoleTransport());
    }

    if (monitoringConfig.logging.enableFile) {
      this.transports.push(new FileTransport());
    }

    if (monitoringConfig.logging.enableDatabase) {
      this.transports.push(new DatabaseTransport());
    }
  }

  setContext(context: string): AdvancedLogger {
    const newLogger = new AdvancedLogger();
    newLogger.context = context;
    newLogger.transports = this.transports;
    return newLogger;
  }

  private async writeLog(
    level: LogLevel,
    message: string,
    meta?: any,
    error?: Error
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      service: this.context,
      meta,
      trace: error?.stack || new Error().stack,
      error
    };

    // 컨텍스트에서 추가 정보 추출 (Express 요청 컨텍스트 등)
    if (meta?.req) {
      entry.requestId = meta.req.headers['x-request-id'];
      entry.ip = meta.req.ip;
      entry.userAgent = meta.req.headers['user-agent'];
      entry.method = meta.req.method;
      entry.url = meta.req.url;
      entry.userId = meta.req.user?.id;
    }

    if (meta?.res) {
      entry.statusCode = meta.res.statusCode;
    }

    if (meta?.duration) {
      entry.duration = meta.duration;
    }

    await Promise.all(
      this.transports.map(transport => 
        transport.log(entry).catch(err => 
          console.error('Transport error:', err)
        )
      )
    );
  }

  async error(message: string, meta?: any, error?: Error): Promise<void> {
    await this.writeLog(LogLevel.ERROR, message, meta, error);
  }

  async warn(message: string, meta?: any): Promise<void> {
    await this.writeLog(LogLevel.WARN, message, meta);
  }

  async info(message: string, meta?: any): Promise<void> {
    await this.writeLog(LogLevel.INFO, message, meta);
  }

  async http(message: string, meta?: any): Promise<void> {
    await this.writeLog(LogLevel.HTTP, message, meta);
  }

  async debug(message: string, meta?: any): Promise<void> {
    await this.writeLog(LogLevel.DEBUG, message, meta);
  }

  // 구조화된 로깅 메서드들
  async logRequest(req: any, res: any, duration: number): Promise<void> {
    await this.http('HTTP Request', {
      req,
      res,
      duration,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
  }

  async logError(error: Error, context?: any): Promise<void> {
    await this.error(error.message, {
      ...context,
      errorName: error.name,
      stack: error.stack
    }, error);
  }

  async logSecurityEvent(event: string, details: any, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): Promise<void> {
    const logLevel = severity === 'HIGH' || severity === 'CRITICAL' ? LogLevel.ERROR : LogLevel.WARN;
    await this.writeLog(logLevel, `Security Event: ${event}`, {
      event,
      severity,
      details: sanitizeLogData(details)
    });
  }

  async logPerformance(operation: string, duration: number, meta?: any): Promise<void> {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;
    await this.writeLog(level, `Performance: ${operation}`, {
      operation,
      duration,
      ...meta
    });
  }

  async logBusinessEvent(event: string, details: any): Promise<void> {
    await this.info(`Business Event: ${event}`, {
      event,
      details: sanitizeLogData(details),
      labels: metricLabels
    });
  }
}

// 전역 logger 인스턴스
export const logger = new AdvancedLogger();

// 기존 인터페이스와의 호환성을 위한 간단한 logger
export const simpleLogger = {
  error: (message: string, data?: any) => logger.error(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  debug: (message: string, data?: any) => logger.debug(message, data)
};