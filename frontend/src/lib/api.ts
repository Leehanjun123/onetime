// API 클라이언트 설정
const API_BASE_URL = 'https://onetime-production.up.railway.app';

// API 헬퍼 함수
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log('🌐 API Request:', url); // 디버깅용

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ API Error:', response.status, url, data);
    throw new Error(data.message || 'API 요청 실패');
  }

  console.log('✅ API Success:', url, data);
  return data;
}

// 인증 API
export const authAPI = {
  register: (userData: { email: string; password: string; name: string; userType?: 'WORKER' | 'EMPLOYER' }) => 
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials: { email: string; password: string }) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getCurrentUser: () => 
    apiRequest('/api/auth/me'),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// 구인공고 API
export const jobAPI = {
  getJobs: (params?: { category?: string; location?: string; page?: number; limit?: number }) => {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return apiRequest(`/api/jobs${queryString}`);
  },

  getJobById: (id: string) =>
    apiRequest(`/api/jobs/${id}`),

  createJob: (jobData: {
    title: string;
    description: string;
    category: string;
    location: string;
    wage: number;
    workDate: string;
  }) =>
    apiRequest('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    }),

  updateJobStatus: (id: string, status: 'OPEN' | 'COMPLETED' | 'CANCELLED') =>
    apiRequest(`/api/jobs/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  applyToJob: (id: string, applicationData: { message?: string }) =>
    apiRequest(`/api/jobs/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    }),
};

// 사용자 API
export const userAPI = {
  getProfile: () =>
    apiRequest('/api/users/profile'),

  updateProfile: (userData: { name?: string; userType?: 'WORKER' | 'EMPLOYER' }) =>
    apiRequest('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
    
  getApplications: () =>
    apiRequest('/api/users/applications'),
    
  getJobs: () =>
    apiRequest('/api/users/jobs'),
};

// 지원 관리 API
export const applicationAPI = {
  updateStatus: (applicationId: string, status: 'PENDING' | 'ACCEPTED' | 'REJECTED') =>
    apiRequest(`/api/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// 카테고리 상수
export const JOB_CATEGORIES = [
  '일반알바',
  '단기알바', 
  '배달',
  '청소',
  '이사',
  '포장',
  '행사도우미',
  '기타'
] as const;

export default {
  auth: authAPI,
  jobs: jobAPI,
  user: userAPI,
  applications: applicationAPI,
};