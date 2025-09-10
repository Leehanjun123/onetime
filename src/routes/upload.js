const express = require('express');
const { uploadConfigs, handleUploadError, getFileUrl, deleteFile } = require('../middlewares/upload');
const { authenticateToken } = require('../middlewares/auth');
const { prisma } = require('../config/database');
const router = express.Router();

// 사용자 아바타 업로드
router.post('/avatar', authenticateToken, (req, res, next) => {
  uploadConfigs.avatar(req, res, (err) => {
    handleUploadError(err, req, res, next);
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: '파일이 선택되지 않았습니다'
      });
    }

    // 파일 URL 생성
    const avatarUrl = getFileUrl(req, req.file.filename);

    // 기존 아바타 파일 삭제
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatar: true }
    });

    if (currentUser?.avatar) {
      const oldFilename = currentUser.avatar.split('/').pop();
      const oldFilePath = `uploads/avatars/${oldFilename}`;
      deleteFile(oldFilePath);
    }

    // 사용자 아바타 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        userType: true
      }
    });

    res.json({
      message: '아바타가 성공적으로 업로드되었습니다',
      user: updatedUser,
      fileInfo: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: avatarUrl
      }
    });
  } catch (error) {
    console.error('아바타 업로드 오류:', error);
    res.status(500).json({
      message: '아바타 업로드에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 작업 사진 업로드 (단일)
router.post('/work-photo', authenticateToken, (req, res, next) => {
  uploadConfigs.workPhoto(req, res, (err) => {
    handleUploadError(err, req, res, next);
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: '파일이 선택되지 않았습니다'
      });
    }

    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        message: '작업 세션 ID가 필요합니다'
      });
    }

    // 작업 세션 확인 및 권한 검증
    const workSession = await prisma.workSession.findUnique({
      where: { id: sessionId }
    });

    if (!workSession) {
      return res.status(404).json({
        message: '작업 세션을 찾을 수 없습니다'
      });
    }

    if (workSession.workerId !== req.user.id) {
      return res.status(403).json({
        message: '이 작업 세션에 사진을 업로드할 권한이 없습니다'
      });
    }

    const photoUrl = getFileUrl(req, req.file.filename);

    // 작업 세션에 사진 추가
    const updatedSession = await prisma.workSession.update({
      where: { id: sessionId },
      data: {
        photos: {
          push: photoUrl
        }
      },
      select: {
        id: true,
        photos: true,
        status: true
      }
    });

    res.json({
      message: '작업 사진이 성공적으로 업로드되었습니다',
      workSession: updatedSession,
      fileInfo: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: photoUrl
      }
    });
  } catch (error) {
    console.error('작업 사진 업로드 오류:', error);
    res.status(500).json({
      message: '작업 사진 업로드에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 작업 사진 업로드 (다중)
router.post('/work-photos', authenticateToken, (req, res, next) => {
  uploadConfigs.workPhotos(req, res, (err) => {
    handleUploadError(err, req, res, next);
  });
}, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: '파일이 선택되지 않았습니다'
      });
    }

    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        message: '작업 세션 ID가 필요합니다'
      });
    }

    // 작업 세션 확인 및 권한 검증
    const workSession = await prisma.workSession.findUnique({
      where: { id: sessionId }
    });

    if (!workSession) {
      return res.status(404).json({
        message: '작업 세션을 찾을 수 없습니다'
      });
    }

    if (workSession.workerId !== req.user.id) {
      return res.status(403).json({
        message: '이 작업 세션에 사진을 업로드할 권한이 없습니다'
      });
    }

    // 모든 파일 URL 생성
    const photoUrls = req.files.map(file => getFileUrl(req, file.filename));

    // 작업 세션에 사진들 추가
    const updatedSession = await prisma.workSession.update({
      where: { id: sessionId },
      data: {
        photos: {
          push: photoUrls
        }
      },
      select: {
        id: true,
        photos: true,
        status: true
      }
    });

    res.json({
      message: `${req.files.length}개의 작업 사진이 성공적으로 업로드되었습니다`,
      workSession: updatedSession,
      filesInfo: req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        url: getFileUrl(req, file.filename)
      }))
    });
  } catch (error) {
    console.error('작업 사진 업로드 오류:', error);
    res.status(500).json({
      message: '작업 사진 업로드에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 문서 파일 업로드
router.post('/document', authenticateToken, (req, res, next) => {
  uploadConfigs.document(req, res, (err) => {
    handleUploadError(err, req, res, next);
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: '파일이 선택되지 않았습니다'
      });
    }

    const documentUrl = getFileUrl(req, req.file.filename);

    res.json({
      message: '문서가 성공적으로 업로드되었습니다',
      fileInfo: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: documentUrl
      }
    });
  } catch (error) {
    console.error('문서 업로드 오류:', error);
    res.status(500).json({
      message: '문서 업로드에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 업로드된 파일 삭제
router.delete('/file/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'others' } = req.query;

    const validTypes = ['avatars', 'work-photos', 'documents', 'others'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: '유효하지 않은 파일 타입입니다'
      });
    }

    const filePath = `uploads/${type}/${filename}`;
    
    // 파일 삭제
    const deleted = deleteFile(filePath);
    
    if (!deleted) {
      return res.status(404).json({
        message: '파일을 찾을 수 없습니다'
      });
    }

    // 아바타인 경우 사용자 정보에서도 제거
    if (type === 'avatars') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { avatar: null }
      });
    }

    res.json({
      message: '파일이 성공적으로 삭제되었습니다',
      filename
    });
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    res.status(500).json({
      message: '파일 삭제에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;