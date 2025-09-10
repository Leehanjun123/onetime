const RecommendationService = require('../src/services/recommendation');

// Mock dependencies
jest.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    job: {
      findMany: jest.fn()
    },
    jobApplication: {
      findMany: jest.fn()
    },
    workSession: {
      findMany: jest.fn()
    },
    review: {
      findMany: jest.fn()
    },
    savedJob: {
      findMany: jest.fn()
    }
  }
}));

jest.mock('../src/config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  delPattern: jest.fn()
}));

describe('RecommendationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateJobScore', () => {
    it('should calculate job score correctly', () => {
      const job = {
        category: 'DELIVERY',
        location: '서울 강남구',
        wage: 15000,
        urgent: true,
        employer: {
          rating: 4.5
        },
        _count: {
          applications: 2
        }
      };

      const userProfile = {
        preferences: {
          categories: [
            { category: 'DELIVERY', score: 0.8 },
            { category: 'LOGISTICS', score: 0.5 }
          ],
          locations: [
            { location: '서울 강남구', score: 0.9 },
            { location: '서울 서초구', score: 0.6 }
          ],
          wageRange: {
            min: 10000,
            max: 20000,
            avg: 15000
          }
        }
      };

      const preferences = {};

      const score = RecommendationService.calculateJobScore(job, userProfile, preferences);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should give bonus for urgent jobs', () => {
      const urgentJob = {
        category: 'DELIVERY',
        location: '서울',
        wage: 15000,
        urgent: true,
        employer: { rating: 4 },
        _count: { applications: 0 }
      };

      const normalJob = {
        ...urgentJob,
        urgent: false
      };

      const userProfile = {
        preferences: {
          categories: [],
          locations: [],
          wageRange: { min: 10000, max: 20000, avg: 15000 }
        }
      };

      const urgentScore = RecommendationService.calculateJobScore(urgentJob, userProfile, {});
      const normalScore = RecommendationService.calculateJobScore(normalJob, userProfile, {});

      expect(urgentScore).toBeGreaterThan(normalScore);
    });
  });

  describe('analyzeCategoryPreferences', () => {
    it('should analyze category preferences from applications', () => {
      const applications = [
        { job: { category: 'DELIVERY' } },
        { job: { category: 'DELIVERY' } },
        { job: { category: 'LOGISTICS' } },
        { job: { category: 'CLEANING' } }
      ];

      const preferences = RecommendationService.analyzeCategoryPreferences(applications);

      expect(preferences[0].category).toBe('DELIVERY');
      expect(preferences[0].count).toBe(2);
      expect(preferences[0].score).toBe(0.5); // 2/4
    });

    it('should handle empty applications', () => {
      const preferences = RecommendationService.analyzeCategoryPreferences([]);
      
      expect(preferences).toEqual([]);
    });
  });

  describe('analyzeWagePreferences', () => {
    it('should calculate wage statistics', () => {
      const applications = [
        { job: { wage: 10000 } },
        { job: { wage: 15000 } },
        { job: { wage: 20000 } }
      ];

      const wagePrefs = RecommendationService.analyzeWagePreferences(applications);

      expect(wagePrefs.min).toBe(10000);
      expect(wagePrefs.max).toBe(20000);
      expect(wagePrefs.avg).toBe(15000);
    });

    it('should return defaults for empty data', () => {
      const wagePrefs = RecommendationService.analyzeWagePreferences([]);

      expect(wagePrefs.min).toBe(10000);
      expect(wagePrefs.max).toBe(30000);
      expect(wagePrefs.avg).toBe(15000);
    });
  });

  describe('generateRecommendationReason', () => {
    it('should generate appropriate reasons', () => {
      const matchDetails = {
        categoryMatch: 0.9,
        locationMatch: 0.8,
        wageMatch: 0.9,
        ratingMatch: 0.9,
        isUrgent: true,
        competitionLevel: 1
      };

      const reasons = RecommendationService.generateRecommendationReason(matchDetails);

      expect(reasons).toContain('선호하시는 카테고리의 일자리입니다');
      expect(reasons).toContain('선호 지역과 가까운 위치입니다');
      expect(reasons).toContain('적정 임금 수준입니다');
      expect(reasons).toContain('높은 평점의 고용주입니다');
      expect(reasons).toContain('긴급 채용으로 빠른 매칭이 가능합니다');
      expect(reasons).toContain('경쟁률이 낮습니다');
    });

    it('should provide default reason when no specific matches', () => {
      const matchDetails = {
        categoryMatch: 0.3,
        locationMatch: 0.3,
        wageMatch: 0.3,
        ratingMatch: 0.3,
        isUrgent: false,
        competitionLevel: 10
      };

      const reasons = RecommendationService.generateRecommendationReason(matchDetails);

      expect(reasons).toContain('회원님께 적합한 일자리입니다');
    });
  });

  describe('analyzeActivityPattern', () => {
    it('should analyze work patterns', () => {
      const applications = [
        { job: { workDate: new Date('2025-01-10 09:00') } }, // Friday
        { job: { workDate: new Date('2025-01-10 09:00') } }, // Friday
        { job: { workDate: new Date('2025-01-11 14:00') } }, // Saturday
        { job: { workDate: new Date('2025-01-12 10:00') } }  // Sunday
      ];

      const pattern = RecommendationService.analyzeActivityPattern(applications);

      expect(pattern.preferredDays).toBeDefined();
      expect(pattern.preferredHours).toBeDefined();
      expect(pattern.preferredDays.length).toBeGreaterThan(0);
    });
  });
});