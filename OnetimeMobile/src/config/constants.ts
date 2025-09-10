export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api'
  : 'https://api.onetime.kr/api';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@onetime_access_token',
  REFRESH_TOKEN: '@onetime_refresh_token',
  USER_DATA: '@onetime_user_data',
  ONBOARDING_COMPLETED: '@onetime_onboarding_completed',
  THEME: '@onetime_theme',
  LANGUAGE: '@onetime_language',
  NOTIFICATION_SETTINGS: '@onetime_notification_settings',
};

export const COLORS = {
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#818CF8',
  secondary: '#10B981',
  secondaryDark: '#059669',
  secondaryLight: '#34D399',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  success: '#10B981',
  dark: '#1F2937',
  gray: '#6B7280',
  lightGray: '#E5E7EB',
  white: '#FFFFFF',
  background: '#F9FAFB',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const CATEGORIES = [
  { id: 'restaurant', name: '음식점', icon: 'restaurant' },
  { id: 'cafe', name: '카페', icon: 'coffee' },
  { id: 'delivery', name: '배달', icon: 'motorcycle' },
  { id: 'mart', name: '마트/편의점', icon: 'shopping-cart' },
  { id: 'factory', name: '공장/제조', icon: 'industry' },
  { id: 'construction', name: '건설/노무', icon: 'hammer' },
  { id: 'office', name: '사무/행정', icon: 'briefcase' },
  { id: 'education', name: '교육', icon: 'graduation-cap' },
  { id: 'event', name: '이벤트/행사', icon: 'calendar' },
  { id: 'other', name: '기타', icon: 'ellipsis-h' },
];

export const LOCATIONS = [
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '대전',
  '광주',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
];

export const JOB_STATUS = {
  draft: { label: '임시저장', color: COLORS.gray },
  open: { label: '모집중', color: COLORS.success },
  in_progress: { label: '진행중', color: COLORS.info },
  completed: { label: '완료', color: COLORS.dark },
  cancelled: { label: '취소됨', color: COLORS.danger },
};

export const APPLICATION_STATUS = {
  pending: { label: '대기중', color: COLORS.warning },
  accepted: { label: '승인됨', color: COLORS.success },
  rejected: { label: '거절됨', color: COLORS.danger },
  withdrawn: { label: '취소됨', color: COLORS.gray },
};

export const SCREENS = {
  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  ONBOARDING: 'Onboarding',
  
  // Main Tabs
  HOME: 'Home',
  JOBS: 'Jobs',
  APPLICATIONS: 'Applications',
  PROFILE: 'Profile',
  
  // Job Screens
  JOB_DETAIL: 'JobDetail',
  JOB_CREATE: 'JobCreate',
  JOB_EDIT: 'JobEdit',
  JOB_APPLY: 'JobApply',
  
  // Profile Screens
  PROFILE_EDIT: 'ProfileEdit',
  SETTINGS: 'Settings',
  NOTIFICATIONS: 'Notifications',
  REVIEWS: 'Reviews',
  
  // Business Screens
  BUSINESS_DASHBOARD: 'BusinessDashboard',
  BUSINESS_JOBS: 'BusinessJobs',
  BUSINESS_APPLICANTS: 'BusinessApplicants',
  BUSINESS_PROFILE: 'BusinessProfile',
};