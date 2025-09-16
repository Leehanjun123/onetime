import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Interfaces
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

interface UpdateProfileRequestBody {
  name?: string;
  avatar?: string;
  phone?: string;
}

// Rate limiting
const profileUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 profile updates per windowMs
  message: {
    error: 'Too many profile update attempts, please try again later.',
  },
});

// Middleware to authenticate JWT token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Validation rules
const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  body('phone').optional().isMobilePhone('any').withMessage('Phone must be a valid phone number'),
];

// Utility functions
const sanitizeUser = (user: any) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

// Get user profile (same as auth profile but for consistency)
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
          select: {
            id: true,
            title: true,
            status: true,
            wage: true,
            workDate: true,
            createdAt: true,
            _count: {
              select: {
                applications: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        applications: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                wage: true,
                workDate: true,
                status: true,
                employer: {
                  select: {
                    id: true,
                    name: true,
                    rating: true,
                    avatar: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
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

// Update user profile
router.put('/profile', profileUpdateLimiter, authenticateToken, updateProfileValidation, async (req: Request<{}, {}, UpdateProfileRequestBody>, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, avatar, phone } = req.body;
    const updateData: Partial<UpdateProfileRequestBody> = {};

    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (phone !== undefined) updateData.phone = phone;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Use transaction for data integrity
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Check if phone number is already in use (if provided)
      if (phone) {
        const existingUser = await tx.user.findFirst({
          where: { 
            phone,
            id: { not: authReq.user!.userId }
          }
        });

        if (existingUser) {
          throw new Error('PHONE_EXISTS');
        }
      }

      return await tx.user.update({
        where: { id: authReq.user!.userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          verified: true,
          rating: true,
          totalEarned: true,
          avatar: true,
          phone: true,
          updatedAt: true
        }
      });
    });

    console.log(`✅ Profile updated for user: ${authReq.user.email}`);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error instanceof Error && error.message === 'PHONE_EXISTS') {
      return res.status(400).json({ error: 'Phone number already in use' });
    }

    // Handle Prisma unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(400).json({ error: 'Phone number already in use' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's job applications
router.get('/applications', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { workerId: req.user.userId },
      include: {
        job: {
          include: {
            employer: {
              select: {
                id: true,
                name: true,
                rating: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's posted jobs (for employers)
router.get('/jobs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const jobs = await prisma.job.findMany({
      where: { employerId: req.user.userId },
      include: {
        applications: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                rating: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ jobs });
  } catch (error) {
    console.error('Get user jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { userType: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let stats: any = {};

    if (user.userType === 'WORKER') {
      // Worker statistics
      const [
        totalApplications,
        acceptedApplications,
        completedJobs,
        totalEarnings
      ] = await Promise.all([
        prisma.jobApplication.count({
          where: { workerId: req.user.userId }
        }),
        prisma.jobApplication.count({
          where: { 
            workerId: req.user.userId,
            status: 'ACCEPTED'
          }
        }),
        prisma.jobApplication.count({
          where: { 
            workerId: req.user.userId,
            job: { status: 'COMPLETED' }
          }
        }),
        prisma.jobApplication.aggregate({
          where: { 
            workerId: req.user.userId,
            job: { status: 'COMPLETED' }
          },
          _sum: {
            job: {
              select: {
                wage: true
              }
            }
          }
        })
      ]);

      stats = {
        totalApplications,
        acceptedApplications,
        completedJobs,
        totalEarnings: totalEarnings._sum || 0,
        acceptanceRate: totalApplications > 0 ? (acceptedApplications / totalApplications * 100).toFixed(1) : 0
      };

    } else if (user.userType === 'EMPLOYER') {
      // Employer statistics
      const [
        totalJobsPosted,
        activeJobs,
        completedJobs,
        totalApplicationsReceived
      ] = await Promise.all([
        prisma.job.count({
          where: { employerId: req.user.userId }
        }),
        prisma.job.count({
          where: { 
            employerId: req.user.userId,
            status: 'OPEN'
          }
        }),
        prisma.job.count({
          where: { 
            employerId: req.user.userId,
            status: 'COMPLETED'
          }
        }),
        prisma.jobApplication.count({
          where: { 
            job: { employerId: req.user.userId }
          }
        })
      ]);

      stats = {
        totalJobsPosted,
        activeJobs,
        completedJobs,
        totalApplicationsReceived,
        averageApplicationsPerJob: totalJobsPosted > 0 ? (totalApplicationsReceived / totalJobsPosted).toFixed(1) : 0
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;