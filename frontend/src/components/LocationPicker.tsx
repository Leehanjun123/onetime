'use client'

import { useState, useEffect } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationPickerProps {
  onLocationChange: (location: LocationData | null) => void;
  currentLocation?: LocationData | null;
}

export default function LocationPicker({ onLocationChange, currentLocation }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // 역지오코딩으로 주소 가져오기 (여기서는 간단한 형태로 구현)
          const locationData: LocationData = {
            latitude,
            longitude,
            address: `위도: ${latitude.toFixed(4)}, 경도: ${longitude.toFixed(4)}`
          };

          onLocationChange(locationData);
          setLoading(false);
        } catch (err) {
          console.error('주소 변환 실패:', err);
          onLocationChange({
            latitude,
            longitude,
            address: `위도: ${latitude.toFixed(4)}, 경도: ${longitude.toFixed(4)}`
          });
          setLoading(false);
        }
      },
      (err) => {
        console.error('위치 가져오기 실패:', err);
        setLoading(false);
        
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setError('위치 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('위치 정보를 사용할 수 없습니다.');
        } else if (err.code === err.TIMEOUT) {
          setError('위치 요청 시간이 초과되었습니다.');
        } else {
          setError('위치 정보를 가져올 수 없습니다.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5분
      }
    );
  };

  // 거리 계산 함수 (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // 소수점 첫째자리까지
  };

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📍 위치 설정</h3>
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              위치 확인 중...
            </>
          ) : (
            <>
              🎯 현재 위치
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          {permissionDenied && (
            <p className="text-xs text-red-500 mt-2">
              💡 팁: 브라우저 주소창 왼쪽의 자물쇠 아이콘을 클릭하여 위치 권한을 허용할 수 있습니다.
            </p>
          )}
        </div>
      )}

      {currentLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <div className="text-green-600 mt-1">✅</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 mb-1">현재 위치가 설정되었습니다</p>
              <p className="text-xs text-green-600">{currentLocation.address}</p>
              <div className="mt-2 text-xs text-green-600">
                위도: {currentLocation.latitude.toFixed(6)} | 경도: {currentLocation.longitude.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}

      {!currentLocation && !error && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-sm text-gray-600 mb-3">
            현재 위치를 설정하면 근처 일자리를 추천받을 수 있습니다
          </p>
          <p className="text-xs text-gray-500">
            위치 정보는 일자리 매칭에만 사용되며, 안전하게 처리됩니다.
          </p>
        </div>
      )}
    </div>
  );
}