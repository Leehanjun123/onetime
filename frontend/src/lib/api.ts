// API 클라이언트 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://onetime-production.up.railway.app/api';

// API 헬퍼 함수
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API 요청 실패');
  }

  return data;
}

// 인증 API
export const authAPI = {
  register: (userData: any) => 
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials: any) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// 구인공고 API
export const jobAPI = {
  getJobs: (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest(`/jobs${queryString}`);
  },

  getJobById: (id: string) =>
    apiRequest(`/jobs/${id}`),

  createJob: (jobData: any) =>
    apiRequest('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    }),

  updateJob: (id: string, jobData: any) =>
    apiRequest(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    }),

  deleteJob: (id: string) =>
    apiRequest(`/jobs/${id}`, {
      method: 'DELETE',
    }),

  applyToJob: (id: string, applicationData: any) =>
    apiRequest(`/jobs/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    }),
};

// 사용자 API
export const userAPI = {
  getProfile: () =>
    apiRequest('/users/profile'),

  updateProfile: (userData: any) =>
    apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
    
  getApplications: () =>
    apiRequest('/users/applications'),
    
  getJobs: () =>
    apiRequest('/users/jobs'),
};

// 매칭 API
export const matchingAPI = {
  requestMatching: (matchingData: any) =>
    apiRequest('/matching/request', {
      method: 'POST',
      body: JSON.stringify(matchingData),
    }),

  getMatchingStatus: (id: string) =>
    apiRequest(`/matching/${id}`),
};

export default {
  auth: authAPI,
  jobs: jobAPI,
  user: userAPI,
  matching: matchingAPI,
};