import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { colors, shadows, borderRadius, transitions } from '../../utils/theme';

const UserDashboard = ({ onClose, onJoinGame, currentGameState }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [quickStats, setQuickStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    winRate: 0,
    currentStreak: 0
  });

  // Load actual user statistics
  useEffect(() => {
    if (isAuthenticated && user) {
      // Use actual statistics from user object
      const stats = user.statistics || {};
      const gamesPlayed = stats.totalGamesPlayed || 0;
      const gamesWon = stats.totalGamesWon || 0;
      const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
      
      setQuickStats({
        gamesPlayed: gamesPlayed,
        wins: gamesWon,
        winRate: winRate,
        currentStreak: stats.currentWinStreak || 0
      });
    }
  }, [user, isAuthenticated]);

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'games', label: '🎮 Games', icon: '🎮' },
    { id: 'achievements', label: '🏆 Achievements', icon: '🏆' },
    { id: 'friends', label: '👥 Friends', icon: '👥' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.authOverlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        backgroundColor: colors.formBackground,
        borderRadius: borderRadius.large,
        padding: '0',
        width: '800px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: shadows.large,
        position: 'relative',
        border: `1px solid ${colors.border}`
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 25px',
          borderBottom: `2px solid ${colors.background}`,
          backgroundColor: colors.primary,
          borderRadius: `${borderRadius.large} ${borderRadius.large} 0 0`,
          color: colors.white,
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '20px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.white,
              padding: '5px',
              borderRadius: borderRadius.small,
              opacity: 0.8,
              transition: transitions.fast
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
          >
            ×
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: colors.white,
              borderRadius: borderRadius.round,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              👤
            </div>
            <div>
              <h2 style={{
                margin: '0 0 5px 0',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {user?.displayName || user?.username || 'User'}
              </h2>
              <div style={{
                fontSize: '14px',
                opacity: 0.9
              }}>
                Member since {new Date(user?.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Current Game Status */}
        {currentGameState?.gameId && (
          <div style={{
            padding: '15px 25px',
            backgroundColor: colors.secondaryLight,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: colors.secondary,
                marginBottom: '2px'
              }}>
                🎮 Current Game
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.darkGray
              }}>
                Game ID: {currentGameState.gameId} • {currentGameState.players?.length || 0} players • Round {currentGameState.roundNumber || 1}
              </div>
            </div>
            <button
              onClick={onJoinGame}
              style={{
                padding: '8px 16px',
                backgroundColor: colors.secondary,
                color: colors.white,
                border: 'none',
                borderRadius: borderRadius.small,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              ↩️ Return to Game
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          backgroundColor: colors.background,
          borderBottom: `1px solid ${colors.border}`
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '15px 10px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? colors.white : 'transparent',
                color: activeTab === tab.id ? colors.primary : colors.darkGray,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                borderBottom: activeTab === tab.id ? `3px solid ${colors.primary}` : '3px solid transparent',
                transition: transitions.fast
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{
          padding: '25px',
          minHeight: '300px'
        }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3 style={{
                margin: '0 0 20px 0',
                color: colors.dark,
                fontSize: '18px'
              }}>
                📊 Quick Overview
              </h3>

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '25px'
              }}>
                <StatCard
                  icon="🎮"
                  title="Games Played"
                  value={quickStats.gamesPlayed}
                  color={colors.primary}
                />
                <StatCard
                  icon="🏆"
                  title="Games Won"
                  value={quickStats.wins}
                  color={colors.secondary}
                />
                <StatCard
                  icon="📈"
                  title="Win Rate"
                  value={`${quickStats.winRate}%`}
                  color={colors.warning}
                />
                <StatCard
                  icon="🔥"
                  title="Current Streak"
                  value={quickStats.currentStreak}
                  color={colors.error}
                />
              </div>

              {/* Recent Activity */}
              <div style={{
                backgroundColor: colors.background,
                borderRadius: borderRadius.medium,
                padding: '20px'
              }}>
                <h4 style={{
                  margin: '0 0 15px 0',
                  color: colors.dark,
                  fontSize: '16px'
                }}>
                  📅 Recent Activity
                </h4>
                <div style={{
                  textAlign: 'center',
                  color: colors.darkGray,
                  fontSize: '14px',
                  padding: '40px 20px'
                }}>
                  🎮 Start playing games to see your activity here!
                  <div style={{
                    marginTop: '15px',
                    fontSize: '12px'
                  }}>
                    Your game history, achievements, and stats will appear as you play.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Games Tab */}
          {activeTab === 'games' && (
            <div>
              <h3 style={{
                margin: '0 0 20px 0',
                color: colors.dark,
                fontSize: '18px'
              }}>
                🎮 Game History
              </h3>
              <div style={{
                textAlign: 'center',
                color: colors.darkGray,
                fontSize: '14px',
                padding: '60px 20px',
                backgroundColor: colors.background,
                borderRadius: borderRadius.medium
              }}>
                🎯 No games played yet!
                <div style={{
                  marginTop: '10px',
                  fontSize: '12px'
                }}>
                  Start playing to build your game history and track your progress.
                </div>
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div>
              <h3 style={{
                margin: '0 0 20px 0',
                color: colors.dark,
                fontSize: '18px'
              }}>
                🏆 Achievements
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px'
              }}>
                <AchievementCard
                  icon="🎮"
                  title="First Game"
                  description="Play your first game"
                  unlocked={quickStats.gamesPlayed > 0}
                  progress={quickStats.gamesPlayed > 0 ? 1 : 0}
                  total={1}
                />
                <AchievementCard
                  icon="🏆"
                  title="First Win"
                  description="Win your first game"
                  unlocked={quickStats.wins > 0}
                  progress={quickStats.wins > 0 ? 1 : 0}
                  total={1}
                />
                <AchievementCard
                  icon="🔟"
                  title="Veteran Player"
                  description="Play 10 games"
                  unlocked={quickStats.gamesPlayed >= 10}
                  progress={Math.min(quickStats.gamesPlayed, 10)}
                  total={10}
                />
                <AchievementCard
                  icon="🎯"
                  title="Win Streak"
                  description="Win 5 games in a row"
                  unlocked={quickStats.currentStreak >= 5}
                  progress={Math.min(quickStats.currentStreak, 5)}
                  total={5}
                />
              </div>
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div>
              <h3 style={{
                margin: '0 0 20px 0',
                color: colors.dark,
                fontSize: '18px'
              }}>
                👥 Friends & Social
              </h3>
              <div style={{
                textAlign: 'center',
                color: colors.darkGray,
                fontSize: '14px',
                padding: '60px 20px',
                backgroundColor: colors.background,
                borderRadius: borderRadius.medium
              }}>
                🚀 Coming Soon!
                <div style={{
                  marginTop: '10px',
                  fontSize: '12px'
                }}>
                  Friend lists, leaderboards, and social features are in development.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, title, value, color }) => (
  <div style={{
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: '20px',
    textAlign: 'center',
    boxShadow: shadows.small,
    border: `1px solid ${colors.border}`
  }}>
    <div style={{
      fontSize: '32px',
      marginBottom: '8px'
    }}>
      {icon}
    </div>
    <div style={{
      fontSize: '24px',
      fontWeight: 'bold',
      color: color,
      marginBottom: '5px'
    }}>
      {value}
    </div>
    <div style={{
      fontSize: '12px',
      color: colors.darkGray,
      fontWeight: 'bold'
    }}>
      {title}
    </div>
  </div>
);

const AchievementCard = ({ icon, title, description, unlocked, progress, total }) => (
  <div style={{
    backgroundColor: unlocked ? colors.secondaryLight : colors.background,
    borderRadius: borderRadius.medium,
    padding: '15px',
    border: `2px solid ${unlocked ? colors.secondary : colors.border}`,
    opacity: unlocked ? 1 : 0.6,
    transition: transitions.fast
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '8px'
    }}>
      <div style={{ fontSize: '24px' }}>{icon}</div>
      <div>
        <div style={{
          fontWeight: 'bold',
          color: colors.dark,
          fontSize: '14px'
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '12px',
          color: colors.darkGray
        }}>
          {description}
        </div>
      </div>
    </div>
    
    {!unlocked && total > 1 && (
      <div style={{
        marginTop: '10px'
      }}>
        <div style={{
          fontSize: '11px',
          color: colors.darkGray,
          marginBottom: '3px'
        }}>
          Progress: {progress}/{total}
        </div>
        <div style={{
          height: '4px',
          backgroundColor: colors.border,
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: colors.primary,
            width: `${(progress / total) * 100}%`,
            transition: transitions.fast
          }} />
        </div>
      </div>
    )}
    
    {unlocked && (
      <div style={{
        marginTop: '5px',
        fontSize: '11px',
        color: colors.secondary,
        fontWeight: 'bold'
      }}>
        ✅ Unlocked!
      </div>
    )}
  </div>
);

export default UserDashboard;