import { JobStatus, ApplicationStatus } from './common';
import { UserProfile } from './user';

export interface Job {
  id: string;
  employerId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  wage: number;
  workDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  requiredWorkers: number;
  currentWorkers: number;
  requirements?: string;
  benefits?: string;
  status: JobStatus;
  urgent: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  employer?: UserProfile;
  applications?: JobApplication[];
  _count?: {
    applications: number;
  };
}

export interface JobApplication {
  id: string;
  jobId: string;
  workerId: string;
  status: ApplicationStatus;
  message?: string;
  appliedAt: Date;
  respondedAt?: Date;
  job?: Job;
  worker?: UserProfile;
}

export interface JobFilters {
  category?: string;
  location?: string;
  urgent?: boolean;
  minWage?: number;
  maxWage?: number;
  workDate?: Date;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface JobSearchQuery extends JobFilters {
  page?: number;
  limit?: number;
  sort?: 'wage' | 'workDate' | 'createdAt' | 'distance';
  order?: 'asc' | 'desc';
  userLat?: number;
  userLng?: number;
}

export interface JobCreation {
  title: string;
  description: string;
  category: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  wage: number;
  workDate: Date;
  startTime: string;
  endTime: string;
  requiredWorkers: number;
  requirements?: string;
  benefits?: string;
  urgent?: boolean;
  tags?: string[];
}

export interface JobUpdate {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  wage?: number;
  workDate?: Date;
  startTime?: string;
  endTime?: string;
  requiredWorkers?: number;
  requirements?: string;
  benefits?: string;
  urgent?: boolean;
  tags?: string[];
}

export interface WorkSession {
  id: string;
  jobId: string;
  workerId: string;
  employerId: string;
  startTime: Date;
  endTime?: Date;
  breakTime?: number;
  totalHours?: number;
  hourlyRate: number;
  totalPay?: number;
  status: 'STARTED' | 'BREAK' | 'RESUMED' | 'COMPLETED' | 'CANCELLED';
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobReview {
  id: string;
  jobId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment?: string;
  type: 'EMPLOYER_TO_WORKER' | 'WORKER_TO_EMPLOYER';
  createdAt: Date;
  reviewer?: UserProfile;
  reviewed?: UserProfile;
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  createdAt: Date;
  job: Job;
}

export interface JobRecommendation {
  job: Job;
  score: number;
  reasons: string[];
  distance?: number;
}