// API 설정
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api',
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://onetime-production.up.railway.app',
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'https://onetime-production.up.railway.app',
  
  // 개발 환경에서만 localhost 사용
  get LOCAL_API_URL() {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3002/api';
    }
    return this.BASE_URL;
  },
  
  get LOCAL_BACKEND_URL() {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3002';
    }
    return this.BACKEND_URL;
  }
};

// 환경 설정
export const ENV_CONFIG = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
};

// AdSense 설정
export const ADSENSE_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
  ENABLED: process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true',
  SLOTS: {
    BANNER: process.env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT || '',
    SIDEBAR: process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT || '',
    INFEED: process.env.NEXT_PUBLIC_ADSENSE_INFEED_SLOT || '',
    MOBILE: process.env.NEXT_PUBLIC_ADSENSE_MOBILE_SLOT || '',
    NATIVE: process.env.NEXT_PUBLIC_ADSENSE_NATIVE_SLOT || '',
  }
};

// API 엔드포인트 생성 헬퍼
export const createApiUrl = (path: string): string => {
  const baseUrl = API_CONFIG.BASE_URL;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

// 백엔드 URL 생성 헬퍼
export const createBackendUrl = (path: string): string => {
  const baseUrl = API_CONFIG.BACKEND_URL;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};