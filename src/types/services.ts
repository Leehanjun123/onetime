import { UserProfile, AuthTokens } from './user';
import { DeviceInfo } from './common';
import { Job, JobFilters, JobRecommendation } from './job';

export interface CacheService {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T, ttl?: number): Promise<boolean>;
  del(key: string): Promise<boolean>;
  flush(): Promise<boolean>;
  deletePattern(pattern: string): Promise<boolean>;
  invalidateJobCaches(jobId?: string): Promise<void>;
  invalidateUserCaches(userId: string): Promise<void>;
  getJobsKey(filters?: JobFilters): string;
  getJobKey(jobId: string): string;
  getUserKey(userId: string): string;
  getUserStatsKey(userId: string): string;
}

export interface AuthServiceResult {
  tokens: AuthTokens;
  user: UserProfile;
  requiresTwoFactor?: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score?: number;
}

export interface EmailService {
  sendVerificationEmail(user: UserProfile): Promise<void>;
  sendPasswordResetEmail(user: UserProfile, resetToken: string): Promise<void>;
  sendJobApplicationEmail(job: Job, applicant: UserProfile): Promise<void>;
  sendJobAcceptanceEmail(job: Job, worker: UserProfile): Promise<void>;
  sendJobCompletionEmail(job: Job, participants: UserProfile[]): Promise<void>;
}

export interface NotificationService {
  sendNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void>;
  sendBulkNotifications(
    notifications: Array<{
      userId: string;
      type: string;
      title: string;
      message: string;
      data?: Record<string, any>;
    }>
  ): Promise<void>;
  markAsRead(notificationId: string): Promise<void>;
  getUserNotifications(userId: string, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<any[]>;
}

export interface UploadService {
  uploadProfileImage(userId: string, file: Express.Multer.File): Promise<{
    url: string;
    filename: string;
    size: number;
  }>;
  uploadPortfolioFiles(userId: string, files: Express.Multer.File[]): Promise<{
    uploadedFiles: Array<{
      id: string;
      filename: string;
      originalName: string;
      url: string;
      size: number;
    }>;
    totalSize: number;
  }>;
  deleteFile(filePath: string): Promise<void>;
  getUserStorageUsage(userId: string): Promise<{
    used: number;
    max: number;
    percentage: number;
  }>;
}

export interface RecommendationService {
  getJobRecommendations(
    userId: string,
    options?: {
      limit?: number;
      includeDistance?: boolean;
      userLat?: number;
      userLng?: number;
    }
  ): Promise<JobRecommendation[]>;
  updateUserPreferences(
    userId: string,
    preferences: {
      categories?: string[];
      locations?: string[];
      minWage?: number;
      maxDistance?: number;
    }
  ): Promise<void>;
}

export interface MatchingService {
  findMatchingJobs(
    workerId: string,
    filters?: JobFilters,
    options?: {
      limit?: number;
      userLat?: number;
      userLng?: number;
    }
  ): Promise<{
    jobs: Job[];
    scores: Record<string, number>;
  }>;
  calculateJobScore(
    job: Job,
    workerProfile: UserProfile,
    workerPreferences?: any
  ): Promise<number>;
}

export interface SearchService {
  searchJobs(query: string, filters?: JobFilters): Promise<{
    jobs: Job[];
    total: number;
    facets: Record<string, any>;
  }>;
  indexJob(job: Job): Promise<void>;
  deleteJob(jobId: string): Promise<void>;
  updateJobIndex(jobId: string, updates: Partial<Job>): Promise<void>;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
  sender?: UserProfile;
}

export interface Conversation {
  id: string;
  jobId?: string;
  participants: string[];
  lastMessage?: ChatMessage;
  lastActivity: Date;
  unreadCount: Record<string, number>;
  createdAt: Date;
}

export interface ChatService {
  createConversation(participants: string[], jobId?: string): Promise<Conversation>;
  sendMessage(
    conversationId: string,
    senderId: string,
    message: string,
    type?: string,
    metadata?: Record<string, any>
  ): Promise<ChatMessage>;
  getConversations(userId: string): Promise<Conversation[]>;
  getMessages(conversationId: string, options?: {
    limit?: number;
    before?: Date;
  }): Promise<ChatMessage[]>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
}