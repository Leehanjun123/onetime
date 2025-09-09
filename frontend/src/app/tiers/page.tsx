'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface UserStats {
  totalJobs: number;
  averageRating: number;
  totalEarnings: number;
  certifications: number;
  completionRate: number;
}

interface Tier {
  id: string;
  name: string;
  minRating: number;
  minJobs: number;
  minCertifications: number;
  color: string;
  bgColor: string;
  icon: string;
  benefits: string[];
  description: string;
}

const TIERS: Tier[] = [
  {
    id: 'beginner',
    name: '초보자',
    minRating: 0,
    minJobs: 0,
    minCertifications: 0,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: '🌱',
    description: '일용직을 시작하는 단계입니다.',
    benefits: [
      '기본 일자리 지원 가능',
      '안전교육 무료 제공',
      '멘토링 프로그램 참여',
      '초보자 전용 일자리 우선 배정'
    ]
  },
  {
    id: 'experienced',
    name: '경험자',
    minRating: 4.0,
    minJobs: 10,
    minCertifications: 2,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '💪',
    description: '어느 정도 경험을 쌓은 숙련된 작업자입니다.',
    benefits: [
      '더 많은 일자리 지원 가능',
      '프리미엄 일자리 우선권',
      '시급 협상 가능',
      '팀장 추천 기회 제공',
      '고급 교육 과정 할인'
    ]
  },
  {
    id: 'skilled',
    name: '숙련자',
    minRating: 4.5,
    minJobs: 50,
    minCertifications: 5,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '🔧',
    description: '전문적인 기술과 풍부한 경험을 보유한 숙련자입니다.',
    benefits: [
      '고액 일자리 우선 배정',
      '전문 기술 일자리 독점 지원',
      '프로젝트 리더 기회',
      '개인 브랜딩 지원',
      '월간 보너스 지급',
      '전문가 네트워크 참여'
    ]
  },
  {
    id: 'expert',
    name: '전문가',
    minRating: 4.8,
    minJobs: 100,
    minCertifications: 10,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: '👑',
    description: '최고 수준의 전문성과 신뢰성을 인정받은 전문가입니다.',
    benefits: [
      '최고급 일자리 독점 지원',
      '컨설팅 업무 기회',
      '교육 강사 활동 지원',
      '파트너십 제휴 기회',
      '연간 성과급 지급',
      'VIP 고객 전담 매니저',
      '해외 프로젝트 우선권'
    ]
  }
];

export default function TiersPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [userStats, setUserStats] = useState<UserStats>({
    totalJobs: 0,
    averageRating: 0,
    totalEarnings: 0,
    certifications: 0,
    completionRate: 0
  });
  const [currentTier, setCurrentTier] = useState<Tier>(TIERS[0]);
  const [nextTier, setNextTier] = useState<Tier | null>(null);

  useEffect(() => {
    // 실제로는 API에서 사용자 통계를 가져와야 함
    const mockStats: UserStats = {
      totalJobs: 28,
      averageRating: 4.3,
      totalEarnings: 2450000,
      certifications: 3,
      completionRate: 95.2
    };
    setUserStats(mockStats);

    // 현재 등급 계산
    let tier = TIERS[0];
    for (let i = TIERS.length - 1; i >= 0; i--) {
      const t = TIERS[i];
      if (
        mockStats.averageRating >= t.minRating &&
        mockStats.totalJobs >= t.minJobs &&
        mockStats.certifications >= t.minCertifications
      ) {
        tier = t;
        break;
      }
    }
    setCurrentTier(tier);

    // 다음 등급 찾기
    const currentIndex = TIERS.findIndex(t => t.id === tier.id);
    if (currentIndex < TIERS.length - 1) {
      setNextTier(TIERS[currentIndex + 1]);
    }
  }, []);

  const calculateProgress = () => {
    if (!nextTier) return 100;

    const ratingProgress = Math.min((userStats.averageRating / nextTier.minRating) * 100, 100);
    const jobsProgress = Math.min((userStats.totalJobs / nextTier.minJobs) * 100, 100);
    const certsProgress = Math.min((userStats.certifications / nextTier.minCertifications) * 100, 100);

    return Math.min((ratingProgress + jobsProgress + certsProgress) / 3, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">등급 시스템</h1>
          <p className="text-gray-600">평점과 경험을 바탕으로 등급이 결정됩니다</p>
        </div>

        {/* 현재 등급 카드 */}
        <div className={`${currentTier.bgColor} rounded-xl p-8 mb-8 border-2 border-opacity-20`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{currentTier.icon}</div>
              <div>
                <h2 className={`text-2xl font-bold ${currentTier.color}`}>
                  {currentTier.name}
                </h2>
                <p className="text-gray-600">{currentTier.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">현재 평점</div>
              <div className="text-2xl font-bold text-yellow-600">
                ⭐ {userStats.averageRating.toFixed(1)}
              </div>
            </div>
          </div>

          {/* 사용자 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white bg-opacity-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{userStats.totalJobs}</div>
              <div className="text-sm text-gray-600">완료 일자리</div>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{userStats.certifications}</div>
              <div className="text-sm text-gray-600">보유 인증</div>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(userStats.totalEarnings / 10000).toFixed(0)}만원
              </div>
              <div className="text-sm text-gray-600">총 수익</div>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{userStats.completionRate}%</div>
              <div className="text-sm text-gray-600">완료율</div>
            </div>
          </div>

          {/* 혜택 */}
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">현재 등급 혜택</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentTier.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 다음 등급까지의 진행 상황 */}
        {nextTier && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {nextTier.name} 등급까지
              </h3>
              <div className="text-2xl">{nextTier.icon}</div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>진행률</span>
                <span>{calculateProgress().toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-900">평점 요구사항</div>
                <div className="text-gray-600">
                  {userStats.averageRating.toFixed(1)} / {nextTier.minRating} ⭐
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {userStats.averageRating >= nextTier.minRating ? '✓ 달성' : '미달성'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-900">일자리 완료</div>
                <div className="text-gray-600">
                  {userStats.totalJobs} / {nextTier.minJobs} 개
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {userStats.totalJobs >= nextTier.minJobs ? '✓ 달성' : '미달성'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-900">인증 개수</div>
                <div className="text-gray-600">
                  {userStats.certifications} / {nextTier.minCertifications} 개
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {userStats.certifications >= nextTier.minCertifications ? '✓ 달성' : '미달성'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 모든 등급 정보 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">전체 등급 체계</h3>
          <div className="space-y-4">
            {TIERS.map((tier, index) => (
              <div 
                key={tier.id} 
                className={`border rounded-lg p-4 ${
                  tier.id === currentTier.id 
                    ? 'border-orange-300 bg-orange-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{tier.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={`text-lg font-semibold ${tier.color}`}>
                        {tier.name}
                      </h4>
                      {tier.id === currentTier.id && (
                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                          현재 등급
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{tier.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 mb-3">
                      <div>평점: {tier.minRating}⭐ 이상</div>
                      <div>완료 일자리: {tier.minJobs}개 이상</div>
                      <div>보유 인증: {tier.minCertifications}개 이상</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tier.benefits.slice(0, 3).map((benefit, idx) => (
                        <span 
                          key={idx}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {benefit}
                        </span>
                      ))}
                      {tier.benefits.length > 3 && (
                        <span className="text-gray-500 text-xs">
                          +{tier.benefits.length - 3}개 더
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 등급 상승 팁 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">등급 상승 팁</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📈 평점 올리기</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 시간 엄수와 성실한 근무 태도</li>
                <li>• 고용주와의 원활한 소통</li>
                <li>• 안전 수칙 준수</li>
                <li>• 작업 품질 향상</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">🎯 인증 취득하기</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• 인증 페이지에서 과정 수강</li>
                <li>• 실무 관련 자격증 취득</li>
                <li>• 안전교육 이수</li>
                <li>• 전문기술 교육 참여</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}