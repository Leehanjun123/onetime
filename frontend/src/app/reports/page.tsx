'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface ReportData {
  period: string;
  summary: {
    totalJobs: number;
    totalEarnings: number;
    totalHours: number;
    averageRating: number;
    growthRate: number;
  };
  achievements: {
    title: string;
    description: string;
    value: string;
    type: 'milestone' | 'improvement' | 'streak';
  }[];
  insights: {
    title: string;
    description: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  comparisons: {
    metric: string;
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  sections: string[];
  isActive: boolean;
}

const SAMPLE_REPORT_DATA: ReportData = {
  period: '2024년 12월',
  summary: {
    totalJobs: 22,
    totalEarnings: 4400000,
    totalHours: 176,
    averageRating: 4.9,
    growthRate: 22.2
  },
  achievements: [
    {
      title: '첫 500만원 달성 임박',
      description: '월간 수익이 440만원에 도달하여 500만원 목표에 88% 진행',
      value: '88%',
      type: 'milestone'
    },
    {
      title: '평점 개선',
      description: '평균 평점이 4.7에서 4.9로 0.2점 상승',
      value: '+0.2',
      type: 'improvement'
    },
    {
      title: '연속 근무 기록',
      description: '15일 연속으로 일자리 완료 (개인 최고 기록)',
      value: '15일',
      type: 'streak'
    }
  ],
  insights: [
    {
      title: '마감작업 전문성 인정',
      description: '마감작업 분야에서 평균 평점 4.8점으로 고객 만족도가 높습니다.',
      recommendation: '마감작업 일자리 비중을 늘려 전문성을 더욱 강화하세요.',
      priority: 'high'
    },
    {
      title: '야간 작업 기회 증가',
      description: '야간 작업의 시급이 평균 25% 높지만 참여율이 낮습니다.',
      recommendation: '체력 관리를 전제로 야간 작업 참여를 고려해보세요.',
      priority: 'medium'
    },
    {
      title: '새로운 지역 개척 필요',
      description: '현재 작업 지역이 강남/서초구에 집중되어 있습니다.',
      recommendation: '마포구, 용산구 등 새로운 지역으로 활동 반경을 넓혀보세요.',
      priority: 'low'
    }
  ],
  comparisons: [
    { metric: '일자리 수', current: 22, previous: 18, change: 22.2, trend: 'up' },
    { metric: '총 수익', current: 4400000, previous: 3600000, change: 22.2, trend: 'up' },
    { metric: '평균 평점', current: 4.9, previous: 4.8, change: 2.1, trend: 'up' },
    { metric: '시급', current: 200000, previous: 195000, change: 2.6, trend: 'up' },
    { metric: '작업 시간', current: 176, previous: 144, change: 22.2, trend: 'up' }
  ]
};

const SAMPLE_TEMPLATES: ReportTemplate[] = [
  {
    id: 'weekly_summary',
    name: '주간 요약 리포트',
    description: '주간 활동 요약과 핵심 지표',
    frequency: 'weekly',
    sections: ['요약', '수익 분석', '시간 분석'],
    isActive: true
  },
  {
    id: 'monthly_detailed',
    name: '월간 상세 리포트',
    description: '월간 성과 분석과 개선 방안',
    frequency: 'monthly',
    sections: ['요약', '성과 분석', '인사이트', '목표 진행률', '개선 제안'],
    isActive: true
  },
  {
    id: 'quarterly_strategic',
    name: '분기 전략 리포트',
    description: '분기별 전략 검토와 장기 계획',
    frequency: 'quarterly',
    sections: ['전략 검토', '시장 분석', '경쟁력 평가', '목표 수정'],
    isActive: false
  },
  {
    id: 'yearly_comprehensive',
    name: '연간 종합 리포트',
    description: '연간 성과 총결산과 내년 계획',
    frequency: 'yearly',
    sections: ['연간 총결산', '성장 분석', '시장 변화', '내년 전략'],
    isActive: true
  }
];

export default function ReportsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [reportData, setReportData] = useState<ReportData>(SAMPLE_REPORT_DATA);
  const [templates, setTemplates] = useState<ReportTemplate[]>(SAMPLE_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>(SAMPLE_TEMPLATES[1]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'view' | 'generate' | 'templates' | 'schedule'>('view');

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

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'milestone': return '🎯';
      case 'improvement': return '📈';
      case 'streak': return '🔥';
      default: return '🏆';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700 bg-red-100';
      case 'medium': return 'text-orange-700 bg-orange-100';
      case 'low': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    // 리포트 생성 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsGenerating(false);
  };

  const exportReport = (format: 'pdf' | 'excel' | 'email') => {
    // 리포트 내보내기 시뮬레이션
    alert(`${format.toUpperCase()} 형식으로 내보내기가 시작되었습니다.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">성과 리포트</h1>
          <p className="text-gray-600">자동 생성되는 상세한 성과 분석과 인사이트를 확인하세요</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'view', label: '리포트 보기', icon: '📊' },
                { key: 'generate', label: '리포트 생성', icon: '🤖' },
                { key: 'templates', label: '템플릿 관리', icon: '📝' },
                { key: 'schedule', label: '자동 발송', icon: '📅' }
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

        {/* 리포트 보기 */}
        {selectedTab === 'view' && (
          <div className="space-y-8">
            {/* 리포트 헤더 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{reportData.period} 성과 리포트</h2>
                  <p className="text-gray-600">자동 생성된 상세 분석 리포트</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportReport('pdf')}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => exportReport('excel')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                  >
                    📊 Excel
                  </button>
                  <button
                    onClick={() => exportReport('email')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    📧 이메일
                  </button>
                </div>
              </div>

              {/* 핵심 지표 요약 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{reportData.summary.totalJobs}</div>
                  <div className="text-sm text-blue-700">완료 일자리</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(reportData.summary.totalEarnings)}
                  </div>
                  <div className="text-sm text-green-700">총 수익</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{reportData.summary.totalHours}h</div>
                  <div className="text-sm text-purple-700">총 근무시간</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{reportData.summary.averageRating}</div>
                  <div className="text-sm text-yellow-700">평균 평점</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">+{reportData.summary.growthRate}%</div>
                  <div className="text-sm text-orange-700">성장률</div>
                </div>
              </div>
            </div>

            {/* 주요 성과 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">🏆 주요 성과</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reportData.achievements.map((achievement, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getAchievementIcon(achievement.type)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                        <div className="text-lg font-bold text-orange-600">{achievement.value}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 전월 대비 비교 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">📈 전월 대비 변화</h3>
              <div className="space-y-4">
                {reportData.comparisons.map((comparison, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${getTrendColor(comparison.trend)}`}>
                        {getTrendIcon(comparison.trend)}
                      </span>
                      <span className="font-medium text-gray-900">{comparison.metric}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {comparison.metric.includes('수익') || comparison.metric.includes('시급') ? 
                            formatCurrency(comparison.current) : 
                            comparison.current.toLocaleString()
                          }
                        </div>
                        <div className="text-sm text-gray-600">
                          전월: {comparison.metric.includes('수익') || comparison.metric.includes('시급') ? 
                            formatCurrency(comparison.previous) : 
                            comparison.previous.toLocaleString()
                          }
                        </div>
                      </div>
                      <div className={`font-semibold ${getTrendColor(comparison.trend)}`}>
                        {comparison.change > 0 ? '+' : ''}{comparison.change.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI 인사이트 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">💡 AI 분석 인사이트</h3>
              <div className="space-y-4">
                {reportData.insights.map((insight, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                        {insight.priority === 'high' ? '높음' : insight.priority === 'medium' ? '보통' : '낮음'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{insight.description}</p>
                    <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                      <p className="text-sm text-orange-800">
                        <strong>추천:</strong> {insight.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 리포트 생성 */}
        {selectedTab === 'generate' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">새 리포트 생성</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      리포트 템플릿
                    </label>
                    <select
                      value={selectedTemplate.id}
                      onChange={(e) => {
                        const template = templates.find(t => t.id === e.target.value);
                        if (template) setSelectedTemplate(template);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      분석 기간
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        defaultValue="2024-12-01"
                      />
                      <input
                        type="date"
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        defaultValue="2024-12-31"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      포함할 섹션
                    </label>
                    <div className="space-y-2">
                      {selectedTemplate.sections.map((section, index) => (
                        <label key={index} className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="mr-2 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-700">{section}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={generateReport}
                    disabled={isGenerating}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        리포트 생성 중...
                      </>
                    ) : (
                      <>🤖 AI 리포트 생성</>
                    )}
                  </button>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">선택된 템플릿 정보</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">{selectedTemplate.name}</h5>
                    <p className="text-sm text-gray-600 mb-3">{selectedTemplate.description}</p>
                    
                    <div className="mb-3">
                      <span className="text-xs text-gray-500">빈도: </span>
                      <span className="text-sm font-medium text-gray-700">
                        {selectedTemplate.frequency === 'weekly' ? '주간' :
                         selectedTemplate.frequency === 'monthly' ? '월간' :
                         selectedTemplate.frequency === 'quarterly' ? '분기' : '연간'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-500">포함 섹션:</span>
                      <div className="mt-1">
                        {selectedTemplate.sections.map((section, index) => (
                          <span key={index} className="inline-block bg-white text-gray-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-4">생성 옵션</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2 text-orange-600" defaultChecked />
                        <span className="text-sm text-gray-700">경쟁사 벤치마크 포함</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2 text-orange-600" defaultChecked />
                        <span className="text-sm text-gray-700">시장 트렌드 분석 포함</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2 text-orange-600" />
                        <span className="text-sm text-gray-700">개인정보 마스킹</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2 text-orange-600" defaultChecked />
                        <span className="text-sm text-gray-700">액션 플랜 생성</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 템플릿 관리 */}
        {selectedTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">리포트 템플릿</h3>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                새 템플릿 만들기
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        template.isActive ? 'bg-green-400' : 'bg-gray-300'
                      }`}></span>
                      <span className="text-xs text-gray-500">
                        {template.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-xs text-gray-500">빈도: </span>
                    <span className="text-sm font-medium text-gray-700">
                      {template.frequency === 'weekly' ? '주간' :
                       template.frequency === 'monthly' ? '월간' :
                       template.frequency === 'quarterly' ? '분기' : '연간'}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-xs text-gray-500">포함 섹션:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {template.sections.map((section, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-100 text-blue-700 py-2 rounded text-sm hover:bg-blue-200">
                      편집
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded text-sm hover:bg-gray-200">
                      복제
                    </button>
                    <button 
                      onClick={() => {
                        setTemplates(prev => prev.map(t => 
                          t.id === template.id ? { ...t, isActive: !t.isActive } : t
                        ));
                      }}
                      className={`flex-1 py-2 rounded text-sm ${
                        template.isActive 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {template.isActive ? '비활성화' : '활성화'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 자동 발송 */}
        {selectedTab === 'schedule' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">자동 리포트 발송 설정</h3>
              
              <div className="space-y-6">
                {templates.filter(t => t.isActive).map((template) => (
                  <div key={template.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2 text-orange-600 focus:ring-orange-500"
                          defaultChecked={template.frequency === 'weekly' || template.frequency === 'monthly'}
                        />
                        <span className="text-sm text-gray-700">자동 발송</span>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">발송 주기</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                          <option value={template.frequency}>
                            {template.frequency === 'weekly' ? '매주' :
                             template.frequency === 'monthly' ? '매월' :
                             template.frequency === 'quarterly' ? '매분기' : '매년'}
                          </option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">발송일</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                          <option>매월 1일</option>
                          <option>매월 15일</option>
                          <option>매월 말일</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">발송 시간</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                          <option>오전 9시</option>
                          <option>오후 6시</option>
                          <option>오후 11시</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm text-gray-600 mb-1">수신자 이메일</label>
                      <input
                        type="email"
                        placeholder="example@email.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        defaultValue={user?.email || ''}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">알림 설정</h4>
                    <p className="text-sm text-gray-600">리포트 생성 및 발송 관련 알림</p>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2 text-orange-600" defaultChecked />
                      <span className="text-sm text-gray-700">리포트 생성 완료 알림</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2 text-orange-600" defaultChecked />
                      <span className="text-sm text-gray-700">발송 실패 시 알림</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2 text-orange-600" />
                      <span className="text-sm text-gray-700">주요 인사이트 발견 시 즉시 알림</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">
                  설정 저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}