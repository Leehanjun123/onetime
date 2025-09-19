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
    workHours?: string;
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
  // 일자리에 지원하기
  applyToJob: (jobId: string, applicationData: { message?: string }) =>
    apiRequest(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    }),

  // 지원 상태 업데이트 (고용주용)
  updateStatus: (applicationId: string, status: 'PENDING' | 'ACCEPTED' | 'REJECTED') =>
    apiRequest(`/api/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // 내 지원 내역 조회 (근로자용)
  getMyApplications: () =>
    apiRequest('/api/users/applications'),

  // 내 일자리의 지원자 목록 (고용주용)
  getJobApplications: (jobId: string) =>
    apiRequest(`/api/jobs/${jobId}/applications`),
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

// 이력서 API
export const resumeAPI = {
  // 내 이력서 조회
  getResume: () =>
    apiRequest('/api/users/resume'),

  // 이력서 생성/업데이트
  saveResume: (resumeData: {
    title?: string;
    summary?: string;
    phone?: string;
    address?: string;
    birthDate?: string;
  }) =>
    apiRequest('/api/users/resume', {
      method: 'POST',
      body: JSON.stringify(resumeData),
    }),

  // 경력 관리
  workExperience: {
    add: (experienceData: {
      company: string;
      position: string;
      description?: string;
      startDate: string;
      endDate?: string;
      isCurrent?: boolean;
    }) =>
      apiRequest('/api/users/resume/work-experiences', {
        method: 'POST',
        body: JSON.stringify(experienceData),
      }),

    update: (id: string, experienceData: {
      company?: string;
      position?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      isCurrent?: boolean;
    }) =>
      apiRequest(`/api/users/resume/work-experiences/${id}`, {
        method: 'PUT',
        body: JSON.stringify(experienceData),
      }),

    delete: (id: string) =>
      apiRequest(`/api/users/resume/work-experiences/${id}`, {
        method: 'DELETE',
      }),
  },

  // 학력 관리
  education: {
    add: (educationData: {
      school: string;
      major?: string;
      degree: 'HIGH_SCHOOL' | 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'OTHER';
      startDate: string;
      endDate?: string;
      isGraduated?: boolean;
      gpa?: number;
      maxGpa?: number;
    }) =>
      apiRequest('/api/users/resume/educations', {
        method: 'POST',
        body: JSON.stringify(educationData),
      }),

    update: (id: string, educationData: {
      school?: string;
      major?: string;
      degree?: 'HIGH_SCHOOL' | 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'OTHER';
      startDate?: string;
      endDate?: string;
      isGraduated?: boolean;
      gpa?: number;
      maxGpa?: number;
    }) =>
      apiRequest(`/api/users/resume/educations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(educationData),
      }),

    delete: (id: string) =>
      apiRequest(`/api/users/resume/educations/${id}`, {
        method: 'DELETE',
      }),
  },

  // 스킬 관리
  skill: {
    add: (skillData: {
      name: string;
      level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
      category?: string;
    }) =>
      apiRequest('/api/users/resume/skills', {
        method: 'POST',
        body: JSON.stringify(skillData),
      }),

    update: (id: string, skillData: {
      name?: string;
      level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
      category?: string;
    }) =>
      apiRequest(`/api/users/resume/skills/${id}`, {
        method: 'PUT',
        body: JSON.stringify(skillData),
      }),

    delete: (id: string) =>
      apiRequest(`/api/users/resume/skills/${id}`, {
        method: 'DELETE',
      }),
  },
};

// 회사 인증 API
export const companyAPI = {
  // 내 회사 정보 조회
  getCompany: () =>
    apiRequest('/api/users/company'),

  // 회사 정보 등록/업데이트
  saveCompany: (companyData: {
    businessName: string;
    businessNumber: string;
    ceoName: string;
    businessType?: string;
    businessAddress?: string;
    phoneNumber?: string;
    email?: string;
    website?: string;
    establishedDate?: string;
    employeeCount?: number;
    description?: string;
  }) =>
    apiRequest('/api/users/company', {
      method: 'POST',
      body: JSON.stringify(companyData),
    }),

  // 인증 서류 업로드 정보 저장
  uploadDocument: (documentData: {
    type: 'BUSINESS_LICENSE' | 'CORPORATE_SEAL' | 'BANK_ACCOUNT' | 'TAX_INVOICE' | 'COMPANY_PROFILE' | 'OTHER';
    fileName: string;
    filePath: string;
    fileSize?: number;
    mimeType?: string;
  }) =>
    apiRequest('/api/users/company/documents', {
      method: 'POST',
      body: JSON.stringify(documentData),
    }),

  // 인증 서류 삭제
  deleteDocument: (id: string) =>
    apiRequest(`/api/users/company/documents/${id}`, {
      method: 'DELETE',
    }),

  // 인증 신청
  submitVerification: () =>
    apiRequest('/api/users/company/verify', {
      method: 'POST',
    }),

  // 관리자: 인증 승인/거절
  updateVerificationStatus: (companyId: string, status: 'APPROVED' | 'REJECTED', rejectedReason?: string) =>
    apiRequest(`/api/admin/companies/${companyId}/verification`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectedReason }),
    }),
};

// 리뷰 API
export const reviewAPI = {
  // 리뷰 작성
  createReview: (reviewData: {
    jobId: string;
    revieweeId: string;
    rating: number;
    comment?: string;
    reviewType: 'EMPLOYER_TO_WORKER' | 'WORKER_TO_EMPLOYER';
  }) =>
    apiRequest('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),

  // 내가 받은 리뷰 조회
  getReceivedReviews: (page = 1, limit = 10) =>
    apiRequest(`/api/users/reviews/received?page=${page}&limit=${limit}`),

  // 내가 작성한 리뷰 조회
  getGivenReviews: (page = 1, limit = 10) =>
    apiRequest(`/api/users/reviews/given?page=${page}&limit=${limit}`),

  // 특정 사용자의 리뷰 조회
  getUserReviews: (userId: string, page = 1, limit = 10) =>
    apiRequest(`/api/users/${userId}/reviews?page=${page}&limit=${limit}`),

  // 리뷰 수정
  updateReview: (reviewId: string, updateData: {
    rating: number;
    comment?: string;
  }) =>
    apiRequest(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  // 리뷰 삭제
  deleteReview: (reviewId: string) =>
    apiRequest(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
    }),

  // 일자리별 리뷰 가능한 사용자 조회
  getReviewableUsers: (jobId: string) =>
    apiRequest(`/api/jobs/${jobId}/reviewable-users`),
};

export default {
  auth: authAPI,
  jobs: jobAPI,
  user: userAPI,
  applications: applicationAPI,
  resume: resumeAPI,
  company: companyAPI,
  review: reviewAPI,
};