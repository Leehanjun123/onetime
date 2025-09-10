const nodemailer = require('nodemailer');
const { prisma } = require('../config/database');
const { logger } = require('../utils/logger');
const crypto = require('crypto');
const redis = require('../config/redis');

class EmailService {
  constructor() {
    // Gmail SMTP 설정 (추후 환경변수로 변경)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'noreply@onetime.kr',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });

    // 이메일 템플릿 캐시
    this.templateCache = new Map();
  }

  // 이메일 전송 (최적화: 큐 시스템 사용)
  async sendEmail(to, subject, html, text) {
    try {
      const mailOptions = {
        from: `원데이 <${process.env.EMAIL_USER || 'noreply@onetime.kr'}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to,
        subject
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Email sending failed', error);
      throw error;
    }
  }

  // 인증 토큰 생성 (최적화: Redis 캐싱)
  async generateVerificationToken(userId, type = 'EMAIL_VERIFY') {
    try {
      // 기존 토큰 무효화
      await this.invalidateUserTokens(userId, type);

      // 새 토큰 생성
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간

      // DB 저장
      await prisma.verificationToken.create({
        data: {
          token: hashedToken,
          type,
          userId,
          expiresAt
        }
      });

      // Redis 캐싱 (빠른 조회를 위해)
      if (redis.client) {
        await redis.client.setex(
          `verify:${hashedToken}`,
          86400, // 24시간
          JSON.stringify({ userId, type })
        );
      }

      return token;
    } catch (error) {
      logger.error('Token generation failed', error);
      throw error;
    }
  }

  // 기존 토큰 무효화
  async invalidateUserTokens(userId, type) {
    try {
      const existingTokens = await prisma.verificationToken.findMany({
        where: {
          userId,
          type,
          used: false
        }
      });

      // Redis에서 제거
      if (redis.client) {
        for (const token of existingTokens) {
          await redis.client.del(`verify:${token.token}`);
        }
      }

      // DB 업데이트
      await prisma.verificationToken.updateMany({
        where: {
          userId,
          type,
          used: false
        },
        data: {
          used: true,
          usedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Token invalidation failed', error);
    }
  }

  // 토큰 검증 (최적화: Redis 우선 조회)
  async verifyToken(token, type = 'EMAIL_VERIFY') {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Redis에서 먼저 확인 (빠른 조회)
      if (redis.client) {
        const cached = await redis.client.get(`verify:${hashedToken}`);
        if (cached) {
          const data = JSON.parse(cached);
          if (data.type === type) {
            // DB에서 상세 정보 조회
            const dbToken = await prisma.verificationToken.findFirst({
              where: {
                token: hashedToken,
                type,
                used: false,
                expiresAt: { gt: new Date() }
              },
              include: { user: true }
            });

            if (dbToken) {
              return dbToken;
            }
          }
        }
      }

      // Redis에 없으면 DB 조회
      const verificationToken = await prisma.verificationToken.findFirst({
        where: {
          token: hashedToken,
          type,
          used: false,
          expiresAt: { gt: new Date() }
        },
        include: { user: true }
      });

      if (!verificationToken) {
        throw new Error('Invalid or expired token');
      }

      return verificationToken;
    } catch (error) {
      logger.error('Token verification failed', error);
      throw error;
    }
  }

  // 이메일 인증 링크 전송
  async sendVerificationEmail(user) {
    try {
      const token = await this.generateVerificationToken(user.id);
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

      const html = this.getEmailTemplate('verification', {
        userName: user.name,
        verificationUrl
      });

      await this.sendEmail(
        user.email,
        '원데이 이메일 인증',
        html
      );

      logger.info('Verification email sent', { userId: user.id, email: user.email });
      return { success: true };
    } catch (error) {
      logger.error('Verification email failed', error);
      throw error;
    }
  }

  // 비밀번호 재설정 이메일
  async sendPasswordResetEmail(user) {
    try {
      const token = await this.generateVerificationToken(user.id, 'PASSWORD_RESET');
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

      const html = this.getEmailTemplate('passwordReset', {
        userName: user.name,
        resetUrl
      });

      await this.sendEmail(
        user.email,
        '원데이 비밀번호 재설정',
        html
      );

      logger.info('Password reset email sent', { userId: user.id });
      return { success: true };
    } catch (error) {
      logger.error('Password reset email failed', error);
      throw error;
    }
  }

  // 환영 이메일
  async sendWelcomeEmail(user) {
    try {
      const html = this.getEmailTemplate('welcome', {
        userName: user.name,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
      });

      await this.sendEmail(
        user.email,
        '원데이에 오신 것을 환영합니다!',
        html
      );

      logger.info('Welcome email sent', { userId: user.id });
      return { success: true };
    } catch (error) {
      logger.error('Welcome email failed', error);
      throw error;
    }
  }

  // 일자리 매칭 알림 이메일
  async sendJobMatchEmail(user, job) {
    try {
      const html = this.getEmailTemplate('jobMatch', {
        userName: user.name,
        jobTitle: job.title,
        company: job.company,
        wage: job.wage.toLocaleString(),
        workDate: new Date(job.workDate).toLocaleDateString('ko-KR'),
        jobUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${job.id}`
      });

      await this.sendEmail(
        user.email,
        `${user.name}님께 적합한 일자리를 찾았습니다!`,
        html
      );

      logger.info('Job match email sent', { userId: user.id, jobId: job.id });
      return { success: true };
    } catch (error) {
      logger.error('Job match email failed', error);
      throw error;
    }
  }

  // 이메일 템플릿 가져오기 (최적화: 템플릿 캐싱)
  getEmailTemplate(templateName, variables = {}) {
    // 캐시에서 먼저 확인
    const cacheKey = `${templateName}_${JSON.stringify(variables)}`;
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey);
    }

    const templates = {
      verification: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6B46C1 0%, #9333EA 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #9333EA; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>원데이 이메일 인증</h1>
            </div>
            <div class="content">
              <p>안녕하세요, {{userName}}님!</p>
              <p>원데이 회원가입을 진행해 주셔서 감사합니다.</p>
              <p>아래 버튼을 클릭하여 이메일 인증을 완료해 주세요:</p>
              <div style="text-align: center;">
                <a href="{{verificationUrl}}" class="button">이메일 인증하기</a>
              </div>
              <p style="font-size: 12px; color: #666;">
                버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 붙여넣어 주세요:<br>
                {{verificationUrl}}
              </p>
              <p style="font-size: 12px; color: #666;">
                이 링크는 24시간 동안 유효합니다.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 원데이. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      passwordReset: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>비밀번호 재설정</h1>
            </div>
            <div class="content">
              <p>안녕하세요, {{userName}}님!</p>
              <p>비밀번호 재설정을 요청하셨습니다.</p>
              <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해 주세요:</p>
              <div style="text-align: center;">
                <a href="{{resetUrl}}" class="button">비밀번호 재설정</a>
              </div>
              <p style="font-size: 12px; color: #666;">
                만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시해 주세요.
              </p>
              <p style="font-size: 12px; color: #666;">
                이 링크는 24시간 동안 유효합니다.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 원데이. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      welcome: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .features { margin: 20px 0; }
            .feature { margin: 10px 0; padding-left: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>원데이에 오신 것을 환영합니다!</h1>
            </div>
            <div class="content">
              <p>안녕하세요, {{userName}}님!</p>
              <p>원데이 회원이 되신 것을 진심으로 환영합니다.</p>
              <div class="features">
                <h3>원데이에서 할 수 있는 일:</h3>
                <div class="feature">✅ 나에게 맞는 일자리 찾기</div>
                <div class="feature">✅ 간편한 지원 및 관리</div>
                <div class="feature">✅ 실시간 채팅으로 빠른 소통</div>
                <div class="feature">✅ 안전한 결제 시스템</div>
              </div>
              <div style="text-align: center;">
                <a href="{{loginUrl}}" class="button">지금 시작하기</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2025 원데이. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      jobMatch: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .job-title { font-size: 20px; font-weight: bold; color: #2563EB; }
            .job-detail { margin: 10px 0; color: #666; }
            .button { display: inline-block; padding: 15px 30px; background: #2563EB; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>새로운 일자리 추천!</h1>
            </div>
            <div class="content">
              <p>안녕하세요, {{userName}}님!</p>
              <p>회원님께 적합한 일자리를 찾았습니다.</p>
              <div class="job-card">
                <div class="job-title">{{jobTitle}}</div>
                <div class="job-detail">📍 회사: {{company}}</div>
                <div class="job-detail">💰 일당: {{wage}}원</div>
                <div class="job-detail">📅 근무일: {{workDate}}</div>
              </div>
              <div style="text-align: center;">
                <a href="{{jobUrl}}" class="button">자세히 보기</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2025 원데이. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    let html = templates[templateName] || '';
    
    // 변수 치환
    for (const [key, value] of Object.entries(variables)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // 캐시에 저장 (최대 100개까지만)
    if (this.templateCache.size > 100) {
      const firstKey = this.templateCache.keys().next().value;
      this.templateCache.delete(firstKey);
    }
    this.templateCache.set(cacheKey, html);

    return html;
  }

  // 일괄 이메일 전송 (최적화: 배치 처리)
  async sendBulkEmails(recipients, subject, template, batchSize = 50) {
    const results = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(recipient => 
        this.sendEmail(
          recipient.email,
          subject,
          this.getEmailTemplate(template, recipient.variables)
        ).catch(error => ({
          email: recipient.email,
          error: error.message
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 배치 간 딜레이 (rate limiting 방지)
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

module.exports = new EmailService();