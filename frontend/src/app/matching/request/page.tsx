'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 전문 분야 데이터
const specialties = [
  { id: '1', name: '전기', code: 'ELECTRIC', icon: '⚡' },
  { id: '2', name: '목공', code: 'CARPENTRY', icon: '🔨' },
  { id: '3', name: '샷시', code: 'SASH', icon: '🪟' },
  { id: '4', name: '철거', code: 'DEMOLITION', icon: '🏗️' },
  { id: '5', name: '에어컨', code: 'AIRCON', icon: '❄️' },
  { id: '6', name: '설비', code: 'PLUMBING', icon: '🔧' },
  { id: '7', name: '마루', code: 'FLOOR', icon: '🪵' },
  { id: '8', name: '타일', code: 'TILE', icon: '🟦' },
  { id: '9', name: '장판', code: 'LINOLEUM', icon: '📐' },
  { id: '10', name: '도배', code: 'WALLPAPER', icon: '🎨' },
  { id: '11', name: '가구', code: 'FURNITURE', icon: '🪑' },
  { id: '12', name: '미장', code: 'PLASTERING', icon: '🏠' }
];

export default function MatchingRequestPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'EMPLOYER' | 'JOB_SEEKER'>('EMPLOYER');
  const [formData, setFormData] = useState({
    matchDate: '',
    matchTime: '',
    categoryId: '',
    location: '',
    latitude: 0,
    longitude: 0,
    radius: 5,
    desiredWage: '',
    wageType: 'DAILY' as 'DAILY' | 'HOURLY',
    workHours: 8,
    isUrgent: false,
    urgentBonus: '',
    requirements: ''
  });
  const [isLocating, setIsLocating] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          // Reverse geocoding (실제로는 Google Maps API 등 사용)
          setFormData(prev => ({
            ...prev,
            location: `현재 위치 (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
          }));
          setIsLocating(false);
        },
        (error) => {
          console.error('위치 정보 획득 실패:', error);
          alert('위치 정보를 가져올 수 없습니다.');
          setIsLocating(false);
        }
      );
    } else {
      alert('브라우저가 위치 정보를 지원하지 않습니다.');
      setIsLocating(false);
    }
  };

  // 오늘 날짜를 기본값으로 설정
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);
    setFormData(prev => ({
      ...prev,
      matchDate: today,
      matchTime: currentTime
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 날짜와 시간 합치기
      const matchDateTime = new Date(`${formData.matchDate}T${formData.matchTime}`).toISOString();

      const requestData = {
        matchDate: matchDateTime,
        categoryId: formData.categoryId || undefined,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius: formData.radius,
        desiredWage: formData.desiredWage ? parseInt(formData.desiredWage) : undefined,
        wageType: formData.wageType,
        workHours: formData.workHours,
        isUrgent: formData.isUrgent,
        urgentBonus: formData.urgentBonus ? parseInt(formData.urgentBonus) : undefined,
        requirements: formData.requirements
      };

      const response = await fetch('https://onetime-production.up.railway.app/api/v1/matching/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        setMatches(data.data.matches || []);
        alert(`매칭 요청이 생성되었습니다! ${data.data.potentialMatches}개의 잠재 매칭을 찾았습니다.`);
      } else {
        alert(data.message || '매칭 요청 실패');
      }
    } catch (error) {
      console.error('매칭 요청 오류:', error);
      alert('매칭 요청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ⚡ 빠른 매칭 요청
          </h1>
          <p className="text-gray-600">
            {userType === 'EMPLOYER' 
              ? '필요한 인력을 빠르게 찾아드립니다. AI가 최적의 인력을 매칭해드려요.'
              : '원하는 조건의 일자리를 빠르게 찾아드립니다.'}
          </p>
        </div>

        {/* User Type Toggle */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setUserType('EMPLOYER')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                userType === 'EMPLOYER'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              👔 인력을 찾고 있어요
            </button>
            <button
              onClick={() => setUserType('JOB_SEEKER')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                userType === 'JOB_SEEKER'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              👷 일자리를 찾고 있어요
            </button>
          </div>
        </div>

        {/* Matching Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 작업 일시 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📅 작업 일시</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  작업 날짜
                </label>
                <input
                  type="date"
                  required
                  value={formData.matchDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, matchDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 시간
                </label>
                <input
                  type="time"
                  required
                  value={formData.matchTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, matchTime: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 전문 분야 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🔧 전문 분야</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, categoryId: '' }))}
                className={`p-3 rounded-lg border-2 transition-all ${
                  !formData.categoryId
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🔍</div>
                <div className="text-sm font-medium">전체</div>
              </button>
              {specialties.map(specialty => (
                <button
                  key={specialty.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, categoryId: specialty.id }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.categoryId === specialty.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{specialty.icon}</div>
                  <div className="text-sm font-medium">{specialty.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 위치 정보 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📍 위치 정보</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  작업 위치
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="예: 서울시 강남구 역삼동"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isLocating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {isLocating ? '위치 확인중...' : '현재 위치'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  검색 반경 (km)
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={formData.radius}
                  onChange={(e) => setFormData(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>1km</span>
                  <span className="font-bold text-indigo-600">{formData.radius}km</span>
                  <span>50km</span>
                </div>
              </div>
            </div>
          </div>

          {/* 급여 조건 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">💰 급여 조건</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {userType === 'EMPLOYER' ? '제시 급여' : '희망 급여'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="150000"
                    value={formData.desiredWage}
                    onChange={(e) => setFormData(prev => ({ ...prev, desiredWage: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={formData.wageType}
                    onChange={(e) => setFormData(prev => ({ ...prev, wageType: e.target.value as 'DAILY' | 'HOURLY' }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DAILY">일당</option>
                    <option value="HOURLY">시급</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예상 근무 시간
                </label>
                <select
                  value={formData.workHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, workHours: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {[4, 6, 8, 10, 12].map(hour => (
                    <option key={hour} value={hour}>{hour}시간</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 긴급 옵션 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🚨 긴급 옵션</h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData(prev => ({ ...prev, isUrgent: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-700">
                  <span className="font-medium">긴급 매칭 요청</span>
                  <span className="text-sm text-gray-500 block">4시간 내 매칭 (일반: 24시간)</span>
                </span>
              </label>
              {formData.isUrgent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    긴급 보너스 (선택)
                  </label>
                  <input
                    type="number"
                    placeholder="20000"
                    value={formData.urgentBonus}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgentBonus: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 추가 요구사항 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📝 추가 요구사항</h2>
            <textarea
              rows={4}
              placeholder="예: 경력 3년 이상, 자격증 보유자 우대, 차량 소지자 등"
              value={formData.requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.location}
              className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium"
            >
              {isSubmitting ? '매칭 중...' : '매칭 요청하기'}
            </button>
          </div>
        </form>

        {/* Matching Results */}
        {matches.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 추천 매칭</h2>
            <div className="space-y-3">
              {matches.map((match, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {match.name || match.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        거리: {match.distance?.toFixed(1)}km | 
                        매칭 점수: {match.matchScore}%
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                      상세보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}