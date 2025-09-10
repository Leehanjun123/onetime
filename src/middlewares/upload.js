const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

// 업로드 디렉토리 확인 및 생성
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // 파일 타입에 따라 디렉토리 결정
    switch (file.fieldname) {
      case 'avatar':
        uploadPath += 'avatars/';
        break;
      case 'workPhotos':
      case 'workPhoto':
        uploadPath += 'work-photos/';
        break;
      case 'document':
        uploadPath += 'documents/';
        break;
      default:
        uploadPath += 'others/';
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 고유한 파일명 생성 (타임스탬프 + 랜덤값 + 확장자)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// 파일 필터링 (이미지만 허용)
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다 (JPEG, PNG, GIF, WebP)'));
  }
};

// 문서 파일 필터링
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt|rtf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf'
  ];
  const mimetype = allowedMimes.includes(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('문서 파일만 업로드 가능합니다 (PDF, DOC, DOCX, TXT, RTF)'));
  }
};

// 업로드 설정들
const uploadConfigs = {
  // 아바타 이미지 (단일 파일, 2MB 제한)
  avatar: multer({
    storage: storage,
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB
      files: 1
    },
    fileFilter: imageFileFilter
  }).single('avatar'),

  // 작업 사진들 (최대 5개, 각 10MB 제한)
  workPhotos: multer({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 5
    },
    fileFilter: imageFileFilter
  }).array('workPhotos', 5),

  // 단일 작업 사진
  workPhoto: multer({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1
    },
    fileFilter: imageFileFilter
  }).single('workPhoto'),

  // 문서 파일
  document: multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1
    },
    fileFilter: documentFileFilter
  }).single('document'),

  // 다양한 파일 타입 동시 업로드
  mixed: multer({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 10 // 최대 10개 파일
    }
  }).fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'workPhotos', maxCount: 5 },
    { name: 'documents', maxCount: 3 }
  ])
};

// 업로드 에러 핸들링 미들웨어
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          message: '파일 크기가 너무 큽니다',
          error: '최대 업로드 크기를 확인해주세요'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          message: '파일 개수가 제한을 초과했습니다',
          error: '업로드 가능한 파일 수를 확인해주세요'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          message: '허용되지 않은 필드명입니다',
          error: '올바른 필드명을 사용해주세요'
        });
      default:
        return res.status(400).json({
          message: '파일 업로드 오류',
          error: error.message
        });
    }
  }
  
  if (error) {
    return res.status(400).json({
      message: '파일 업로드 실패',
      error: error.message
    });
  }
  
  next();
};

// 파일 URL 생성 헬퍼
const getFileUrl = (req, filename) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
};

// 파일 삭제 헬퍼
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('File deletion error:', error);
    return false;
  }
};

module.exports = {
  uploadConfigs,
  handleUploadError,
  getFileUrl,
  deleteFile,
  ensureDirectoryExists
};