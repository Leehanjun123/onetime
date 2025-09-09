'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InstantMatching from '../../../components/InstantMatching';

export default function InstantMatchingPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [acceptedMatch, setAcceptedMatch] = useState<any>(null);

  const handleMatchFound = (foundMatches: any[]) => {
    setMatches(foundMatches);
  };

  const handleMatchAccepted = (match: any) => {
    setAcceptedMatch(match);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ⚡ 즉시 매칭 서비스
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            AI 기반 실시간 매칭으로 조건에 맞는 일자리를 빠르게 찾아보세요. 
            5분 내에 매칭 결과를 받아볼 수 있습니다.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold text-gray-900 mb-2">정확한 매칭</h3>
            <p className="text-sm text-gray-600">
              AI가 위치, 급여, 경력을 종합 분석하여 최적의 일자리를 추천합니다.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900 mb-2">빠른 응답</h3>
            <p className="text-sm text-gray-600">
              5분 내 매칭 결과 알림, 실시간 수락/거절 처리로 빠른 취업을 지원합니다.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">🔔</div>
            <h3 className="font-bold text-gray-900 mb-2">실시간 알림</h3>
            <p className="text-sm text-gray-600">
              새로운 매칭, 수락/거절 알림을 즉시 받아볼 수 있습니다.
            </p>
          </div>
        </div>

        {/* Instant Matching Component */}
        <InstantMatching 
          userId="user123" // 실제로는 로그인된 사용자 ID 사용
          onMatchFound={handleMatchFound}
          onMatchAccepted={handleMatchAccepted}
        />

        {/* Success Message */}
        {acceptedMatch && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">🎉</div>
              <h3 className="text-lg font-bold text-green-800">매칭 성사!</h3>
            </div>
            <p className="text-green-700 mb-4">
              축하합니다! {acceptedMatch.job.title} 일자리에 매칭되었습니다.
            </p>
            <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">다음 단계:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>1. 고용주 연락처 확인 및 연락</li>
                <li>2. 작업 세부 사항 논의</li>
                <li>3. 작업 시작 전 체크인</li>
                <li>4. 작업 완료 후 체크아웃 및 정산</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/messages')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                메시지 확인하기
              </button>
              <button
                onClick={() => router.push('/work-tracking')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                근무 관리하기
              </button>
            </div>
          </div>
        )}

        {/* How it Works */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            매칭 프로세스
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1️⃣</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">조건 입력</h3>
              <p className="text-sm text-gray-600">
                희망 지역, 직종, 급여 등 조건을 입력합니다.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2️⃣</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">AI 매칭</h3>
              <p className="text-sm text-gray-600">
                AI가 조건에 맞는 일자리를 실시간 검색합니다.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3️⃣</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">매칭 알림</h3>
              <p className="text-sm text-gray-600">
                적합한 일자리 발견시 즉시 알림을 받습니다.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">4️⃣</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">매칭 완료</h3>
              <p className="text-sm text-gray-600">
                수락시 고용주와 연결되어 작업을 시작합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-yellow-800 mb-3">💡 매칭 성공 팁</h3>
          <ul className="text-sm text-yellow-700 space-y-2">
            <li>• 정확한 위치 정보를 입력하면 더 정확한 매칭을 받을 수 있습니다.</li>
            <li>• 급여 조건을 너무 높게 설정하면 매칭 기회가 줄어들 수 있습니다.</li>
            <li>• 긴급 일자리 옵션을 체크하면 더 빠른 매칭이 가능합니다.</li>
            <li>• 여러 직종을 선택하면 매칭 확률이 높아집니다.</li>
          </ul>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}