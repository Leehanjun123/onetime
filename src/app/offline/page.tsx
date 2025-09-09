'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // 네트워크 상태 감지
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    
    try {
      const response = await fetch('/api/health', { 
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.log('Connection still unavailable');
    }
  };

  // 온라인 상태가 복구되면 자동으로 리디렉션
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          
          <h1 className="text-2xl font-bold text-green-600 mb-4">
            연결 복구됨!
          </h1>
          
          <p className="text-gray-600 mb-6">
            인터넷 연결이 복구되었습니다.<br/>
            잠시 후 자동으로 이동합니다...
          </p>

          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
        {/* 오프라인 아이콘 */}
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-12.728 12.728M9.879 9.879l4.242 4.242M6.343 6.343l11.314 11.314M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          오프라인 모드
        </h1>

        <p className="text-gray-600 mb-6">
          인터넷 연결을 확인해주세요.<br/>
          일부 기능은 오프라인에서도 사용 가능합니다.
        </p>

        {/* 연결 상태 표시 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-700">
              네트워크 연결 없음
            </span>
          </div>
        </div>

        {/* 사용 가능한 기능들 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">오프라인에서도 가능한 기능</h3>
          <ul className="text-sm text-blue-700 space-y-1 text-left">
            <li>• 이전에 본 일자리 목록 확인</li>
            <li>• 저장된 프로필 정보 보기</li>
            <li>• 즐겨찾기한 일자리 확인</li>
            <li>• 앱 사용법 및 도움말</li>
          </ul>
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
            disabled={retryCount >= 3}
          >
            {retryCount >= 3 ? '잠시 후 다시 시도해주세요' : `다시 연결 시도 ${retryCount > 0 ? `(${retryCount})` : ''}`}
          </button>

          <Link
            href="/jobs"
            className="block w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
          >
            저장된 일자리 보기
          </Link>
        </div>

        {/* 현장 작업자를 위한 팁 */}
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg text-left">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 현장에서 연결이 안 될 때</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Wi-Fi와 모바일 데이터를 번갈아 시도</li>
            <li>• 건물 밖이나 높은 곳으로 이동</li>
            <li>• 비행기 모드를 10초간 켠 후 해제</li>
            <li>• 긴급시 전화: <span className="font-semibold">1588-0000</span></li>
          </ul>
        </div>

        {/* 재시도 횟수 표시 */}
        {retryCount > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            재시도 {retryCount}회 / 3회
          </div>
        )}
      </div>
    </div>
  );
}