'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface AnalyticsData {
  overview: {
    totalJobs: number;
    totalEarnings: number;
    averageRating: number;
    totalHours: number;
    growthRate: number;
  };
  monthlyData: {
    month: string;
    jobs: number;
    earnings: number;
    hours: number;
    rating: number;
  }[];
  categoryData: {
    category: string;
    jobs: number;
    earnings: number;
    percentage: number;
    avgRating: number;
  }[];
  timeSlotData: {
    timeSlot: string;
    jobs: number;
    avgWage: number;
  }[];
  locationData: {
    location: string;
    jobs: number;
    avgDistance: number;
  }[];
  weeklyPattern: {
    day: string;
    jobs: number;
    earnings: number;
  }[];
}

const SAMPLE_ANALYTICS: AnalyticsData = {
  overview: {
    totalJobs: 45,
    totalEarnings: 8750000,
    averageRating: 4.7,
    totalHours: 356,
    growthRate: 23.5
  },
  monthlyData: [
    { month: '7월', jobs: 8, earnings: 1600000, hours: 64, rating: 4.5 },
    { month: '8월', jobs: 12, earnings: 2400000, hours: 96, rating: 4.6 },
    { month: '9월', jobs: 10, earnings: 2000000, hours: 80, rating: 4.8 },
    { month: '10월', jobs: 15, earnings: 3000000, hours: 120, rating: 4.7 },
    { month: '11월', jobs: 18, earnings: 3600000, hours: 144, rating: 4.8 },
    { month: '12월', jobs: 22, earnings: 4400000, hours: 176, rating: 4.9 }
  ],
  categoryData: [
    { category: '마감작업', jobs: 18, earnings: 3600000, percentage: 40, avgRating: 4.8 },
    { category: '철거작업', jobs: 12, earnings: 2400000, percentage: 27, avgRating: 4.6 },
    { category: '도색작업', jobs: 8, earnings: 1600000, percentage: 18, avgRating: 4.7 },
    { category: '전기작업', jobs: 7, earnings: 1400000, percentage: 15, avgRating: 4.5 }
  ],
  timeSlotData: [
    { timeSlot: '오전 (8-12시)', jobs: 25, avgWage: 200000 },
    { timeSlot: '오후 (12-18시)', jobs: 35, avgWage: 195000 },
    { timeSlot: '야간 (18-24시)', jobs: 8, avgWage: 250000 },
    { timeSlot: '새벽 (24-8시)', jobs: 2, avgWage: 300000 }
  ],
  locationData: [
    { location: '강남구', jobs: 15, avgDistance: 5.2 },
    { location: '서초구', jobs: 12, avgDistance: 7.8 },
    { location: '송파구', jobs: 8, avgDistance: 12.3 },
    { location: '마포구', jobs: 6, avgDistance: 15.7 },
    { location: '용산구', jobs: 4, avgDistance: 8.9 }
  ],
  weeklyPattern: [
    { day: '월', jobs: 8, earnings: 1600000 },
    { day: '화', jobs: 7, earnings: 1400000 },
    { day: '수', jobs: 6, earnings: 1200000 },
    { day: '목', jobs: 5, earnings: 1000000 },
    { day: '금', jobs: 4, earnings: 800000 },
    { day: '토', jobs: 9, earnings: 1800000 },
    { day: '일', jobs: 6, earnings: 1200000 }
  ]
};

export default function AnalyticsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [data, setData] = useState<AnalyticsData>(SAMPLE_ANALYTICS);
  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | '1y' | 'all'>('6m');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'categories' | 'insights'>('overview');

  const formatCurrency = (amount: number) => {
    return `${Math.round(amount / 10000)}만원`;
  };

  const getGrowthColor = (rate: number) => {
    return rate > 0 ? 'text-green-600' : rate < 0 ? 'text-red-600' : 'text-gray-600';
  };

  const calculatePeriodGrowth = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">분석 대시보드</h1>
          <p className="text-gray-600">상세한 활동 분석과 인사이트를 제공합니다</p>
        </div>

        {/* 기간 선택 */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: '3m', label: '최근 3개월' },
              { key: '6m', label: '최근 6개월' },
              { key: '1y', label: '최근 1년' },
              { key: 'all', label: '전체 기간' }
            ].map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedPeriod === period.key
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: '종합 현황', icon: '📊' },
                { key: 'trends', label: '트렌드 분석', icon: '📈' },
                { key: 'categories', label: '카테고리 분석', icon: '🎯' },
                { key: 'insights', label: '인사이트', icon: '💡' }
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

        {/* 종합 현황 */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 일자리</p>
                    <p className="text-2xl font-bold text-gray-900">{data.overview.totalJobs}</p>
                    <p className={`text-sm ${getGrowthColor(data.overview.growthRate)}`}>
                      {data.overview.growthRate > 0 ? '+' : ''}{data.overview.growthRate.toFixed(1)}% vs 지난달
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    💼
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 수익</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.overview.totalEarnings)}</p>
                    <p className={`text-sm ${getGrowthColor(25.3)}`}>
                      +25.3% vs 지난달
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    💰
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">평균 평점</p>
                    <p className="text-2xl font-bold text-gray-900">{data.overview.averageRating}</p>
                    <p className={`text-sm ${getGrowthColor(4.2)}`}>
                      +4.2% vs 지난달
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    ⭐
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 근무시간</p>
                    <p className="text-2xl font-bold text-gray-900">{data.overview.totalHours}h</p>
                    <p className={`text-sm ${getGrowthColor(18.7)}`}>
                      +18.7% vs 지난달
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    ⏰
                  </div>
                </div>
              </div>
            </div>

            {/* 월별 트렌드 차트 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">월별 활동 추이</h3>
              <div className="space-y-6">
                {/* 간단한 텍스트 기반 차트 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">일자리 수</h4>
                  <div className="space-y-2">
                    {data.monthlyData.map((month, index) => (
                      <div key={month.month} className="flex items-center gap-3">
                        <span className="w-8 text-sm text-gray-600">{month.month}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(month.jobs / Math.max(...data.monthlyData.map(m => m.jobs))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="w-8 text-sm font-medium text-gray-900">{month.jobs}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">수익</h4>
                  <div className="space-y-2">
                    {data.monthlyData.map((month, index) => (
                      <div key={month.month} className="flex items-center gap-3">
                        <span className="w-8 text-sm text-gray-600">{month.month}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(month.earnings / Math.max(...data.monthlyData.map(m => m.earnings))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="w-16 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(month.earnings)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 시간대별 분석 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">시간대별 활동</h3>
                <div className="space-y-3">
                  {data.timeSlotData.map((slot) => (
                    <div key={slot.timeSlot} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{slot.timeSlot}</div>
                        <div className="text-sm text-gray-600">{slot.jobs}개 일자리</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{formatCurrency(slot.avgWage)}</div>
                        <div className="text-sm text-gray-600">평균 일당</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">지역별 분석</h3>
                <div className="space-y-3">
                  {data.locationData.map((location) => (
                    <div key={location.location} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{location.location}</div>
                        <div className="text-sm text-gray-600">{location.jobs}개 일자리</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{location.avgDistance}km</div>
                        <div className="text-sm text-gray-600">평균 거리</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 트렌드 분석 */}
        {selectedTab === 'trends' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">요일별 활동 패턴</h3>
              <div className="grid grid-cols-7 gap-2">
                {data.weeklyPattern.map((day) => (
                  <div key={day.day} className="text-center">
                    <div className="bg-blue-100 rounded p-4 mb-2">
                      <div className="text-sm font-medium text-blue-900">{day.day}</div>
                      <div 
                        className="bg-blue-500 rounded mt-2 mx-auto"
                        style={{ 
                          height: `${(day.jobs / Math.max(...data.weeklyPattern.map(d => d.jobs))) * 60}px`,
                          width: '8px'
                        }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600">{day.jobs}개</div>
                    <div className="text-xs text-gray-500">{formatCurrency(day.earnings)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">성장 지표</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">+{data.overview.growthRate.toFixed(1)}%</div>
                  <div className="text-sm text-green-700">일자리 증가율</div>
                  <div className="text-xs text-gray-600 mt-1">지난달 대비</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">+25.3%</div>
                  <div className="text-sm text-blue-700">수익 증가율</div>
                  <div className="text-xs text-gray-600 mt-1">지난달 대비</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">+4.2%</div>
                  <div className="text-sm text-purple-700">평점 개선</div>
                  <div className="text-xs text-gray-600 mt-1">지난달 대비</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 카테고리 분석 */}
        {selectedTab === 'categories' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">작업 유형별 분석</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">일자리 분포</h4>
                  <div className="space-y-3">
                    {data.categoryData.map((category) => (
                      <div key={category.category}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{category.category}</span>
                          <span className="text-sm text-gray-600">{category.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">카테고리별 성과</h4>
                  <div className="space-y-4">
                    {data.categoryData.map((category) => (
                      <div key={category.category} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-gray-900">{category.category}</h5>
                          <span className="text-yellow-600">⭐ {category.avgRating}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">일자리 수</div>
                            <div className="font-medium text-gray-900">{category.jobs}개</div>
                          </div>
                          <div>
                            <div className="text-gray-600">총 수익</div>
                            <div className="font-medium text-gray-900">{formatCurrency(category.earnings)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 인사이트 */}
        {selectedTab === 'insights' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    💡
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">주요 인사이트</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">최고 성과 작업 유형</h4>
                    <p className="text-sm text-green-700 mt-1">
                      마감작업에서 가장 높은 평점(4.8)과 수익을 기록했습니다.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">최적 근무 시간</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      야간 시간대(18-24시)에 가장 높은 시급을 받고 있습니다.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900">성장 추세</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      지난 6개월간 꾸준한 상승세를 보이고 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    📈
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">개선 제안</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-900">지역 확장</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      송파구, 마포구 지역의 일자리 비중을 늘려보세요.
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900">스킬 개발</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      전기작업 분야 인증을 취득하면 더 높은 수익을 얻을 수 있습니다.
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-900">시간 최적화</h4>
                    <p className="text-sm text-red-700 mt-1">
                      평일 오후 시간대 활용도를 높여보세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">목표 달성 현황</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="transparent"/>
                      <circle 
                        cx="40" cy="40" r="36" 
                        stroke="#10b981" strokeWidth="8" fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - 0.78)}`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">78%</span>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900">월 수익 목표</h4>
                  <p className="text-sm text-gray-600">목표: 500만원</p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="transparent"/>
                      <circle 
                        cx="40" cy="40" r="36" 
                        stroke="#3b82f6" strokeWidth="8" fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - 0.94)}`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">94%</span>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900">평점 목표</h4>
                  <p className="text-sm text-gray-600">목표: 4.5점</p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="transparent"/>
                      <circle 
                        cx="40" cy="40" r="36" 
                        stroke="#f59e0b" strokeWidth="8" fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - 0.67)}`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">67%</span>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900">일자리 목표</h4>
                  <p className="text-sm text-gray-600">목표: 30개/월</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}