const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendation');
const { authenticateToken } = require('../middlewares/auth');
const { logger } = require('../utils/logger');

// 맞춤 일자리 추천
router.get('/jobs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      limit = 10, 
      excludeApplied = true,
      includeUrgent = true 
    } = req.query;

    const recommendations = await recommendationService.getRecommendations(userId, {
      limit: parseInt(limit),
      excludeApplied: excludeApplied === 'true',
      includeUrgent: includeUrgent === 'true'
    });

    res.json({
      message: '추천 일자리를 조회했습니다',
      data: recommendations
    });
  } catch (error) {
    logger.error('Get job recommendations error:', error);
    res.status(500).json({
      message: '추천 일자리 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 유사 사용자 기반 추천
router.get('/collaborative', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;

    const recommendations = await recommendationService.getCollaborativeRecommendations(
      userId, 
      parseInt(limit)
    );

    res.json({
      message: '협업 필터링 추천을 조회했습니다',
      data: recommendations
    });
  } catch (error) {
    logger.error('Collaborative recommendations error:', error);
    res.status(500).json({
      message: '협업 필터링 추천 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 사용자 선호도 분석
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userProfile = await recommendationService.getUserProfile(userId);
    const preferences = await recommendationService.analyzeUserPreferences(userId);

    res.json({
      message: '사용자 선호도를 분석했습니다',
      data: {
        profile: userProfile.preferences,
        analysis: preferences
      }
    });
  } catch (error) {
    logger.error('Get user preferences error:', error);
    res.status(500).json({
      message: '선호도 분석에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 유사 사용자 찾기
router.get('/similar-users', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const similarUsers = await recommendationService.findSimilarUsers(
      userId,
      parseInt(limit)
    );

    res.json({
      message: '유사한 사용자를 찾았습니다',
      data: similarUsers
    });
  } catch (error) {
    logger.error('Find similar users error:', error);
    res.status(500).json({
      message: '유사 사용자 찾기에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;