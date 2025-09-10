const express = require('express');
const { query, validationResult } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const ElasticsearchService = require('../services/ElasticsearchService');
const logger = require('../utils/logger');

const router = express.Router();
const elasticsearchService = new ElasticsearchService();

// 일자리 검색
router.get('/jobs',
  optionalAuth, // 로그인 선택사항
  [
    query('q').optional().isLength({ max: 100 }).withMessage('검색어는 100자를 초과할 수 없습니다'),
    query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('제한은 1-50 사이여야 합니다'),
    query('category').optional().isIn([
      'CONSTRUCTION', 'INTERIOR', 'LOGISTICS', 'FACTORY', 'CLEANING', 'DELIVERY'
    ]).withMessage('유효하지 않은 카테고리입니다'),
    query('location').optional().isLength({ max: 50 }),
    query('minWage').optional().isInt({ min: 0 }),
    query('maxWage').optional().isInt({ min: 0 }),
    query('workDate').optional().isISO8601(),
    query('sortBy').optional().isIn([
      'relevance', 'wage_desc', 'wage_asc', 'date_desc', 'date_asc', 'work_date', 'distance'
    ]),
    query('urgent').optional().isBoolean(),
    query('radius').optional().isInt({ min: 1, max: 100 }),
    query('lat').optional().isFloat({ min: -90, max: 90 }),
    query('lng').optional().isFloat({ min: -180, max: 180 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '검색 매개변수가 올바르지 않습니다',
          errors: errors.array()
        });
      }

      const {
        q: query = '',
        page = 1,
        limit = 20,
        category,
        location,
        minWage,
        maxWage,
        workDate,
        sortBy = 'relevance',
        urgent,
        radius = 10,
        lat,
        lng
      } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        category,
        location,
        minWage: minWage ? parseInt(minWage) : undefined,
        maxWage: maxWage ? parseInt(maxWage) : undefined,
        workDate,
        urgent: urgent === 'true',
        radius: parseInt(radius),
        geoLocation: (lat && lng) ? { lat: parseFloat(lat), lon: parseFloat(lng) } : undefined
      };

      const result = await elasticsearchService.searchJobs(query, filters);

      res.json({
        success: true,
        message: '일자리 검색이 완료되었습니다',
        data: {
          jobs: result.jobs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(limit))
          },
          meta: {
            maxScore: result.maxScore,
            took: result.took
          }
        }
      });
    } catch (error) {
      logger.error('Job search error:', error);
      res.status(500).json({
        success: false,
        message: '일자리 검색 중 오류가 발생했습니다'
      });
    }
  }
);

// 일자리 자동완성 검색
router.get('/jobs/suggest',
  [
    query('q').notEmpty().withMessage('검색어는 필수입니다').isLength({ max: 50 }),
    query('limit').optional().isInt({ min: 1, max: 10 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '검색 매개변수가 올바르지 않습니다',
          errors: errors.array()
        });
      }

      const { q: query, limit = 5 } = req.query;
      const suggestions = await elasticsearchService.suggestJobs(query, parseInt(limit));

      res.json({
        success: true,
        message: '자동완성 검색이 완료되었습니다',
        data: {
          suggestions,
          query
        }
      });
    } catch (error) {
      logger.error('Job suggestion error:', error);
      res.status(500).json({
        success: false,
        message: '자동완성 검색 중 오류가 발생했습니다'
      });
    }
  }
);

// 사용자 검색 (관리자만)
router.get('/users',
  authenticateToken,
  [
    query('q').optional().isLength({ max: 100 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('userType').optional().isIn(['WORKER', 'EMPLOYER', 'ADMIN'])
  ],
  async (req, res) => {
    try {
      // 관리자 권한 확인
      if (req.user.userType !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: '관리자만 사용자 검색이 가능합니다'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '검색 매개변수가 올바르지 않습니다',
          errors: errors.array()
        });
      }

      const {
        q: query = '',
        page = 1,
        limit = 20,
        userType
      } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        userType
      };

      const result = await elasticsearchService.searchUsers(query, filters);

      res.json({
        success: true,
        message: '사용자 검색이 완료되었습니다',
        data: {
          users: result.users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('User search error:', error);
      res.status(500).json({
        success: false,
        message: '사용자 검색 중 오류가 발생했습니다'
      });
    }
  }
);

// 검색 통계 (관리자만)
router.get('/stats',
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.userType !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: '관리자만 검색 통계를 조회할 수 있습니다'
        });
      }

      const stats = await elasticsearchService.getIndexStats();

      if (!stats) {
        return res.status(503).json({
          success: false,
          message: 'Elasticsearch 연결에 실패했습니다'
        });
      }

      res.json({
        success: true,
        message: '검색 통계를 성공적으로 조회했습니다',
        data: {
          indices: stats,
          isConnected: elasticsearchService.isConnected
        }
      });
    } catch (error) {
      logger.error('Search stats error:', error);
      res.status(500).json({
        success: false,
        message: '검색 통계 조회 중 오류가 발생했습니다'
      });
    }
  }
);

// 전체 재인덱싱 (관리자만)
router.post('/reindex',
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.userType !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: '관리자만 재인덱싱이 가능합니다'
        });
      }

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const success = await elasticsearchService.reindexAllJobs(prisma);
      await prisma.$disconnect();

      if (success) {
        res.json({
          success: true,
          message: '재인덱싱이 완료되었습니다'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '재인덱싱에 실패했습니다'
        });
      }
    } catch (error) {
      logger.error('Reindexing error:', error);
      res.status(500).json({
        success: false,
        message: '재인덱싱 중 오류가 발생했습니다'
      });
    }
  }
);

// 인기 검색어 (캐시된 결과 반환)
router.get('/popular-keywords',
  async (req, res) => {
    try {
      // 실제 환경에서는 Redis에서 가져오거나 별도 로그 분석 결과 사용
      const popularKeywords = [
        { keyword: '카페', count: 1250 },
        { keyword: '배달', count: 980 },
        { keyword: '청소', count: 850 },
        { keyword: '공장', count: 720 },
        { keyword: '포장', count: 680 },
        { keyword: '단기', count: 620 },
        { keyword: '주말', count: 580 },
        { keyword: '야간', count: 520 },
        { keyword: '서빙', count: 480 },
        { keyword: '건설', count: 450 }
      ];

      res.json({
        success: true,
        message: '인기 검색어를 성공적으로 조회했습니다',
        data: {
          keywords: popularKeywords,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Popular keywords error:', error);
      res.status(500).json({
        success: false,
        message: '인기 검색어 조회 중 오류가 발생했습니다'
      });
    }
  }
);

// 검색 필터 옵션
router.get('/filter-options',
  async (req, res) => {
    try {
      const filterOptions = {
        categories: [
          { value: 'CONSTRUCTION', label: '건설/토목', count: 150 },
          { value: 'INTERIOR', label: '인테리어', count: 89 },
          { value: 'LOGISTICS', label: '물류/배송', count: 230 },
          { value: 'FACTORY', label: '공장/제조', count: 180 },
          { value: 'CLEANING', label: '청소', count: 95 },
          { value: 'DELIVERY', label: '배달', count: 320 }
        ],
        locations: [
          { value: '서울', label: '서울', count: 450 },
          { value: '경기', label: '경기도', count: 320 },
          { value: '인천', label: '인천', count: 150 },
          { value: '부산', label: '부산', count: 200 },
          { value: '대구', label: '대구', count: 120 },
          { value: '대전', label: '대전', count: 110 }
        ],
        wageRanges: [
          { value: '0-10000', label: '10,000원 이하', count: 50 },
          { value: '10000-15000', label: '10,000원 - 15,000원', count: 280 },
          { value: '15000-20000', label: '15,000원 - 20,000원', count: 450 },
          { value: '20000-25000', label: '20,000원 - 25,000원', count: 320 },
          { value: '25000-30000', label: '25,000원 - 30,000원', count: 180 },
          { value: '30000-', label: '30,000원 이상', count: 85 }
        ]
      };

      res.json({
        success: true,
        message: '검색 필터 옵션을 성공적으로 조회했습니다',
        data: filterOptions
      });
    } catch (error) {
      logger.error('Filter options error:', error);
      res.status(500).json({
        success: false,
        message: '검색 필터 옵션 조회 중 오류가 발생했습니다'
      });
    }
  }
);

module.exports = router;