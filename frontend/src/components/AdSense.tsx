'use client'

import { useEffect } from 'react';
import Script from 'next/script';

// AdSense 설정
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-1234567890123456';
const ADSENSE_ENABLED = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true';

// 슬롯 ID들
const SLOT_IDS = {
  banner: process.env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT || '1234567890',
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT || '0987654321',
  infeed: process.env.NEXT_PUBLIC_ADSENSE_INFEED_SLOT || '1122334455',
  mobile: process.env.NEXT_PUBLIC_ADSENSE_MOBILE_SLOT || '5544332211',
  native: process.env.NEXT_PUBLIC_ADSENSE_NATIVE_SLOT || '9988776655'
};

interface AdSenseProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

// AdSense 스크립트 로더
export function AdSenseScript() {
  if (!ADSENSE_ENABLED) return null;
  
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

// AdSense 광고 컴포넌트
export function AdSenseAd({ 
  slot, 
  format = 'auto',
  responsive = true,
  style = {},
  className = ''
}: AdSenseProps) {
  useEffect(() => {
    if (!ADSENSE_ENABLED) return;
    
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  if (!ADSENSE_ENABLED) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${className}`} style={style}>
        <span className="text-gray-500 text-sm">광고 생성 예정 공간</span>
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{
        display: 'block',
        ...style
      }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive}
    />
  );
}

// 배너 광고 (상단/하단)
export function BannerAd({ position = 'top' }: { position?: 'top' | 'bottom' }) {
  return (
    <div className={`w-full ${position === 'top' ? 'mb-4' : 'mt-4'}`}>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
        <span className="text-xs text-gray-500 block mb-1">광고</span>
        <AdSenseAd
          slot={SLOT_IDS.banner}
          format="horizontal"
          style={{ minHeight: '90px' }}
        />
      </div>
    </div>
  );
}

// 사이드바 광고
export function SidebarAd() {
  return (
    <div className="sticky top-20">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
        <span className="text-xs text-gray-500 block mb-1 text-center">광고</span>
        <AdSenseAd
          slot={SLOT_IDS.sidebar}
          format="rectangle"
          style={{ minHeight: '250px' }}
        />
      </div>
    </div>
  );
}

// 인피드 광고 (리스트 중간)
export function InFeedAd() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 my-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">광고</span>
        <span className="text-xs text-gray-400">Sponsored</span>
      </div>
      <AdSenseAd
        slot={SLOT_IDS.infeed}
        format="fluid"
        style={{ minHeight: '100px' }}
      />
    </div>
  );
}

// 모바일 고정 하단 광고
export function MobileBottomAd() {
  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 md:hidden bg-white border-t border-gray-200 p-2">
      <div className="max-w-screen-sm mx-auto">
        <span className="text-xs text-gray-500 block text-center mb-1">광고</span>
        <AdSenseAd
          slot={SLOT_IDS.mobile}
          format="horizontal"
          style={{ minHeight: '50px', maxHeight: '100px' }}
        />
      </div>
    </div>
  );
}

// 팝업/인터스티셜 광고 (사용 주의)
export function InterstitialAd({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">광고</span>
          <button
            onClick={() => window.location.reload()}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <AdSenseAd
          slot={SLOT_IDS.banner}
          format="rectangle"
          style={{ minHeight: '250px' }}
        />
      </div>
    </div>
  );
}

// 네이티브 광고 (콘텐츠와 유사한 스타일)
export function NativeAd() {
  return (
    <div className="bg-orange-50 rounded-2xl p-4 my-4 border border-orange-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-orange-200 text-orange-700 px-2 py-1 rounded">추천</span>
          <span className="text-xs text-gray-500">광고</span>
        </div>
      </div>
      <AdSenseAd
        slot={SLOT_IDS.native}
        format="fluid"
        className="native-ad"
      />
    </div>
  );
}

// 광고 로드 체크
export function useAdBlockDetector() {
  useEffect(() => {
    const checkAdBlock = setTimeout(() => {
      const adElement = document.querySelector('.adsbygoogle');
      if (adElement && adElement.clientHeight === 0) {
        console.log('AdBlock detected');
        // 광고 차단 감지 시 처리
        // 예: 사용자에게 광고 차단 해제 요청
      }
    }, 3000);

    return () => clearTimeout(checkAdBlock);
  }, []);
}