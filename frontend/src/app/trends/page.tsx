'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface RegionTrend {
  region: string;
  totalJobs: number;
  averageWage: number;
  growthRate: number;
  hotCategories: string[];
  demandIndex: number;
  competitionLevel: 'low' | 'medium' | 'high';
  monthlyData: {
    month: string;
    jobs: number;
    wage: number;
  }[];
}

interface CategoryTrend {
  category: string;
  totalJobs: number;
  growthRate: number;
  averageWage: number;
  regions: {
    region: string;
    jobs: number;
    wage: number;
  }[];
  seasonality: {
    season: string;
    demand: number;
  }[];
}

interface MarketInsight {
  title: string;
  type: 'opportunity' | 'warning' | 'info';
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

const SAMPLE_REGION_TRENDS: RegionTrend[] = [
  {
    region: '강남구',
    totalJobs: 156,
    averageWage: 210000,
    growthRate: 15.2,
    hotCategories: ['마감작업', '전기작업', '배관작업'],
    demandIndex: 85,
    competitionLevel: 'high',
    monthlyData: [
      { month: '7월', jobs: 20, wage: 195000 },
      { month: '8월', jobs: 24, wage: 200000 },
      { month: '9월', jobs: 22, wage: 205000 },
      { month: '10월', jobs: 28, wage: 210000 },
      { month: '11월', jobs: 32, wage: 215000 },
      { month: '12월', jobs: 30, wage: 220000 }
    ]
  },
  {
    region: '서초구',
    totalJobs: 128,
    averageWage: 195000,
    growthRate: 12.8,
    hotCategories: ['철거작업', '도색작업', '마감작업'],
    demandIndex: 78,
    competitionLevel: 'medium',
    monthlyData: [
      { month: '7월', jobs: 18, wage: 185000 },
      { month: '8월', jobs: 20, wage: 188000 },
      { month: '9월', jobs: 19, wage: 190000 },
      { month: '10월', jobs: 23, wage: 195000 },
      { month: '11월', jobs: 26, wage: 200000 },
      { month: '12월', jobs: 22, wage: 198000 }
    ]
  },
  {
    region: '송파구',
    totalJobs: 94,
    averageWage: 185000,
    growthRate: 8.5,
    hotCategories: ['도색작업', '마감작업', '조경작업'],
    demandIndex: 65,
    competitionLevel: 'medium',
    monthlyData: [
      { month: '7월', jobs: 12, wage: 175000 },
      { month: '8월', jobs: 15, wage: 180000 },
      { month: '9월', jobs: 14, wage: 182000 },
      { month: '10월', jobs: 17, wage: 185000 },
      { month: '11월', jobs: 19, wage: 188000 },
      { month: '12월', jobs: 17, wage: 190000 }
    ]
  },
  {
    region: '마포구',
    totalJobs: 112,
    averageWage: 200000,
    growthRate: 18.7,
    hotCategories: ['전기작업', '마감작업', '설비작업'],
    demandIndex: 82,
    competitionLevel: 'low',
    monthlyData: [
      { month: '7월', jobs: 14, wage: 190000 },
      { month: '8월', jobs: 16, wage: 192000 },
      { month: '9월', jobs: 18, wage: 195000 },
      { month: '10월', jobs: 20, wage: 200000 },
      { month: '11월', jobs: 22, wage: 205000 },
      { month: '12월', jobs: 22, wage: 210000 }
    ]
  },
  {
    region: '용산구',
    totalJobs: 87,
    averageWage: 192000,
    growthRate: 6.3,
    hotCategories: ['마감작업', '도색작업', '청소작업'],
    demandIndex: 58,
    competitionLevel: 'low',
    monthlyData: [
      { month: '7월', jobs: 11, wage: 185000 },
      { month: '8월', jobs: 13, wage: 188000 },
      { month: '9월', jobs: 12, wage: 190000 },
      { month: '10월', jobs: 15, wage: 192000 },
      { month: '11월', jobs: 18, wage: 195000 },
      { month: '12월', jobs: 18, wage: 198000 }
    ]
  }
];

const SAMPLE_CATEGORY_TRENDS: CategoryTrend[] = [
  {
    category: '마감작업',
    totalJobs: 198,
    growthRate: 22.5,
    averageWage: 205000,
    regions: [
      { region: '강남구', jobs: 45, wage: 220000 },
      { region: '서초구', jobs: 38, wage: 210000 },
      { region: '마포구', jobs: 35, wage: 200000 },
      { region: '송파구', jobs: 28, wage: 195000 },
      { region: '용산구', jobs: 25, wage: 190000 }
    ],
    seasonality: [
      { season: '봄', demand: 85 },
      { season: '여름', demand: 92 },
      { season: '가을', demand: 88 },
      { season: '겨울', demand: 78 }
    ]
  },
  {
    category: '철거작업',
    totalJobs: 145,
    growthRate: 8.3,
    averageWage: 180000,
    regions: [
      { region: '서초구', jobs: 35, wage: 185000 },
      { region: '강남구', jobs: 32, wage: 190000 },
      { region: '송파구', jobs: 28, wage: 175000 },
      { region: '마포구', jobs: 25, wage: 180000 },
      { region: '용산구', jobs: 25, wage: 175000 }
    ],
    seasonality: [
      { season: '봄', demand: 75 },
      { season: '여름', demand: 68 },
      { season: '가을', demand: 82 },
      { season: '겨울', demand: 65 }
    ]
  },
  {
    category: '전기작업',
    totalJobs: 123,
    growthRate: 28.9,
    averageWage: 225000,
    regions: [
      { region: '강남구', jobs: 38, wage: 235000 },
      { region: '마포구', jobs: 32, wage: 230000 },
      { region: '서초구', jobs: 25, wage: 220000 },
      { region: '송파구', jobs: 18, wage: 215000 },
      { region: '용산구', jobs: 10, wage: 210000 }
    ],
    seasonality: [
      { season: '봄', demand: 88 },
      { season: '여름', demand: 95 },
      { season: '가을', demand: 90 },
      { season: '겨울', demand: 92 }
    ]
  }
];

const SAMPLE_MARKET_INSIGHTS: MarketInsight[] = [
  {
    title: '마포구 전기작업 급성장',
    type: 'opportunity',
    description: '마포구 지역 전기작업 수요가 전월 대비 35% 증가했습니다. 신규 오피스텔 건설이 주요 원인입니다.',
    impact: 'high',
    actionable: true
  },
  {
    title: '강남구 경쟁 심화',
    type: 'warning',
    description: '강남구 지역 일자리 경쟁이 심화되고 있습니다. 평균 지원자 수가 20% 증가했습니다.',
    impact: 'medium',
    actionable: true
  },
  {
    title: '겨울철 도색작업 수요 감소',
    type: 'info',
    description: '계절적 요인으로 도색작업 수요가 25% 감소했습니다. 내년 3월부터 회복 예상됩니다.',
    impact: 'medium',
    actionable: false
  },
  {
    title: '용산구 신규 기회 발견',
    type: 'opportunity',
    description: '용산구 지역 경쟁도가 낮아 새로운 기회가 많습니다. 평균 경쟁률이 타 지역 대비 40% 낮습니다.',
    impact: 'high',
    actionable: true
  }
];

export default function TrendsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [regionTrends, setRegionTrends] = useState<RegionTrend[]>(SAMPLE_REGION_TRENDS);
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>(SAMPLE_CATEGORY_TRENDS);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>(SAMPLE_MARKET_INSIGHTS);
  const [selectedView, setSelectedView] = useState<'regions' | 'categories' | 'insights'>('regions');
  const [selectedRegion, setSelectedRegion] = useState<RegionTrend | null>(null);

  const formatCurrency = (amount: number) => {
    return `${Math.round(amount / 10000)}만원`;
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-700 bg-red-100';
      case 'medium': return 'text-orange-700 bg-orange-100';
      case 'low': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getCompetitionText = (level: string) => {
    switch (level) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '알 수 없음';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-green-700 bg-green-100';
      case 'warning': return 'text-red-700 bg-red-100';
      case 'info': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return '🚀';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📊';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">시장 트렌드</h1>
          <p className="text-gray-600">지역별, 카테고리별 일자리 트렌드와 시장 인사이트를 제공합니다</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'regions', label: '지역별 트렌드', icon: '🗺️' },
                { key: 'categories', label: '카테고리 트렌드', icon: '📊' },
                { key: 'insights', label: '시장 인사이트', icon: '💡' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedView(tab.key as any)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedView === tab.key
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

        {/* 지역별 트렌드 */}
        {selectedView === 'regions' && (
          <div className="space-y-8">
            {/* 지역 개요 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regionTrends.map((region) => (
                <div key={region.region} className="bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                     onClick={() => setSelectedRegion(region)}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{region.region}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCompetitionColor(region.competitionLevel)}`}>
                      경쟁도 {getCompetitionText(region.competitionLevel)}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">총 일자리</span>
                      <span className="font-medium text-gray-900">{region.totalJobs}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">평균 일당</span>
                      <span className="font-medium text-gray-900">{formatCurrency(region.averageWage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">성장률</span>
                      <span className={`font-medium ${region.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {region.growthRate > 0 ? '+' : ''}{region.growthRate.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">인기 카테고리</span>
                      <div className="flex flex-wrap gap-1">
                        {region.hotCategories.slice(0, 2).map((category) => (
                          <span key={category} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">수요 지수</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-orange-500 h-1.5 rounded-full"
                            style={{ width: `${region.demandIndex}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{region.demandIndex}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 선택된 지역 상세 */}
            {selectedRegion && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedRegion.region} 상세 분석</h3>
                  <button
                    onClick={() => setSelectedRegion(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">월별 일자리 수</h4>
                    <div className="space-y-3">
                      {selectedRegion.monthlyData.map((month) => (
                        <div key={month.month} className="flex items-center gap-3">
                          <span className="w-8 text-sm text-gray-600">{month.month}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(month.jobs / Math.max(...selectedRegion.monthlyData.map(m => m.jobs))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="w-8 text-sm font-medium text-gray-900">{month.jobs}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">월별 평균 일당</h4>
                    <div className="space-y-3">
                      {selectedRegion.monthlyData.map((month) => (
                        <div key={month.month} className="flex items-center gap-3">
                          <span className="w-8 text-sm text-gray-600">{month.month}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(month.wage / Math.max(...selectedRegion.monthlyData.map(m => m.wage))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="w-16 text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(month.wage)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-3">인기 카테고리</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRegion.hotCategories.map((category) => (
                      <span key={category} className="bg-orange-100 text-orange-700 px-3 py-1 rounded">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 카테고리별 트렌드 */}
        {selectedView === 'categories' && (
          <div className="space-y-8">
            {categoryTrends.map((category) => (
              <div key={category.category} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{category.category}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>총 {category.totalJobs}개 일자리</span>
                      <span className={`font-medium ${category.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {category.growthRate > 0 ? '+' : ''}{category.growthRate.toFixed(1)}% 성장
                      </span>
                      <span>평균 {formatCurrency(category.averageWage)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">지역별 분포</h4>
                    <div className="space-y-3">
                      {category.regions.map((region) => (
                        <div key={region.region} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium text-gray-900">{region.region}</div>
                            <div className="text-sm text-gray-600">{region.jobs}개 일자리</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">{formatCurrency(region.wage)}</div>
                            <div className="text-sm text-gray-600">평균 일당</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">계절별 수요</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {category.seasonality.map((season) => (
                        <div key={season.season} className="text-center p-3 bg-gray-50 rounded">
                          <div className="text-lg font-semibold text-gray-900">{season.demand}%</div>
                          <div className="text-sm text-gray-600">{season.season}</div>
                          <div 
                            className="w-full bg-gray-200 rounded-full h-1.5 mt-2"
                          >
                            <div 
                              className="bg-orange-500 h-1.5 rounded-full"
                              style={{ width: `${season.demand}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 시장 인사이트 */}
        {selectedView === 'insights' && (
          <div className="space-y-6">
            {marketInsights.map((insight, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{getInsightIcon(insight.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getInsightColor(insight.type)}`}>
                        {insight.type === 'opportunity' ? '기회' : insight.type === 'warning' ? '주의' : '정보'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        insight.impact === 'high' ? 'text-red-700 bg-red-100' :
                        insight.impact === 'medium' ? 'text-orange-700 bg-orange-100' :
                        'text-gray-700 bg-gray-100'
                      }`}>
                        {insight.impact === 'high' ? '높은 영향' : insight.impact === 'medium' ? '보통 영향' : '낮은 영향'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{insight.description}</p>
                    {insight.actionable && (
                      <div className="flex gap-2">
                        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium">
                          관련 일자리 보기
                        </button>
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium">
                          알림 설정
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* 추가 분석 도구 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">맞춤형 시장 분석</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <h4 className="font-medium text-gray-900 mb-2">개인 맞춤 분석</h4>
                    <p className="text-sm text-gray-600 mb-3">당신의 스킬과 위치에 맞는 시장 분석</p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                      분석 받기
                    </button>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <h4 className="font-medium text-gray-900 mb-2">경쟁 분석</h4>
                    <p className="text-sm text-gray-600 mb-3">관심 지역의 경쟁도와 성공 확률</p>
                    <button className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                      확인하기
                    </button>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🔮</div>
                    <h4 className="font-medium text-gray-900 mb-2">수요 예측</h4>
                    <p className="text-sm text-gray-600 mb-3">다음 달 일자리 수요 예측</p>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700">
                      예측 보기
                    </button>
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