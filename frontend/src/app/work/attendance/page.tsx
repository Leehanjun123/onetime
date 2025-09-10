'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface WorkSession {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  checkInTime: string;
  checkInLocation: string;
  checkOutTime?: string;
  checkOutLocation?: string;
  totalWorkTime?: number;
  status: 'CHECKED_IN' | 'CHECKED_OUT' | 'COMPLETED';
  wage: number;
  wageType: 'HOURLY' | 'DAILY';
  workDate: string;
}

export default function AttendancePage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [workHistory, setWorkHistory] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkHistory();
    }
  }, [isAuthenticated, selectedPeriod]);

  const fetchWorkHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/v1/work-session/history?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWorkHistory(data.data.sessions);
        }
      } else {
        // API 실패 시 샘플 데이터
        setWorkHistory([
          {
            id: '1',
            jobId: 'job1',
            jobTitle: '아파트 전기 배선 작업',
            company: '한빛전기',
            checkInTime: new Date(Date.now() - 86400000).toISOString(), // 1일 전
            checkInLocation: '서울시 강남구 역삼동',
            checkOutTime: new Date(Date.now() - 57600000).toISOString(), // 16시간 전
            checkOutLocation: '서울시 강남구 역삼동',
            totalWorkTime: 480, // 8시간
            status: 'COMPLETED',
            wage: 180000,
            wageType: 'DAILY',
            workDate: new Date(Date.now() - 86400000).toISOString().split('T')[0]
          },
          {
            id: '2',
            jobId: 'job2',
            jobTitle: '원룸 도배 작업',
            company: '청솔도배',
            checkInTime: new Date(Date.now() - 172800000).toISOString(), // 2일 전
            checkInLocation: '서울시 강남구 삼성동',
            checkOutTime: new Date(Date.now() - 144000000).toISOString(),
            checkOutLocation: '서울시 강남구 삼성동',
            totalWorkTime: 420, // 7시간
            status: 'COMPLETED',
            wage: 150000,
            wageType: 'DAILY',
            workDate: new Date(Date.now() - 172800000).toISOString().split('T')[0]
          },
          {
            id: '3',
            jobId: 'job3',
            jobTitle: '상가 철거 작업',
            company: '대한철거',
            checkInTime: new Date(Date.now() - 259200000).toISOString(), // 3일 전
            checkInLocation: '서울시 서초구 서초동',
            checkOutTime: new Date(Date.now() - 223200000).toISOString(),
            checkOutLocation: '서울시 서초구 서초동',
            totalWorkTime: 600, // 10시간
            status: 'COMPLETED',
            wage: 25000,
            wageType: 'HOURLY',
            workDate: new Date(Date.now() - 259200000).toISOString().split('T')[0]
          }
        ]);
      }
    } catch (error) {
      console.error('근무 이력 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  const calculateWage = (session: WorkSession) => {
    if (!session.totalWorkTime) return 0;
    
    if (session.wageType === 'HOURLY') {
      const hours = session.totalWorkTime / 60;
      return Math.floor(hours * session.wage);
    } else {
      return session.wage; // 일당
    }
  };

  const getTotalStats = () => {
    const totalHours = workHistory.reduce((sum, session) => sum + (session.totalWorkTime || 0), 0);
    const totalWage = workHistory.reduce((sum, session) => sum + calculateWage(session), 0);
    const completedJobs = workHistory.filter(session => session.status === 'COMPLETED').length;

    return {
      totalHours: Math.floor(totalHours / 60),
      totalWage,
      completedJobs,
      avgHoursPerDay: completedJobs > 0 ? Math.floor(totalHours / 60 / completedJobs) : 0
    };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CHECKED_IN: { bg: 'bg-green-100', text: 'text-green-800', label: '근무 중' },
      CHECKED_OUT: { bg: 'bg-blue-100', text: 'text-blue-800', label: '근무 완료' },
      COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-800', label: '정산 완료' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">출퇴근 기록을 확인하려면 로그인해주세요.</p>
          <a 
            href="/login"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
          >
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">⏰ 출퇴근 관리</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            GPS 기반 정확한 근무시간 관리
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* 기간 선택 */}
        <div className="mb-6">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
            <h2 className="text-lg font-bold mb-4">조회 기간</h2>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              {[
                { key: 'today', label: '오늘' },
                { key: 'week', label: '이번 주' },
                { key: 'month', label: '이번 달' },
                { key: 'all', label: '전체' }
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm ${
                    selectedPeriod === period.key
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-2">
              {stats.completedJobs}건
            </div>
            <div className="text-xs sm:text-sm text-gray-600">완료된 작업</div>
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
              {stats.totalHours}시간
            </div>
            <div className="text-xs sm:text-sm text-gray-600">총 근무시간</div>
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-2">
              {stats.totalWage.toLocaleString()}원
            </div>
            <div className="text-xs sm:text-sm text-gray-600">총 급여</div>
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-600 mb-2">
              {stats.avgHoursPerDay}시간
            </div>
            <div className="text-xs sm:text-sm text-gray-600">평균 근무시간</div>
          </div>
        </div>

        {/* 근무 이력 */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">근무 이력</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">근무 이력을 불러오는 중...</p>
            </div>
          ) : workHistory.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                근무 기록이 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                일용직 작업을 시작하면 출퇴근 기록을 확인할 수 있습니다
              </p>
              <a
                href="/jobs/nearby"
                className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
              >
                일자리 찾기
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {workHistory.map((session) => (
                <div key={session.id} className="p-4 sm:p-6 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {session.jobTitle}
                        </h3>
                        {getStatusBadge(session.status)}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        {session.company} • {formatDate(session.workDate)}
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span>🕐 체크인:</span>
                          <span>{formatDateTime(session.checkInTime)}</span>
                        </div>
                        <div className="text-xs text-gray-500 pl-6">
                          📍 {session.checkInLocation}
                        </div>
                        
                        {session.checkOutTime && (
                          <>
                            <div className="flex items-center gap-2">
                              <span>🕐 체크아웃:</span>
                              <span>{formatDateTime(session.checkOutTime)}</span>
                            </div>
                            <div className="text-xs text-gray-500 pl-6">
                              📍 {session.checkOutLocation}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-left sm:text-right">
                      {session.totalWorkTime && (
                        <div className="text-lg font-semibold text-gray-900 mb-2">
                          {formatTime(session.totalWorkTime)}
                        </div>
                      )}
                      <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                        {calculateWage(session).toLocaleString()}원
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.wageType === 'HOURLY' ? '시급' : '일당'} {session.wage.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 안내 */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-green-900 mb-3">📱 GPS 출퇴근 관리 안내</h3>
          <div className="space-y-2 text-sm text-green-800">
            <p>• 작업 시작 전 <strong>체크인</strong>을 완료해주세요</p>
            <p>• 작업 완료 후 <strong>체크아웃</strong>으로 정확한 근무시간이 기록됩니다</p>
            <p>• GPS 위치 기반으로 <strong>정확한 출퇴근 위치</strong>가 기록됩니다</p>
            <p>• 근무시간에 따라 <strong>자동으로 급여가 계산</strong>됩니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}