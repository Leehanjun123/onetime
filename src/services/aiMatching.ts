import { PrismaClient, JobCategory, MatchStatus, MatchAction } from '@prisma/client';
import { calculateDistance } from '../utils/geoUtils';
import { logger } from '../utils/logger';

interface MatchingWeights {
  distanceWeight: number;
  skillWeight: number;
  scheduleWeight: number;
  wageWeight: number;
  experienceWeight: number;
  reliabilityWeight: number;
}

interface MatchScore {
  overall: number;
  distanceScore: number;
  skillScore: number;
  scheduleScore: number;
  wageScore: number;
  experienceScore: number;
  reliabilityScore: number;
  preferenceScore: number;
  breakdown: {
    distance: { score: number; reason: string };
    skills: { score: number; reason: string };
    schedule: { score: number; reason: string };
    wage: { score: number; reason: string };
    experience: { score: number; reason: string };
    reliability: { score: number; reason: string };
    preference: { score: number; reason: string };
  };
}

export class AIMatchingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 새로운 일자리에 대해 AI 매칭을 실행
   */
  async generateMatches(jobId: string): Promise<void> {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        include: { employer: true }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // 적합한 워커들 찾기
      const eligibleWorkers = await this.findEligibleWorkers(job);
      
      logger.info(`Found ${eligibleWorkers.length} eligible workers for job ${jobId}`);

      // 각 워커에 대해 매칭 점수 계산
      const matchPromises = eligibleWorkers.map(async (worker) => {
        const matchScore = await this.calculateMatchScore(job, worker);
        
        if (matchScore.overall >= 0.3) { // 최소 매칭 점수 30%
          await this.createJobMatch(job.id, worker.id, matchScore);
          
          // 매칭 히스토리 기록
          await this.recordMatchingHistory(
            job.id,
            worker.id,
            MatchAction.GENERATED,
            matchScore.overall,
            'AI generated match'
          );
        }
      });

      await Promise.all(matchPromises);
      logger.info(`AI matching completed for job ${jobId}`);

    } catch (error) {
      logger.error('Error in generateMatches:', error);
      throw error;
    }
  }

  /**
   * 적합한 워커들 찾기
   */
  private async findEligibleWorkers(job: any) {
    return await this.prisma.user.findMany({
      where: {
        userType: 'WORKER',
        status: 'ACTIVE',
        verified: true,
        workerProfile: {
          isNot: null
        }
      },
      include: {
        workerProfile: true,
        matchingPreferences: true,
        reviews: {
          select: {
            rating: true
          }
        },
        applications: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 최근 30일
            }
          }
        }
      }
    });
  }

  /**
   * 매칭 점수 계산
   */
  private async calculateMatchScore(job: any, worker: any): Promise<MatchScore> {
    const weights: MatchingWeights = {
      distanceWeight: worker.matchingPreferences?.distanceWeight || 0.2,
      skillWeight: worker.matchingPreferences?.skillWeight || 0.25,
      scheduleWeight: worker.matchingPreferences?.scheduleWeight || 0.2,
      wageWeight: worker.matchingPreferences?.wageWeight || 0.15,
      experienceWeight: worker.matchingPreferences?.experienceWeight || 0.1,
      reliabilityWeight: worker.matchingPreferences?.reliabilityWeight || 0.1
    };

    // 1. 거리 점수 계산
    const distanceScore = this.calculateDistanceScore(job, worker);
    
    // 2. 기술/경험 점수 계산
    const skillScore = this.calculateSkillScore(job, worker);
    
    // 3. 스케줄 점수 계산
    const scheduleScore = this.calculateScheduleScore(job, worker);
    
    // 4. 급여 점수 계산
    const wageScore = this.calculateWageScore(job, worker);
    
    // 5. 경험 점수 계산
    const experienceScore = this.calculateExperienceScore(job, worker);
    
    // 6. 신뢰도 점수 계산
    const reliabilityScore = this.calculateReliabilityScore(worker);
    
    // 7. 선호도 점수 계산
    const preferenceScore = this.calculatePreferenceScore(job, worker);

    // 전체 점수 계산
    const overall = 
      distanceScore.score * weights.distanceWeight +
      skillScore.score * weights.skillWeight +
      scheduleScore.score * weights.scheduleWeight +
      wageScore.score * weights.wageWeight +
      experienceScore.score * weights.experienceWeight +
      reliabilityScore.score * weights.reliabilityWeight;

    return {
      overall: Math.round(overall * 100) / 100,
      distanceScore: distanceScore.score,
      skillScore: skillScore.score,
      scheduleScore: scheduleScore.score,
      wageScore: wageScore.score,
      experienceScore: experienceScore.score,
      reliabilityScore: reliabilityScore.score,
      preferenceScore: preferenceScore.score,
      breakdown: {
        distance: distanceScore,
        skills: skillScore,
        schedule: scheduleScore,
        wage: wageScore,
        experience: experienceScore,
        reliability: reliabilityScore,
        preference: preferenceScore
      }
    };
  }

  private calculateDistanceScore(job: any, worker: any): { score: number; reason: string } {
    // 실제 구현에서는 job.location과 worker 위치를 비교
    // 여기서는 간단한 로직으로 구현
    const maxDistance = worker.workerProfile?.maxDistance || 50; // km
    
    // 임시로 랜덤 거리 생성 (실제로는 지리적 계산)
    const estimatedDistance = Math.random() * 100;
    
    if (estimatedDistance > maxDistance) {
      return { score: 0, reason: `거리가 너무 멀음 (${estimatedDistance.toFixed(1)}km > ${maxDistance}km)` };
    }
    
    const score = Math.max(0, 1 - (estimatedDistance / maxDistance));
    return { 
      score: Math.round(score * 100) / 100, 
      reason: `거리: ${estimatedDistance.toFixed(1)}km (최대: ${maxDistance}km)` 
    };
  }

  private calculateSkillScore(job: any, worker: any): { score: number; reason: string } {
    const workerSkills = worker.workerProfile?.skills || [];
    const requiredSkills = this.getRequiredSkillsForCategory(job.category);
    
    if (requiredSkills.length === 0) {
      return { score: 0.7, reason: '특별한 기술 요구사항 없음' };
    }
    
    const matchingSkills = workerSkills.filter(skill => 
      requiredSkills.some(required => 
        skill.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    const score = matchingSkills.length / requiredSkills.length;
    return { 
      score: Math.min(1, score), 
      reason: `보유 기술: ${matchingSkills.length}/${requiredSkills.length} 매치` 
    };
  }

  private calculateScheduleScore(job: any, worker: any): { score: number; reason: string } {
    const jobDate = new Date(job.workDate);
    const jobHour = jobDate.getHours();
    const jobDay = jobDate.getDay(); // 0=일요일, 1=월요일, ...
    
    const availableHours = worker.workerProfile?.availableHours || {};
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const daySchedule = availableHours[dayNames[jobDay]];
    
    if (!daySchedule || !Array.isArray(daySchedule) || daySchedule.length < 2) {
      return { score: 0.5, reason: '해당 요일 일정 정보 없음' };
    }
    
    const [startHour, endHour] = daySchedule;
    
    if (jobHour >= startHour && jobHour <= endHour) {
      return { score: 1.0, reason: '일정 완벽 매칭' };
    } else {
      const score = Math.max(0, 1 - Math.abs(jobHour - startHour) / 12);
      return { 
        score: Math.round(score * 100) / 100, 
        reason: `일정 부분 매칭 (작업: ${jobHour}시, 가능: ${startHour}-${endHour}시)` 
      };
    }
  }

  private calculateWageScore(job: any, worker: any): { score: number; reason: string } {
    const jobWage = job.wage;
    const minWage = worker.workerProfile?.minWage;
    
    if (!minWage) {
      return { score: 0.8, reason: '최소 희망 시급 정보 없음' };
    }
    
    if (jobWage >= minWage) {
      const bonus = Math.min(0.3, (jobWage - minWage) / minWage);
      const score = Math.min(1.0, 0.7 + bonus);
      return { 
        score: Math.round(score * 100) / 100, 
        reason: `급여 만족 (제시: ${jobWage}원, 희망: ${minWage}원)` 
      };
    } else {
      const penalty = (minWage - jobWage) / minWage;
      const score = Math.max(0, 0.7 - penalty);
      return { 
        score: Math.round(score * 100) / 100, 
        reason: `급여 부족 (제시: ${jobWage}원, 희망: ${minWage}원)` 
      };
    }
  }

  private calculateExperienceScore(job: any, worker: any): { score: number; reason: string } {
    const workerExperience = worker.workerProfile?.experience || 0;
    const jobComplexity = this.getJobComplexity(job.category, job.description);
    
    if (jobComplexity === 'low') {
      return { score: 1.0, reason: '단순 업무 - 경험 무관' };
    } else if (jobComplexity === 'medium') {
      const score = Math.min(1.0, 0.5 + workerExperience * 0.1);
      return { 
        score: Math.round(score * 100) / 100, 
        reason: `중급 업무 - 경험 ${workerExperience}년` 
      };
    } else {
      const score = Math.min(1.0, workerExperience * 0.2);
      return { 
        score: Math.round(score * 100) / 100, 
        reason: `고급 업무 - 경험 ${workerExperience}년` 
      };
    }
  }

  private calculateReliabilityScore(worker: any): { score: number; reason: string } {
    const reviews = worker.reviews || [];
    const totalApplications = worker.applications?.length || 0;
    
    if (reviews.length === 0) {
      return { score: 0.5, reason: '리뷰 데이터 없음' };
    }
    
    const avgRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;
    const ratingScore = avgRating / 5; // 5점 만점을 1점 만점으로 변환
    
    // 지원 활동성 점수 (최근 활동이 많을수록 높은 점수)
    const activityScore = Math.min(1.0, totalApplications / 10);
    
    const finalScore = (ratingScore * 0.7) + (activityScore * 0.3);
    
    return { 
      score: Math.round(finalScore * 100) / 100, 
      reason: `평균 평점: ${avgRating.toFixed(1)}/5 (리뷰 ${reviews.length}개)` 
    };
  }

  private calculatePreferenceScore(job: any, worker: any): { score: number; reason: string } {
    const preferredCategories = worker.workerProfile?.preferredCategories || [];
    const preferredLocations = worker.workerProfile?.preferredLocations || [];
    
    let score = 0;
    let reasons = [];
    
    // 카테고리 선호도
    if (preferredCategories.includes(job.category)) {
      score += 0.6;
      reasons.push('선호 카테고리 매치');
    }
    
    // 위치 선호도 (간단한 문자열 매칭)
    const locationMatch = preferredLocations.some(loc => 
      job.location.toLowerCase().includes(loc.toLowerCase()) ||
      loc.toLowerCase().includes(job.location.toLowerCase())
    );
    
    if (locationMatch) {
      score += 0.4;
      reasons.push('선호 지역 매치');
    }
    
    return { 
      score: Math.min(1.0, score), 
      reason: reasons.length > 0 ? reasons.join(', ') : '선호도 정보 부족' 
    };
  }

  private getRequiredSkillsForCategory(category: JobCategory): string[] {
    const skillMap: Record<JobCategory, string[]> = {
      CONSTRUCTION: ['건설', '토목', '안전관리', '중장비'],
      INTERIOR: ['인테리어', '페인팅', '목공', '타일'],
      LOGISTICS: ['물류', '운전', '창고관리', '포장'],
      FACTORY: ['제조', '생산', '품질관리', '기계조작'],
      CLEANING: ['청소', '위생관리', '환경미화'],
      DELIVERY: ['배송', '운전', '고객서비스', '지역지식']
    };
    
    return skillMap[category] || [];
  }

  private getJobComplexity(category: JobCategory, description: string): 'low' | 'medium' | 'high' {
    const complexKeywords = ['전문', '숙련', '경력', '자격증', '인증'];
    const simpleKeywords = ['단순', '초보', '경험무관', '교육제공'];
    
    const lowerDesc = description.toLowerCase();
    
    if (complexKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'high';
    } else if (simpleKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  /**
   * JobMatch 레코드 생성
   */
  private async createJobMatch(jobId: string, workerId: string, matchScore: MatchScore): Promise<void> {
    await this.prisma.jobMatch.create({
      data: {
        jobId,
        workerId,
        matchScore: matchScore.overall,
        scoreBreakdown: matchScore.breakdown,
        distanceScore: matchScore.distanceScore,
        skillScore: matchScore.skillScore,
        scheduleScore: matchScore.scheduleScore,
        wageScore: matchScore.wageScore,
        experienceScore: matchScore.experienceScore,
        reliabilityScore: matchScore.reliabilityScore,
        preferenceScore: matchScore.preferenceScore,
        status: MatchStatus.GENERATED
      }
    });
  }

  /**
   * 매칭 히스토리 기록
   */
  private async recordMatchingHistory(
    jobId: string, 
    workerId: string, 
    action: MatchAction, 
    score?: number, 
    reason?: string,
    metadata?: any
  ): Promise<void> {
    await this.prisma.matchingHistory.create({
      data: {
        jobId,
        workerId,
        action,
        score,
        reason,
        metadata
      }
    });
  }

  /**
   * 워커의 매칭된 일자리 조회
   */
  async getMatchesForWorker(workerId: string, limit: number = 10): Promise<any[]> {
    return await this.prisma.jobMatch.findMany({
      where: {
        workerId,
        status: MatchStatus.GENERATED,
        job: {
          status: 'OPEN'
        }
      },
      include: {
        job: {
          include: {
            employer: {
              select: {
                id: true,
                name: true,
                avatar: true,
                rating: true
              }
            }
          }
        }
      },
      orderBy: {
        matchScore: 'desc'
      },
      take: limit
    });
  }

  /**
   * 고용주의 일자리에 대한 매칭 결과 조회
   */
  async getMatchesForJob(jobId: string, limit: number = 20): Promise<any[]> {
    return await this.prisma.jobMatch.findMany({
      where: {
        jobId,
        status: MatchStatus.GENERATED
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true,
            workerProfile: true
          }
        }
      },
      orderBy: {
        matchScore: 'desc'
      },
      take: limit
    });
  }

  /**
   * 매칭 피드백 처리
   */
  async handleMatchFeedback(
    jobId: string, 
    workerId: string, 
    action: 'applied' | 'rejected' | 'viewed'
  ): Promise<void> {
    const updates: any = {};
    
    switch (action) {
      case 'applied':
        updates.status = MatchStatus.APPLIED;
        updates.appliedAt = new Date();
        break;
      case 'rejected':
        updates.status = MatchStatus.REJECTED;
        updates.rejectedAt = new Date();
        break;
      case 'viewed':
        updates.status = MatchStatus.VIEWED;
        updates.viewedByWorker = true;
        break;
    }

    await this.prisma.jobMatch.update({
      where: {
        jobId_workerId: {
          jobId,
          workerId
        }
      },
      data: updates
    });

    // 히스토리 기록
    await this.recordMatchingHistory(
      jobId,
      workerId,
      action === 'applied' ? MatchAction.APPLIED : 
      action === 'rejected' ? MatchAction.REJECTED : MatchAction.VIEWED,
      undefined,
      `User ${action} the match`
    );
  }

  /**
   * 매칭 성능 분석
   */
  async getMatchingAnalytics(timeRange: number = 7): Promise<any> {
    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);
    
    const totalMatches = await this.prisma.jobMatch.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    });

    const appliedMatches = await this.prisma.jobMatch.count({
      where: {
        status: MatchStatus.APPLIED,
        createdAt: {
          gte: startDate
        }
      }
    });

    const avgMatchScore = await this.prisma.jobMatch.aggregate({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _avg: {
        matchScore: true
      }
    });

    return {
      totalMatches,
      appliedMatches,
      applicationRate: totalMatches > 0 ? (appliedMatches / totalMatches) * 100 : 0,
      avgMatchScore: avgMatchScore._avg.matchScore || 0,
      timeRange
    };
  }
}