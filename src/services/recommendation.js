const { prisma } = require('../config/database');
const { logger } = require('../utils/logger');
const redis = require('../config/redis');

class RecommendationService {
  constructor() {
    // 가중치 설정
    this.weights = {
      category: 0.3,        // 카테고리 일치
      location: 0.25,       // 위치 근접성
      wage: 0.15,          // 임금 수준
      rating: 0.1,         // 고용주 평점
      recentActivity: 0.1, // 최근 활동
      skills: 0.1          // 스킬 매칭
    };
  }

  // 사용자별 맞춤 일자리 추천
  async getRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        excludeApplied = true,
        includeUrgent = true
      } = options;

      // 캐시 확인
      const cacheKey = `recommendations:${userId}:${JSON.stringify(options)}`;
      const cached = await redis.get(cacheKey);
      if (cached) return cached;

      // 사용자 프로필 및 선호도 분석
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User not found');
      }

      // 사용자 선호도 학습
      const preferences = await this.analyzeUserPreferences(userId);

      // 추천 대상 일자리 조회
      let jobQuery = {
        status: 'OPEN',
        workDate: {
          gte: new Date()
        }
      };

      // 이미 지원한 일자리 제외
      if (excludeApplied) {
        const appliedJobIds = await this.getAppliedJobIds(userId);
        if (appliedJobIds.length > 0) {
          jobQuery.id = { notIn: appliedJobIds };
        }
      }

      const jobs = await prisma.job.findMany({
        where: jobQuery,
        include: {
          employer: {
            select: {
              id: true,
              name: true,
              rating: true,
              totalEarned: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        take: 100 // 초기 후보군
      });

      // 각 일자리에 대한 점수 계산
      const scoredJobs = jobs.map(job => ({
        ...job,
        score: this.calculateJobScore(job, userProfile, preferences),
        matchDetails: this.getMatchDetails(job, userProfile, preferences)
      }));

      // 점수 기준 정렬
      scoredJobs.sort((a, b) => b.score - a.score);

      // 상위 N개 선택
      const recommendations = scoredJobs.slice(0, limit);

      // 추천 이유 생성
      const enhancedRecommendations = recommendations.map(job => ({
        ...job,
        recommendationReason: this.generateRecommendationReason(job.matchDetails),
        matchPercentage: Math.round(job.score * 100)
      }));

      // 캐시 저장 (10분)
      await redis.set(cacheKey, enhancedRecommendations, 600);

      // 추천 이력 저장
      await this.saveRecommendationHistory(userId, enhancedRecommendations);

      return enhancedRecommendations;
    } catch (error) {
      logger.error('Get recommendations error:', error);
      throw error;
    }
  }

  // 사용자 프로필 분석
  async getUserProfile(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          applications: {
            include: {
              job: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 20
          },
          reviews: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!user) return null;

      // 선호 카테고리 분석
      const categoryPreferences = this.analyzeCategoryPreferences(user.applications);
      
      // 선호 임금 범위 분석
      const wagePreferences = this.analyzeWagePreferences(user.applications);
      
      // 선호 위치 분석
      const locationPreferences = this.analyzeLocationPreferences(user.applications);

      // 활동 패턴 분석
      const activityPattern = this.analyzeActivityPattern(user.applications);

      return {
        ...user,
        preferences: {
          categories: categoryPreferences,
          wageRange: wagePreferences,
          locations: locationPreferences,
          activityPattern
        }
      };
    } catch (error) {
      logger.error('Get user profile error:', error);
      throw error;
    }
  }

  // 사용자 선호도 학습
  async analyzeUserPreferences(userId) {
    try {
      // 완료된 작업 분석
      const completedJobs = await prisma.workSession.findMany({
        where: {
          workerId: userId,
          status: 'COMPLETED'
        },
        include: {
          job: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      // 높은 평점을 받은 작업 분석
      const highRatedJobs = await prisma.review.findMany({
        where: {
          revieweeId: userId,
          rating: { gte: 4 }
        },
        include: {
          job: true
        },
        take: 10
      });

      // 저장한 일자리 분석
      const savedJobs = await prisma.savedJob.findMany({
        where: { userId },
        include: {
          job: true
        },
        take: 10
      });

      return {
        completedCategories: this.extractCategories(completedJobs.map(w => w.job)),
        successfulCategories: this.extractCategories(highRatedJobs.map(r => r.job)),
        interestedCategories: this.extractCategories(savedJobs.map(s => s.job)),
        avgCompletionTime: this.calculateAvgCompletionTime(completedJobs),
        preferredEmployers: this.extractPreferredEmployers(completedJobs)
      };
    } catch (error) {
      logger.error('Analyze user preferences error:', error);
      return {};
    }
  }

  // 일자리 점수 계산
  calculateJobScore(job, userProfile, preferences) {
    let score = 0;

    // 1. 카테고리 매칭
    const categoryScore = this.calculateCategoryScore(job, userProfile.preferences.categories);
    score += categoryScore * this.weights.category;

    // 2. 위치 매칭
    const locationScore = this.calculateLocationScore(job, userProfile.preferences.locations);
    score += locationScore * this.weights.location;

    // 3. 임금 매칭
    const wageScore = this.calculateWageScore(job, userProfile.preferences.wageRange);
    score += wageScore * this.weights.wage;

    // 4. 고용주 평점
    const ratingScore = job.employer.rating / 5;
    score += ratingScore * this.weights.rating;

    // 5. 긴급 여부 (보너스)
    if (job.urgent) {
      score += 0.1;
    }

    // 6. 경쟁률 (지원자 수가 적을수록 높은 점수)
    const competitionScore = Math.max(0, 1 - (job._count.applications / 10));
    score += competitionScore * 0.05;

    return Math.min(1, score); // 최대 1점
  }

  // 카테고리 점수 계산
  calculateCategoryScore(job, categoryPreferences) {
    if (!categoryPreferences || categoryPreferences.length === 0) {
      return 0.5; // 기본 점수
    }

    const preference = categoryPreferences.find(p => p.category === job.category);
    if (preference) {
      return preference.score;
    }

    return 0.3; // 낮은 점수
  }

  // 위치 점수 계산
  calculateLocationScore(job, locationPreferences) {
    if (!locationPreferences || locationPreferences.length === 0) {
      return 0.5;
    }

    // 간단한 위치 매칭 (실제로는 좌표 기반 거리 계산 필요)
    const preference = locationPreferences.find(p => 
      job.location.includes(p.location) || p.location.includes(job.location)
    );

    if (preference) {
      return preference.score;
    }

    return 0.3;
  }

  // 임금 점수 계산
  calculateWageScore(job, wageRange) {
    if (!wageRange) {
      return 0.5;
    }

    const { min, max, avg } = wageRange;
    
    if (job.wage >= avg * 0.9 && job.wage <= avg * 1.1) {
      return 1; // 선호 범위 내
    } else if (job.wage >= min && job.wage <= max) {
      return 0.7; // 허용 범위 내
    } else if (job.wage > max) {
      return 0.8; // 높은 임금
    } else {
      return 0.3; // 낮은 임금
    }
  }

  // 매칭 상세 정보
  getMatchDetails(job, userProfile, preferences) {
    return {
      categoryMatch: this.calculateCategoryScore(job, userProfile.preferences.categories),
      locationMatch: this.calculateLocationScore(job, userProfile.preferences.locations),
      wageMatch: this.calculateWageScore(job, userProfile.preferences.wageRange),
      ratingMatch: job.employer.rating / 5,
      isUrgent: job.urgent,
      competitionLevel: job._count.applications
    };
  }

  // 추천 이유 생성
  generateRecommendationReason(matchDetails) {
    const reasons = [];

    if (matchDetails.categoryMatch > 0.7) {
      reasons.push('선호하시는 카테고리의 일자리입니다');
    }
    if (matchDetails.locationMatch > 0.7) {
      reasons.push('선호 지역과 가까운 위치입니다');
    }
    if (matchDetails.wageMatch > 0.8) {
      reasons.push('적정 임금 수준입니다');
    }
    if (matchDetails.ratingMatch > 0.8) {
      reasons.push('높은 평점의 고용주입니다');
    }
    if (matchDetails.isUrgent) {
      reasons.push('긴급 채용으로 빠른 매칭이 가능합니다');
    }
    if (matchDetails.competitionLevel < 3) {
      reasons.push('경쟁률이 낮습니다');
    }

    return reasons.length > 0 ? reasons : ['회원님께 적합한 일자리입니다'];
  }

  // 카테고리 선호도 분석
  analyzeCategoryPreferences(applications) {
    const categoryCount = {};
    
    applications.forEach(app => {
      if (app.job && app.job.category) {
        categoryCount[app.job.category] = (categoryCount[app.job.category] || 0) + 1;
      }
    });

    const total = applications.length || 1;
    
    return Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        score: count / total
      }))
      .sort((a, b) => b.score - a.score);
  }

  // 임금 선호도 분석
  analyzeWagePreferences(applications) {
    const wages = applications
      .filter(app => app.job && app.job.wage)
      .map(app => app.job.wage);

    if (wages.length === 0) {
      return { min: 10000, max: 30000, avg: 15000 };
    }

    const avg = wages.reduce((sum, wage) => sum + wage, 0) / wages.length;
    const min = Math.min(...wages);
    const max = Math.max(...wages);

    return { min, max, avg };
  }

  // 위치 선호도 분석
  analyzeLocationPreferences(applications) {
    const locationCount = {};
    
    applications.forEach(app => {
      if (app.job && app.job.location) {
        locationCount[app.job.location] = (locationCount[app.job.location] || 0) + 1;
      }
    });

    const total = applications.length || 1;
    
    return Object.entries(locationCount)
      .map(([location, count]) => ({
        location,
        count,
        score: count / total
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // 상위 5개 지역
  }

  // 활동 패턴 분석
  analyzeActivityPattern(applications) {
    const dayOfWeekCount = new Array(7).fill(0);
    const hourCount = new Array(24).fill(0);

    applications.forEach(app => {
      if (app.job && app.job.workDate) {
        const date = new Date(app.job.workDate);
        dayOfWeekCount[date.getDay()]++;
        hourCount[date.getHours()]++;
      }
    });

    return {
      preferredDays: this.getPreferredTimes(dayOfWeekCount, ['일', '월', '화', '수', '목', '금', '토']),
      preferredHours: this.getPreferredTimes(hourCount, Array.from({length: 24}, (_, i) => `${i}시`))
    };
  }

  // 선호 시간대 추출
  getPreferredTimes(counts, labels) {
    return counts
      .map((count, index) => ({
        label: labels[index],
        count,
        score: count / Math.max(...counts, 1)
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  // 카테고리 추출
  extractCategories(jobs) {
    const categories = {};
    jobs.forEach(job => {
      if (job && job.category) {
        categories[job.category] = (categories[job.category] || 0) + 1;
      }
    });
    return Object.keys(categories);
  }

  // 평균 완료 시간 계산
  calculateAvgCompletionTime(workSessions) {
    if (workSessions.length === 0) return 0;
    
    const totalHours = workSessions.reduce((sum, session) => {
      return sum + (session.totalHours || 0);
    }, 0);
    
    return totalHours / workSessions.length;
  }

  // 선호 고용주 추출
  extractPreferredEmployers(workSessions) {
    const employers = {};
    
    workSessions.forEach(session => {
      if (session.job && session.job.employerId) {
        employers[session.job.employerId] = (employers[session.job.employerId] || 0) + 1;
      }
    });
    
    return Object.entries(employers)
      .filter(([_, count]) => count >= 2)
      .map(([employerId]) => employerId);
  }

  // 지원한 일자리 ID 목록
  async getAppliedJobIds(userId) {
    const applications = await prisma.jobApplication.findMany({
      where: { workerId: userId },
      select: { jobId: true }
    });
    
    return applications.map(app => app.jobId);
  }

  // 추천 이력 저장
  async saveRecommendationHistory(userId, recommendations) {
    try {
      // 추천 이력을 별도 테이블에 저장할 수 있음
      // 현재는 로그만 남김
      logger.info('Recommendations generated', {
        userId,
        count: recommendations.length,
        topJobId: recommendations[0]?.id
      });
    } catch (error) {
      logger.error('Save recommendation history error:', error);
    }
  }

  // 유사 사용자 기반 추천 (협업 필터링)
  async getCollaborativeRecommendations(userId, limit = 5) {
    try {
      // 유사한 사용자 찾기
      const similarUsers = await this.findSimilarUsers(userId);
      
      if (similarUsers.length === 0) {
        return [];
      }

      // 유사 사용자들이 지원한 일자리 조회
      const jobIds = await prisma.jobApplication.findMany({
        where: {
          workerId: { in: similarUsers.map(u => u.id) },
          status: 'ACCEPTED'
        },
        select: {
          jobId: true
        },
        distinct: ['jobId']
      });

      // 본인이 지원하지 않은 일자리만 필터링
      const appliedJobIds = await this.getAppliedJobIds(userId);
      const recommendedJobIds = jobIds
        .map(j => j.jobId)
        .filter(id => !appliedJobIds.includes(id));

      // 일자리 정보 조회
      const jobs = await prisma.job.findMany({
        where: {
          id: { in: recommendedJobIds },
          status: 'OPEN'
        },
        include: {
          employer: true
        },
        take: limit
      });

      return jobs;
    } catch (error) {
      logger.error('Collaborative recommendations error:', error);
      return [];
    }
  }

  // 유사 사용자 찾기
  async findSimilarUsers(userId, limit = 10) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          applications: {
            select: {
              job: {
                select: {
                  category: true
                }
              }
            }
          }
        }
      });

      if (!user) return [];

      // 사용자의 주요 카테고리
      const userCategories = this.extractCategories(user.applications.map(a => a.job));

      // 유사한 카테고리에 지원한 다른 사용자 찾기
      const similarUsers = await prisma.user.findMany({
        where: {
          id: { not: userId },
          applications: {
            some: {
              job: {
                category: { in: userCategories }
              }
            }
          }
        },
        take: limit
      });

      return similarUsers;
    } catch (error) {
      logger.error('Find similar users error:', error);
      return [];
    }
  }
}

module.exports = new RecommendationService();