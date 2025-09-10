const express = require('express');
const router = express.Router();
const uploadService = require('../services/upload');
const { authenticateToken } = require('../middlewares/auth');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');

// 프로필 이미지 업로드
router.post('/profile-image', 
  authenticateToken,
  uploadService.getProfileImageUploader().single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: '이미지 파일을 선택해주세요'
        });
      }

      const result = await uploadService.uploadProfileImage(req.user.id, req.file);

      // 사용자 캐시 무효화
      await redis.invalidateUserCache(req.user.id);

      res.json({
        message: '프로필 이미지가 업로드되었습니다',
        data: result
      });
    } catch (error) {
      logger.error('프로필 이미지 업로드 오류:', error);
      res.status(500).json({
        message: '프로필 이미지 업로드에 실패했습니다',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// 포트폴리오 파일 업로드
router.post('/portfolio',
  authenticateToken,
  uploadService.getPortfolioUploader().array('files', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          message: '업로드할 파일을 선택해주세요'
        });
      }

      // 스토리지 사용량 확인
      const storageUsage = await uploadService.getUserStorageUsage(req.user.id);
      const newFilesSize = req.files.reduce((sum, file) => sum + file.size, 0);
      
      if (storageUsage.used + newFilesSize > storageUsage.max) {
        // 업로드된 파일 삭제
        for (const file of req.files) {
          await uploadService.deleteFile(file.path);
        }
        
        return res.status(400).json({
          message: '저장 공간이 부족합니다',
          data: {
            currentUsage: storageUsage.percentage.toFixed(2) + '%',
            maxStorage: Math.floor(storageUsage.max / 1024 / 1024) + 'MB'
          }
        });
      }

      const result = await uploadService.uploadPortfolioFiles(req.user.id, req.files);

      res.json({
        message: '포트폴리오 파일이 업로드되었습니다',
        data: result
      });
    } catch (error) {
      logger.error('포트폴리오 업로드 오류:', error);
      res.status(500).json({
        message: '포트폴리오 업로드에 실패했습니다',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// 포트폴리오 파일 목록 조회
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const { prisma } = require('../config/database');
    
    const files = await prisma.portfolioFile.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    const storageUsage = await uploadService.getUserStorageUsage(req.user.id);

    res.json({
      data: {
        files,
        storage: {
          used: storageUsage.used,
          max: storageUsage.max,
          percentage: storageUsage.percentage.toFixed(2)
        }
      }
    });
  } catch (error) {
    logger.error('포트폴리오 조회 오류:', error);
    res.status(500).json({
      message: '포트폴리오 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 포트폴리오 파일 삭제
router.delete('/portfolio/:fileId', authenticateToken, async (req, res) => {
  try {
    const { prisma } = require('../config/database');
    const { fileId } = req.params;

    // 파일 소유권 확인
    const file = await prisma.portfolioFile.findFirst({
      where: {
        id: fileId,
        userId: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({
        message: '파일을 찾을 수 없습니다'
      });
    }

    // 파일 시스템에서 삭제
    await uploadService.deleteFile(file.filePath);

    // DB에서 삭제
    await prisma.portfolioFile.delete({
      where: { id: fileId }
    });

    res.json({
      message: '파일이 삭제되었습니다'
    });
  } catch (error) {
    logger.error('파일 삭제 오류:', error);
    res.status(500).json({
      message: '파일 삭제에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 스토리지 사용량 조회
router.get('/storage-usage', authenticateToken, async (req, res) => {
  try {
    const usage = await uploadService.getUserStorageUsage(req.user.id);

    res.json({
      data: {
        used: usage.used,
        max: usage.max,
        percentage: usage.percentage.toFixed(2),
        usedMB: (usage.used / 1024 / 1024).toFixed(2),
        maxMB: (usage.max / 1024 / 1024).toFixed(2)
      }
    });
  } catch (error) {
    logger.error('스토리지 사용량 조회 오류:', error);
    res.status(500).json({
      message: '스토리지 사용량 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;