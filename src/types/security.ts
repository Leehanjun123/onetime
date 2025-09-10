// 보안 관련 타입 정의
export interface TrustScore {
  score: number; // 0-100
  level: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  factors: {
    deviceTrust: number;
    behaviorTrust: number;
    locationTrust: number;
    networkTrust: number;
  };
  recommendations: string[];
}

export interface DeviceFingerprint {
  id: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  plugins: string[];
  canvas: string;
  webgl: string;
  audioContext: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  platform: string;
}

export interface RequestContext {
  userId?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: DeviceFingerprint;
  geolocation?: {
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  timestamp: Date;
  requestPath: string;
  requestMethod: string;
}

export interface SecurityEvent {
  id: string;
  type: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'PERMISSION_DENIED' | 'SUSPICIOUS_ACTIVITY' | 'DATA_ACCESS' | 'ADMIN_ACTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  sessionId: string;
  context: RequestContext;
  details: {
    resource?: string;
    action?: string;
    outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
    errorCode?: string;
    additionalData?: Record<string, any>;
  };
  timestamp: Date;
}

export interface Permission {
  id: string;
  resource: string; // 'jobs', 'users', 'payments', 'admin'
  action: string; // 'create', 'read', 'update', 'delete', 'list', 'manage'
  scope: string[]; // ['own', 'company', 'region:seoul', 'global']
  conditions?: {
    timeRestriction?: {
      startHour: number;
      endHour: number;
      daysOfWeek: number[];
    };
    ipWhitelist?: string[];
    requiredTrustLevel?: number;
  };
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inheritance?: string[]; // 상위 역할 상속
  metadata: {
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}

export interface AuthenticationResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    roles: Role[];
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  trustScore: TrustScore;
  requiresAdditionalAuth: boolean;
  nextAuthStep?: 'OTP' | 'BIOMETRIC' | 'SECURITY_QUESTIONS';
  sessionId: string;
}

export interface OTPConfig {
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number; // seconds
  window: number; // tolerance window
}

export interface SecurityConfig {
  jwt: {
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    algorithm: string;
    issuer: string;
    audience: string;
  };
  otp: {
    enabled: boolean;
    issuer: string;
    defaultWindow: number;
  };
  riskAnalysis: {
    enabled: boolean;
    thresholds: {
      blockThreshold: number;
      requireOtpThreshold: number;
      alertThreshold: number;
    };
  };
  sessionManagement: {
    maxConcurrentSessions: number;
    sessionTimeout: number; // minutes
    slidingExpiration: boolean;
  };
}