'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  wage: number;
  duration: string;
  description: string;
  requirements: string[];
  preferredSkills: string[];
  matchScore: number;
  matchReasons: string[];
  urgency: 'low' | 'medium' | 'high';
  workType: string;
  posted: string;
}

interface MatchingPreferences {
  maxDistance: number;
  minWage: number;
  preferredWorkTypes: string[];
  preferredDurations: string[];
  skills: string[];
  availability: string[];
}

const SAMPLE_JOBS: Job[] = [
  {
    id: '1',
    title: '아파트 리모델링 마감재 시공',
    company: '(주)프리미엄홈',
    location: '서울 강남구',
    wage: 200000,
    duration: '1일',
    description: '신축 아파트 마감재 시공 및 정리 작업',
    requirements: ['타일/벽지 시공 경험', '정밀 작업 가능'],
    preferredSkills: ['타일시공', '벽지시공', '마감작업'],
    matchScore: 95,
    matchReasons: ['타일시공 인증 보유', '5km 내 위치', '선호 시급 이상', '과거 유사 작업 경험'],
    urgency: 'high',
    workType: '마감작업',
    posted: '30분 전'
  },
  {
    id: '2',
    title: '상가 인테리어 철거 작업',
    company: '대한건설',
    location: '서울 서초구',
    wage: 180000,
    duration: '1일',
    description: '기존 상가 인테리어 철거 및 정리',
    requirements: ['철거 작업 경험', '안전교육 이수'],
    preferredSkills: ['철거작업', '안전관리', '중장비운전'],
    matchScore: 88,
    matchReasons: ['철거작업 경험 다수', '3km 내 위치', '안전교육 인증 보유'],
    urgency: 'medium',
    workType: '철거작업',
    posted: '1시간 전'
  },
  {
    id: '3',
    title: '펜션 외벽 도색 작업',
    company: '코리아페인트',
    location: '경기 가평군',
    wage: 160000,
    duration: '1일',
    description: '펜션 건물 외벽 도색 및 마무리 작업',
    requirements: ['도색 작업 경험', '고소작업 가능'],
    preferredSkills: ['페인팅', '외벽작업', '고소작업'],
    matchScore: 82,
    matchReasons: ['도색작업 인증 보유', '주말 근무 선호 일치', '경험 등급 일치'],
    urgency: 'low',
    workType: '도색작업',
    posted: '2시간 전'
  },
  {
    id: '4',
    title: '오피스텔 전기배선 보조',
    company: '서울전기',
    location: '서울 마포구',
    wage: 170000,
    duration: '1일',
    description: '신축 오피스텔 전기배선 설치 보조 작업',
    requirements: ['전기 관련 기초 지식', '협업 능력'],
    preferredSkills: ['전기작업', '배선작업', '측정장비'],
    matchScore: 75,
    matchReasons: ['전기 기초 교육 이수', '10km 내 위치', '협업 평점 우수'],
    urgency: 'medium',
    workType: '전기작업',
    posted: '3시간 전'
  }
];

export default function SmartMatchingPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [preferences, setPreferences] = useState<MatchingPreferences>({
    maxDistance: 10,
    minWage: 150000,
    preferredWorkTypes: ['마감작업', '철거작업'],
    preferredDurations: ['1일'],
    skills: ['타일시공', '벽지시공', '철거작업'],
    availability: ['평일', '주말']
  });
  const [filterType, setFilterType] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([
    'AI가 당신의 작업 이력을 분석한 결과, 마감작업에서 우수한 성과를 보였습니다.',
    '최근 야간 작업 선호도가 증가했습니다. 야간 일자리를 더 많이 추천드리겠습니다.',
    '강남구 지역에서의 평점이 높아 해당 지역 일자리를 우선 추천합니다.'
  ]);
  const [learningStatus, setLearningStatus] = useState({
    totalInteractions: 156,
    accuracyRate: 89.5,
    lastUpdate: '2024-12-30 15:30'
  });

  useEffect(() => {
    // AI 매칭 로직 시뮬레이션
    const matchedJobs = SAMPLE_JOBS
      .filter(job => job.wage >= preferences.minWage)
      .filter(job => preferences.preferredWorkTypes.some(type => job.workType === type) || preferences.preferredWorkTypes.length === 0)
      .sort((a, b) => b.matchScore - a.matchScore);
    
    setJobs(matchedJobs);
  }, [preferences]);

  const filteredJobs = jobs.filter(job => {
    if (filterType === 'all') return true;
    return job.urgency === filterType;
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high': return '급구';
      case 'medium': return '보통';
      case 'low': return '여유';
      default: return '보통';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-orange-600 bg-orange-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">스마트 매칭</h1>
          <p className="text-gray-600">AI가 당신의 스킬과 선호도를 분석해 최적의 일자리를 추천합니다</p>
        </div>

        {/* AI 학습 상태 및 인사이트 */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">🤖 AI 매칭 엔진 상태</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              실시간 학습 중
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{learningStatus.totalInteractions}</div>
              <div className="text-sm text-gray-600">총 상호작용</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{learningStatus.accuracyRate}%</div>
              <div className="text-sm text-gray-600">추천 정확도</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">마지막 학습</div>
              <div className="font-medium text-gray-900">{learningStatus.lastUpdate}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-3">AI 인사이트</h3>
            <div className="space-y-2">
              {aiInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-600 mt-0.5">💡</span>
                  <span className="text-sm text-blue-800">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 매칭 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
            <div className="text-sm text-gray-600">추천 일자리</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter(j => j.matchScore >= 90).length}
            </div>
            <div className="text-sm text-gray-600">고도 일치</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">
              {jobs.filter(j => j.urgency === 'high').length}
            </div>
            <div className="text-sm text-gray-600">긴급 모집</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(jobs.reduce((sum, j) => sum + j.matchScore, 0) / jobs.length)}%
            </div>
            <div className="text-sm text-gray-600">평균 일치도</div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 매칭 설정 사이드바 */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">매칭 설정</h3>
                <button
                  onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
                  className="lg:hidden text-gray-500"
                >
                  📋
                </button>
              </div>
              
              <div className={`space-y-4 ${!isPreferencesOpen ? 'hidden lg:block' : ''}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최대 거리 (km)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={preferences.maxDistance}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      maxDistance: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500">{preferences.maxDistance}km</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최소 일당 (원)
                  </label>
                  <input
                    type="range"
                    min="120000"
                    max="300000"
                    step="10000"
                    value={preferences.minWage}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      minWage: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500">
                    {(preferences.minWage / 10000).toFixed(0)}만원
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    선호 작업 유형
                  </label>
                  <div className="space-y-2">
                    {['마감작업', '철거작업', '도색작업', '전기작업', '배관작업'].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.preferredWorkTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPreferences({
                                ...preferences,
                                preferredWorkTypes: [...preferences.preferredWorkTypes, type]
                              });
                            } else {
                              setPreferences({
                                ...preferences,
                                preferredWorkTypes: preferences.preferredWorkTypes.filter(t => t !== type)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    // AI 재매칭 시뮬레이션
                    const rematchedJobs = [...SAMPLE_JOBS]
                      .map(job => ({
                        ...job,
                        matchScore: Math.max(60, Math.min(98, job.matchScore + Math.random() * 10 - 5))
                      }))
                      .sort((a, b) => b.matchScore - a.matchScore);
                    setJobs(rematchedJobs);
                    
                    // 학습 상태 업데이트
                    setLearningStatus(prev => ({
                      ...prev,
                      totalInteractions: prev.totalInteractions + 1,
                      accuracyRate: Math.min(95, prev.accuracyRate + Math.random() * 0.5),
                      lastUpdate: new Date().toLocaleString('ko-KR').slice(0, -3)
                    }));
                    
                    // 새로운 AI 인사이트 추가
                    const newInsights = [
                      '사용자 피드백을 반영하여 매칭 알고리즘을 개선했습니다.',
                      '최근 선택한 일자리 패턴을 학습하여 추천 정확도가 향상되었습니다.',
                      '선호하는 작업 시간대와 지역을 더 정확히 파악했습니다.'
                    ];
                    setAiInsights(newInsights);
                  }}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 text-sm"
                >
                  🤖 AI 재매칭
                </button>
                
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-900 mb-2">매칭 학습 정보</h4>
                  <div className="text-xs text-purple-700 space-y-1">
                    <div>• 지원한 일자리: 학습에 반영됨</div>
                    <div>• 완료한 작업: 가중치 증가</div>
                    <div>• 평점 5.0: 유사 일자리 우선순위 상승</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 일자리 목록 */}
          <div className="lg:w-3/4">
            {/* 필터 탭 */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {[
                { key: 'all', label: '전체', count: filteredJobs.length },
                { key: 'high', label: '긴급', count: jobs.filter(j => j.urgency === 'high').length },
                { key: 'medium', label: '보통', count: jobs.filter(j => j.urgency === 'medium').length },
                { key: 'low', label: '여유', count: jobs.filter(j => j.urgency === 'low').length }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    filterType === filter.key
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            {/* 일자리 카드 */}
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-orange-500">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(job.urgency)}`}>
                          {getUrgencyText(job.urgency)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>🏢 {job.company}</span>
                        <span>📍 {job.location}</span>
                        <span>⏰ {job.duration}</span>
                        <span className="text-gray-400">{job.posted}</span>
                      </div>
                      <div className="text-xl font-bold text-green-600 mb-2">
                        일당 {(job.wage / 10000).toFixed(0)}만원
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 md:mt-0">
                      <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${getMatchScoreColor(job.matchScore)}`}>
                        🎯 매칭도 {job.matchScore}%
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{job.description}</p>

                  {/* AI 매칭 분석 */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">🤖 AI 매칭 분석</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {job.matchReasons.map((reason, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-blue-800">
                          <span className="text-green-600">✓</span>
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 요구사항 및 우대사항 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">필수 요구사항</h4>
                      <div className="space-y-1">
                        {job.requirements.map((req, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="text-red-500">•</span>
                            {req}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">우대사항</h4>
                      <div className="flex flex-wrap gap-1">
                        {job.preferredSkills.map((skill, index) => (
                          <span 
                            key={index}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 text-center text-sm font-medium"
                    >
                      상세보기
                    </Link>
                    <button 
                      onClick={() => {
                        // 지원 시 AI 학습 데이터 수집
                        setLearningStatus(prev => ({
                          ...prev,
                          totalInteractions: prev.totalInteractions + 1,
                          accuracyRate: job.matchScore >= 85 ? Math.min(95, prev.accuracyRate + 0.1) : prev.accuracyRate
                        }));
                        alert('지원이 완료되었습니다. AI가 이 선택을 학습합니다.');
                      }}
                      className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 text-sm font-medium"
                    >
                      🚀 즉시 지원
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">매칭되는 일자리가 없습니다</h3>
                <p className="text-gray-600 mb-4">매칭 설정을 조정해보세요</p>
                <button
                  onClick={() => setPreferences({
                    ...preferences,
                    maxDistance: 50,
                    minWage: 120000,
                    preferredWorkTypes: []
                  })}
                  className="bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 text-sm"
                >
                  설정 초기화
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}