// Google AdSense 유틸리티 함수들

export const ADSENSE_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true',
  slots: {
    banner: process.env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT || '',
    sidebar: process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT || '',
    infeed: process.env.NEXT_PUBLIC_ADSENSE_INFEED_SLOT || '',
    mobile: process.env.NEXT_PUBLIC_ADSENSE_MOBILE_SLOT || '',
    native: process.env.NEXT_PUBLIC_ADSENSE_NATIVE_SLOT || ''
  }
};

// AdSense 광고 성능 추적
export const trackAdPerformance = (adSlot: string, event: 'impression' | 'click') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', `ad_${event}`, {
      event_category: 'advertising',
      ad_slot: adSlot,
      value: event === 'click' ? 1 : 0
    });
  }
};

// AdSense 광고 차단 감지
export const detectAdBlocker = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox';
    testAd.style.position = 'absolute';
    testAd.style.left = '-10000px';
    testAd.style.width = '1px';
    testAd.style.height = '1px';
    
    document.body.appendChild(testAd);
    
    setTimeout(() => {
      const isBlocked = testAd.offsetHeight === 0;
      document.body.removeChild(testAd);
      resolve(isBlocked);
    }, 100);
  });
};

// AdSense 광고 로드 상태 확인
export const checkAdLoadStatus = (adElement: HTMLElement): Promise<boolean> => {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (adElement.querySelector('iframe') || adElement.innerHTML.includes('google_ads_iframe')) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 100);
    
    // 5초 후 타임아웃
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(false);
    }, 5000);
  });
};

// 광고 수익 계산 (예상치)
export const calculateEstimatedRevenue = (impressions: number, ctr: number = 0.02, cpc: number = 0.5) => {
  const clicks = impressions * ctr;
  const revenue = clicks * cpc;
  return {
    impressions,
    clicks: Math.round(clicks),
    revenue: Math.round(revenue * 100) / 100
  };
};

// AdSense 스크립트 동적 로드
export const loadAdSenseScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!ADSENSE_CONFIG.enabled || !ADSENSE_CONFIG.clientId) {
      reject(new Error('AdSense not configured'));
      return;
    }

    // 이미 로드된 경우
    if (document.querySelector(`script[src*="pagead2.googlesyndication.com"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.clientId}`;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load AdSense script'));
    
    document.head.appendChild(script);
  });
};

// 광고 영역 가시성 감지
export const observeAdVisibility = (adElement: HTMLElement, callback: (visible: boolean) => void) => {
  if (!window.IntersectionObserver) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        callback(entry.isIntersecting);
        if (entry.isIntersecting) {
          trackAdPerformance(adElement.dataset.adSlot || '', 'impression');
        }
      });
    },
    { threshold: 0.5 }
  );

  observer.observe(adElement);
  return observer;
};