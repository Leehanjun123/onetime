import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient, User, UserType } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { authenticateToken, generateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

interface RegisterRequestBody {
  email: string;
  password: string;
  name: string;
  userType?: UserType;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
});

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('userType').optional().isIn(['WORKER', 'EMPLOYER', 'ADMIN']).withMessage('Invalid user type'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Utility functions
const sanitizeUser = (user: User) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

// Register new user
router.post('/register', authLimiter, registerValidation, async (req: Request<{}, {}, RegisterRequestBody>, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, name, userType = 'WORKER' } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with transaction for data integrity
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          userType,
          verified: false,
          status: 'ACTIVE',
        }
      });

      // Create wallet for user
      await tx.wallet.create({
        data: {
          userId: newUser.id,
          balance: 0,
          pendingBalance: 0,
          withdrawableBalance: 0,
        }
      });

      return newUser;
    });

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Log successful registration
    console.log(`✅ New user registered: ${email} (${userType})`);

    res.status(201).json({
      message: 'User registered successfully',
      user: sanitizeUser(user),
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', authLimiter, loginValidation, async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user with password field
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user account is active
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Account is suspended or deleted' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login information
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
        isOnline: true,
        lastSeenAt: new Date()
      }
    });

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Log successful login
    console.log(`✅ User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: sanitizeUser(user),
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        wallet: true,
        jobs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            wage: true,
            workDate: true,
            createdAt: true
          }
        },
        applications: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            job: {
              select: {
                id: true,
                title: true,
                wage: true,
                workDate: true,
                employer: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Update user status to offline
    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        isOnline: false,
        lastSeenAt: new Date()
      }
    });

    console.log(`✅ User logged out: ${req.user.email}`);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || !user.password) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    console.log(`✅ Password changed for user: ${user.email}`);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;