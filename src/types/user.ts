import { UserType } from './common';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar?: string;
  userType: UserType;
  verified: boolean;
  rating: number;
  totalEarned: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  twoFactorEnabled: boolean;
  verificationToken?: string;
  verificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  userType: UserType;
  verified: boolean;
  rating: number;
  totalEarned: number;
  createdAt: Date;
}

export interface UserRegistration {
  email: string;
  password: string;
  name: string;
  phone?: string;
  userType?: UserType;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserStats {
  totalApplications?: number;
  acceptedApplications?: number;
  completedJobs?: number;
  totalEarned?: number;
  averageRating?: number;
  totalJobsPosted?: number;
  activeJobs?: number;
}

export interface JWTPayload {
  id: string;
  email: string;
  userType: UserType;
  iat?: number;
  exp?: number;
  aud?: string;
  iss?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenId: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface AuthResponse extends AuthTokens {
  user: UserProfile;
  requiresTwoFactor?: boolean;
}

export interface RefreshTokenData {
  tokenId: string;
  token: string;
  deviceInfo: Record<string, any>;
  createdAt: string;
  lastUsed: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  timestamp: Date;
}

export interface SuspiciousActivity {
  id: string;
  userId: string;
  type: string;
  details: string;
  timestamp: Date;
}