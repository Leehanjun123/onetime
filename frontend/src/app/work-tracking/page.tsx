'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface WorkSession {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  startTime: string;
  endTime?: string;
  status: 'in_progress' | 'break' | 'completed' | 'paused';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  photos: string[];
  notes: string;
  breaks: {
    startTime: string;
    endTime?: string;
    reason: string;
  }[];
  totalHours: number;
  rating?: {
    score: number;
    feedback: string;
    ratedAt: string;
  };
}

interface PerformanceMetrics {
  punctuality: number;
  quality: number;
  communication: number;
  safety: number;
  overall: number;
}

const SAMPLE_WORK_SESSIONS: WorkSession[] = [
  {
    id: 'ws1',
    jobId: '1',
    jobTitle: '아파트 리모델링 마감재 시공',
    company: '(주)프리미엄홈',
    startTime: '2024-12-30T08:00:00Z',
    endTime: '2024-12-30T17:00:00Z',
    status: 'completed',
    location: {
      lat: 37.5665,
      lng: 126.9780,
      address: '서울 강남구 테헤란로 123'
    },
    photos: ['/images/work1-before.jpg', '/images/work1-after.jpg'],
    notes: '타일 시공 완료. 모서리 부분 마감 처리 완벽.',
    breaks: [
      {
        startTime: '2024-12-30T12:00:00Z',
        endTime: '2024-12-30T13:00:00Z',
        reason: '점심시간'
      }
    ],
    totalHours: 8,
    rating: {
      score: 4.8,
      feedback: '매우 깔끔하고 정확한 작업이었습니다. 시간도 정확히 지켜주셨고 의사소통도 원활했습니다.',
      ratedAt: '2024-12-30T18:00:00Z'
    }
  },
  {
    id: 'ws2',
    jobId: '2',
    jobTitle: '상가 인테리어 철거 작업',
    company: '대한건설',
    startTime: '2024-12-29T09:00:00Z',
    endTime: '2024-12-29T18:00:00Z',
    status: 'completed',
    location: {
      lat: 37.5665,
      lng: 126.9780,
      address: '서울 서초구 강남대로 456'
    },
    photos: ['/images/work2-progress.jpg'],
    notes: '철거 작업 완료. 안전수칙 준수하여 진행.',
    breaks: [
      {
        startTime: '2024-12-29T12:00:00Z',
        endTime: '2024-12-29T13:00:00Z',
        reason: '점심시간'
      },
      {
        startTime: '2024-12-29T15:00:00Z',
        endTime: '2024-12-29T15:15:00Z',
        reason: '휴식'
      }
    ],
    totalHours: 8.25,
    rating: {
      score: 4.5,
      feedback: '안전하게 작업해주셔서 감사합니다.',
      ratedAt: '2024-12-29T19:00:00Z'
    }
  },
  {
    id: 'ws3',
    jobId: '3',
    jobTitle: '펜션 외벽 도색 작업',
    company: '코리아페인트',
    startTime: '2024-12-31T08:00:00Z',
    status: 'in_progress',
    location: {
      lat: 37.7749,
      lng: 127.4194,
      address: '경기 가평군 청평면'
    },
    photos: ['/images/work3-start.jpg'],
    notes: '외벽 도색 시작. 날씨 좋음.',
    breaks: [],
    totalHours: 0
  }
];

const SAMPLE_METRICS: PerformanceMetrics = {
  punctuality: 4.7,
  quality: 4.8,
  communication: 4.6,
  safety: 4.9,
  overall: 4.75
};

export default function WorkTrackingPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>(SAMPLE_WORK_SESSIONS);
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(
    SAMPLE_WORK_SESSIONS.find(ws => ws.status === 'in_progress') || null
  );
  const [metrics, setMetrics] = useState<PerformanceMetrics>(SAMPLE_METRICS);
  const [selectedSession, setSelectedSession] = useState<WorkSession | null>(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : currentTime;
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}시간 ${minutes}분`;
  };

  const startBreak = () => {
    if (!currentSession) return;
    
    setIsOnBreak(true);
    setCurrentSession({
      ...currentSession,
      status: 'break',
      breaks: [
        ...currentSession.breaks,
        {
          startTime: new Date().toISOString(),
          reason: '휴식'
        }
      ]
    });
  };

  const endBreak = () => {
    if (!currentSession || !isOnBreak) return;
    
    const updatedBreaks = [...currentSession.breaks];
    const lastBreak = updatedBreaks[updatedBreaks.length - 1];
    lastBreak.endTime = new Date().toISOString();
    
    setIsOnBreak(false);
    setCurrentSession({
      ...currentSession,
      status: 'in_progress',
      breaks: updatedBreaks
    });
  };

  const completeWork = () => {
    if (!currentSession) return;
    
    const completedSession = {
      ...currentSession,
      status: 'completed' as const,
      endTime: new Date().toISOString(),
      totalHours: calculateTotalHours(currentSession.startTime, new Date().toISOString(), currentSession.breaks)
    };
    
    setWorkSessions(prev => prev.map(ws => 
      ws.id === currentSession.id ? completedSession : ws
    ));
    setCurrentSession(null);
  };

  const calculateTotalHours = (startTime: string, endTime: string, breaks: WorkSession['breaks']) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    let totalMs = end.getTime() - start.getTime();
    
    // 휴식 시간 차감
    breaks.forEach(br => {
      if (br.endTime) {
        const breakMs = new Date(br.endTime).getTime() - new Date(br.startTime).getTime();
        totalMs -= breakMs;
      }
    });
    
    return Math.round((totalMs / (1000 * 60 * 60)) * 100) / 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-green-700 bg-green-100';
      case 'break': return 'text-yellow-700 bg-yellow-100';
      case 'completed': return 'text-blue-700 bg-blue-100';
      case 'paused': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return '작업중';
      case 'break': return '휴식중';
      case 'completed': return '완료';
      case 'paused': return '일시정지';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">업무 추적</h1>
          <p className="text-gray-600">실시간 작업 시간 추적과 성과 분석을 제공합니다</p>
        </div>

        {/* 현재 작업 세션 */}
        {currentSession && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border-l-4 border-green-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">{currentSession.jobTitle}</h2>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(currentSession.status)}`}>
                    {getStatusText(currentSession.status)}
                  </span>
                </div>
                <div className="text-gray-600">
                  🏢 {currentSession.company} • 📍 {currentSession.location.address}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {formatDuration(currentSession.startTime)}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(currentSession.startTime).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} 시작
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {currentSession.status === 'in_progress' && (
                <>
                  <button
                    onClick={startBreak}
                    className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-200 font-medium"
                  >
                    ⏸️ 휴식 시작
                  </button>
                  <button
                    onClick={completeWork}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    ✅ 작업 완료
                  </button>
                </>
              )}
              {currentSession.status === 'break' && (
                <button
                  onClick={endBreak}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                >
                  ▶️ 작업 재개
                </button>
              )}
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">
                📷 사진 촬영
              </button>
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">
                📝 메모 추가
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 작업 이력 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">작업 이력</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {workSessions.map((session) => (
                  <div key={session.id} className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{session.jobTitle}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                            {getStatusText(session.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>🏢 {session.company}</div>
                          <div>📍 {session.location.address}</div>
                          <div>📅 {new Date(session.startTime).toLocaleDateString('ko-KR')}</div>
                          {session.endTime && (
                            <div>⏰ {formatDuration(session.startTime, session.endTime)}</div>
                          )}
                        </div>
                        
                        {session.rating && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-600">⭐ {session.rating.score}</span>
                              <span className="text-sm text-gray-600">{session.rating.feedback}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                        >
                          상세보기
                        </button>
                        {session.photos.length > 0 && (
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm">
                            📷 {session.photos.length}장
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {workSessions.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">작업 이력이 없습니다</h3>
                    <p className="text-gray-600">일자리를 시작하면 작업 추적이 시작됩니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 성과 지표 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">성과 지표</h3>
              <div className="space-y-4">
                {[
                  { key: 'punctuality', label: '시간 준수', value: metrics.punctuality, color: 'blue' },
                  { key: 'quality', label: '작업 품질', value: metrics.quality, color: 'green' },
                  { key: 'communication', label: '의사소통', value: metrics.communication, color: 'purple' },
                  { key: 'safety', label: '안전 준수', value: metrics.safety, color: 'red' },
                  { key: 'overall', label: '종합 평가', value: metrics.overall, color: 'orange' }
                ].map(metric => (
                  <div key={metric.key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                      <span className="text-sm font-medium text-gray-900">{metric.value.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-${metric.color}-500 h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${(metric.value / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 오늘의 통계 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">오늘의 통계</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {currentSession ? formatDuration(currentSession.startTime) : '0시간 0분'}
                  </div>
                  <div className="text-sm text-gray-600">작업 시간</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {currentSession?.breaks.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">휴식 횟수</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {currentSession?.photos.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">촬영한 사진</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {currentSession ? '1' : '0'}
                  </div>
                  <div className="text-sm text-gray-600">진행중 작업</div>
                </div>
              </div>
            </div>

            {/* 최근 평가 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 평가</h3>
              <div className="space-y-3">
                {workSessions.filter(ws => ws.rating).slice(0, 3).map(session => (
                  <div key={session.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {session.jobTitle}
                      </span>
                      <span className="text-yellow-600 font-medium">
                        ⭐ {session.rating!.score}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {session.rating!.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 작업 세션 상세 모달 */}
        {selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">작업 상세</h3>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{selectedSession.jobTitle}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>🏢 {selectedSession.company}</div>
                      <div>📍 {selectedSession.location.address}</div>
                      <div>📅 {new Date(selectedSession.startTime).toLocaleDateString('ko-KR')}</div>
                      <div>⏰ {selectedSession.totalHours}시간</div>
                    </div>
                  </div>
                  
                  {selectedSession.breaks.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">휴식 기록</h4>
                      <div className="space-y-2">
                        {selectedSession.breaks.map((br, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                            <div className="flex justify-between">
                              <span>{br.reason}</span>
                              <span>
                                {new Date(br.startTime).toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                                {br.endTime && (
                                  <> - {new Date(br.endTime).toLocaleTimeString('ko-KR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</>
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedSession.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">작업 메모</h4>
                      <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                        {selectedSession.notes}
                      </div>
                    </div>
                  )}
                  
                  {selectedSession.rating && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">평가</h4>
                      <div className="bg-yellow-50 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-yellow-600 font-medium">⭐ {selectedSession.rating.score}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(selectedSession.rating.ratedAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{selectedSession.rating.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}