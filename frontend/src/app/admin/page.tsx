'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

interface SystemMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'job' | 'payment' | 'report' | 'system';
  action: string;
  target: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface PendingApproval {
  id: string;
  type: '일자리' | '사용자인증' | '급여분쟁' | '신고';
  title: string;
  requester: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'finance' | 'reports' | 'settings'>('overview');
  const [timeRange, setTimeRange] = useState('today');
  
  // Check admin access
  useEffect(() => {
    // In real app, check if user has admin role
    if (user?.email !== 'admin@ilday.com') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const [systemMetrics] = useState<SystemMetric[]>([
    {
      label: '활성 사용자',
      value: '12,543',
      change: '+523',
      trend: 'up',
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      label: '일일 일자리',
      value: '3,421',
      change: '+127',
      trend: 'up',
      icon: '💼',
      color: 'bg-green-500'
    },
    {
      label: '오늘 거래액',
      value: '₩458M',
      change: '+12%',
      trend: 'up',
      icon: '💰',
      color: 'bg-yellow-500'
    },
    {
      label: '시스템 상태',
      value: '정상',
      trend: 'stable',
      icon: '✅',
      color: 'bg-green-500'
    },
    {
      label: '응답 시간',
      value: '45ms',
      change: '-5ms',
      trend: 'down',
      icon: '⚡',
      color: 'bg-purple-500'
    },
    {
      label: '신고 건수',
      value: '23',
      change: '+5',
      trend: 'up',
      icon: '🚨',
      color: 'bg-red-500'
    }
  ]);

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'user',
      action: '새 사용자 가입',
      target: 'kim***@email.com',
      timestamp: '5분 전',
      status: 'success'
    },
    {
      id: '2',
      type: 'job',
      action: '일자리 승인 대기',
      target: '건설현장 일용직 (대한건설)',
      timestamp: '10분 전',
      status: 'warning'
    },
    {
      id: '3',
      type: 'payment',
      action: '급여 분쟁 발생',
      target: '사용자 #1234 vs 고용주 #5678',
      timestamp: '15분 전',
      status: 'error'
    },
    {
      id: '4',
      type: 'report',
      action: '부적절한 콘텐츠 신고',
      target: '게시글 #9876',
      timestamp: '30분 전',
      status: 'warning'
    },
    {
      id: '5',
      type: 'system',
      action: '자동 백업 완료',
      target: 'Database backup',
      timestamp: '1시간 전',
      status: 'success'
    }
  ]);

  const [pendingApprovals] = useState<PendingApproval[]>([
    {
      id: '1',
      type: '일자리',
      title: '서울 강남 건설현장 50명 모집',
      requester: '대한건설(주)',
      priority: 'high',
      createdAt: '2024-01-30 14:00'
    },
    {
      id: '2',
      type: '사용자인증',
      title: '기업 계정 인증 요청',
      requester: '한국물류센터',
      priority: 'medium',
      createdAt: '2024-01-30 13:30'
    },
    {
      id: '3',
      type: '급여분쟁',
      title: '12월 급여 미지급 신고',
      requester: '김철수',
      priority: 'high',
      createdAt: '2024-01-30 11:00'
    },
    {
      id: '4',
      type: '신고',
      title: '허위 일자리 정보 신고',
      requester: '이영희',
      priority: 'medium',
      createdAt: '2024-01-30 10:00'
    }
  ]);

  const [userStats] = useState({
    total: 45823,
    workers: 38421,
    employers: 7402,
    newToday: 523,
    activeToday: 12543,
    verifiedRate: 87
  });

  const [jobStats] = useState({
    totalActive: 8932,
    newToday: 421,
    completedToday: 356,
    matchingRate: 78,
    avgWage: 165000,
    categories: [
      { name: '건설', count: 2341, percentage: 26 },
      { name: '물류', count: 1876, percentage: 21 },
      { name: '제조', count: 1432, percentage: 16 },
      { name: '서비스', count: 1254, percentage: 14 },
      { name: '기타', count: 2029, percentage: 23 }
    ]
  });

  const [financeStats] = useState({
    totalTransactions: 458000000,
    todayTransactions: 45800000,
    pendingPayments: 12300000,
    avgTransactionSize: 165000,
    paymentMethods: [
      { method: '계좌이체', percentage: 65 },
      { method: '현금', percentage: 25 },
      { method: '카드', percentage: 10 }
    ]
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">🛠️ 일데이 관리자</h1>
              <span className="bg-red-600 text-white px-3 py-1 rounded text-sm">ADMIN</span>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-700"
              >
                <option value="today">오늘</option>
                <option value="week">이번 주</option>
                <option value="month">이번 달</option>
                <option value="year">올해</option>
              </select>
              <button className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
                긴급 알림 (3)
              </button>
              <Link href="/dashboard" className="text-gray-300 hover:text-white">
                사용자 모드 →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: '대시보드', icon: '📊' },
              { id: 'users', label: '사용자 관리', icon: '👥' },
              { id: 'jobs', label: '일자리 관리', icon: '💼' },
              { id: 'finance', label: '재무 관리', icon: '💰' },
              { id: 'reports', label: '신고 관리', icon: '🚨' },
              { id: 'settings', label: '시스템 설정', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div>
            {/* System Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {systemMetrics.map((metric) => (
                <div key={metric.label} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{metric.icon}</span>
                    {metric.trend && (
                      <span className={`text-xs ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                        {metric.change}
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-bold">{metric.value}</div>
                  <div className="text-xs text-gray-500">{metric.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Pending Approvals */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">승인 대기</h2>
                    <button className="text-blue-600 hover:text-blue-700 text-sm">
                      전체보기 →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {pendingApprovals.map((approval) => (
                      <div key={approval.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                              getPriorityColor(approval.priority)
                            }`}>
                              {approval.priority === 'high' ? '긴급' : 
                               approval.priority === 'medium' ? '보통' : '낮음'}
                            </span>
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                              {approval.type}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{approval.createdAt}</span>
                        </div>
                        <h3 className="font-medium mb-1">{approval.title}</h3>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">요청자: {approval.requester}</span>
                          <div className="flex gap-2">
                            <button className="text-green-600 hover:text-green-700 text-sm">
                              승인
                            </button>
                            <button className="text-red-600 hover:text-red-700 text-sm">
                              거절
                            </button>
                            <button className="text-blue-600 hover:text-blue-700 text-sm">
                              상세
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real-time Charts */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">실시간 모니터링</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">시간별 활성 사용자</h3>
                      <div className="h-32 bg-gradient-to-r from-blue-100 to-blue-200 rounded flex items-end justify-around p-2">
                        {[40, 65, 45, 80, 95, 120, 85, 70].map((height, idx) => (
                          <div
                            key={idx}
                            className="bg-blue-500 w-8 rounded-t"
                            style={{ height: `${height}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">일자리 매칭률</h3>
                      <div className="h-32 bg-gradient-to-r from-green-100 to-green-200 rounded flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">78%</div>
                          <div className="text-sm text-gray-600">성공률</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">최근 활동</h2>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <span className={`mt-1 ${getStatusColor(activity.status)}`}>
                        {activity.status === 'success' ? '✅' : 
                         activity.status === 'warning' ? '⚠️' : '❌'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-600">{activity.target}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-700">
                  모든 활동 보기 →
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">사용자 통계</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">전체 사용자</span>
                    <span className="font-bold">{userStats.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">근로자</span>
                    <span className="font-bold">{userStats.workers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">고용주</span>
                    <span className="font-bold">{userStats.employers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">오늘 가입</span>
                    <span className="font-bold text-green-600">+{userStats.newToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">인증률</span>
                    <span className="font-bold">{userStats.verifiedRate}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">활동 분석</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">일일 활성</span>
                    <span className="font-bold">{userStats.activeToday.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">주간 활성</span>
                    <span className="font-bold">34,521</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">월간 활성</span>
                    <span className="font-bold">41,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">평균 체류시간</span>
                    <span className="font-bold">23분</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">재방문율</span>
                    <span className="font-bold">67%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">빠른 작업</h3>
                <div className="space-y-2">
                  <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    사용자 검색
                  </button>
                  <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                    일괄 메시지 발송
                  </button>
                  <button className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700">
                    계정 인증 관리
                  </button>
                  <button className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
                    정지 계정 관리
                  </button>
                  <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                    사용자 리포트
                  </button>
                </div>
              </div>
            </div>

            {/* User Management Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">최근 가입 사용자</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="사용자 검색..."
                    className="px-3 py-1 border rounded"
                  />
                  <button className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">
                    검색
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">이름</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">이메일</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">유형</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">가입일</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">상태</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">#{45823 + i}</td>
                        <td className="px-4 py-2 text-sm">사용자{i}</td>
                        <td className="px-4 py-2 text-sm">user{i}@email.com</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            근로자
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">2024-01-30</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            활성
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <button className="text-blue-600 hover:text-blue-700 mr-2">보기</button>
                          <button className="text-yellow-600 hover:text-yellow-700 mr-2">수정</button>
                          <button className="text-red-600 hover:text-red-700">정지</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div>
            {/* Job Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">활성 일자리</span>
                  <span className="text-2xl">💼</span>
                </div>
                <div className="text-2xl font-bold">{jobStats.totalActive.toLocaleString()}</div>
                <div className="text-sm text-green-600">+{jobStats.newToday} 오늘</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">완료된 일자리</span>
                  <span className="text-2xl">✅</span>
                </div>
                <div className="text-2xl font-bold">{jobStats.completedToday}</div>
                <div className="text-sm text-gray-500">오늘 완료</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">매칭률</span>
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="text-2xl font-bold">{jobStats.matchingRate}%</div>
                <div className="text-sm text-gray-500">평균 매칭률</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">평균 일당</span>
                  <span className="text-2xl">💰</span>
                </div>
                <div className="text-2xl font-bold">₩{jobStats.avgWage.toLocaleString()}</div>
                <div className="text-sm text-gray-500">일일 평균</div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">카테고리별 분포</h3>
              <div className="space-y-3">
                {jobStats.categories.map((category) => (
                  <div key={category.name} className="flex items-center gap-4">
                    <span className="w-20 text-sm font-medium">{category.name}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div
                        className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${category.percentage}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {category.count.toLocaleString()} ({category.percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Management Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">일자리 관리</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-2 bg-gray-50 rounded hover:bg-gray-100">
                    📝 승인 대기 일자리 (23)
                  </button>
                  <button className="w-full text-left px-4 py-2 bg-gray-50 rounded hover:bg-gray-100">
                    🚨 신고된 일자리 (5)
                  </button>
                  <button className="w-full text-left px-4 py-2 bg-gray-50 rounded hover:bg-gray-100">
                    ⏰ 만료 예정 일자리 (142)
                  </button>
                  <button className="w-full text-left px-4 py-2 bg-gray-50 rounded hover:bg-gray-100">
                    📊 일자리 통계 리포트
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">품질 관리</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2">
                    <span className="text-sm">중복 일자리 검사</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      실행
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-2">
                    <span className="text-sm">허위 일자리 검증</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      실행
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-2">
                    <span className="text-sm">자동 매칭 최적화</span>
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                      실행 중
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-2">
                    <span className="text-sm">급여 검증</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      실행
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div>
            {/* Finance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">총 거래액</span>
                  <span className="text-2xl">💰</span>
                </div>
                <div className="text-2xl font-bold">₩{(financeStats.totalTransactions / 1000000).toFixed(0)}M</div>
                <div className="text-sm text-green-600">+12% 전월 대비</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">오늘 거래액</span>
                  <span className="text-2xl">📈</span>
                </div>
                <div className="text-2xl font-bold">₩{(financeStats.todayTransactions / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-gray-500">실시간</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">대기중 지급</span>
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="text-2xl font-bold">₩{(financeStats.pendingPayments / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-yellow-600">23건 처리중</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">평균 거래</span>
                  <span className="text-2xl">💳</span>
                </div>
                <div className="text-2xl font-bold">₩{financeStats.avgTransactionSize.toLocaleString()}</div>
                <div className="text-sm text-gray-500">건당 평균</div>
              </div>
            </div>

            {/* Payment Methods & Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">결제 방법 분포</h3>
                <div className="space-y-3">
                  {financeStats.paymentMethods.map((method) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{method.method}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-green-500 h-4 rounded-full"
                            style={{ width: `${method.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {method.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">재무 관리</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-2 bg-gray-50 rounded hover:bg-gray-100">
                    💸 정산 처리 (45건)
                  </button>
                  <button className="w-full text-left px-4 py-2 bg-gray-50 rounded hover:bg-gray-100">
                    🚨 급여 분쟁 (12건)
                  </button>
                  <button className="w-full text-left px-4 py-2 bg-gray-50 rounded hover:bg-gray-100">
                    📊 재무 리포트 생성
                  </button>
                  <button className="w-full text-left px-4 py-2 bg-gray-50 rounded hover:bg-gray-100">
                    💳 수수료 관리
                  </button>
                  <button className="w-full text-left px-4 py-2 bg-gray-50 rounded hover:bg-gray-100">
                    🔍 거래 내역 감사
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">신고 관리</h2>
              
              {/* Report Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">23</div>
                  <div className="text-sm text-gray-600">미처리 신고</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">15</div>
                  <div className="text-sm text-gray-600">검토중</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">142</div>
                  <div className="text-sm text-gray-600">처리완료 (이번달)</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-600">3.2일</div>
                  <div className="text-sm text-gray-600">평균 처리시간</div>
                </div>
              </div>

              {/* Reports Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">유형</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">제목</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">신고자</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">대상</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">날짜</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">상태</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">#2341</td>
                      <td className="px-4 py-2 text-sm">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          허위정보
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">가짜 일자리 게시</td>
                      <td className="px-4 py-2 text-sm">김**</td>
                      <td className="px-4 py-2 text-sm">일자리 #1234</td>
                      <td className="px-4 py-2 text-sm">2024-01-30</td>
                      <td className="px-4 py-2 text-sm">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                          검토중
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <button className="text-blue-600 hover:text-blue-700 mr-2">상세</button>
                        <button className="text-green-600 hover:text-green-700 mr-2">처리</button>
                        <button className="text-red-600 hover:text-red-700">삭제</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* System Settings */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">시스템 설정</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">사이트 모드</label>
                    <select className="w-full px-3 py-2 border rounded-md">
                      <option>정상 운영</option>
                      <option>점검 모드</option>
                      <option>읽기 전용</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">수수료율 (%)</label>
                    <input type="number" defaultValue="5" className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">최대 업로드 크기 (MB)</label>
                    <input type="number" defaultValue="10" className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">신규 가입 허용</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">이메일 인증 필수</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Backup & Maintenance */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">백업 & 유지보수</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">마지막 백업</span>
                      <span className="text-sm text-gray-600">2024-01-30 03:00</span>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                      수동 백업 실행
                    </button>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">데이터베이스 최적화</span>
                      <span className="text-sm text-gray-600">7일 전</span>
                    </div>
                    <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                      최적화 실행
                    </button>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">캐시</span>
                      <span className="text-sm text-gray-600">2.3GB 사용중</span>
                    </div>
                    <button className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700">
                      캐시 삭제
                    </button>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">로그 파일</span>
                      <span className="text-sm text-gray-600">523MB</span>
                    </div>
                    <button className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
                      로그 정리
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Accounts */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">관리자 계정</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">이름</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">이메일</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">역할</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">마지막 접속</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">관리자</td>
                      <td className="px-4 py-2 text-sm">admin@ilday.com</td>
                      <td className="px-4 py-2 text-sm">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          슈퍼관리자
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">현재 접속중</td>
                      <td className="px-4 py-2 text-sm">
                        <button className="text-blue-600 hover:text-blue-700">수정</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                관리자 추가
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}