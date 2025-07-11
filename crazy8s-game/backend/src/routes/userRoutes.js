const express = require('express');
const { authenticate, optionalAuth, requireOwnership } = require('../middleware/auth');
const UserStore = require('../stores/UserStore');
const logger = require('../utils/logger');

const router = express.Router();

// Get user by ID (public info only)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;
    
    const user = await UserStore.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.profile.isActive) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Return different levels of detail based on authentication
    let userData;
    if (requestingUser && requestingUser.id === user.id) {
      // User viewing their own profile - return full data
      userData = user.toPublicJSON();
    } else {
      // Public view - limited data
      userData = {
        id: user.id,
        username: user.username,
        profile: {
          displayName: user.profile.displayName,
          avatar: user.profile.avatar,
          joinedAt: user.profile.joinedAt
        },
        statistics: {
          gamesPlayed: user.statistics.gamesPlayed,
          gamesWon: user.statistics.gamesWon,
          gamesLost: user.statistics.gamesLost,
          bestScore: user.statistics.bestScore,
          longestWinStreak: user.statistics.longestWinStreak,
          favoriteGameMode: user.statistics.favoriteGameMode
        }
      };
    }
    
    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'GET_USER_ERROR'
    });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
        code: 'INVALID_SEARCH_QUERY'
      });
    }
    
    const users = await UserStore.findAll({
      search: query,
      isActive: true,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Return public data only
    const publicUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      profile: {
        displayName: user.profile.displayName,
        avatar: user.profile.avatar,
        joinedAt: user.profile.joinedAt
      },
      statistics: {
        gamesPlayed: user.statistics.gamesPlayed,
        gamesWon: user.statistics.gamesWon,
        bestScore: user.statistics.bestScore
      }
    }));
    
    res.json({
      success: true,
      users: publicUsers,
      query,
      total: publicUsers.length
    });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SEARCH_USERS_ERROR'
    });
  }
});

// Get user statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await UserStore.findById(id);
    if (!user || !user.profile.isActive) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Calculate additional statistics
    const winRate = user.statistics.gamesPlayed > 0 
      ? (user.statistics.gamesWon / user.statistics.gamesPlayed * 100).toFixed(2) 
      : 0;
    
    const averageScore = user.statistics.gamesPlayed > 0 
      ? (user.statistics.totalScore / user.statistics.gamesPlayed).toFixed(2) 
      : 0;
    
    const statistics = {
      ...user.statistics,
      winRate: parseFloat(winRate),
      averageScore: parseFloat(averageScore)
    };
    
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    logger.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'GET_USER_STATISTICS_ERROR'
    });
  }
});

// Get leaderboard
router.get('/leaderboard/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    const validTypes = ['wins', 'winRate', 'bestScore', 'gamesPlayed', 'winStreak'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid leaderboard type',
        code: 'INVALID_LEADERBOARD_TYPE',
        validTypes
      });
    }
    
    const users = await UserStore.findAll({ isActive: true });
    
    // Sort based on type
    let sortedUsers;
    switch (type) {
      case 'wins':
        sortedUsers = users.sort((a, b) => b.statistics.gamesWon - a.statistics.gamesWon);
        break;
      case 'winRate':
        sortedUsers = users
          .filter(user => user.statistics.gamesPlayed >= 5) // Minimum games for win rate
          .sort((a, b) => {
            const aRate = a.statistics.gamesWon / a.statistics.gamesPlayed;
            const bRate = b.statistics.gamesWon / b.statistics.gamesPlayed;
            return bRate - aRate;
          });
        break;
      case 'bestScore':
        sortedUsers = users.sort((a, b) => b.statistics.bestScore - a.statistics.bestScore);
        break;
      case 'gamesPlayed':
        sortedUsers = users.sort((a, b) => b.statistics.gamesPlayed - a.statistics.gamesPlayed);
        break;
      case 'winStreak':
        sortedUsers = users.sort((a, b) => b.statistics.longestWinStreak - a.statistics.longestWinStreak);
        break;
    }
    
    // Paginate
    const paginatedUsers = sortedUsers.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    // Format response
    const leaderboard = paginatedUsers.map((user, index) => {
      const rank = parseInt(offset) + index + 1;
      const winRate = user.statistics.gamesPlayed > 0 
        ? (user.statistics.gamesWon / user.statistics.gamesPlayed * 100).toFixed(2) 
        : 0;
      
      return {
        rank,
        id: user.id,
        username: user.username,
        displayName: user.profile.displayName,
        avatar: user.profile.avatar,
        statistics: {
          gamesPlayed: user.statistics.gamesPlayed,
          gamesWon: user.statistics.gamesWon,
          gamesLost: user.statistics.gamesLost,
          bestScore: user.statistics.bestScore,
          longestWinStreak: user.statistics.longestWinStreak,
          currentWinStreak: user.statistics.currentWinStreak,
          winRate: parseFloat(winRate),
          favoriteGameMode: user.statistics.favoriteGameMode
        }
      };
    });
    
    res.json({
      success: true,
      leaderboard,
      type,
      total: sortedUsers.length
    });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'GET_LEADERBOARD_ERROR'
    });
  }
});

module.exports = router;