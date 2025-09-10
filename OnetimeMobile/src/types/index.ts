export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'worker' | 'business' | 'admin';
  profileImage?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  userId: string;
  name: string;
  description: string;
  businessNumber: string;
  address: string;
  phone: string;
  email: string;
  category: string;
  logoUrl?: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  businessId: string;
  business?: Business;
  title: string;
  description: string;
  category: string;
  location: string;
  address: string;
  workDate: string;
  startTime: string;
  endTime: string;
  breakTime: number;
  hourlyWage: number;
  totalWage: number;
  requiredWorkers: number;
  currentApplicants: number;
  acceptedApplicants: number;
  requirements: string[];
  benefits: string[];
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  images: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  job?: Job;
  worker?: User;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  message?: string;
  appliedAt: string;
  respondedAt?: string;
}

export interface Review {
  id: string;
  jobId: string;
  workerId: string;
  businessId: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'application' | 'acceptance' | 'rejection' | 'reminder' | 'system';
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'worker' | 'business';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface JobFilters {
  category?: string;
  location?: string;
  minWage?: number;
  maxWage?: number;
  date?: string;
  status?: string;
}