const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../config/database');
const redis = require('../config/redis');
const validator = require('validator');
const { logger } = require('../utils/logger');

class AuthService {
  constructor() {
    this.accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';
    this.refreshTokenRotation = true;
    this.maxRefreshTokens = 5; // Maximum refresh tokens per user
  }

  // Generate tokens
  generateTokens(payload) {
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        expiresIn: this.accessTokenExpiry,
        issuer: 'onetime',
        audience: 'onetime-app'
      }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { 
        expiresIn: this.refreshTokenExpiry,
        issuer: 'onetime',
        audience: 'onetime-app'
      }
    );

    const tokenId = crypto.randomBytes(16).toString('hex');

    return {
      accessToken,
      refreshToken,
      tokenId,
      expiresIn: 900, // 15 minutes in seconds
      refreshExpiresIn: 604800 // 7 days in seconds
    };
  }

  // Store refresh token
  async storeRefreshToken(userId, tokenId, refreshToken, deviceInfo = {}) {
    const key = `refresh_token:${userId}`;
    const tokenData = {
      tokenId,
      token: refreshToken,
      deviceInfo,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

    // Get existing tokens
    const existingTokens = await redis.get(key);
    const tokens = existingTokens ? JSON.parse(existingTokens) : [];

    // Add new token
    tokens.push(tokenData);

    // Keep only the latest N tokens
    if (tokens.length > this.maxRefreshTokens) {
      tokens.shift(); // Remove oldest token
    }

    // Store in Redis with expiry
    await redis.set(
      key,
      JSON.stringify(tokens),
      'EX',
      7 * 24 * 60 * 60 // 7 days
    );

    // Also store in database for persistence
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenId,
        tokenHash: this.hashToken(refreshToken),
        deviceInfo: JSON.stringify(deviceInfo),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
  }

  // Validate refresh token
  async validateRefreshToken(userId, refreshToken) {
    try {
      // Verify JWT
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        {
          issuer: 'onetime',
          audience: 'onetime-app'
        }
      );

      if (decoded.type !== 'refresh' || decoded.id !== userId) {
        return null;
      }

      // Check in Redis cache
      const key = `refresh_token:${userId}`;
      const tokensData = await redis.get(key);
      
      if (tokensData) {
        const tokens = JSON.parse(tokensData);
        const tokenExists = tokens.some(t => t.token === refreshToken);
        
        if (tokenExists) {
          // Update last used
          const updatedTokens = tokens.map(t => {
            if (t.token === refreshToken) {
              t.lastUsed = new Date().toISOString();
            }
            return t;
          });
          
          await redis.set(key, JSON.stringify(updatedTokens), 'EX', 7 * 24 * 60 * 60);
          return decoded;
        }
      }

      // Fallback to database
      const tokenHash = this.hashToken(refreshToken);
      const dbToken = await prisma.refreshToken.findFirst({
        where: {
          userId,
          tokenHash,
          expiresAt: { gt: new Date() },
          revokedAt: null
        }
      });

      if (dbToken) {
        await prisma.refreshToken.update({
          where: { id: dbToken.id },
          data: { lastUsedAt: new Date() }
        });
        return decoded;
      }

      return null;
    } catch (error) {
      logger.error('Refresh token validation error:', error);
      return null;
    }
  }

  // Refresh access token
  async refreshAccessToken(userId, refreshToken, deviceInfo = {}) {
    const decoded = await this.validateRefreshToken(userId, refreshToken);
    
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        verified: true,
        status: true
      }
    });

    if (!user || user.status === 'SUSPENDED') {
      throw new Error('User not found or suspended');
    }

    // Generate new tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      userType: user.userType
    });

    // If rotation is enabled, revoke old refresh token
    if (this.refreshTokenRotation) {
      await this.revokeRefreshToken(userId, refreshToken);
      await this.storeRefreshToken(userId, tokens.tokenId, tokens.refreshToken, deviceInfo);
    }

    return {
      ...tokens,
      user
    };
  }

  // Revoke refresh token
  async revokeRefreshToken(userId, refreshToken) {
    // Remove from Redis
    const key = `refresh_token:${userId}`;
    const tokensData = await redis.get(key);
    
    if (tokensData) {
      const tokens = JSON.parse(tokensData);
      const filteredTokens = tokens.filter(t => t.token !== refreshToken);
      
      if (filteredTokens.length > 0) {
        await redis.set(key, JSON.stringify(filteredTokens), 'EX', 7 * 24 * 60 * 60);
      } else {
        await redis.del(key);
      }
    }

    // Mark as revoked in database
    const tokenHash = this.hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        tokenHash
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  // Revoke all refresh tokens for a user
  async revokeAllRefreshTokens(userId) {
    // Clear from Redis
    await redis.del(`refresh_token:${userId}`);

    // Revoke all in database
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  // Login with enhanced security
  async login(email, password, deviceInfo = {}) {
    // Validate input
    if (!validator.isEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Rate limiting check
    const attempts = await this.getLoginAttempts(email);
    if (attempts >= 5) {
      throw new Error('Too many login attempts. Please try again later.');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        userType: true,
        verified: true,
        status: true,
        twoFactorEnabled: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      await this.recordLoginAttempt(email, false);
      throw new Error('Invalid credentials');
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      throw new Error('Account suspended');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      await this.recordLoginAttempt(email, false);
      
      // Record suspicious activity
      await this.recordSuspiciousActivity(user.id, 'failed_login', deviceInfo);
      
      throw new Error('Invalid credentials');
    }

    // Clear login attempts
    await this.clearLoginAttempts(email);

    // Check for suspicious login
    const isSuspicious = await this.checkSuspiciousLogin(user, deviceInfo);
    if (isSuspicious) {
      // Send email notification
      await this.sendSuspiciousLoginAlert(user, deviceInfo);
    }

    // Generate tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      userType: user.userType
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.tokenId, tokens.refreshToken, deviceInfo);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: deviceInfo.ip
      }
    });

    // Record login history
    await this.recordLoginHistory(user.id, deviceInfo);

    // Remove sensitive data
    delete user.password;
    delete user.twoFactorEnabled;

    return {
      ...tokens,
      user,
      requiresTwoFactor: user.twoFactorEnabled
    };
  }

  // Register with enhanced validation
  async register(userData, deviceInfo = {}) {
    const { email, password, name, phone, userType } = userData;

    // Validate inputs
    if (!validator.isEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!this.isStrongPassword(password)) {
      throw new Error('Password does not meet security requirements');
    }

    if (phone && !validator.isMobilePhone(phone, 'ko-KR')) {
      throw new Error('Invalid phone number format');
    }

    // Check existing user
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        userType: userType || 'WORKER',
        verificationToken: crypto.randomBytes(32).toString('hex'),
        verificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        createdAt: true
      }
    });

    // Generate tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      userType: user.userType
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.tokenId, tokens.refreshToken, deviceInfo);

    // Send verification email
    await this.sendVerificationEmail(user);

    return {
      ...tokens,
      user
    };
  }

  // Helper methods
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  isStrongPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    return strongRegex.test(password);
  }

  async getLoginAttempts(email) {
    const key = `login_attempts:${email}`;
    const attempts = await redis.get(key);
    return attempts ? parseInt(attempts) : 0;
  }

  async recordLoginAttempt(email, success) {
    const key = `login_attempts:${email}`;
    
    if (success) {
      await redis.del(key);
    } else {
      await redis.incr(key);
      await redis.expire(key, 900); // 15 minutes
    }
  }

  async clearLoginAttempts(email) {
    await redis.del(`login_attempts:${email}`);
  }

  async checkSuspiciousLogin(user, deviceInfo) {
    // Check for unusual location, device, or time
    const lastLogin = user.lastLoginAt;
    const timeSinceLastLogin = lastLogin ? Date.now() - lastLogin.getTime() : 0;
    
    // Suspicious if: new device, different country, or unusual time
    return deviceInfo.newDevice || 
           deviceInfo.differentCountry || 
           (timeSinceLastLogin > 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  async recordSuspiciousActivity(userId, type, details) {
    await prisma.suspiciousActivity.create({
      data: {
        userId,
        type,
        details: JSON.stringify(details),
        timestamp: new Date()
      }
    });
  }

  async recordLoginHistory(userId, deviceInfo) {
    await prisma.loginHistory.create({
      data: {
        userId,
        ip: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        country: deviceInfo.country,
        city: deviceInfo.city,
        timestamp: new Date()
      }
    });
  }

  async sendVerificationEmail(user) {
    // Implementation would use email service
    logger.info(`Sending verification email to ${user.email}`);
  }

  async sendSuspiciousLoginAlert(user, deviceInfo) {
    // Implementation would use email service
    logger.info(`Sending suspicious login alert to ${user.email}`);
  }
}

module.exports = new AuthService();