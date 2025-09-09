'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import LocationPicker from '@/components/LocationPicker';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface NearbyJob {
  id: string;
  title: string;
  company: string;
  location: string;
  latitude: number;
  longitude: number;
  wage: number;
  wageType: 'DAILY' | 'HOURLY';
  category: string;
  distance?: number;
  workDate: string;
  workTime: string;
  isUrgent: boolean;
  requiredWorkers: number;
}

// 샘플 일자리 데이터
const sampleJobs: NearbyJob[] = [
  {
    id: '1',
    title: '아파트 전기 배선 작업',
    company: '한빛전기',
    location: '서울시 강남구 역삼동',
    latitude: 37.5006,
    longitude: 127.0366,
    wage: 180000,
    wageType: 'DAILY',
    category: '전기',
    workDate: '2025-08-31',
    workTime: '09:00-18:00',
    isUrgent: true,
    requiredWorkers: 2
  },
  {
    id: '2',
    title: '원룸 도배 작업',
    company: '청솔도배',
    location: '서울시 강남구 삼성동',
    latitude: 37.5087,
    longitude: 127.0632,
    wage: 150000,
    wageType: 'DAILY',
    category: '도배',
    workDate: '2025-09-01',
    workTime: '08:00-17:00',
    isUrgent: false,
    requiredWorkers: 1
  },
  {
    id: '3',
    title: '상가 철거 작업',
    company: '대한철거',
    location: '서울시 서초구 서초동',
    latitude: 37.4938,
    longitude: 127.0323,
    wage: 25000,
    wageType: 'HOURLY',
    category: '철거',
    workDate: '2025-08-31',
    workTime: '07:00-19:00',
    isUrgent: true,
    requiredWorkers: 5
  },
  {
    id: '4',
    title: '마루 시공 작업',
    company: '우드플로어',
    location: '서울시 강남구 개포동',
    latitude: 37.4828,
    longitude: 127.0631,
    wage: 200000,
    wageType: 'DAILY',
    category: '마루',
    workDate: '2025-09-02',
    workTime: '09:00-18:00',
    isUrgent: false,
    requiredWorkers: 2
  },
  {
    id: '5',
    title: '사무실 목공 인테리어',
    company: '프리미엄우드',
    location: '서울시 강남구 논현동',
    latitude: 37.5106,
    longitude: 127.0282,
    wage: 22000,
    wageType: 'HOURLY',
    category: '목공',
    workDate: '2025-09-01',
    workTime: '08:30-17:30',
    isUrgent: false,
    requiredWorkers: 3
  },
  {
    id: '6',
    title: '빌딩 샷시 교체 작업',
    company: '세진샷시',
    location: '서울시 서초구 방배동',
    latitude: 37.4818,
    longitude: 127.0113,
    wage: 190000,
    wageType: 'DAILY',
    category: '샷시',
    workDate: '2025-08-31',
    workTime: '08:00-18:00',
    isUrgent: true,
    requiredWorkers: 4
  },
  {
    id: '7',
    title: '카페 에어컨 설치',
    company: '시원한에어컨',
    location: '서울시 강남구 신사동',
    latitude: 37.5205,
    longitude: 127.0194,
    wage: 170000,
    wageType: 'DAILY',
    category: '에어컨',
    workDate: '2025-09-02',
    workTime: '09:00-17:00',
    isUrgent: false,
    requiredWorkers: 2
  },
  {
    id: '8',
    title: '아파트 배관 설비 작업',
    company: '현대설비',
    location: '서울시 서초구 반포동',
    latitude: 37.5058,
    longitude: 127.0125,
    wage: 28000,
    wageType: 'HOURLY',
    category: '설비',
    workDate: '2025-09-01',
    workTime: '07:30-18:30',
    isUrgent: true,
    requiredWorkers: 3
  },
  {
    id: '9',
    title: '상가 타일 시공',
    company: '미래타일',
    location: '서울시 강남구 청담동',
    latitude: 37.5273,
    longitude: 127.0486,
    wage: 160000,
    wageType: 'DAILY',
    category: '타일',
    workDate: '2025-09-03',
    workTime: '08:00-17:00',
    isUrgent: false,
    requiredWorkers: 2
  },
  {
    id: '10',
    title: '원룸 장판 교체',
    company: '깔끔장판',
    location: '서울시 서초구 서초동',
    latitude: 37.4923,
    longitude: 127.0298,
    wage: 120000,
    wageType: 'DAILY',
    category: '장판',
    workDate: '2025-09-01',
    workTime: '10:00-16:00',
    isUrgent: false,
    requiredWorkers: 1
  },
  {
    id: '11',
    title: '오피스텔 가구 조립',
    company: '조립의달인',
    location: '서울시 강남구 대치동',
    latitude: 37.4951,
    longitude: 127.0628,
    wage: 18000,
    wageType: 'HOURLY',
    category: '가구',
    workDate: '2025-08-31',
    workTime: '13:00-18:00',
    isUrgent: true,
    requiredWorkers: 2
  },
  {
    id: '12',
    title: '주택 미장 보수 작업',
    company: '완벽미장',
    location: '서울시 서초구 잠원동',
    latitude: 37.5158,
    longitude: 127.0113,
    wage: 24000,
    wageType: 'HOURLY',
    category: '미장',
    workDate: '2025-09-02',
    workTime: '08:00-17:00',
    isUrgent: false,
    requiredWorkers: 2
  },
  {
    id: '13',
    title: '펜션 전기 점검',
    company: '안전전기',
    location: '서울시 강남구 압구정동',
    latitude: 37.5272,
    longitude: 127.0286,
    wage: 140000,
    wageType: 'DAILY',
    category: '전기',
    workDate: '2025-09-03',
    workTime: '09:30-16:30',
    isUrgent: false,
    requiredWorkers: 1
  },
  {
    id: '14',
    title: '학원 도배 리모델링',
    company: '프로도배',
    location: '서울시 서초구 교대동',
    latitude: 37.4942,
    longitude: 127.0135,
    wage: 165000,
    wageType: 'DAILY',
    category: '도배',
    workDate: '2025-09-01',
    workTime: '08:30-18:30',
    isUrgent: true,
    requiredWorkers: 3
  },
  {
    id: '15',
    title: '창고 철거 및 정리',
    company: '깔끔철거',
    location: '서울시 강남구 수서동',
    latitude: 37.4839,
    longitude: 127.1006,
    wage: 23000,
    wageType: 'HOURLY',
    category: '철거',
    workDate: '2025-09-02',
    workTime: '07:00-18:00',
    isUrgent: true,
    requiredWorkers: 6
  },
  {
    id: '16',
    title: '카페 마루 재시공',
    company: '프리미엄마루',
    location: '서울시 강남구 도곡동',
    latitude: 37.4876,
    longitude: 127.0516,
    wage: 210000,
    wageType: 'DAILY',
    category: '마루',
    workDate: '2025-09-04',
    workTime: '08:00-18:00',
    isUrgent: false,
    requiredWorkers: 3
  },
  {
    id: '17',
    title: '사무실 목공 파티션',
    company: '스마트목공',
    location: '서울시 서초구 양재동',
    latitude: 37.4672,
    longitude: 127.0348,
    wage: 26000,
    wageType: 'HOURLY',
    category: '목공',
    workDate: '2025-09-03',
    workTime: '09:00-18:00',
    isUrgent: false,
    requiredWorkers: 2
  },
  {
    id: '18',
    title: '아파트 샷시 보수',
    company: '믿음샷시',
    location: '서울시 강남구 일원동',
    latitude: 37.4833,
    longitude: 127.0831,
    wage: 175000,
    wageType: 'DAILY',
    category: '샷시',
    workDate: '2025-09-01',
    workTime: '08:30-17:30',
    isUrgent: true,
    requiredWorkers: 2
  },
  {
    id: '19',
    title: '병원 에어컨 청소',
    company: '깨끗한에어컨',
    location: '서울시 서초구 내곡동',
    latitude: 37.4648,
    longitude: 127.0918,
    wage: 130000,
    wageType: 'DAILY',
    category: '에어컨',
    workDate: '2025-09-02',
    workTime: '10:00-16:00',
    isUrgent: false,
    requiredWorkers: 1
  },
  {
    id: '20',
    title: '주택 배관 교체',
    company: '전문설비',
    location: '서울시 강남구 세곡동',
    latitude: 37.4692,
    longitude: 127.1061,
    wage: 30000,
    wageType: 'HOURLY',
    category: '설비',
    workDate: '2025-09-03',
    workTime: '08:00-17:00',
    isUrgent: true,
    requiredWorkers: 4
  }
];

export default function NearbyJobsPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[]>([]);
  const [searchRadius, setSearchRadius] = useState(5); // 기본 5km
  const [loading, setLoading] = useState(false);
  const [showChatForJob, setShowChatForJob] = useState<string | null>(null);

  // 거리 계산 함수
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 위치가 변경될 때 근처 일자리 검색
  useEffect(() => {
    if (currentLocation) {
      fetchNearbyJobs();
    } else {
      setNearbyJobs([]);
    }
  }, [currentLocation, searchRadius]);

  const fetchNearbyJobs = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `http://localhost:5000/api/v1/jobs/nearby?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&radius=${searchRadius}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNearbyJobs(data.data.jobs);
        }
      } else {
        // API 실패 시 샘플 데이터 사용
        const jobsWithDistance = sampleJobs.map(job => ({
          ...job,
          distance: calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            job.latitude,
            job.longitude
          )
        }));

        const filteredJobs = jobsWithDistance
          .filter(job => job.distance! <= searchRadius)
          .sort((a, b) => a.distance! - b.distance!);

        setNearbyJobs(filteredJobs);
      }
    } catch (error) {
      console.error('근처 일자리 조회 실패:', error);
      
      // 에러 시 샘플 데이터 사용
      const jobsWithDistance = sampleJobs.map(job => ({
        ...job,
        distance: calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          job.latitude,
          job.longitude
        )
      }));

      const filteredJobs = jobsWithDistance
        .filter(job => job.distance! <= searchRadius)
        .sort((a, b) => a.distance! - b.distance!);

      setNearbyJobs(filteredJobs);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '내일';
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      '전기': '⚡',
      '목공': '🪵',
      '샷시': '🪟',
      '철거': '🔨',
      '에어컨': '❄️',
      '설비': '🔧',
      '마루': '🪵',
      '타일': '🧱',
      '장판': '📏',
      '도배': '🎨',
      '가구': '🪑',
      '미장': '🧽'
    };
    return icons[category] || '🔨';
  };

  const handleApplyJob = async (job: NearbyJob) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 채팅방 생성 API 호출
      const response = await fetch('http://localhost:5000/api/v1/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          otherUserId: 'employer_' + job.id, // 임시 고용주 ID
          jobId: job.id,
          jobTitle: job.title
        })
      });

      if (response.ok) {
        alert('지원이 완료되었습니다! 고용주와 채팅을 시작할 수 있습니다.');
        // 채팅 목록을 새로고침하거나 채팅 창을 바로 열 수 있음
      } else {
        alert('지원 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('지원 오류:', error);
      alert('지원 중 오류가 발생했습니다.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">근처 일자리를 찾으려면 로그인해주세요.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📍 근처 일자리</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            현재 위치 기반으로 가까운 일용직을 찾아보세요
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* 위치 설정 및 필터 */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* 위치 선택기 */}
              <LocationPicker
                onLocationChange={setCurrentLocation}
                currentLocation={currentLocation}
              />

              {/* 검색 반경 설정 */}
              {currentLocation && (
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 검색 반경</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        반경: {searchRadius}km
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1km</span>
                        <span>20km</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 일자리 목록 */}
          <div className="lg:col-span-2">
            {!currentLocation ? (
              <div className="bg-white rounded-lg p-8 shadow-md text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  위치를 설정해주세요
                </h3>
                <p className="text-gray-600">
                  현재 위치를 설정하면 근처 일자리를 추천받을 수 있습니다.
                </p>
              </div>
            ) : loading ? (
              <div className="bg-white rounded-lg p-8 shadow-md text-center">
                <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">근처 일자리를 찾는 중...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    근처 일자리 {nearbyJobs.length}개
                  </h2>
                  <div className="text-sm text-gray-500">
                    {searchRadius}km 반경 내
                  </div>
                </div>

                {nearbyJobs.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 shadow-md text-center">
                    <div className="text-4xl mb-4">😔</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      근처에 일자리가 없습니다
                    </h3>
                    <p className="text-gray-600 mb-4">
                      검색 반경을 늘려보거나 다른 지역을 확인해보세요.
                    </p>
                    <button
                      onClick={() => setSearchRadius(Math.min(20, searchRadius + 5))}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                    >
                      반경 {Math.min(20, searchRadius + 5)}km로 확장
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nearbyJobs.map((job) => (
                      <div key={job.id} className="bg-white rounded-lg p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="text-2xl">{getCategoryIcon(job.category)}</div>
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {job.title}
                                  </h3>
                                  {job.isUrgent && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                      🚨 급구
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500">
                                  <span>📍 {job.location}</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="text-orange-600 font-medium">
                                    📏 {job.distance?.toFixed(1)}km
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span>📅 {formatDate(job.workDate)}</span>
                              <span>⏰ {job.workTime}</span>
                              <span>👥 {job.requiredWorkers}명 모집</span>
                            </div>
                          </div>
                          
                          <div className="text-left sm:text-right">
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                              {formatCurrency(job.wage)}
                            </div>
                            <div className="text-sm text-gray-500 mb-3">
                              {job.wageType === 'DAILY' ? '일당' : '시급'}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <a
                                href={`/jobs/${job.id}`}
                                className="w-full sm:w-auto bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium text-center"
                              >
                                상세보기
                              </a>
                              <button 
                                onClick={() => handleApplyJob(job)}
                                className="w-full sm:w-auto bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium"
                              >
                                지원하기
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}