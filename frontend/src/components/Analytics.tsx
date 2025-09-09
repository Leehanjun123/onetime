'use client'

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

// Google Analytics 4 설정
declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
    dataLayer?: any[];
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    // Google Analytics 스크립트 로드
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: false, // 수동으로 페이지뷰 추적
        custom_map: {
          'custom_dimension_1': 'user_type',
          'custom_dimension_2': 'location',
          'custom_dimension_3': 'job_category',
          'custom_dimension_4': 'device_type'
        }
      });
    `;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  return null;
}

export function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (typeof window.gtag === 'undefined') return;

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    // 건설업 특화 페이지 뷰 추적
    if (GA_MEASUREMENT_ID) {
      window.gtag?.('config', GA_MEASUREMENT_ID, {
        page_title: document.title,
        page_location: window.location.origin + url,
        custom_map: {
          user_type: user?.userType || 'guest',
          location: user?.location || 'unknown',
          device_type: getMobileDeviceType(),
          timestamp: Date.now()
        }
      });
    }

    // 특별한 페이지별 이벤트 추적
    trackSpecialPages(pathname);
  }, [pathname, searchParams, user]);

  return null;
}

// Hotjar 설정
export function HotjarTracker() {
  useEffect(() => {
    const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;
    if (!HOTJAR_ID) return;

    // Hotjar 스크립트 로드
    const script = document.createElement('script');
    script.innerHTML = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${HOTJAR_ID},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
    document.head.appendChild(script);

    // 건설업 특화 Hotjar 이벤트
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.hj = window.hj || function () {
        // @ts-ignore
        (window.hj.q = window.hj.q || []).push(arguments);
      };
      
      // 사용자 속성 설정
      setTimeout(() => {
        // @ts-ignore
        window.hj('identify', 'user-' + Date.now(), {
          device_type: getMobileDeviceType(),
          screen_size: `${window.screen.width}x${window.screen.height}`,
          user_agent: navigator.userAgent,
          is_construction_worker: true,
          session_start: new Date().toISOString()
        });
      }, 1000);
    }

    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return null;
}

// 이벤트 추적 유틸리티
export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && !window.gtag) return;

  // 건설업 특화 파라미터 자동 추가
  const enhancedParams = {
    ...parameters,
    timestamp: Date.now(),
    device_type: getMobileDeviceType(),
    screen_size: `${window.screen.width}x${window.screen.height}`,
    connection_type: getConnectionType(),
  };

  window.gtag?.('event', eventName, enhancedParams);

  // 개발환경에서 로그 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Event tracked:', eventName, enhancedParams);
  }
};

// 건설업 특화 이벤트들
export const trackJobSearch = (searchParams: {
  category?: string;
  location?: string;
  filters?: string[];
  results_count?: number;
}) => {
  trackEvent('job_search', {
    event_category: 'job_interaction',
    search_category: searchParams.category || 'all',
    search_location: searchParams.location || 'current',
    active_filters: searchParams.filters?.join(',') || 'none',
    results_found: searchParams.results_count || 0
  });
};

export const trackJobApplication = (jobData: {
  job_id: string;
  job_title: string;
  job_category: string;
  hourly_pay: number;
  is_urgent: boolean;
  application_method: 'call' | 'message' | 'form';
}) => {
  trackEvent('job_application', {
    event_category: 'conversion',
    job_id: jobData.job_id,
    job_title: jobData.job_title,
    job_category: jobData.job_category,
    hourly_pay: jobData.hourly_pay,
    is_urgent_job: jobData.is_urgent,
    application_method: jobData.application_method,
    value: jobData.hourly_pay / 100 // 가치를 백원 단위로 설정
  });
};

export const trackUserRegistration = (userType: 'JOB_SEEKER' | 'EMPLOYER', registrationTime: number) => {
  trackEvent('sign_up', {
    event_category: 'user_lifecycle',
    method: 'phone_sms',
    user_type: userType,
    registration_duration: registrationTime,
    value: userType === 'JOB_SEEKER' ? 10 : 50 // LTV 예상치
  });
};

export const trackConstructionWorkCheck = (action: 'check_in' | 'check_out', location?: string) => {
  trackEvent('work_attendance', {
    event_category: 'work_tracking',
    action_type: action,
    work_location: location || 'unknown',
    timestamp: Date.now()
  });
};

export const trackOfflineUsage = (feature: string, duration: number) => {
  trackEvent('offline_usage', {
    event_category: 'pwa_engagement',
    feature_used: feature,
    offline_duration: duration,
    network_type: 'offline'
  });
};

// 특별한 페이지 추적
function trackSpecialPages(pathname: string) {
  if (pathname === '/') {
    trackEvent('page_view_home', {
      event_category: 'navigation',
      page_type: 'landing'
    });
  } else if (pathname === '/jobs') {
    trackEvent('page_view_jobs', {
      event_category: 'navigation',
      page_type: 'job_listing'
    });
  } else if (pathname === '/auth/register') {
    trackEvent('page_view_register', {
      event_category: 'navigation',
      page_type: 'registration_start'
    });
  } else if (pathname === '/auth/welcome') {
    trackEvent('registration_complete', {
      event_category: 'user_lifecycle',
      page_type: 'onboarding'
    });
  } else if (pathname === '/offline') {
    trackEvent('offline_page_view', {
      event_category: 'pwa_engagement',
      page_type: 'offline_fallback'
    });
  }
}

// 유틸리티 함수들
function getMobileDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipod/.test(userAgent)) return 'iPhone';
  if (/ipad/.test(userAgent)) return 'iPad';
  if (/android/.test(userAgent)) {
    if (/mobile/.test(userAgent)) return 'Android Mobile';
    return 'Android Tablet';
  }
  if (/windows phone/.test(userAgent)) return 'Windows Phone';
  
  return 'Desktop';
}

function getConnectionType(): string {
  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (connection) {
    return connection.effectiveType || connection.type || 'unknown';
  }
  
  return 'unknown';
}

// 마운트될 때 자동으로 세션 시작 추적
export function SessionTracker() {
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // 세션 시작 추적
    trackEvent('session_start', {
      event_category: 'user_engagement',
      user_type: user?.userType || 'guest',
      session_id: generateSessionId(),
      is_returning_user: localStorage.getItem('returning_user') === 'true'
    });

    // 리턴 유저 체크
    if (!localStorage.getItem('first_visit')) {
      localStorage.setItem('first_visit', Date.now().toString());
      trackEvent('first_visit', {
        event_category: 'user_lifecycle',
        visit_timestamp: Date.now()
      });
    } else {
      localStorage.setItem('returning_user', 'true');
    }

    // 페이지 언로드시 세션 종료 추적
    const handleUnload = () => {
      trackEvent('session_end', {
        event_category: 'user_engagement',
        session_duration: Date.now() - parseInt(localStorage.getItem('session_start') || '0')
      });
    };

    localStorage.setItem('session_start', Date.now().toString());
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user]);

  return null;
}

function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 전체 분석 컴포넌트
function AnalyticsContent() {
  return (
    <>
      <GoogleAnalytics />
      <HotjarTracker />
      <PageTracker />
      <SessionTracker />
    </>
  );
}

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  );
}