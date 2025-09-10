import { Request, Response } from 'express';
import { JWTPayload } from './user';
import { DeviceInfo } from './common';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      deviceInfo?: DeviceInfo;
      rateLimitInfo?: {
        remaining: number;
        resetTime: Date;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

export interface ApiRequest<T = any> extends Request {
  body: T;
}

export interface ApiResponse<T = any> extends Response {
  json(body: {
    success?: boolean;
    message?: string;
    data?: T;
    error?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasMore?: boolean;
    };
  }): this;
}

export type AsyncRequestHandler<T = any> = (
  req: Request,
  res: Response,
  next?: Function
) => Promise<T>;

export type AuthenticatedRequestHandler<T = any> = (
  req: AuthenticatedRequest,
  res: Response,
  next?: Function
) => Promise<T>;

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface RequestValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface UploadedFiles {
  [fieldname: string]: MulterFile[] | MulterFile;
}