import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, JobStatus, JobCategory, UserType } from '@prisma/client';
import { body, query, param, validationResult } from 'express-validator';
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

interface JobQueryParams {
  category?: JobCategory;
  location?: string;
  minWage?: string;
  maxWage?: string;
  urgent?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateJobRequestBody {
  title: string;
  description: string;
  category: JobCategory;
  location: string;
  wage: number;
  workDate: string;
  workHours: number;
  urgent?: boolean;
}

interface ApplyJobRequestBody {
  message?: string;
}

// Rate limiting for job creation and applications
const jobActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 job actions per windowMs
  message: {
    error: 'Too many job actions, please try again later.',
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
const createJobValidation = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('category').isIn(['CLEANING', 'DELIVERY', 'MOVING', 'COOKING', 'TUTORING', 'BABYSITTING', 'GARDENING', 'TECH_SUPPORT', 'OTHER']).withMessage('Invalid category'),
  body('location').trim().isLength({ min: 2, max: 100 }).withMessage('Location must be 2-100 characters'),
  body('wage').isInt({ min: 1000, max: 1000000 }).withMessage('Wage must be between 1,000 and 1,000,000'),
  body('workDate').isISO8601().withMessage('Work date must be a valid date'),
  body('workHours').isInt({ min: 1, max: 24 }).withMessage('Work hours must be between 1 and 24'),
  body('urgent').optional().isBoolean().withMessage('Urgent must be a boolean'),
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('minWage').optional().isInt({ min: 0 }).withMessage('Minimum wage must be a positive number'),
  query('maxWage').optional().isInt({ min: 0 }).withMessage('Maximum wage must be a positive number'),
  query('sortBy').optional().isIn(['createdAt', 'wage', 'workDate', 'urgent']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid job ID format'),
];

// Utility functions
const sanitizeJobQuery = (query: JobQueryParams) => {
  const where: any = {
    status: 'OPEN' as JobStatus
  };

  if (query.category) where.category = query.category;
  if (query.location) where.location = { contains: query.location, mode: 'insensitive' };
  if (query.minWage) where.wage = { ...where.wage, gte: parseInt(query.minWage) };
  if (query.maxWage) where.wage = { ...where.wage, lte: parseInt(query.maxWage) };
  if (query.urgent) where.urgent = query.urgent === 'true';

  return where;
};

// Get all jobs (public endpoint with filters)
router.get('/', queryValidation, async (req: Request<{}, {}, {}, JobQueryParams>, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { 
      page = '1', 
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where = sanitizeJobQuery(req.query);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 50);

    // Get jobs with employer info
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          employer: {
            select: {
              id: true,
              name: true,
              rating: true,
              avatar: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take
      }),
      prisma.job.count({ where })
    ]);

    res.json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new job (authenticated employers only)
router.post('/', jobActionLimiter, authenticateToken, createJobValidation, async (req: Request<{}, {}, CreateJobRequestBody>, res: Response) => {
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

    const { 
      title, 
      description, 
      category, 
      location, 
      wage, 
      workDate, 
      workHours, 
      urgent = false 
    } = req.body;

    // Validate user is employer or admin
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.userId },
      select: { userType: true, status: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account not active' });
    }

    if (user.userType !== 'EMPLOYER' && user.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Only employers can create jobs' });
    }

    // Validate work date is in the future
    const workDateTime = new Date(workDate);
    if (workDateTime <= new Date()) {
      return res.status(400).json({ error: 'Work date must be in the future' });
    }

    // Create job with transaction for data integrity
    const job = await prisma.$transaction(async (tx) => {
      return await tx.job.create({
        data: {
          title,
          description,
          category,
          location,
          wage,
          workDate: workDateTime,
          workHours,
          urgent,
          employerId: authReq.user!.userId
        },
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
      });
    });

    console.log(`✅ New job created: ${title} by ${authReq.user.email}`);

    res.status(201).json({
      message: 'Job created successfully',
      job
    });

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job by ID
router.get('/:id', idValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            rating: true,
            avatar: true,
            totalEarned: true,
            createdAt: true
          }
        },
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
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });

  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update job (employer only)
router.put('/:id', authenticateToken, idValidation, async (req: AuthenticatedRequest, res: Response) => {
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

    const { id } = req.params;
    const updateData = req.body;

    // Find job and verify ownership
    const existingJob = await prisma.job.findUnique({
      where: { id },
      include: { employer: true }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (existingJob.employerId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only update your own jobs' });
    }

    // Remove fields that shouldn't be updated
    const { employerId, createdAt, updatedAt, ...allowedUpdates } = updateData;

    // Convert and validate data types
    if (allowedUpdates.workDate) {
      const workDateTime = new Date(allowedUpdates.workDate);
      if (workDateTime <= new Date()) {
        return res.status(400).json({ error: 'Work date must be in the future' });
      }
      allowedUpdates.workDate = workDateTime;
    }

    if (allowedUpdates.wage) {
      const wage = parseInt(allowedUpdates.wage);
      if (wage < 1000 || wage > 1000000) {
        return res.status(400).json({ error: 'Wage must be between 1,000 and 1,000,000' });
      }
      allowedUpdates.wage = wage;
    }

    if (allowedUpdates.workHours) {
      const hours = parseInt(allowedUpdates.workHours);
      if (hours < 1 || hours > 24) {
        return res.status(400).json({ error: 'Work hours must be between 1 and 24' });
      }
      allowedUpdates.workHours = hours;
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: allowedUpdates,
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
    });

    console.log(`✅ Job updated: ${updatedJob.title} by ${req.user.email}`);

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete job (employer only)
router.delete('/:id', authenticateToken, idValidation, async (req: AuthenticatedRequest, res: Response) => {
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

    const { id } = req.params;

    // Find job and verify ownership
    const existingJob = await prisma.job.findUnique({
      where: { id }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (existingJob.employerId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own jobs' });
    }

    // Use transaction to handle related data
    await prisma.$transaction(async (tx) => {
      // Delete related applications first
      await tx.jobApplication.deleteMany({
        where: { jobId: id }
      });

      // Delete the job
      await tx.job.delete({
        where: { id }
      });
    });

    console.log(`✅ Job deleted: ${existingJob.title} by ${req.user.email}`);

    res.json({ message: 'Job deleted successfully' });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply to job (workers only)
router.post('/:id/apply', jobActionLimiter, authenticateToken, idValidation, [
  body('message').optional().trim().isLength({ max: 500 }).withMessage('Message must be less than 500 characters')
], async (req: Request<{ id: string }, {}, ApplyJobRequestBody>, res: Response) => {
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

    const { id: jobId } = req.params;
    const { message } = req.body;

    // Verify user is a worker
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.userId },
      select: { userType: true, status: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account not active' });
    }

    if (user.userType !== 'WORKER') {
      return res.status(403).json({ error: 'Only workers can apply to jobs' });
    }

    // Check if job exists and is open
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { 
        id: true, 
        status: true, 
        employerId: true,
        title: true,
        workDate: true 
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'OPEN') {
      return res.status(400).json({ error: 'Job is no longer open for applications' });
    }

    // Prevent applying to own job
    if (job.employerId === authReq.user.userId) {
      return res.status(400).json({ error: 'You cannot apply to your own job' });
    }

    // Check if user already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId: authReq.user.userId
        }
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied to this job' });
    }

    // Create application with transaction
    const application = await prisma.$transaction(async (tx) => {
      return await tx.jobApplication.create({
        data: {
          jobId,
          workerId: authReq.user!.userId,
          message: message || null
        },
        include: {
          worker: {
            select: {
              id: true,
              name: true,
              rating: true,
              avatar: true
            }
          },
          job: {
            select: {
              id: true,
              title: true,
              wage: true,
              workDate: true
            }
          }
        }
      });
    });

    console.log(`✅ Job application submitted: ${job.title} by ${authReq.user.email}`);

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });

  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;