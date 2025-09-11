const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Get all jobs (public endpoint with filters)
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      location, 
      minWage, 
      maxWage, 
      urgent, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build where clause
    const where = {
      status: 'OPEN'
    };

    if (category) where.category = category;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (minWage) where.wage = { ...where.wage, gte: parseInt(minWage) };
    if (maxWage) where.wage = { ...where.wage, lte: parseInt(maxWage) };
    if (urgent) where.urgent = urgent === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = Math.min(parseInt(limit), 50); // Max 50 per page

    // Get jobs with employer info
    const jobs = await prisma.job.findMany({
      where,
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            rating: true,
            avatar: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take
    });

    // Get total count for pagination
    const total = await prisma.job.count({ where });

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
router.post('/', authenticateToken, async (req, res) => {
  try {
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

    // Validate required fields
    if (!title || !description || !category || !location || !wage || !workDate || !workHours) {
      return res.status(400).json({ 
        error: 'All fields are required: title, description, category, location, wage, workDate, workHours' 
      });
    }

    // Validate user is employer or admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { userType: true, status: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account not active' });
    }

    if (user.userType !== 'EMPLOYER' && user.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Only employers can create jobs' });
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        title,
        description,
        category: category.toUpperCase(),
        location,
        wage: parseInt(wage),
        workDate: new Date(workDate),
        workHours: parseInt(workHours),
        urgent: Boolean(urgent),
        employerId: req.user.userId
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
router.get('/:id', async (req, res) => {
  try {
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
            totalEarned: true
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
          }
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
          }
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
router.put('/:id', authenticateToken, async (req, res) => {
  try {
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

    // Convert date strings
    if (allowedUpdates.workDate) {
      allowedUpdates.workDate = new Date(allowedUpdates.workDate);
    }

    // Convert numbers
    if (allowedUpdates.wage) allowedUpdates.wage = parseInt(allowedUpdates.wage);
    if (allowedUpdates.workHours) allowedUpdates.workHours = parseInt(allowedUpdates.workHours);
    if (allowedUpdates.category) allowedUpdates.category = allowedUpdates.category.toUpperCase();

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
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
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

    await prisma.job.delete({
      where: { id }
    });

    res.json({ message: 'Job deleted successfully' });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply to job (workers only)
router.post('/:id/apply', authenticateToken, async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { message } = req.body;

    // Verify user is a worker
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'OPEN') {
      return res.status(400).json({ error: 'Job is no longer open for applications' });
    }

    // Check if user already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId: req.user.userId
        }
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied to this job' });
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        workerId: req.user.userId,
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

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });

  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;