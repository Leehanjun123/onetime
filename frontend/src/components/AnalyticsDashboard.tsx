'use client'

import { useState, useEffect } from 'react';
import { trackEvent } from './Analytics';

interface MetricsData {
  pageViews: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  jobApplications: number;
  registrations: number;
  offlineUsage: number;
}

interface UserBehaviorData {
  topJobCategories: Array<{ category: string; searches: number; applications: number }>;
  popularLocations: Array<{ location: string; users: number }>;
  deviceBreakdown: Array<{ device: string; percentage: number }>;
  timeOfDayUsage: Array<{ hour: number; users: number }>;
}

export default function AnalyticsDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<MetricsData>({
    pageViews: 0,
    uniqueUsers: 0,
    averageSessionDuration: 0,
    bounceRate: 0,
    conversionRate: 0,
    jobApplications: 0,
    registrations: 0,
    offlineUsage: 0
  });
  const [behaviorData, setBehaviorData] = useState<UserBehaviorData>({
    topJobCategories: [],
    popularLocations: [],
    deviceBreakdown: [],
    timeOfDayUsage: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 개발환경에서만 대시보드 표시 (또는 관리자 권한)
    const isDev = process.env.NODE_ENV === 'development';
    const isAdmin = localStorage.getItem('user_role') === 'admin';
    
    if (isDev || isAdmin) {
      setIsVisible(true);
      fetchAnalyticsData();
    }
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // 실제 환경에서는 백엔드 API 호출
      const response = await fetch('/api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setBehaviorData(data.behaviorData);
      } else {
        // Mock 데이터 사용 (개발환경)
        loadMockData();
      }
    } catch (error) {
      console.log('Analytics API not available, using mock data');
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // 건설업 특화 Mock 데이터
    setMetrics({
      pageViews: 15420,
      uniqueUsers: 3240,
      averageSessionDuration: 185, // 3분 5초
      bounceRate: 32.5,
      conversionRate: 8.7,
      jobApplications: 289,
      registrations: 124,
      offlineUsage: 45
    });

    setBehaviorData({
      topJobCategories: [
        { category: '건설/토목', searches: 1250, applications: 89 },
        { category: '배달/운전', searches: 890, applications: 67 },
        { category: '공장/제조', searches: 720, applications: 45 },
        { category: '카페/음료', searches: 560, applications: 32 },
        { category: '청소/환경', searches: 340, applications: 24 }
      ],
      popularLocations: [
        { location: '서울 강남구', users: 456 },
        { location: '서울 송파구', users: 378 },
        { location: '경기 성남시', users: 342 },
        { location: '서울 강서구', users: 298 },
        { location: '경기 수원시', users: 245 }
      ],
      deviceBreakdown: [
        { device: 'Android Mobile', percentage: 68.4 },
        { device: 'iPhone', percentage: 24.1 },
        { device: 'Desktop', percentage: 5.2 },
        { device: 'Android Tablet', percentage: 1.8 },
        { device: 'iPad', percentage: 0.5 }
      ],
      timeOfDayUsage: [
        { hour: 6, users: 45 },
        { hour: 7, users: 120 },
        { hour: 8, users: 280 },
        { hour: 9, users: 350 },
        { hour: 10, users: 290 },
        { hour: 11, users: 240 },
        { hour: 12, users: 180 },
        { hour: 13, users: 160 },
        { hour: 14, users: 200 },
        { hour: 15, users: 240 },
        { hour: 16, users: 210 },
        { hour: 17, users: 180 },
        { hour: 18, users: 150 },
        { hour: 19, users: 120 },
        { hour: 20, users: 90 },
        { hour: 21, users: 60 },
        { hour: 22, users: 40 },
        { hour: 23, users: 25 }
      ]
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">📊 실시간 분석</h3>
          <button
            onClick={() => {
              setIsVisible(false);
              trackEvent('analytics_dashboard_closed', {
                event_category: 'admin_interaction'
              });
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">데이터 로딩 중...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 핵심 지표 */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-blue-600 font-semibold">페이지뷰</div>
                <div className="text-xl font-bold">{metrics.pageViews.toLocaleString()}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="text-green-600 font-semibold">고유 사용자</div>
                <div className="text-xl font-bold">{metrics.uniqueUsers.toLocaleString()}</div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <div className="text-orange-600 font-semibold">평균 세션</div>
                <div className="text-xl font-bold">{Math.floor(metrics.averageSessionDuration / 60)}분</div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <div className="text-purple-600 font-semibold">전환율</div>
                <div className="text-xl font-bold">{metrics.conversionRate}%</div>
              </div>
            </div>

            {/* 인기 직종 */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🏗️ 인기 직종</h4>
              <div className="space-y-1">
                {behaviorData.topJobCategories.slice(0, 3).map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <span className="text-orange-600 mr-1">{index + 1}.</span>
                      {category.category}
                    </span>
                    <div className="flex space-x-2 text-xs">
                      <span className="text-blue-600">{category.searches}검색</span>
                      <span className="text-green-600">{category.applications}지원</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 디바이스 분석 */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">📱 디바이스</h4>
              <div className="space-y-1">
                {behaviorData.deviceBreakdown.slice(0, 3).map((device) => (
                  <div key={device.device} className="flex items-center justify-between text-sm">
                    <span>{device.device}</span>
                    <span className="font-semibold">{device.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 시간대별 사용량 차트 */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">⏰ 시간대별 사용량</h4>
              <div className="flex items-end space-x-1 h-16">
                {behaviorData.timeOfDayUsage
                  .filter(data => data.hour >= 6 && data.hour <= 22)
                  .map((data) => {
                    const maxUsers = Math.max(...behaviorData.timeOfDayUsage.map(d => d.users));
                    const height = Math.max(4, (data.users / maxUsers) * 60);
                    
                    return (
                      <div key={data.hour} className="flex flex-col items-center">
                        <div
                          className="bg-orange-400 w-2 rounded-t"
                          style={{ height: `${height}px` }}
                          title={`${data.hour}시: ${data.users}명`}
                        ></div>
                        <div className="text-xs text-gray-500 mt-1">
                          {data.hour % 3 === 0 ? data.hour : ''}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 건설업 특화 지표 */}
            <div className="border-t pt-3 mt-3">
              <h4 className="font-semibold text-gray-800 mb-2">🔨 건설업 지표</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>일자리 지원</span>
                  <span className="font-semibold text-green-600">{metrics.jobApplications}</span>
                </div>
                <div className="flex justify-between">
                  <span>신규 가입</span>
                  <span className="font-semibold text-blue-600">{metrics.registrations}</span>
                </div>
                <div className="flex justify-between">
                  <span>오프라인 사용</span>
                  <span className="font-semibold text-purple-600">{metrics.offlineUsage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>이탈률</span>
                  <span className="font-semibold text-red-600">{metrics.bounceRate}%</span>
                </div>
              </div>
            </div>

            {/* 새로고침 버튼 */}
            <button
              onClick={() => {
                fetchAnalyticsData();
                trackEvent('analytics_dashboard_refresh', {
                  event_category: 'admin_interaction'
                });
              }}
              className="w-full bg-orange-600 text-white py-2 rounded text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              🔄 데이터 새로고침
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 키보드 단축키로 대시보드 토글 (개발용)
export function AnalyticsDashboardToggle() {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl + Shift + A로 대시보드 토글
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        const dashboardElement = document.getElementById('analytics-dashboard');
        if (dashboardElement) {
          dashboardElement.style.display = 
            dashboardElement.style.display === 'none' ? 'block' : 'none';
        }
        
        trackEvent('analytics_dashboard_toggled', {
          event_category: 'admin_interaction',
          method: 'keyboard_shortcut'
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return null;
}