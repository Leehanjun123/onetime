export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore?: boolean;
  offset?: number;
}

export interface ErrorResponse {
  message: string;
  error?: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
}

export interface RequestQuery {
  page?: string | number;
  limit?: string | number;
  offset?: string | number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filter?: string;
}

export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export type UserType = 'WORKER' | 'EMPLOYER' | 'ADMIN';
export type JobStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED';
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type NotificationType = 'JOB_APPLICATION' | 'APPLICATION_ACCEPTED' | 'APPLICATION_REJECTED' | 'JOB_COMPLETED' | 'PAYMENT_RECEIVED' | 'SYSTEM';

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export interface DeviceInfo {
  ip?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  newDevice?: boolean;
  differentCountry?: boolean;
}