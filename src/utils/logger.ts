/**
 * 로거 유틸리티
 */

export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export class Logger {
  private level: keyof LogLevel;

  constructor(level: keyof LogLevel = 'INFO') {
    this.level = level;
  }

  private shouldLog(level: keyof LogLevel): boolean {
    const levels: Record<keyof LogLevel, number> = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };

    return levels[level] <= levels[this.level];
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (data) {
      return `${baseMessage} ${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('INFO')) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('DEBUG')) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }
}

// 전역 logger 인스턴스
export const logger = new Logger(
  (process.env.LOG_LEVEL as keyof LogLevel) || 'INFO'
);