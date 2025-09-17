'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface EarningsData {
  monthly: {
    month: string;
    actual: number;
    predicted: number;
    jobs: number;
  }[];
  weekly: {
    week: string;
    earnings: number;
    jobs: number;
    avgDailyRate: number;
  }[];
  breakdown: {
    category: string;
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    forecast: number;
  }[];
}

interface ForecastModel {
  id: string;
  name: string;
  description: string;
  accuracy: number;
  predictions: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
  };
  factors: string[];
}

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  isActive: boolean;
}

const SAMPLE_EARNINGS_DATA: EarningsData = {
  monthly: [
    { month: '7월', actual: 1600000, predicted: 1550000, jobs: 8 },
    { month: '8월', actual: 2400000, predicted: 2300000, jobs: 12 },
    { month: '9월', actual: 2000000, predicted: 2100000, jobs: 10 },
    { month: '10월', actual: 3000000, predicted: 2900000, jobs: 15 },
    { month: '11월', actual: 3600000, predicted: 3500000, jobs: 18 },
    { month: '12월', actual: 4400000, predicted: 4200000, jobs: 22 },
    { month: '1월', actual: 0, predicted: 4800000, jobs: 0 },
    { month: '2월', actual: 0, predicted: 5200000, jobs: 0 }
  ],
  weekly: [
    { week: '12/2-12/8', earnings: 800000, jobs: 4, avgDailyRate: 200000 },
    { week: '12/9-12/15', earnings: 1200000, jobs: 6, avgDailyRate: 200000 },
    { week: '12/16-12/22', earnings: 1000000, jobs: 5, avgDailyRate: 200000 },
    { week: '12/23-12/29', earnings: 1400000, jobs: 7, avgDailyRate: 200000 }
  ],
  breakdown: [
    { category: '마감작업', amount: 1800000, percentage: 41, trend: 'up', forecast: 2200000 },
    { category: '철거작업', amount: 1200000, percentage: 27, trend: 'stable', forecast: 1250000 },
    { category: '도색작업', amount: 800000, percentage: 18, trend: 'down', forecast: 750000 },
    { category: '전기작업', amount: 600000, percentage: 14, trend: 'up', forecast: 800000 }
  ]
};

const SAMPLE_FORECAST_MODELS: ForecastModel[] = [
  {
    id: 'ai_basic',
    name: 'AI 기본 예측',
    description: '과거 6개월 데이터 기반 머신러닝 예측',
    accuracy: 87.5,
    predictions: {
      nextMonth: 4800000,
      nextQuarter: 14500000,
      nextYear: 58000000
    },
    factors: ['과거 수익 패턴', '계절성', '작업 카테고리 분포']
  },
  {
    id: 'market_trend',
    name: '시장 트렌드 예측',
    description: '시장 동향과 경제 지표를 반영한 예측',
    accuracy: 82.3,
    predictions: {
      nextMonth: 5200000,
      nextQuarter: 15200000,
      nextYear: 62000000
    },
    factors: ['지역별 시장 동향', '건설업 경기', '최저임금 변동', '인플레이션율']
  },
  {
    id: 'personal_growth',
    name: '개인 성장 예측',
    description: '스킬 향상과 평점 개선을 고려한 예측',
    accuracy: 91.2,
    predictions: {
      nextMonth: 5500000,
      nextQuarter: 16800000,
      nextYear: 68000000
    },
    factors: ['평점 향상', '인증 취득', '경험 축적', '리피트 고객']
  }
];

const SAMPLE_GOALS: Goal[] = [
  {
    id: 'goal1',
    title: '월 500만원 달성',
    targetAmount: 5000000,
    currentAmount: 4400000,
    deadline: '2025-01-31',
    category: '단기',
    isActive: true
  },
  {
    id: 'goal2',
    title: '분기 1500만원 달성',
    targetAmount: 15000000,
    currentAmount: 10000000,
    deadline: '2025-03-31',
    category: '중기',
    isActive: true
  },
  {
    id: 'goal3',
    title: '연간 6000만원 달성',
    targetAmount: 60000000,
    currentAmount: 17400000,
    deadline: '2025-12-31',
    category: '장기',
    isActive: true
  }
];

export default function EarningsForecastPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [earningsData, setEarningsData] = useState<EarningsData>(SAMPLE_EARNINGS_DATA);
  const [forecastModels, setForecastModels] = useState<ForecastModel[]>(SAMPLE_FORECAST_MODELS);
  const [goals, setGoals] = useState<Goal[]>(SAMPLE_GOALS);
  const [selectedModel, setSelectedModel] = useState<ForecastModel>(SAMPLE_FORECAST_MODELS[2]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'forecast' | 'goals' | 'optimization'>('overview');
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  const formatCurrency = (amount: number) => {
    return `${Math.round(amount / 10000)}만원`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const calculateGoalProgress = (goal: Goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">수익 분석 & 예측</h1>
          <p className="text-gray-600">AI 기반 수익 예측과 목표 달성을 위한 인사이트를 제공합니다</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: '수익 현황', icon: '💰' },
                { key: 'forecast', label: 'AI 예측', icon: '🔮' },
                { key: 'goals', label: '목표 관리', icon: '🎯' },
                { key: 'optimization', label: '최적화 제안', icon: '🚀' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 수익 현황 */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* 월별 수익 트렌드 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">월별 수익 트렌드</h3>
              <div className="space-y-4">
                {earningsData.monthly.filter(m => m.actual > 0).map((month) => (
                  <div key={month.month} className="flex items-center gap-4">
                    <span className="w-12 text-sm text-gray-600">{month.month}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div 
                        className="bg-blue-500 h-4 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(month.actual / Math.max(...earningsData.monthly.map(m => m.actual))) * 100}%` }}
                      >
                        <span className="text-xs text-white font-medium">
                          {formatCurrency(month.actual)}
                        </span>
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <span className="text-sm text-gray-600">{month.jobs}개</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 카테고리별 분석 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">카테고리별 수익 분석</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {earningsData.breakdown.map((item) => (
                    <div key={item.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`text-lg ${getTrendColor(item.trend)}`}>
                          {getTrendIcon(item.trend)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.category}</div>
                          <div className="text-sm text-gray-600">{item.percentage}% 비중</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{formatCurrency(item.amount)}</div>
                        <div className="text-sm text-gray-600">이번 달</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">주간 수익 패턴</h4>
                  {earningsData.weekly.map((week) => (
                    <div key={week.week} className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-900">{week.week}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(week.earnings)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{week.jobs}개 일자리</span>
                        <span>일평균 {formatCurrency(week.avgDailyRate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI 예측 */}
        {selectedTab === 'forecast' && (
          <div className="space-y-8">
            {/* 예측 모델 선택 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">예측 모델 선택</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {forecastModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedModel.id === model.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{model.name}</h4>
                      <span className="text-sm font-medium text-green-600">{model.accuracy}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                    <div className="text-xs text-gray-500">
                      주요 요인: {model.factors.slice(0, 2).join(', ')}
                      {model.factors.length > 2 && ` 외 ${model.factors.length - 2}개`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 선택된 모델의 예측 결과 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {selectedModel.name} - 수익 예측
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {formatCurrency(selectedModel.predictions.nextMonth)}
                  </div>
                  <div className="text-sm text-green-700 font-medium">다음 달 예상</div>
                  <div className="text-xs text-gray-600 mt-1">
                    현재 대비 +{((selectedModel.predictions.nextMonth / 4400000 - 1) * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {formatCurrency(selectedModel.predictions.nextQuarter)}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">다음 분기 예상</div>
                  <div className="text-xs text-gray-600 mt-1">
                    월평균 {formatCurrency(selectedModel.predictions.nextQuarter / 3)}
                  </div>
                </div>
                
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {formatCurrency(selectedModel.predictions.nextYear)}
                  </div>
                  <div className="text-sm text-purple-700 font-medium">연간 예상</div>
                  <div className="text-xs text-gray-600 mt-1">
                    월평균 {formatCurrency(selectedModel.predictions.nextYear / 12)}
                  </div>
                </div>
              </div>

              {/* 예측 차트 */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-4">월별 예측 트렌드</h4>
                <div className="space-y-3">
                  {earningsData.monthly.map((month) => (
                    <div key={month.month} className="flex items-center gap-4">
                      <span className="w-12 text-sm text-gray-600">{month.month}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                        {month.actual > 0 ? (
                          <div 
                            className="bg-blue-500 h-3 rounded-full"
                            style={{ width: `${(month.actual / Math.max(...earningsData.monthly.map(m => Math.max(m.actual, m.predicted)))) * 100}%` }}
                          ></div>
                        ) : (
                          <div 
                            className="bg-orange-400 h-3 rounded-full opacity-70"
                            style={{ width: `${(month.predicted / Math.max(...earningsData.monthly.map(m => Math.max(m.actual, m.predicted)))) * 100}%` }}
                          ></div>
                        )}
                      </div>
                      <div className="w-20 text-right">
                        <span className={`text-sm font-medium ${month.actual > 0 ? 'text-gray-900' : 'text-orange-600'}`}>
                          {formatCurrency(month.actual || month.predicted)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>실제 수익</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded opacity-70"></div>
                    <span>예측 수익</span>
                  </div>
                </div>
              </div>

              {/* 예측 요인 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">예측 주요 요인</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedModel.factors.map((factor, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded text-center">
                      <div className="text-sm text-gray-700">{factor}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 목표 관리 */}
        {selectedTab === 'goals' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">수익 목표</h3>
              <button
                onClick={() => setIsAddingGoal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
              >
                새 목표 추가
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {goals.filter(g => g.isActive).map((goal) => (
                <div key={goal.id} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        goal.category === '단기' ? 'bg-green-100 text-green-700' :
                        goal.category === '중기' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {goal.category}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      마감일: {new Date(goal.deadline).toLocaleDateString('ko-KR')} 
                      ({getDaysUntilDeadline(goal.deadline)}일 남음)
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">진행률</span>
                      <span className="font-medium text-gray-900">
                        {calculateGoalProgress(goal).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${calculateGoalProgress(goal)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">현재</span>
                      <span className="font-medium">{formatCurrency(goal.currentAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">목표</span>
                      <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">부족</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(goal.targetAmount - goal.currentAmount)}
                      </span>
                    </div>
                  </div>

                  {selectedModel && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-600 mb-1">AI 예측 달성 가능성</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(85, calculateGoalProgress(goal) + 20)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-green-600">
                          {Math.min(85, Math.round(calculateGoalProgress(goal) + 20))}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 목표 추가 모달 */}
            {isAddingGoal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">새 목표 추가</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="목표 제목"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      placeholder="목표 금액 (원)"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option value="">카테고리 선택</option>
                      <option value="단기">단기 (1개월)</option>
                      <option value="중기">중기 (3개월)</option>
                      <option value="장기">장기 (1년)</option>
                    </select>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button className="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700">
                      추가
                    </button>
                    <button 
                      onClick={() => setIsAddingGoal(false)}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 최적화 제안 */}
        {selectedTab === 'optimization' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">수익 극대화 제안</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600">🚀</span>
                      <h4 className="font-medium text-green-900">고수익 카테고리 집중</h4>
                    </div>
                    <p className="text-sm text-green-700 mb-2">
                      전기작업 비중을 25%로 늘리면 월 60만원 추가 수익 예상
                    </p>
                    <button className="text-xs bg-green-600 text-white px-3 py-1 rounded">
                      관련 일자리 보기
                    </button>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600">🎯</span>
                      <h4 className="font-medium text-blue-900">최적 작업 지역</h4>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">
                      마포구 지역 일자리를 30% 늘리면 통근비 절약과 수익 증가 동시 가능
                    </p>
                    <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded">
                      지역 분석 보기
                    </button>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-purple-600">⏰</span>
                      <h4 className="font-medium text-purple-900">시간 최적화</h4>
                    </div>
                    <p className="text-sm text-purple-700 mb-2">
                      야간 작업 비중을 15%로 늘리면 월 80만원 추가 수익 가능
                    </p>
                    <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded">
                      시간대별 분석
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">스킬 개발 로드맵</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">전기기능사 취득</h4>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        우선순위 1
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      예상 수익 증가: 월 120만원
                    </p>
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>진행률</span>
                      <span>60%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">고급 마감 기술</h4>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        우선순위 2
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      예상 수익 증가: 월 80만원
                    </p>
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>진행률</span>
                      <span>25%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">안전관리자 자격</h4>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        우선순위 3
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      예상 수익 증가: 월 50만원
                    </p>
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>진행률</span>
                      <span>0%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-gray-300 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 시뮬레이션 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">수익 시뮬레이션</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">현재 수준 유지</h4>
                  <div className="text-2xl font-bold text-gray-600 mb-2">
                    {formatCurrency(selectedModel.predictions.nextYear * 0.9)}
                  </div>
                  <div className="text-sm text-gray-600">연간 예상 수익</div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">제안사항 50% 적용</h4>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {formatCurrency(selectedModel.predictions.nextYear * 1.15)}
                  </div>
                  <div className="text-sm text-blue-600">연간 예상 수익</div>
                  <div className="text-xs text-green-600 mt-1">
                    +{formatCurrency(selectedModel.predictions.nextYear * 0.25)} 증가
                  </div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">제안사항 100% 적용</h4>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {formatCurrency(selectedModel.predictions.nextYear * 1.4)}
                  </div>
                  <div className="text-sm text-green-600">연간 예상 수익</div>
                  <div className="text-xs text-green-600 mt-1">
                    +{formatCurrency(selectedModel.predictions.nextYear * 0.5)} 증가
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}