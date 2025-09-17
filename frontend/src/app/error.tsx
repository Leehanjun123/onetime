'use client'

import { useEffect } from 'react';
import { trackEvent } from '@/components/Analytics';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅
    console.error('Application error:', error);
    
    // 분석 도구로 에러 추적
    trackEvent('error_occurred', {
      event_category: 'error',
      error_message: error.message,
      error_digest: error.digest,
      page_url: window.location.pathname
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <span className="text-9xl">⚠️</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          앗! 문제가 발생했습니다
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          일시적인 오류가 발생했습니다.
          잠시 후 다시 시도해주세요.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => {
              trackEvent('error_retry', {
                event_category: 'error',
                action: 'retry_clicked'
              });
              reset();
            }}
            className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            🔄 다시 시도하기
          </button>
          
          <a
            href="/"
            className="block w-full bg-white text-orange-600 py-3 px-6 rounded-lg font-medium border-2 border-orange-600 hover:bg-orange-50 transition-colors"
          >
            🏠 홈으로 돌아가기
          </a>
        </div>
        
        <div className="mt-12 p-4 bg-gray-100 rounded-lg text-left">
          <p className="text-xs text-gray-500 mb-2">오류 정보:</p>
          <p className="text-xs text-gray-700 font-mono break-all">
            {error.message || '알 수 없는 오류'}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 mt-2">
              오류 코드: {error.digest}
            </p>
          )}
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>계속 문제가 발생하면 고객센터로 연락주세요</p>
          <p className="font-medium text-orange-600">1588-1234</p>
        </div>
      </div>
    </div>
  );
}