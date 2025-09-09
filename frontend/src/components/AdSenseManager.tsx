'use client'

import { useState, useEffect } from 'react';
import { ADSENSE_CONFIG, detectAdBlocker, calculateEstimatedRevenue, trackAdPerformance } from '@/lib/adsense';

interface AdStats {
  slot: string;
  name: string;
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
}

export function AdSenseManager() {
  const [isAdBlockerDetected, setIsAdBlockerDetected] = useState(false);
  const [adStats, setAdStats] = useState<AdStats[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    // AdBlocker 감지
    detectAdBlocker().then(setIsAdBlockerDetected);

    // 가상의 광고 통계 데이터 (실제로는 AdSense API에서 가져옴)
    const mockStats: AdStats[] = [
      { slot: ADSENSE_CONFIG.slots.banner, name: '배너 광고', impressions: 1250, clicks: 25, ctr: 2.0, revenue: 12.50 },
      { slot: ADSENSE_CONFIG.slots.sidebar, name: '사이드바 광고', impressions: 850, clicks: 17, ctr: 2.0, revenue: 8.50 },
      { slot: ADSENSE_CONFIG.slots.infeed, name: '인피드 광고', impressions: 2100, clicks: 63, ctr: 3.0, revenue: 31.50 },
      { slot: ADSENSE_CONFIG.slots.mobile, name: '모바일 하단', impressions: 1800, clicks: 36, ctr: 2.0, revenue: 18.00 },
      { slot: ADSENSE_CONFIG.slots.native, name: '네이티브 광고', impressions: 950, clicks: 28, ctr: 2.9, revenue: 14.25 }
    ];

    setAdStats(mockStats);
    setTotalRevenue(mockStats.reduce((sum, stat) => sum + stat.revenue, 0));
  }, []);

  if (!ADSENSE_CONFIG.enabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-600">⚠️</span>
          <h3 className="font-semibold text-yellow-800">AdSense 비활성화</h3>
        </div>
        <p className="text-yellow-700 text-sm">
          환경변수에서 NEXT_PUBLIC_ADSENSE_ENABLED=true로 설정하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AdSense 상태 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4">📊 AdSense 현황</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 mb-1">총 수익</h3>
            <p className="text-2xl font-bold text-green-900">${totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-green-600">이번 달</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-1">총 노출수</h3>
            <p className="text-2xl font-bold text-blue-900">
              {adStats.reduce((sum, stat) => sum + stat.impressions, 0).toLocaleString()}
            </p>
            <p className="text-xs text-blue-600">이번 달</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-800 mb-1">평균 CTR</h3>
            <p className="text-2xl font-bold text-purple-900">
              {(adStats.reduce((sum, stat) => sum + stat.ctr, 0) / adStats.length).toFixed(2)}%
            </p>
            <p className="text-xs text-purple-600">이번 달</p>
          </div>
        </div>

        {/* AdBlocker 감지 */}
        {isAdBlockerDetected && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-red-600">🚫</span>
              <h3 className="font-semibold text-red-800">광고 차단기 감지됨</h3>
            </div>
            <p className="text-red-700 text-sm mt-1">
              일부 사용자가 광고 차단기를 사용하고 있어 수익에 영향을 줄 수 있습니다.
            </p>
          </div>
        )}

        {/* AdSense 설정 정보 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">설정 정보</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">클라이언트 ID:</span>
              <span className="font-mono">{ADSENSE_CONFIG.clientId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">활성 상태:</span>
              <span className={`font-semibold ${ADSENSE_CONFIG.enabled ? 'text-green-600' : 'text-red-600'}`}>
                {ADSENSE_CONFIG.enabled ? '활성' : '비활성'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">광고 슬롯 수:</span>
              <span>{Object.values(ADSENSE_CONFIG.slots).filter(slot => slot).length}개</span>
            </div>
          </div>
        </div>
      </div>

      {/* 광고별 성과 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4">📈 광고별 성과</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-2 font-medium">광고 유형</th>
                <th className="pb-2 font-medium text-right">노출수</th>
                <th className="pb-2 font-medium text-right">클릭수</th>
                <th className="pb-2 font-medium text-right">CTR</th>
                <th className="pb-2 font-medium text-right">수익</th>
              </tr>
            </thead>
            <tbody>
              {adStats.map((stat, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className="py-3">
                    <div>
                      <div className="font-medium">{stat.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{stat.slot}</div>
                    </div>
                  </td>
                  <td className="py-3 text-right">{stat.impressions.toLocaleString()}</td>
                  <td className="py-3 text-right">{stat.clicks}</td>
                  <td className="py-3 text-right">{stat.ctr}%</td>
                  <td className="py-3 text-right font-semibold">${stat.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AdSense 관리 도구 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4">🔧 관리 도구</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => trackAdPerformance('test', 'click')}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-4 rounded-lg transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">테스트 이벤트</div>
            <div className="text-xs">광고 추적 테스트</div>
          </button>
          
          <button
            onClick={() => detectAdBlocker().then(blocked => alert(blocked ? '광고 차단기 감지됨' : '광고 차단기 없음'))}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 p-4 rounded-lg transition-colors"
          >
            <div className="text-2xl mb-2">🚫</div>
            <div className="font-medium">차단기 감지</div>
            <div className="text-xs">AdBlocker 확인</div>
          </button>
          
          <a
            href="https://www.google.com/adsense"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-100 hover:bg-green-200 text-green-800 p-4 rounded-lg transition-colors block text-center"
          >
            <div className="text-2xl mb-2">🏠</div>
            <div className="font-medium">AdSense 콘솔</div>
            <div className="text-xs">Google AdSense 이동</div>
          </a>
        </div>
      </div>
    </div>
  );
}

// AdSense 토글 버튼
export function AdSenseToggle() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <button
        onClick={() => setVisible(!visible)}
        className="fixed bottom-20 right-4 bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg transition-colors z-40"
        title="AdSense 관리"
      >
        💰
      </button>
      
      {visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h1 className="text-xl font-bold">AdSense 관리</h1>
              <button
                onClick={() => setVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <AdSenseManager />
            </div>
          </div>
        </div>
      )}
    </>
  );
}