const fs = require('fs');
const path = require('path');
const util = require('util');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: this.getTimestamp(),
      level,
      message,
      ...meta,
      environment: process.env.NODE_ENV || 'development'
    });
  }

  writeToFile(level, message) {
    const date = new Date().toISOString().split('T')[0];
    const filename = `${level}-${date}.log`;
    const filepath = path.join(this.logDir, filename);
    
    fs.appendFileSync(filepath, message + '\n');
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output with color coding
    const colors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[37m',
      success: '\x1b[32m'
    };
    
    const resetColor = '\x1b[0m';
    const color = colors[level] || resetColor;
    
    console.log(`${color}[${level.toUpperCase()}]${resetColor} ${message}`);
    
    // Write to file in production
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile(level, formattedMessage);
    }
    
    // Send to monitoring service
    if (process.env.SENTRY_DSN && (level === 'error' || level === 'warn')) {
      this.sendToSentry(level, message, meta);
    }
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      errorMessage: error.message,
      stack: error.stack,
      ...meta
    } : meta;
    
    this.log('error', message, errorMeta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }

  success(message, meta = {}) {
    this.log('success', message, meta);
  }

  // HTTP request logging
  logRequest(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id
    };
    
    const level = res.statusCode >= 500 ? 'error' : 
                  res.statusCode >= 400 ? 'warn' : 'info';
    
    this.log(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, meta);
  }

  // Database query logging
  logQuery(query, params, duration) {
    if (process.env.NODE_ENV === 'development') {
      this.debug('Database Query', {
        query: query.substring(0, 200), // Truncate long queries
        params: params ? params.slice(0, 5) : [], // Limit params logged
        duration: `${duration}ms`
      });
    }
  }

  // Security event logging
  logSecurityEvent(event, details) {
    this.warn(`Security Event: ${event}`, {
      event,
      ...details,
      timestamp: this.getTimestamp()
    });
    
    // Alert admins for critical security events
    if (details.severity === 'critical') {
      this.alertAdmins(event, details);
    }
  }

  // Performance logging
  logPerformance(operation, duration, meta = {}) {
    const threshold = 1000; // 1 second
    
    if (duration > threshold) {
      this.warn(`Slow operation: ${operation}`, {
        operation,
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
        ...meta
      });
    } else {
      this.debug(`Performance: ${operation}`, {
        operation,
        duration: `${duration}ms`,
        ...meta
      });
    }
  }

  // User activity logging
  logUserActivity(userId, action, details = {}) {
    this.info(`User Activity: ${action}`, {
      userId,
      action,
      ...details
    });
  }

  // Payment transaction logging
  logPayment(transaction) {
    this.info('Payment Transaction', {
      transactionId: transaction.id,
      amount: transaction.amount,
      status: transaction.status,
      userId: transaction.userId,
      timestamp: this.getTimestamp()
    });
  }

  // Job matching logging
  logMatching(matchData) {
    this.info('Job Matching', {
      jobId: matchData.jobId,
      workerId: matchData.workerId,
      matchScore: matchData.score,
      timestamp: this.getTimestamp()
    });
  }

  // Cleanup old logs (run daily)
  cleanupOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    fs.readdirSync(this.logDir).forEach(file => {
      const filepath = path.join(this.logDir, file);
      const stats = fs.statSync(filepath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filepath);
        this.info(`Deleted old log file: ${file}`);
      }
    });
  }

  // Send to external monitoring service
  sendToSentry(level, message, meta) {
    // Implement Sentry integration here
    // const Sentry = require('@sentry/node');
    // Sentry.captureMessage(message, level);
  }

  // Alert administrators
  alertAdmins(event, details) {
    // Implement admin alerting (email, SMS, Slack, etc.)
    console.error(`🚨 ADMIN ALERT: ${event}`, details);
  }

  // Get log statistics
  getLogStats() {
    const stats = {
      errors: 0,
      warnings: 0,
      info: 0,
      totalSize: 0
    };
    
    if (fs.existsSync(this.logDir)) {
      fs.readdirSync(this.logDir).forEach(file => {
        const filepath = path.join(this.logDir, file);
        const fileStats = fs.statSync(filepath);
        stats.totalSize += fileStats.size;
        
        if (file.startsWith('error')) stats.errors++;
        else if (file.startsWith('warn')) stats.warnings++;
        else if (file.startsWith('info')) stats.info++;
      });
    }
    
    return stats;
  }
}

// Singleton instance
const logger = new Logger();

// Express middleware for request logging
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
  });
  
  next();
};

module.exports = { logger, requestLogger };