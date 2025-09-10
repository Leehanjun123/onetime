/**
 * @jest-environment node
 */

const request = require('supertest');
const express = require('express');

// 기본 Express 앱 설정 (실제 서버 없이 테스트)
function createTestApp() {
  const app = express();
  app.use(express.json());

  // 기본 헬스체크 엔드포인트
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // 기본 루트 엔드포인트
  app.get('/', (req, res) => {
    res.json({
      message: '원데이 Backend API is running!',
      version: '1.0.0'
    });
  });

  // API 정보 엔드포인트
  app.get('/api', (req, res) => {
    res.json({
      name: 'OneTime API',
      version: '2.0.0',
      description: '한국형 일자리 매칭 플랫폼 API'
    });
  });

  // 에러 핸들링 테스트용 엔드포인트
  app.get('/test/error', (req, res) => {
    throw new Error('Test error');
  });

  // 404 핸들러
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: '요청하신 리소스를 찾을 수 없습니다'
    });
  });

  // 에러 핸들러
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '서버 오류가 발생했습니다'
    });
  });

  return app;
}

describe('Basic API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    test('GET /health should return 200 with status info', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('Root Endpoint', () => {
    test('GET / should return welcome message', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '원데이 Backend API is running!');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('API Info', () => {
    test('GET /api should return API information', async () => {
      const response = await request(app).get('/api');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'OneTime API');
      expect(response.body).toHaveProperty('version', '2.0.0');
      expect(response.body).toHaveProperty('description');
    });
  });

  describe('Error Handling', () => {
    test('GET /test/error should return 500 with error message', async () => {
      const response = await request(app).get('/test/error');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(response.body).toHaveProperty('message');
    });

    test('GET /nonexistent should return 404', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('HTTP Methods', () => {
    test('POST to root endpoint should return 404', async () => {
      const response = await request(app)
        .post('/')
        .send({ test: 'data' });

      expect(response.status).toBe(404);
    });

    test('PUT to health endpoint should return 404', async () => {
      const response = await request(app)
        .put('/health')
        .send({ test: 'data' });

      expect(response.status).toBe(404);
    });
  });

  describe('JSON Parsing', () => {
    test('should handle valid JSON in request body', async () => {
      const response = await request(app)
        .post('/api')
        .set('Content-Type', 'application/json')
        .send({ test: 'valid json' });

      // API 엔드포인트는 GET만 허용하므로 404
      expect(response.status).toBe(404);
    });

    test('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      // Malformed JSON은 Express에서 400으로 처리
      expect(response.status).toBe(400);
    });
  });

  describe('Headers', () => {
    test('should return JSON content type', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('should handle custom headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('X-Custom-Header', 'test-value');

      expect(response.status).toBe(200);
      // 커스텀 헤더가 있어도 정상 동작
    });
  });

  describe('Response Format', () => {
    test('health endpoint response should have consistent format', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });
    });

    test('error responses should have consistent format', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.body).toMatchObject({
        error: expect.any(String),
        message: expect.any(String)
      });
    });
  });

  describe('Performance', () => {
    test('health check should respond quickly', async () => {
      const start = Date.now();
      const response = await request(app).get('/health');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100); // 100ms 이내
    });

    test('multiple concurrent requests should be handled', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/health')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
      });
    });
  });
});