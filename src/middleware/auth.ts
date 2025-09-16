import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserType } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Interfaces
export interface AuthenticatedUser {
  userId: string;
  email: string;
  userType?: UserType;
  verified?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// JWT token authentication middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; email: string };
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      userType: 'WORKER', // Will be overridden by user lookup if needed
      verified: false // Will be overridden by user lookup if needed
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Enhanced authentication with user data lookup
export const authenticateTokenWithUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; email: string };
    
    // Fetch full user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        userType: true,
        verified: true,
        status: true
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User not found or account inactive' });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      userType: user.userType,
      verified: user.verified
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Optional authentication (doesn't require token)
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; email: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        userType: true,
        verified: true,
        status: true
      }
    });

    if (user && user.status === 'ACTIVE') {
      req.user = {
        userId: user.id,
        email: user.email,
        userType: user.userType,
        verified: user.verified
      };
    }
  } catch (error) {
    // Continue without user data if token is invalid
  }

  next();
};

// Require specific user types
export const requireUserType = (...allowedTypes: UserType[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({ 
        error: 'Access denied',
        required: allowedTypes,
        current: req.user.userType
      });
    }

    next();
  };
};

// Require verified email
export const requireVerified = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.verified) {
    return res.status(403).json({ 
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

// Require admin access
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.userType !== 'ADMIN') {
    console.warn(`Unauthorized admin access attempt by ${req.user.email}`);
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// Require user to be accessing their own data or be an admin
export const requireSelfOrAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const targetUserId = req.params.id || req.params.userId;
  
  if (req.user.userType === 'ADMIN' || req.user.userId === targetUserId) {
    next();
  } else {
    return res.status(403).json({ 
      error: 'You can only access your own data'
    });
  }
};

// Utility function to generate JWT token
export const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Utility function to generate refresh token
export const generateRefreshToken = (userId: string): string => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || JWT_SECRET!;
  return jwt.sign(
    { userId, type: 'refresh' },
    refreshSecret,
    { expiresIn: '30d' }
  );
};

// Verify refresh token
export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || JWT_SECRET!;
    const decoded = jwt.verify(token, refreshSecret) as { userId: string; type: string };
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return { userId: decoded.userId };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};