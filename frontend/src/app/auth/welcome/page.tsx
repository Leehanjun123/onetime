'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    {
      icon: '💰',
      title: '당일 정산 보장',
      description: '일 끝나면 바로 계좌로 입금됩니다. 알바몬이 중간에서 안전하게 관리해요!'
    },
    {
      icon: '🛡️',
      title: '100% 안전 보장',
      description: '사업자 인증된 업체만 등록. 문제 발생 시 알바몬이 직접 해결해드려요!'
    },
    {
      icon: '📍',
      title: '내 주변 일자리',
      description: '집에서 가까운 곳만 추천해드려요. 교통비 절약!'
    },
    {
      icon: '⏰',
      title: '즉시 시작 가능',
      description: '오늘 지원하면 내일부터 바로 일할 수 있어요. 빠른 매칭 보장!'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [tips.length]);

  const handleGetStarted = () => {
    if (user?.userType === 'EMPLOYER') {
      router.push('/jobs/post');
    } else {
      router.push('/jobs');
    }
  };

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('알림이 활성화되었습니다!', {
          body: '새로운 일자리 소식을 실시간으로 받아보세요',
          icon: '/icons/icon-192x192.png'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">
            환영합니다, {user?.name || '새 회원'}님!
          </h1>
          <p className="text-orange-100">
            {user?.userType === 'EMPLOYER' ? '인력 모집' : '일자리 찾기'} 준비 완료!
          </p>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="p-8">
          {/* 팁 카르셀 */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-2xl p-6 text-center min-h-[140px] flex flex-col justify-center">
              <div className="text-4xl mb-3">{tips[currentTip].icon}</div>
              <h3 className="text-lg font-semibold mb-2">{tips[currentTip].title}</h3>
              <p className="text-gray-600 text-sm">{tips[currentTip].description}</p>
            </div>
            
            <div className="flex justify-center mt-4 space-x-2">
              {tips.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTip(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentTip ? 'bg-orange-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-4">
            <button
              onClick={handleGetStarted}
              className="w-full bg-orange-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-orange-700 transition-colors"
            >
              {user?.userType === 'EMPLOYER' ? '🚀 첫 번째 모집공고 올리기' : '🔍 주변 일자리 찾아보기'}
            </button>

            <button
              onClick={handleEnableNotifications}
              className="w-full border-2 border-orange-600 text-orange-600 py-4 rounded-xl font-semibold hover:bg-orange-50 transition-colors"
            >
              🔔 실시간 알림 켜기
            </button>

            <Link
              href="/profile"
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold text-center block hover:bg-gray-200 transition-colors"
            >
              👤 프로필 완성하기
            </Link>
          </div>

          {/* 당일정산 프로세스 설명 */}
          <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
              💰 당일정산 프로세스
            </h4>
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex items-center">
                <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2">1</span>
                <span>일 완료 후 앱에서 '근무완료' 버튼 터치</span>
              </div>
              <div className="flex items-center">
                <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2">2</span>
                <span>고용주가 확인하면 자동으로 정산 처리</span>
              </div>
              <div className="flex items-center">
                <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2">3</span>
                <span>등록된 계좌로 즉시 입금 (평균 3분 소요)</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-green-100 rounded-lg">
              <p className="text-xs text-green-800 font-medium">
                🛡️ 알바몬 보장제: 정산 지연 시 알바몬이 먼저 지급하고 나중에 회수합니다
              </p>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <h4 className="font-semibold text-blue-800 mb-2">💡 더 좋은 조건으로 일하려면?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 프로필을 완성하면 매칭 확률이 3배 높아져요</li>
              <li>• 좋은 평점을 받으면 더 좋은 조건의 일자리를 우선 추천받아요</li>
              <li>• 위치 정보를 허용하면 통근시간 30분 이내 일자리만 보여드려요</li>
            </ul>
          </div>

          {/* 고객센터 정보 */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>궁금한 점이 있으신가요?</p>
            <div className="mt-2 space-x-4">
              <Link href="/faq" className="text-orange-600 font-semibold hover:text-orange-700">
                자주 묻는 질문
              </Link>
              <span>•</span>
              <Link href="/contact" className="text-orange-600 font-semibold hover:text-orange-700">
                1588-0000
              </Link>
            </div>
          </div>
        </div>

        {/* 하단 스킵 버튼 */}
        <div className="px-8 pb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            나중에 설정하고 바로 시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}