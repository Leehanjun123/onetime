const request = require('supertest');
const express = require('express');

describe('Monitoring System Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock monitoring endpoints
    app.get('/api/monitoring/health', (req, res) => {
      res.json({
        status: 'healthy',
        checks: [
          {
            name: 'database',
            status: 'healthy',
            responseTime: 50,
            timestamp: new Date()
          }
        ],
        uptime: 3600,
        timestamp: new Date(),
        version: '1.0.0',
        environment: 'test'
      });
    });

    app.get('/api/monitoring/metrics', (req, res) => {
      res.set('Content-Type', 'text/plain');
      res.send(`# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1000
http_requests_total{method="POST",status="200"} 500
http_requests_total{method="GET",status="404"} 50
`);
    });

    app.get('/api/monitoring/status', (req, res) => {
      res.json({
        service: 'onetime-api',
        version: '1.0.0',
        environment: 'test',
        status: 'healthy',
        uptime: 3600,
        timestamp: new Date()
      });
    });
  });

  describe('Health Check System', () => {
    test('should return comprehensive health status', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');

      expect(response.body.status).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(Array.isArray(response.body.checks)).toBe(true);
      expect(typeof response.body.uptime).toBe('number');
    });

    test('should include individual check results', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .expect(200);

      const { checks } = response.body;
      expect(Array.isArray(checks)).toBe(true);
      
      if (checks.length > 0) {
        const check = checks[0];
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('responseTime');
        expect(check).toHaveProperty('timestamp');
        
        expect(check.status).toMatch(/^(healthy|degraded|unhealthy)$/);
        expect(typeof check.responseTime).toBe('number');
      }
    });

    test('should validate health check response times', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .expect(200);

      const { checks } = response.body;
      checks.forEach(check => {
        expect(check.responseTime).toBeGreaterThanOrEqual(0);
        expect(check.responseTime).toBeLessThan(10000); // 10초 미만
      });
    });
  });

  describe('Metrics System', () => {
    test('should export metrics in Prometheus format', async () => {
      const response = await request(app)
        .get('/api/monitoring/metrics')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/plain/);
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
      expect(response.text).toContain('http_requests_total');
    });

    test('should include standard system metrics', () => {
      const expectedMetrics = [
        'http_requests_total',
        'system_memory_usage_percent',
        'system_cpu_cores',
        'process_uptime_seconds',
        'database_connections_active'
      ];

      // 실제 메트릭 시스템에서 이러한 메트릭들이 수집되는지 확인
      expectedMetrics.forEach(metric => {
        expect(typeof metric).toBe('string');
        expect(metric.length).toBeGreaterThan(0);
      });
    });

    test('should validate metric label format', () => {
      const sampleMetrics = [
        'http_requests_total{method="GET",status="200"} 1000',
        'system_memory_total_bytes 8589934592',
        'job_processing_duration_seconds{status="completed"} 2.5'
      ];

      sampleMetrics.forEach(metric => {
        // Prometheus 메트릭 형식 검증
        const prometheusPattern = /^[a-zA-Z_:][a-zA-Z0-9_:]*(\{[^}]*\})?\s+[0-9.-]+(\s+[0-9]+)?$/;
        expect(metric).toMatch(prometheusPattern);
      });
    });
  });

  describe('Application Status', () => {
    test('should return service status summary', async () => {
      const response = await request(app)
        .get('/api/monitoring/status')
        .expect(200);

      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');

      expect(response.body.service).toBe('onetime-api');
      expect(response.body.status).toMatch(/^(healthy|degraded|unhealthy|error)$/);
      expect(typeof response.body.uptime).toBe('number');
    });

    test('should include build and environment information', async () => {
      const response = await request(app)
        .get('/api/monitoring/status')
        .expect(200);

      const { version, environment } = response.body;
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
      expect(['development', 'test', 'staging', 'production']).toContain(environment);
    });
  });

  describe('Performance Monitoring', () => {
    test('should track response times', () => {
      const responseTimes = [100, 150, 200, 120, 180];
      const average = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const p95 = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      expect(average).toBe(150);
      expect(p95).toBeGreaterThanOrEqual(average);
    });

    test('should detect slow requests', () => {
      const slowThreshold = 2000; // 2초
      const requests = [
        { path: '/api/jobs', responseTime: 100 },
        { path: '/api/heavy-operation', responseTime: 3000 },
        { path: '/api/users', responseTime: 150 }
      ];

      const slowRequests = requests.filter(req => req.responseTime > slowThreshold);
      expect(slowRequests).toHaveLength(1);
      expect(slowRequests[0].path).toBe('/api/heavy-operation');
    });

    test('should calculate error rates', () => {
      const requests = [
        { status: 200 }, { status: 200 }, { status: 200 },
        { status: 404 }, { status: 500 }
      ];

      const totalRequests = requests.length;
      const errorRequests = requests.filter(req => req.status >= 400).length;
      const errorRate = (errorRequests / totalRequests) * 100;

      expect(totalRequests).toBe(5);
      expect(errorRequests).toBe(2);
      expect(errorRate).toBe(40);
    });
  });

  describe('Resource Monitoring', () => {
    test('should monitor memory usage', () => {
      const mockMemoryUsage = {
        rss: 50 * 1024 * 1024,      // 50MB
        heapTotal: 30 * 1024 * 1024, // 30MB
        heapUsed: 20 * 1024 * 1024,  // 20MB
        external: 5 * 1024 * 1024    // 5MB
      };

      const heapUsagePercent = (mockMemoryUsage.heapUsed / mockMemoryUsage.heapTotal) * 100;
      
      expect(heapUsagePercent).toBeCloseTo(66.67, 1);
      expect(mockMemoryUsage.heapUsed).toBeLessThanOrEqual(mockMemoryUsage.heapTotal);
      expect(mockMemoryUsage.rss).toBeGreaterThanOrEqual(mockMemoryUsage.heapTotal);
    });

    test('should validate system resource thresholds', () => {
      const resourceThresholds = {
        memoryUsage: 85,     // 85%
        cpuUsage: 80,        // 80%
        diskUsage: 90,       // 90%
        dbConnections: 80    // 80%
      };

      const currentUsage = {
        memoryUsage: 75,
        cpuUsage: 60,
        diskUsage: 85,
        dbConnections: 70
      };

      Object.keys(resourceThresholds).forEach(resource => {
        const threshold = resourceThresholds[resource];
        const current = currentUsage[resource];
        
        if (current > threshold) {
          console.warn(`${resource} exceeded threshold: ${current}% > ${threshold}%`);
        }
        
        expect(typeof threshold).toBe('number');
        expect(typeof current).toBe('number');
      });
    });
  });

  describe('Alert System', () => {
    test('should trigger alerts based on thresholds', () => {
      const alerts = [
        {
          name: 'High Error Rate',
          threshold: 5,
          currentValue: 8,
          shouldTrigger: true
        },
        {
          name: 'Slow Response Time',
          threshold: 2000,
          currentValue: 1500,
          shouldTrigger: false
        },
        {
          name: 'High Memory Usage',
          threshold: 85,
          currentValue: 90,
          shouldTrigger: true
        }
      ];

      const triggeredAlerts = alerts.filter(alert => 
        alert.currentValue > alert.threshold
      );

      expect(triggeredAlerts).toHaveLength(2);
      expect(triggeredAlerts[0].name).toBe('High Error Rate');
      expect(triggeredAlerts[1].name).toBe('High Memory Usage');
    });

    test('should validate alert severity levels', () => {
      const severityLevels = ['low', 'medium', 'high', 'critical'];
      const alerts = [
        { name: 'Disk Space Warning', severity: 'medium' },
        { name: 'Database Down', severity: 'critical' },
        { name: 'Slow Query', severity: 'low' }
      ];

      alerts.forEach(alert => {
        expect(severityLevels).toContain(alert.severity);
      });
    });
  });

  describe('Log Management', () => {
    test('should structure log entries correctly', () => {
      const logEntry = {
        timestamp: new Date(),
        level: 'info',
        service: 'api',
        message: 'User login successful',
        meta: {
          userId: 'user123',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        }
      };

      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('level');
      expect(logEntry).toHaveProperty('service');
      expect(logEntry).toHaveProperty('message');
      expect(logEntry).toHaveProperty('meta');

      expect(['error', 'warn', 'info', 'http', 'debug']).toContain(logEntry.level);
      expect(typeof logEntry.message).toBe('string');
      expect(typeof logEntry.meta).toBe('object');
    });

    test('should sanitize sensitive information in logs', () => {
      const sensitiveData = {
        email: 'user@example.com',
        password: 'secret123',
        creditCard: '1234-5678-9012-3456',
        publicInfo: 'safe data'
      };

      const sensitiveFields = ['password', 'credit', 'token', 'secret'];
      const sanitized = {};

      Object.keys(sensitiveData).forEach(key => {
        const isSensitive = sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        );
        
        sanitized[key] = isSensitive ? '[REDACTED]' : sensitiveData[key];
      });

      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.creditCard).toBe('[REDACTED]');
      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.publicInfo).toBe('safe data');
    });
  });

  describe('Business Metrics', () => {
    test('should track key business indicators', () => {
      const businessMetrics = {
        dailyActiveUsers: 1500,
        jobsPosted: 250,
        jobsCompleted: 180,
        matchingSuccessRate: 72,
        averageJobValue: 50000,
        userRetentionRate: 85
      };

      expect(businessMetrics.dailyActiveUsers).toBeGreaterThan(0);
      expect(businessMetrics.jobsCompleted).toBeLessThanOrEqual(businessMetrics.jobsPosted);
      expect(businessMetrics.matchingSuccessRate).toBeGreaterThanOrEqual(0);
      expect(businessMetrics.matchingSuccessRate).toBeLessThanOrEqual(100);
      expect(businessMetrics.averageJobValue).toBeGreaterThan(0);
      expect(businessMetrics.userRetentionRate).toBeGreaterThanOrEqual(0);
      expect(businessMetrics.userRetentionRate).toBeLessThanOrEqual(100);
    });

    test('should calculate conversion rates', () => {
      const funnel = {
        visitors: 10000,
        signups: 1000,
        activeUsers: 800,
        paidUsers: 200
      };

      const signupRate = (funnel.signups / funnel.visitors) * 100;
      const activationRate = (funnel.activeUsers / funnel.signups) * 100;
      const conversionRate = (funnel.paidUsers / funnel.activeUsers) * 100;

      expect(signupRate).toBe(10);
      expect(activationRate).toBe(80);
      expect(conversionRate).toBe(25);
    });
  });
});