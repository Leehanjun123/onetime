const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logger } = require('../utils/logger');

class MatchingService {
  // 근로자-일자리 매칭 점수 계산
  async calculateMatchScore(workerId, jobId) {
    try {
      const [worker, job] = await Promise.all([
        prisma.user.findUnique({
          where: { id: workerId },
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
        }),
        prisma.job.findUnique({
          where: { id: jobId },
          include: {
            employer: {
              select: { rating: true }
            }
          }
        })
      ]);

      if (!worker || !job) return 0;

      let score = 0;
      const weights = {
        categoryMatch: 30,
        locationMatch: 25,
        ratingScore: 20,
        experienceScore: 15,
        availabilityScore: 10
      };

      // 1. 카테고리 매칭 (과거 지원 이력 기반)
      const workerCategories = worker.applications.map(a => a.job.category);
      const categoryFrequency = this.getFrequency(workerCategories);
      
      if (categoryFrequency[job.category]) {
        score += weights.categoryMatch * (categoryFrequency[job.category] / workerCategories.length);
      }

      // 2. 위치 매칭
      const workerLocations = worker.applications.map(a => a.job.location);
      const locationFrequency = this.getFrequency(workerLocations);
      
      if (locationFrequency[job.location]) {
        score += weights.locationMatch * (locationFrequency[job.location] / workerLocations.length);
      } else if (this.isNearbyLocation(worker.location, job.location)) {
        score += weights.locationMatch * 0.5;
      }

      // 3. 평점 점수
      const ratingScore = (worker.rating / 5) * weights.ratingScore;
      score += ratingScore;

      // 4. 경험 점수 (해당 카테고리 완료 건수)
      const categoryExperience = await prisma.application.count({
        where: {
          workerId,
          status: 'COMPLETED',
          job: { category: job.category }
        }
      });
      
      const experienceScore = Math.min(categoryExperience / 10, 1) * weights.experienceScore;
      score += experienceScore;

      // 5. 일정 가능 여부
      const conflictingJobs = await prisma.application.count({
        where: {
          workerId,
          status: 'ACCEPTED',
          job: {
            workDate: job.workDate
          }
        }
      });
      
      if (conflictingJobs === 0) {
        score += weights.availabilityScore;
      }

      return Math.round(score);
    } catch (error) {
      logger.error('Match score calculation failed', error);
      return 0;
    }
  }

  // 일자리에 적합한 근로자 추천
  async recommendWorkersForJob(jobId, limit = 10) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId }
      });

      if (!job) return [];

      // 해당 카테고리 경험이 있는 근로자 찾기
      const experiencedWorkers = await prisma.user.findMany({
        where: {
          userType: 'WORKER',
          verified: true,
          applications: {
            some: {
              job: {
                category: job.category
              },
              status: 'COMPLETED'
            }
          }
        },
        select: {
          id: true,
          name: true,
          rating: true,
          totalEarned: true,
          location: true,
          _count: {
            select: {
              applications: {
                where: {
                  status: 'COMPLETED'
                }
              }
            }
          }
        },
        orderBy: [
          { rating: 'desc' },
          { totalEarned: 'desc' }
        ],
        take: limit * 2 // 점수 계산을 위해 더 많이 조회
      });

      // 각 근로자의 매칭 점수 계산
      const workersWithScore = await Promise.all(
        experiencedWorkers.map(async (worker) => {
          const score = await this.calculateMatchScore(worker.id, jobId);
          return {
            ...worker,
            matchScore: score,
            completedJobs: worker._count.applications
          };
        })
      );

      // 점수 기준으로 정렬하여 상위 근로자 반환
      return workersWithScore
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
    } catch (error) {
      logger.error('Worker recommendation failed', error);
      return [];
    }
  }

  // 근로자에게 적합한 일자리 추천
  async recommendJobsForWorker(workerId, limit = 10) {
    try {
      const worker = await prisma.user.findUnique({
        where: { id: workerId },
        include: {
          applications: {
            include: {
              job: {
                select: { category: true, location: true, wage: true }
              }
            },
            where: {
              status: { in: ['COMPLETED', 'ACCEPTED'] }
            },
            take: 20
          }
        }
      });

      if (!worker) return [];

      // 선호 카테고리와 위치 추출
      const categories = worker.applications.map(a => a.job.category);
      const locations = worker.applications.map(a => a.job.location);
      const avgWage = worker.applications.reduce((sum, a) => sum + a.job.wage, 0) / 
                      (worker.applications.length || 1);

      const categoryFreq = this.getFrequency(categories);
      const locationFreq = this.getFrequency(locations);

      const topCategories = Object.keys(categoryFreq).slice(0, 3);
      const topLocations = Object.keys(locationFreq).slice(0, 3);

      // 추천 일자리 조회
      const jobs = await prisma.job.findMany({
        where: {
          status: 'OPEN',
          workDate: {
            gte: new Date()
          },
          OR: [
            { category: { in: topCategories } },
            { location: { in: topLocations } },
            { wage: { gte: avgWage * 0.8 } }
          ],
          NOT: {
            applications: {
              some: {
                workerId
              }
            }
          }
        },
        include: {
          employer: {
            select: {
              name: true,
              rating: true,
              verified: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        take: limit * 2
      });

      // 각 일자리의 매칭 점수 계산
      const jobsWithScore = await Promise.all(
        jobs.map(async (job) => {
          const score = await this.calculateMatchScore(workerId, job.id);
          return {
            ...job,
            matchScore: score,
            applicationCount: job._count.applications
          };
        })
      );

      // 점수 기준으로 정렬
      return jobsWithScore
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
    } catch (error) {
      logger.error('Job recommendation failed', error);
      return [];
    }
  }

  // AI 기반 자동 매칭 (일일 배치)
  async performAutoMatching() {
    try {
      const startTime = Date.now();
      logger.info('Auto matching started');

      // 내일 시작하는 미충원 일자리 조회
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const urgentJobs = await prisma.job.findMany({
        where: {
          status: 'OPEN',
          workDate: {
            gte: tomorrow,
            lt: dayAfter
          }
        },
        include: {
          applications: {
            where: { status: 'ACCEPTED' }
          }
        }
      });

      const matchingSuggestions = [];

      for (const job of urgentJobs) {
        const neededWorkers = job.requiredWorkers - job.applications.length;
        
        if (neededWorkers > 0) {
          const recommendedWorkers = await this.recommendWorkersForJob(job.id, neededWorkers * 2);
          
          for (const worker of recommendedWorkers) {
            if (worker.matchScore >= 70) { // 70점 이상만 자동 제안
              matchingSuggestions.push({
                jobId: job.id,
                workerId: worker.id,
                score: worker.matchScore,
                type: 'AUTO_SUGGESTION'
              });
            }
          }
        }
      }

      // 매칭 제안 저장 및 알림 전송
      for (const suggestion of matchingSuggestions) {
        await prisma.matchingSuggestion.create({
          data: suggestion
        });

        // 근로자에게 알림
        await prisma.notification.create({
          data: {
            userId: suggestion.workerId,
            type: 'JOB_SUGGESTION',
            title: '맞춤 일자리 추천',
            message: `회원님께 적합한 일자리가 있습니다. (매칭률 ${suggestion.score}%)`,
            relatedId: suggestion.jobId
          }
        });
      }

      const duration = Date.now() - startTime;
      logger.info('Auto matching completed', {
        duration,
        suggestionsCount: matchingSuggestions.length
      });

      return {
        success: true,
        suggestionsCount: matchingSuggestions.length,
        duration
      };
    } catch (error) {
      logger.error('Auto matching failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 유틸리티 함수들
  getFrequency(arr) {
    return arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  }

  isNearbyLocation(loc1, loc2) {
    if (!loc1 || !loc2) return false;
    
    // 같은 시/도인지 확인 (간단한 구현)
    const region1 = loc1.split(' ')[0];
    const region2 = loc2.split(' ')[0];
    
    return region1 === region2;
  }

  // 매칭 성공률 분석
  async analyzeMatchingSuccess() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const suggestions = await prisma.matchingSuggestion.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        include: {
          application: {
            select: { status: true }
          }
        }
      });

      const stats = {
        total: suggestions.length,
        accepted: 0,
        rejected: 0,
        pending: 0,
        avgScore: 0
      };

      suggestions.forEach(s => {
        if (s.application) {
          if (s.application.status === 'ACCEPTED') stats.accepted++;
          else if (s.application.status === 'REJECTED') stats.rejected++;
          else stats.pending++;
        }
        stats.avgScore += s.score;
      });

      stats.avgScore = stats.total > 0 ? stats.avgScore / stats.total : 0;
      stats.successRate = stats.total > 0 ? (stats.accepted / stats.total) * 100 : 0;

      return stats;
    } catch (error) {
      logger.error('Matching analysis failed', error);
      return null;
    }
  }
}

module.exports = new MatchingService();