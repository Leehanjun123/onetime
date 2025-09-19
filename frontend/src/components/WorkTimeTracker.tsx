'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { API_CONFIG } from '@/lib/config';

interface WorkSession {
  id: string;
  jobId: string;
  jobTitle: string;
  checkInTime?: string;
  checkInLocation?: string;
  checkOutTime?: string;
  checkOutLocation?: string;
  totalWorkTime?: number; // 분 단위
  status: 'CHECKED_IN' | 'CHECKED_OUT' | 'COMPLETED';
  wage: number;
  wageType: 'HOURLY' | 'DAILY';
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function WorkTimeTracker() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [workTime, setWorkTime] = useState(0); // 실시간 근무시간 (초)

  // 현재 위치 가져오기
  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('이 브라우저는 위치 서비스를 지원하지 않습니다.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({
            latitude,
            longitude,
            address: `위도: ${latitude.toFixed(4)}, 경도: ${longitude.toFixed(4)}`
          });
        },
        (error) => {
          let message = '위치 정보를 가져올 수 없습니다.';
          if (error.code === error.PERMISSION_DENIED) {
            message = '위치 접근 권한이 거부되었습니다.';
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // 컴포넌트 마운트 시 현재 세션 확인
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCurrentSession();
    }
  }, [isAuthenticated, user]);

  // 실시간 근무시간 업데이트
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentSession?.status === 'CHECKED_IN' && currentSession.checkInTime) {
      interval = setInterval(() => {
        const checkInTime = new Date(currentSession.checkInTime!).getTime();
        const now = new Date().getTime();
        const diffInSeconds = Math.floor((now - checkInTime) / 1000);
        setWorkTime(diffInSeconds);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession]);

  const fetchCurrentSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/work-session/current`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.session) {
          setCurrentSession(data.data.session);
        }
      } else {
        // API 실패 시 샘플 데이터로 테스트
        console.log('현재 활성화된 근무 세션이 없습니다.');
      }
    } catch (error) {
      console.error('현재 세션 조회 실패:', error);
    }
  };

  const handleCheckIn = async (jobId: string, jobTitle: string, wage: number, wageType: 'HOURLY' | 'DAILY') => {
    setLoading(true);
    setLocationError(null);

    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);

      const token = localStorage.getItem('token');
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/work-session/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId,
          jobTitle,
          wage,
          wageType,
          checkInLocation: location.address,
          checkInLatitude: location.latitude,
          checkInLongitude: location.longitude
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data.data.session);
        alert('체크인이 완료되었습니다! 👍');
      } else {
        const errorData = await response.json();
        alert(errorData.message || '체크인 실패');
      }
    } catch (error) {
      console.error('체크인 오류:', error);
      setLocationError((error as Error).message);
      alert('체크인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentSession) return;

    setLoading(true);
    setLocationError(null);

    try {
      const location = await getCurrentLocation();
      
      const token = localStorage.getItem('token');
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/work-session/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          checkOutLocation: location.address,
          checkOutLatitude: location.latitude,
          checkOutLongitude: location.longitude
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data.data.session);
        alert('체크아웃이 완료되었습니다! 수고하셨습니다. 💰');
      } else {
        const errorData = await response.json();
        alert(errorData.message || '체크아웃 실패');
      }
    } catch (error) {
      console.error('체크아웃 오류:', error);
      setLocationError((error as Error).message);
      alert('체크아웃 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  const calculateEstimatedWage = () => {
    if (!currentSession || !workTime) return 0;
    
    if (currentSession.wageType === 'HOURLY') {
      const hours = workTime / 3600;
      return Math.floor(hours * currentSession.wage);
    } else {
      // DAILY의 경우 8시간 기준으로 계산
      const workHours = workTime / 3600;
      const ratio = workHours / 8;
      return Math.floor(ratio * currentSession.wage);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {currentSession ? (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-80 sm:w-96">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${currentSession.status === 'CHECKED_IN' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <h3 className="font-semibold text-gray-900">근무 중</h3>
            </div>
            <div className="text-xs text-gray-500">
              {currentSession.status === 'CHECKED_IN' ? '체크인 완료' : '체크아웃 완료'}
            </div>
          </div>

          {/* 작업 정보 */}
          <div className="mb-4 p-3 bg-orange-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">{currentSession.jobTitle}</h4>
            <div className="text-sm text-gray-600">
              {currentSession.wageType === 'HOURLY' ? 
                `시급 ${currentSession.wage.toLocaleString()}원` : 
                `일당 ${currentSession.wage.toLocaleString()}원`
              }
            </div>
          </div>

          {/* 체크인 정보 */}
          {currentSession.checkInTime && (
            <div className="mb-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <span>🕐 체크인:</span>
                <span>{formatDateTime(currentSession.checkInTime)}</span>
              </div>
              <div className="text-xs text-gray-500 pl-6">
                📍 {currentSession.checkInLocation}
              </div>
            </div>
          )}

          {/* 체크아웃 정보 */}
          {currentSession.checkOutTime && (
            <div className="mb-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <span>🕐 체크아웃:</span>
                <span>{formatDateTime(currentSession.checkOutTime)}</span>
              </div>
              <div className="text-xs text-gray-500 pl-6">
                📍 {currentSession.checkOutLocation}
              </div>
            </div>
          )}

          {/* 실시간 근무시간 */}
          {currentSession.status === 'CHECKED_IN' && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-green-700 mb-1">
                  {formatTime(workTime)}
                </div>
                <div className="text-sm text-green-600 mb-2">현재 근무시간</div>
                <div className="text-lg font-semibold text-green-700">
                  예상 급여: {calculateEstimatedWage().toLocaleString()}원
                </div>
              </div>
            </div>
          )}

          {/* 완료된 세션 정보 */}
          {currentSession.status === 'CHECKED_OUT' && currentSession.totalWorkTime && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-center">
              <div className="text-lg font-semibold text-blue-700 mb-1">
                총 근무시간: {Math.floor(currentSession.totalWorkTime / 60)}시간 {currentSession.totalWorkTime % 60}분
              </div>
              <div className="text-sm text-blue-600">
                정산 금액: {calculateEstimatedWage().toLocaleString()}원
              </div>
            </div>
          )}

          {/* 위치 에러 */}
          {locationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{locationError}</p>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="space-y-2">
            {currentSession.status === 'CHECKED_IN' ? (
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    체크아웃 중...
                  </>
                ) : (
                  <>
                    🏁 체크아웃
                  </>
                )}
              </button>
            ) : (
              <div className="text-center text-gray-600 py-2">
                작업이 완료되었습니다! 🎉
              </div>
            )}
            
            <button
              onClick={() => setCurrentSession(null)}
              className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm"
            >
              닫기
            </button>
          </div>
        </div>
      ) : (
        // 체크인 버튼 (작업이 없을 때)
        <button
          onClick={() => {
            // 임시로 샘플 작업으로 체크인
            handleCheckIn('sample-job', '아파트 전기 배선 작업', 180000, 'DAILY');
          }}
          disabled={loading}
          className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          title="근무 시작"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}