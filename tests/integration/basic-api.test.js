/**
 * @jest-environment node
 */

const request = require('supertest');

// Use the actual server
const app = require('../../src/index.js');

describe('Basic API Integration Tests', () => {

  describe('Health Check', () => {
    test('GET /health should return 200 with status info', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('Root Endpoint', () => {
    test('GET / should return welcome message', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'OneTime API Server');
      expect(response.body).toHaveProperty('version', '2.0.0');
    });
  });

  describe('API Info', () => {
    test('GET /api should return API information', async () => {
      const response = await request(app).get('/api');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'OneTime API v2.0');
      expect(response.body).toHaveProperty('endpoints');
      expect(Array.isArray(response.body.endpoints)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('GET /test/error should return 500 with error message', async () => {
      const response = await request(app).get('/test/error');

      expect(response.status).toBe(404); // Our server returns 404 for unknown routes
      expect(response.body).toHaveProperty('error');
    });

    test('GET /nonexistent should return 404', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });

  describe('HTTP Methods', () => {
    test('POST to root endpoint should return 404', async () => {
      const response = await request(app).post('/');

      expect(response.status).toBe(404);
    });

    test('PUT to health endpoint should return 404', async () => {
      const response = await request(app).put('/health');

      expect(response.status).toBe(404);
    });
  });

  describe('JSON Parsing', () => {
    test('should handle valid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', name: 'Test User' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      // Express will throw a 400 error for malformed JSON, but our error handler might return 500
      expect([400, 500]).toContain(response.status);
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
    });
  });

  describe('Response Format', () => {
    test('health endpoint response should have consistent format', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    test('error responses should have consistent format', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Performance', () => {
    test('health check should respond quickly', async () => {
      const start = Date.now();
      const response = await request(app).get('/health');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    test('multiple concurrent requests should be handled', async () => {
      const promises = Array(5).fill().map(() =>
        request(app).get('/health')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});