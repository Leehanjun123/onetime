'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  totalMatches: number;
  totalRevenue: number;
  activeUsers: number;
  pendingJobs: number;
  todayMatches: number;
  todayRevenue: number;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'job_posted' | 'match_made' | 'payment_received';
  description: string;
  timestamp: string;
  userId?: string;
  amount?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalJobs: 0,
    totalMatches: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingJobs: 0,
    todayMatches: 0,
    todayRevenue: 0
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // 30초마다 데이터 갱신
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      // 통계 데이터 가져오기
      const statsResponse = await fetch('https://onetime-production.up.railway.app/api/v1/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.data);
      }

      // 최근 활동 가져오기
      const activitiesResponse = await fetch('https://onetime-production.up.railway.app/api/v1/admin/activities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (activitiesResponse.ok) {
        const data = await activitiesResponse.json();
        setRecentActivities(data.data);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      notation: amount > 100000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCompactNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return '👤';
      case 'job_posted': return '📋';
      case 'match_made': return '🤝';
      case 'payment_received': return '💰';
      default: return '📌';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_signup': return 'bg-blue-100 text-blue-700';
      case 'job_posted': return 'bg-green-100 text-green-700';
      case 'match_made': return 'bg-purple-100 text-purple-700';
      case 'payment_received': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-full h-full border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-xl font-semibold text-gray-700">대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* 헤더 - 개선된 네비게이션 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">A</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                관리자 대시보드
              </h1>
              {refreshing && (
                <div className="ml-3 flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>실시간 업데이트</span>
                </div>
              )}
            </div>
            
            <nav className="flex items-center gap-2">
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <span className="mr-2">👥</span>
                  사용자 관리
                </Button>
              </Link>
              <Link href="/admin/jobs">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <span className="mr-2">💼</span>
                  일자리 관리
                </Button>
              </Link>
              <Link href="/admin/payments">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <span className="mr-2">💳</span>
                  결제 관리
                </Button>
              </Link>
              <Button
                variant="error"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  router.push('/admin/login');
                }}
              >
                로그아웃
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 주요 지표 - 개선된 디자인 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 사용자 통계 */}
          <Card variant="elevated" className="group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  사용자
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">전체 사용자</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCompactNumber(stats.totalUsers)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center text-xs">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                    <span className="text-green-600 font-semibold">+{stats.activeUsers}</span>
                    <span className="text-gray-500 ml-1">활성</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 일자리 통계 */}
          <Card variant="elevated" className="group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  일자리
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">전체 일자리</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCompactNumber(stats.totalJobs)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center text-xs">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
                    <span className="text-orange-600 font-semibold">{stats.pendingJobs}</span>
                    <span className="text-gray-500 ml-1">대기중</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 매칭 통계 */}
          <Card variant="elevated" className="group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  매칭
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">전체 매칭</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCompactNumber(stats.totalMatches)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center text-xs">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                    <span className="text-blue-600 font-semibold">+{stats.todayMatches}</span>
                    <span className="text-gray-500 ml-1">오늘</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 수익 통계 */}
          <Card variant="elevated" className="group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  수익
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">총 수익</p>
                <p className="text-2xl font-bold text-gray-900 mb-2 truncate" title={formatCurrency(stats.totalRevenue)}>
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center text-xs">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    <span className="text-green-600 font-semibold truncate">
                      +{formatCurrency(stats.todayRevenue)}
                    </span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 차트 영역 - 개선된 플레이스홀더 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>일별 매칭 현황</span>
                <Button variant="ghost" size="sm">
                  <span className="text-xs">7일</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-600 font-medium">차트 준비중</p>
                  <p className="text-sm text-gray-500 mt-1">Chart.js 연동 예정</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>카테고리별 일자리 분포</span>
                <Button variant="ghost" size="sm">
                  <span className="text-xs">전체</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="text-gray-600 font-medium">차트 준비중</p>
                  <p className="text-sm text-gray-500 mt-1">Chart.js 연동 예정</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 최근 활동 - 개선된 디자인 */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>최근 활동</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setRefreshing(true);
                  fetchDashboardData();
                }}
              >
                <svg className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                새로고침
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getActivityColor(activity.type)}`}>
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {activity.amount && (
                        <div className="text-right">
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(activity.amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-gray-600 font-medium">최근 활동이 없습니다</p>
                  <p className="text-sm text-gray-500 mt-1">새로운 활동이 발생하면 여기에 표시됩니다</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 빠른 작업 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="interactive" className="cursor-pointer hover:border-blue-400">
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-semibold text-gray-900">새 공지사항</h3>
              <p className="text-sm text-gray-500 mt-1">사용자에게 공지하기</p>
            </CardContent>
          </Card>
          
          <Card variant="interactive" className="cursor-pointer hover:border-green-400">
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-900">리포트 생성</h3>
              <p className="text-sm text-gray-500 mt-1">월간 보고서 다운로드</p>
            </CardContent>
          </Card>
          
          <Card variant="interactive" className="cursor-pointer hover:border-purple-400">
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">⚙️</div>
              <h3 className="font-semibold text-gray-900">시스템 설정</h3>
              <p className="text-sm text-gray-500 mt-1">플랫폼 설정 관리</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}