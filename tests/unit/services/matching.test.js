/**
 * @jest-environment node
 */

const MatchingService = require('../../../src/services/matching');

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    job: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    application: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    $disconnect: jest.fn()
  }))
}));

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('MatchingService', () => {
  let matchingService;

  beforeEach(() => {
    matchingService = new MatchingService();
    jest.clearAllMocks();
  });

  describe('calculateMatchScore', () => {
    const mockWorker = {
      id: 'worker-id',
      name: 'Test Worker',
      location: '서울특별시 강남구',
      skills: ['JavaScript', 'React'],
      rating: 4.5,
      applications: [
        {
          job: {
            category: 'IT',
            location: '서울특별시 강남구'
          }
        },
        {
          job: {
            category: 'IT',
            location: '서울특별시 서초구'
          }
        },
        {
          job: {
            category: 'Marketing',
            location: '서울특별시 강남구'
          }
        }
      ]
    };

    const mockJob = {
      id: 'job-id',
      title: 'Frontend Developer',
      category: 'IT',
      location: '서울특별시 강남구',
      wage: 50000,
      workDate: new Date('2024-12-31'),
      employer: {
        rating: 4.8
      }
    };

    test('should calculate match score for valid worker and job', async () => {
      prisma.user.findUnique.mockResolvedValue(mockWorker);
      prisma.job.findUnique.mockResolvedValue(mockJob);

      const score = await matchingService.calculateMatchScore('worker-id', 'job-id');

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'worker-id' },
        include: {
          applications: {
            include: {
              job: {
                select: { category: true, location: true }
              }
            },
            take: 20
          }
        }
      });
      expect(prisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-id' },
        include: {
          employer: {
            select: { rating: true }
          }
        }
      });
    });

    test('should return 0 for non-existent worker', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.job.findUnique.mockResolvedValue(mockJob);

      const score = await matchingService.calculateMatchScore('invalid-worker', 'job-id');

      expect(score).toBe(0);
    });

    test('should return 0 for non-existent job', async () => {
      prisma.user.findUnique.mockResolvedValue(mockWorker);
      prisma.job.findUnique.mockResolvedValue(null);

      const score = await matchingService.calculateMatchScore('worker-id', 'invalid-job');

      expect(score).toBe(0);
    });

    test('should handle worker with no application history', async () => {
      const workerWithoutHistory = {
        ...mockWorker,
        applications: []
      };

      prisma.user.findUnique.mockResolvedValue(workerWithoutHistory);
      prisma.job.findUnique.mockResolvedValue(mockJob);

      const score = await matchingService.calculateMatchScore('worker-id', 'job-id');

      expect(score).toBeGreaterThanOrEqual(0);
      // 경험이 없어도 다른 요소들(위치, 고용주 평점 등)로 점수가 있을 수 있음
    });

    test('should give higher score for matching category experience', async () => {
      const itWorker = {
        ...mockWorker,
        applications: [
          { job: { category: 'IT', location: '서울특별시' } },
          { job: { category: 'IT', location: '서울특별시' } },
          { job: { category: 'IT', location: '서울특별시' } }
        ]
      };

      const nonItWorker = {
        ...mockWorker,
        applications: [
          { job: { category: 'Marketing', location: '서울특별시' } },
          { job: { category: 'Sales', location: '서울특별시' } },
          { job: { category: 'Design', location: '서울특별시' } }
        ]
      };

      prisma.job.findUnique.mockResolvedValue(mockJob);

      // IT 경험이 있는 근로자
      prisma.user.findUnique.mockResolvedValueOnce(itWorker);
      const itScore = await matchingService.calculateMatchScore('it-worker', 'job-id');

      // IT 경험이 없는 근로자
      prisma.user.findUnique.mockResolvedValueOnce(nonItWorker);
      const nonItScore = await matchingService.calculateMatchScore('non-it-worker', 'job-id');

      expect(itScore).toBeGreaterThan(nonItScore);
    });

    test('should handle database errors gracefully', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const score = await matchingService.calculateMatchScore('worker-id', 'job-id');

      expect(score).toBe(0);
    });
  });

  describe('findMatchingJobs', () => {
    const mockJobs = [
      {
        id: 'job-1',
        title: 'Frontend Developer',
        category: 'IT',
        location: '서울특별시 강남구',
        wage: 50000,
        matchScore: 85
      },
      {
        id: 'job-2',
        title: 'Backend Developer',
        category: 'IT',
        location: '서울특별시 서초구',
        wage: 55000,
        matchScore: 78
      }
    ];

    test('should find matching jobs for a worker', async () => {
      prisma.job.findMany.mockResolvedValue(mockJobs);
      // calculateMatchScore를 모킹
      jest.spyOn(matchingService, 'calculateMatchScore')
        .mockResolvedValueOnce(85)
        .mockResolvedValueOnce(78);

      const result = await matchingService.findMatchingJobs('worker-id', {
        limit: 10,
        minScore: 70
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('matchScore', 85);
      expect(result[1]).toHaveProperty('matchScore', 78);
      expect(result[0].matchScore).toBeGreaterThanOrEqual(result[1].matchScore); // 내림차순 정렬
    });

    test('should filter jobs by minimum score', async () => {
      prisma.job.findMany.mockResolvedValue(mockJobs);
      jest.spyOn(matchingService, 'calculateMatchScore')
        .mockResolvedValueOnce(85)
        .mockResolvedValueOnce(65); // 낮은 점수

      const result = await matchingService.findMatchingJobs('worker-id', {
        limit: 10,
        minScore: 70
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('matchScore', 85);
    });

    test('should limit number of results', async () => {
      const manyJobs = Array.from({ length: 20 }, (_, i) => ({
        id: `job-${i}`,
        title: `Job ${i}`,
        category: 'IT',
        location: '서울특별시',
        wage: 50000
      }));

      prisma.job.findMany.mockResolvedValue(manyJobs);
      jest.spyOn(matchingService, 'calculateMatchScore')
        .mockImplementation(() => Promise.resolve(80));

      const result = await matchingService.findMatchingJobs('worker-id', {
        limit: 5,
        minScore: 0
      });

      expect(result.length).toBeLessThanOrEqual(5);
    });

    test('should handle empty job results', async () => {
      prisma.job.findMany.mockResolvedValue([]);

      const result = await matchingService.findMatchingJobs('worker-id', {
        limit: 10,
        minScore: 70
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('findMatchingWorkers', () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        name: 'John Doe',
        email: 'john@example.com',
        location: '서울특별시 강남구',
        skills: ['JavaScript', 'React']
      },
      {
        id: 'worker-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        location: '서울특별시 서초구',
        skills: ['Python', 'Django']
      }
    ];

    test('should find matching workers for a job', async () => {
      prisma.user.findMany.mockResolvedValue(mockWorkers);
      jest.spyOn(matchingService, 'calculateMatchScore')
        .mockResolvedValueOnce(88)
        .mockResolvedValueOnce(72);

      const result = await matchingService.findMatchingWorkers('job-id', {
        limit: 10,
        minScore: 70
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('matchScore', 88);
      expect(result[1]).toHaveProperty('matchScore', 72);
      expect(result[0].matchScore).toBeGreaterThanOrEqual(result[1].matchScore);
    });

    test('should filter workers by minimum score', async () => {
      prisma.user.findMany.mockResolvedValue(mockWorkers);
      jest.spyOn(matchingService, 'calculateMatchScore')
        .mockResolvedValueOnce(88)
        .mockResolvedValueOnce(65); // 낮은 점수

      const result = await matchingService.findMatchingWorkers('job-id', {
        limit: 10,
        minScore: 70
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('matchScore', 88);
    });

    test('should not include sensitive user data', async () => {
      const workersWithSensitiveData = mockWorkers.map(worker => ({
        ...worker,
        password: 'hashed-password',
        resetPasswordToken: 'secret-token'
      }));

      prisma.user.findMany.mockResolvedValue(workersWithSensitiveData);
      jest.spyOn(matchingService, 'calculateMatchScore')
        .mockResolvedValue(80);

      const result = await matchingService.findMatchingWorkers('job-id', {
        limit: 10,
        minScore: 70
      });

      result.forEach(worker => {
        expect(worker).not.toHaveProperty('password');
        expect(worker).not.toHaveProperty('resetPasswordToken');
      });
    });
  });

  describe('helper methods', () => {
    test('getFrequency should count item occurrences', () => {
      const items = ['IT', 'IT', 'Marketing', 'IT', 'Sales'];
      const frequency = matchingService.getFrequency(items);

      expect(frequency).toEqual({
        'IT': 3,
        'Marketing': 1,
        'Sales': 1
      });
    });

    test('getFrequency should handle empty array', () => {
      const frequency = matchingService.getFrequency([]);
      expect(frequency).toEqual({});
    });

    test('calculateDistance should return reasonable distance', () => {
      // 서울 강남구와 서초구는 인접한 지역
      const distance = matchingService.calculateDistance(
        '서울특별시 강남구',
        '서울특별시 서초구'
      );

      expect(distance).toBeGreaterThanOrEqual(0);
      expect(distance).toBeLessThan(100); // 100km 이내
    });

    test('calculateDistance should handle same location', () => {
      const distance = matchingService.calculateDistance(
        '서울특별시 강남구',
        '서울특별시 강남구'
      );

      expect(distance).toBe(0);
    });
  });

  describe('error handling', () => {
    test('should handle prisma connection errors', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Connection timeout'));
      prisma.job.findUnique.mockResolvedValue({});

      const score = await matchingService.calculateMatchScore('worker-id', 'job-id');

      expect(score).toBe(0);
    });

    test('should handle invalid input gracefully', async () => {
      const score = await matchingService.calculateMatchScore(null, null);
      expect(score).toBe(0);

      const score2 = await matchingService.calculateMatchScore('', '');
      expect(score2).toBe(0);
    });
  });
});