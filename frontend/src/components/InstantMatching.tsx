'use client';

import { useState, useEffect } from 'react';
import SocketService from '../lib/socket';

interface MatchingPreferences {
  location: string;
  category: string;
  expectedSalary: number;
  maxDistance: number;
  urgentOnly?: boolean;
  availableTime?: string[];
}

interface MatchResult {
  id: string;
  jobId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  score: number;
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    salaryMin: number;
    salaryMax: number;
    category: string;
    isUrgent: boolean;
    workDate: string;
    companyName: string;
  };
}

interface InstantMatchingProps {
  userId?: string;
  onMatchFound?: (matches: MatchResult[]) => void;
  onMatchAccepted?: (match: MatchResult) => void;
}

export default function InstantMatching({ userId, onMatchFound, onMatchAccepted }: InstantMatchingProps) {
  const [isMatching, setIsMatching] = useState(false);
  const [preferences, setPreferences] = useState<MatchingPreferences>({
    location: '',
    category: 'ALL',
    expectedSalary: 100000,
    maxDistance: 5,
    urgentOnly: false,
    availableTime: []
  });
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [socketService] = useState(() => SocketService.getInstance());

  useEffect(() => {
    // 알림 권한 요청
    SocketService.requestNotificationPermission();

    // Socket 연결
    const socket = socketService.connect(userId);

    // 매칭 관련 이벤트 리스너
    const handleMatchingFound = (data: { matches: MatchResult[]; message: string }) => {
      console.log('매칭 발견:', data);
      setMatches(data.matches);
      setIsMatching(false);
      
      if (onMatchFound) {
        onMatchFound(data.matches);
      }
    };

    const handleMatchAccepted = (data: { matchId: string; job: any; message: string }) => {
      console.log('매칭 수락됨:', data);
      setMatches(prev => prev.map(match => 
        match.id === data.matchId 
          ? { ...match, status: 'ACCEPTED' as const }
          : match
      ));

      if (onMatchAccepted) {
        const acceptedMatch = matches.find(m => m.id === data.matchId);
        if (acceptedMatch) {
          onMatchAccepted({ ...acceptedMatch, status: 'ACCEPTED' });
        }
      }
    };

    const handleMatchRejected = (data: { matchId: string; message: string }) => {
      console.log('매칭 거절됨:', data);
      setMatches(prev => prev.map(match => 
        match.id === data.matchId 
          ? { ...match, status: 'REJECTED' as const }
          : match
      ));
    };

    const handleMatchingQueueJoined = (data: { message: string; status: string }) => {
      console.log('매칭 큐 참가:', data);
      setIsMatching(true);
    };

    const handleMatchingQueueLeft = (data: { message: string; status: string }) => {
      console.log('매칭 큐 나감:', data);
      setIsMatching(false);
    };

    // 이벤트 리스너 등록
    socket.on('matching_found', handleMatchingFound);
    socket.on('match_accepted', handleMatchAccepted);
    socket.on('match_rejected', handleMatchRejected);
    socket.on('matching_queue_joined', handleMatchingQueueJoined);
    socket.on('matching_queue_left', handleMatchingQueueLeft);

    // 정리 함수
    return () => {
      socket.off('matching_found', handleMatchingFound);
      socket.off('match_accepted', handleMatchAccepted);
      socket.off('match_rejected', handleMatchRejected);
      socket.off('matching_queue_joined', handleMatchingQueueJoined);
      socket.off('matching_queue_left', handleMatchingQueueLeft);
    };
  }, [userId, socketService, matches, onMatchFound, onMatchAccepted]);

  const handleStartMatching = async () => {
    if (!preferences.location) {
      alert('근무 지역을 입력해주세요.');
      return;
    }

    setIsMatching(true);

    try {
      // API로 매칭 요청
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/matching/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          location: preferences.location,
          category: preferences.category,
          expectedSalary: preferences.expectedSalary,
          maxDistance: preferences.maxDistance,
          preferences: {
            urgentOnly: preferences.urgentOnly,
            salaryRange: {
              min: preferences.expectedSalary * 0.8,
              max: preferences.expectedSalary * 1.2
            }
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.status === 'MATCHED') {
          setMatches(data.data.matches);
          setIsMatching(false);
        } else {
          // Socket을 통해 매칭 큐에 참가
          socketService.joinMatchingQueue(userId || 'anonymous', preferences);
        }
      } else {
        alert(data.message || '매칭 요청에 실패했습니다.');
        setIsMatching(false);
      }
    } catch (error) {
      console.error('매칭 요청 오류:', error);
      alert('매칭 요청 중 오류가 발생했습니다.');
      setIsMatching(false);
    }
  };

  const handleStopMatching = () => {
    socketService.leaveMatchingQueue(userId || 'anonymous');
    setIsMatching(false);
    setMatches([]);
  };

  const handleAcceptMatch = (matchId: string) => {
    socketService.respondToMatch(matchId, 'accept', '매칭을 수락합니다.');
  };

  const handleRejectMatch = (matchId: string) => {
    socketService.respondToMatch(matchId, 'reject', '조건이 맞지 않습니다.');
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 간단한 좌표 -> 주소 변환 (실제로는 Geocoding API 사용)
          const location = `현재 위치 (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`;
          setPreferences(prev => ({ ...prev, location }));
        },
        (error) => {
          console.error('위치 정보 획득 실패:', error);
          alert('위치 정보를 가져올 수 없습니다.');
        }
      );
    } else {
      alert('브라우저가 위치 정보를 지원하지 않습니다.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">⚡ 즉시 매칭</h2>
      
      {/* 매칭 설정 */}
      {!isMatching && matches.length === 0 && (
        <div className="space-y-4">
          {/* 근무 지역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              근무 지역
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="예: 서울시 강남구"
                value={preferences.location}
                onChange={(e) => setPreferences(prev => ({ ...prev, location: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={getCurrentLocation}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                현재 위치
              </button>
            </div>
          </div>

          {/* 직종 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              희망 직종
            </label>
            <select
              value={preferences.category}
              onChange={(e) => setPreferences(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">전체</option>
              <option value="CONSTRUCTION">건설</option>
              <option value="SERVICE">서비스</option>
              <option value="LOGISTICS">물류</option>
              <option value="MANUFACTURING">제조</option>
            </select>
          </div>

          {/* 희망 임금 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              희망 임금 (일당)
            </label>
            <input
              type="number"
              placeholder="100000"
              value={preferences.expectedSalary}
              onChange={(e) => setPreferences(prev => ({ ...prev, expectedSalary: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 최대 거리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              최대 통근 거리: {preferences.maxDistance}km
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={preferences.maxDistance}
              onChange={(e) => setPreferences(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* 긴급 일자리만 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.urgentOnly}
                onChange={(e) => setPreferences(prev => ({ ...prev, urgentOnly: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">긴급 일자리만 찾기</span>
            </label>
          </div>

          {/* 매칭 시작 버튼 */}
          <button
            onClick={handleStartMatching}
            disabled={!preferences.location}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            매칭 시작하기
          </button>
        </div>
      )}

      {/* 매칭 진행 중 */}
      {isMatching && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">매칭 중...</h3>
          <p className="text-gray-600 mb-4">조건에 맞는 일자리를 찾고 있습니다.</p>
          <button
            onClick={handleStopMatching}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            매칭 중단
          </button>
        </div>
      )}

      {/* 매칭 결과 */}
      {matches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            매칭 결과 ({matches.length}개)
          </h3>
          
          {matches.map((match) => (
            <div key={match.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{match.job.title}</h4>
                  <p className="text-sm text-gray-600">{match.job.companyName}</p>
                  <p className="text-sm text-gray-600">{match.job.location}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-blue-600">
                    매칭도 {match.score}%
                  </div>
                  {match.job.isUrgent && (
                    <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mt-1">
                      긴급
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                <p>급여: {match.job.salaryMin?.toLocaleString()}원 - {match.job.salaryMax?.toLocaleString()}원</p>
                <p>근무일: {new Date(match.job.workDate).toLocaleDateString()}</p>
                <p>{match.job.description}</p>
              </div>

              {match.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptMatch(match.id)}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    수락하기
                  </button>
                  <button
                    onClick={() => handleRejectMatch(match.id)}
                    className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    거절하기
                  </button>
                </div>
              )}

              {match.status === 'ACCEPTED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <span className="text-green-800 font-medium">✅ 매칭 성사!</span>
                  <p className="text-sm text-green-600 mt-1">
                    고용주 연락처 정보를 확인하세요.
                  </p>
                </div>
              )}

              {match.status === 'REJECTED' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <span className="text-gray-600">❌ 거절됨</span>
                </div>
              )}

              {match.status === 'EXPIRED' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <span className="text-yellow-800">⏰ 만료됨</span>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={() => {
              setMatches([]);
              setIsMatching(false);
            }}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            새로운 매칭 시작
          </button>
        </div>
      )}
    </div>
  );
}