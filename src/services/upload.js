const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const sharp = require('sharp');
const { prisma } = require('../config/database');
const { logger } = require('../utils/logger');

class UploadService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.allowedDocumentTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    // 업로드 디렉토리 생성
    this.initializeUploadDirs();
  }

  async initializeUploadDirs() {
    const dirs = [
      this.uploadDir,
      path.join(this.uploadDir, 'profiles'),
      path.join(this.uploadDir, 'portfolios'),
      path.join(this.uploadDir, 'documents'),
      path.join(this.uploadDir, 'temp')
    ];

    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        logger.info(`Created upload directory: ${dir}`);
      }
    }
  }

  // 파일명 생성 (보안 강화)
  generateFileName(originalName) {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}_${hash}${ext}`;
  }

  // Multer 설정 - 프로필 이미지
  getProfileImageUploader() {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        cb(null, path.join(this.uploadDir, 'profiles'));
      },
      filename: (req, file, cb) => {
        cb(null, this.generateFileName(file.originalname));
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 1
      },
      fileFilter: (req, file, cb) => {
        if (!this.allowedImageTypes.includes(file.mimetype)) {
          return cb(new Error('지원하지 않는 이미지 형식입니다'));
        }
        cb(null, true);
      }
    });
  }

  // Multer 설정 - 포트폴리오
  getPortfolioUploader() {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        cb(null, path.join(this.uploadDir, 'portfolios'));
      },
      filename: (req, file, cb) => {
        cb(null, this.generateFileName(file.originalname));
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: this.maxFileSize * 2, // 포트폴리오는 20MB까지
        files: 10 // 최대 10개 파일
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [...this.allowedImageTypes, ...this.allowedDocumentTypes];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error('지원하지 않는 파일 형식입니다'));
        }
        cb(null, true);
      }
    });
  }

  // 이미지 최적화 (리사이징, 압축)
  async optimizeImage(filePath, options = {}) {
    try {
      const {
        width = 800,
        height = 800,
        quality = 85,
        format = 'jpeg'
      } = options;

      const optimizedPath = filePath.replace(
        path.extname(filePath),
        `_optimized.${format}`
      );

      await sharp(filePath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat(format, { quality })
        .toFile(optimizedPath);

      // 원본 파일 삭제하고 최적화된 파일로 교체
      await fs.unlink(filePath);
      await fs.rename(optimizedPath, filePath);

      const stats = await fs.stat(filePath);
      logger.info(`Image optimized: ${path.basename(filePath)}, Size: ${stats.size} bytes`);

      return filePath;
    } catch (error) {
      logger.error('Image optimization failed:', error);
      return filePath; // 실패시 원본 반환
    }
  }

  // 썸네일 생성
  async createThumbnail(filePath, options = {}) {
    try {
      const {
        width = 200,
        height = 200,
        quality = 80
      } = options;

      const thumbnailPath = filePath.replace(
        path.extname(filePath),
        '_thumb.jpeg'
      );

      await sharp(filePath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .toFormat('jpeg', { quality })
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      logger.error('Thumbnail creation failed:', error);
      return null;
    }
  }

  // 프로필 이미지 업로드 처리
  async uploadProfileImage(userId, file) {
    try {
      // 이미지 최적화
      await this.optimizeImage(file.path, {
        width: 500,
        height: 500,
        quality: 90
      });

      // 썸네일 생성
      const thumbnailPath = await this.createThumbnail(file.path);

      // 기존 프로필 이미지 삭제
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatar: true }
      });

      if (user.avatar) {
        await this.deleteFile(user.avatar);
      }

      // DB 업데이트
      const relativePath = path.relative(this.uploadDir, file.path);
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          avatar: `/uploads/${relativePath}`
        },
        select: {
          id: true,
          avatar: true
        }
      });

      logger.info(`Profile image uploaded for user ${userId}`);

      return {
        success: true,
        imageUrl: updatedUser.avatar,
        thumbnailUrl: thumbnailPath ? `/uploads/${path.relative(this.uploadDir, thumbnailPath)}` : null
      };
    } catch (error) {
      logger.error('Profile image upload failed:', error);
      // 실패시 업로드된 파일 삭제
      if (file.path) {
        await this.deleteFile(file.path);
      }
      throw error;
    }
  }

  // 포트폴리오 파일 업로드
  async uploadPortfolioFiles(userId, files) {
    try {
      const uploadedFiles = [];

      for (const file of files) {
        // 이미지인 경우 최적화
        if (this.allowedImageTypes.includes(file.mimetype)) {
          await this.optimizeImage(file.path);
          await this.createThumbnail(file.path);
        }

        const relativePath = path.relative(this.uploadDir, file.path);
        
        // DB에 파일 정보 저장
        const portfolioFile = await prisma.portfolioFile.create({
          data: {
            userId,
            fileName: file.originalname,
            filePath: `/uploads/${relativePath}`,
            fileType: file.mimetype,
            fileSize: file.size
          }
        });

        uploadedFiles.push(portfolioFile);
      }

      logger.info(`Portfolio files uploaded for user ${userId}: ${uploadedFiles.length} files`);

      return {
        success: true,
        files: uploadedFiles
      };
    } catch (error) {
      logger.error('Portfolio upload failed:', error);
      // 실패시 업로드된 파일들 삭제
      for (const file of files) {
        await this.deleteFile(file.path);
      }
      throw error;
    }
  }

  // 파일 삭제
  async deleteFile(filePath) {
    try {
      // 상대 경로를 절대 경로로 변환
      if (filePath.startsWith('/uploads/')) {
        filePath = path.join(this.uploadDir, filePath.replace('/uploads/', ''));
      }

      await fs.unlink(filePath);
      
      // 썸네일도 삭제
      const thumbnailPath = filePath.replace(
        path.extname(filePath),
        '_thumb.jpeg'
      );
      
      try {
        await fs.unlink(thumbnailPath);
      } catch {
        // 썸네일이 없을 수도 있음
      }

      logger.info(`File deleted: ${filePath}`);
    } catch (error) {
      logger.error(`File deletion failed: ${filePath}`, error);
    }
  }

  // 임시 파일 정리 (1일 이상 된 파일)
  async cleanupTempFiles() {
    try {
      const tempDir = path.join(this.uploadDir, 'temp');
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > oneDay) {
          await fs.unlink(filePath);
          logger.info(`Cleaned up temp file: ${file}`);
        }
      }
    } catch (error) {
      logger.error('Temp file cleanup failed:', error);
    }
  }

  // 파일 검증
  async validateFile(filePath, expectedType) {
    try {
      const stats = await fs.stat(filePath);
      
      // 파일 크기 검증
      if (stats.size > this.maxFileSize * 2) {
        throw new Error('파일 크기가 너무 큽니다');
      }

      // 파일 타입 검증 (magic number 체크 등 추가 가능)
      // ...

      return true;
    } catch (error) {
      logger.error('File validation failed:', error);
      throw error;
    }
  }

  // 사용자 스토리지 사용량 계산
  async getUserStorageUsage(userId) {
    try {
      const files = await prisma.portfolioFile.findMany({
        where: { userId },
        select: { fileSize: true }
      });

      const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);
      const maxStorage = parseInt(process.env.MAX_USER_STORAGE) || 100 * 1024 * 1024; // 100MB

      return {
        used: totalSize,
        max: maxStorage,
        percentage: (totalSize / maxStorage) * 100
      };
    } catch (error) {
      logger.error('Storage usage calculation failed:', error);
      throw error;
    }
  }
}

module.exports = new UploadService();