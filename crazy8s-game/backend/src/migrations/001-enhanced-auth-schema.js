const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Enhanced Authentication Schema Migration
 * Based on architect's comprehensive schema design
 * Implements all tables, indexes, triggers, and views from schema.sql
 */

const SCHEMA_SQL = `
-- Enhanced Authentication Database Schema (PostgreSQL)
-- Based on architect's design from claude-workspace/auth-implementation/backend/schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- CORE AUTHENTICATION TABLES
-- =====================================================================

-- Users table - Core user information and authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) UNIQUE NOT NULL CHECK (length(username) >= 3 AND username ~ '^[a-zA-Z0-9_-]+$'),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~ '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'),
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile information
    display_name VARCHAR(50),
    avatar_url TEXT,
    bio TEXT,
    
    -- Account status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User security - Authentication and security related data
CREATE TABLE IF NOT EXISTS user_security (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Login tracking
    last_login TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    last_login_user_agent TEXT,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Account protection
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    failed_login_ips INET[] DEFAULT '{}',
    
    -- Email verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    
    -- Password reset
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- Session management
    refresh_token_hash VARCHAR(255),
    refresh_token_expires TIMESTAMP WITH TIME ZONE,
    
    -- Two-factor authentication (future feature)
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    backup_codes TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- =====================================================================
-- GAME SETTINGS TABLES
-- =====================================================================

-- User game settings - Based on current localStorage structure
CREATE TABLE IF NOT EXISTS user_game_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Card organization settings (from localStorage analysis)
    sort_by_rank BOOLEAN DEFAULT FALSE,
    group_by_suit BOOLEAN DEFAULT FALSE,
    experienced_mode BOOLEAN DEFAULT FALSE,
    
    -- Timer settings (from localStorage analysis)
    enable_timer BOOLEAN DEFAULT TRUE,
    timer_duration INTEGER DEFAULT 60 CHECK (timer_duration BETWEEN 15 AND 300),
    timer_warning_time INTEGER DEFAULT 15 CHECK (timer_warning_time BETWEEN 5 AND 60),
    
    -- Card sorting preferences (complex nested object from CardSortingPreferences.js)
    card_sorting_preferences JSONB DEFAULT '{}',
    
    -- UI/UX preferences
    sound_enabled BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    animations_enabled BOOLEAN DEFAULT TRUE,
    
    -- Accessibility settings
    high_contrast_mode BOOLEAN DEFAULT FALSE,
    reduced_motion BOOLEAN DEFAULT FALSE,
    font_size_multiplier DECIMAL(3,2) DEFAULT 1.00 CHECK (font_size_multiplier BETWEEN 0.5 AND 2.0),
    
    -- Advanced settings
    auto_sort_hand BOOLEAN DEFAULT TRUE,
    show_card_count BOOLEAN DEFAULT TRUE,
    quick_play_mode BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- User app preferences - Non-game specific settings
CREATE TABLE IF NOT EXISTS user_app_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Internationalization
    language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh')),
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    
    -- UI theme
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto', 'high-contrast')),
    color_scheme VARCHAR(20) DEFAULT 'default',
    
    -- Communication preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    game_invites_enabled BOOLEAN DEFAULT TRUE,
    friend_requests_enabled BOOLEAN DEFAULT TRUE,
    
    -- Privacy settings
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
    show_online_status BOOLEAN DEFAULT TRUE,
    allow_friend_requests BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- =====================================================================
-- USER STATISTICS AND ANALYTICS
-- =====================================================================

-- User game statistics
CREATE TABLE IF NOT EXISTS user_game_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic game stats
    total_games_played INTEGER DEFAULT 0,
    total_games_won INTEGER DEFAULT 0,
    total_games_lost INTEGER DEFAULT 0,
    total_games_abandoned INTEGER DEFAULT 0,
    
    -- Scoring statistics
    total_score BIGINT DEFAULT 0,
    highest_single_game_score INTEGER DEFAULT 0,
    lowest_single_game_score INTEGER DEFAULT 0,
    average_score DECIMAL(10,2) DEFAULT 0,
    
    -- Streak tracking
    current_win_streak INTEGER DEFAULT 0,
    longest_win_streak INTEGER DEFAULT 0,
    current_loss_streak INTEGER DEFAULT 0,
    longest_loss_streak INTEGER DEFAULT 0,
    
    -- Time-based statistics
    total_play_time_seconds INTEGER DEFAULT 0,
    average_game_duration_seconds INTEGER DEFAULT 0,
    shortest_game_seconds INTEGER,
    longest_game_seconds INTEGER,
    
    -- Card-specific statistics
    total_cards_played INTEGER DEFAULT 0,
    favorite_card_rank VARCHAR(10),
    favorite_card_suit VARCHAR(10),
    eight_cards_played INTEGER DEFAULT 0,
    special_cards_played INTEGER DEFAULT 0,
    
    -- Advanced gameplay statistics
    average_cards_per_turn DECIMAL(4,2) DEFAULT 0,
    most_cards_played_single_turn INTEGER DEFAULT 0,
    tournament_games_played INTEGER DEFAULT 0,
    tournament_wins INTEGER DEFAULT 0,
    
    -- Monthly/seasonal tracking
    monthly_games_won INTEGER DEFAULT 0,
    monthly_games_played INTEGER DEFAULT 0,
    season_start_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Detailed game statistics tracking per game type
CREATE TABLE IF NOT EXISTS user_game_type_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_type VARCHAR(30) NOT NULL,
    
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    total_score BIGINT DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    total_play_time_seconds INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, game_type)
);

-- =====================================================================
-- MIGRATION AND AUDIT TABLES
-- =====================================================================

-- Migration tracking for localStorage to database migration
CREATE TABLE IF NOT EXISTS user_migration_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    migration_type VARCHAR(50) NOT NULL,
    source_data JSONB,
    migration_status VARCHAR(20) DEFAULT 'pending' CHECK (migration_status IN ('pending', 'success', 'failed', 'partial')),
    error_message TEXT,
    migrated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for security and troubleshooting
CREATE TABLE IF NOT EXISTS user_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    action VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON user_security(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_email_token ON user_security(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_user_security_reset_token ON user_security(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_user_security_refresh_token ON user_security(refresh_token_hash);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_user_game_settings_user_id ON user_game_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_preferences_user_id ON user_app_preferences(user_id);

-- Statistics indexes
CREATE INDEX IF NOT EXISTS idx_user_game_statistics_user_id ON user_game_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_statistics_games_played ON user_game_statistics(total_games_played);
CREATE INDEX IF NOT EXISTS idx_user_game_statistics_win_streak ON user_game_statistics(current_win_streak);

-- Game type statistics indexes
CREATE INDEX IF NOT EXISTS idx_user_game_type_stats_user_type ON user_game_type_statistics(user_id, game_type);

-- Migration and audit indexes
CREATE INDEX IF NOT EXISTS idx_user_migration_log_user_type ON user_migration_log(user_id, migration_type);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_action ON user_audit_log(user_id, action, created_at);

-- =====================================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_security_updated_at ON user_security;
CREATE TRIGGER update_user_security_updated_at BEFORE UPDATE ON user_security
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_game_settings_updated_at ON user_game_settings;
CREATE TRIGGER update_user_game_settings_updated_at BEFORE UPDATE ON user_game_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_app_preferences_updated_at ON user_app_preferences;
CREATE TRIGGER update_user_app_preferences_updated_at BEFORE UPDATE ON user_app_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_game_statistics_updated_at ON user_game_statistics;
CREATE TRIGGER update_user_game_statistics_updated_at BEFORE UPDATE ON user_game_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user default records
CREATE OR REPLACE FUNCTION create_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user security record
    INSERT INTO user_security (user_id) VALUES (NEW.id);
    
    -- Create user game settings with localStorage defaults
    INSERT INTO user_game_settings (user_id) VALUES (NEW.id);
    
    -- Create user app preferences
    INSERT INTO user_app_preferences (user_id) VALUES (NEW.id);
    
    -- Create user game statistics
    INSERT INTO user_game_statistics (user_id) VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create default records for new users
DROP TRIGGER IF EXISTS create_user_defaults_trigger ON users;
CREATE TRIGGER create_user_defaults_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_defaults();

-- =====================================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================================

-- Comprehensive user profile view
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.display_name,
    u.avatar_url,
    u.bio,
    u.is_active,
    u.is_verified,
    u.created_at,
    
    -- Statistics
    ugs.total_games_played,
    ugs.total_games_won,
    ugs.current_win_streak,
    ugs.longest_win_streak,
    CASE 
        WHEN ugs.total_games_played > 0 THEN ROUND((ugs.total_games_won::DECIMAL / ugs.total_games_played::DECIMAL * 100), 2)
        ELSE 0
    END as win_percentage,
    
    -- Settings summary
    ugset.sort_by_rank,
    ugset.group_by_suit,
    ugset.experienced_mode
    
FROM users u
LEFT JOIN user_game_statistics ugs ON u.id = ugs.user_id
LEFT JOIN user_game_settings ugset ON u.id = ugset.user_id
WHERE u.is_active = TRUE AND u.is_deleted = FALSE;

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    ugs.total_games_played,
    ugs.total_games_won,
    ugs.current_win_streak,
    ugs.longest_win_streak,
    CASE 
        WHEN ugs.total_games_played > 0 THEN ROUND((ugs.total_games_won::DECIMAL / ugs.total_games_played::DECIMAL * 100), 2)
        ELSE 0
    END as win_percentage,
    ugs.total_score,
    ROW_NUMBER() OVER (ORDER BY ugs.total_games_won DESC, ugs.total_games_played ASC) as rank_by_wins,
    ROW_NUMBER() OVER (ORDER BY 
        CASE 
            WHEN ugs.total_games_played >= 10 THEN ugs.total_games_won::DECIMAL / ugs.total_games_played::DECIMAL 
            ELSE 0 
        END DESC, 
        ugs.total_games_played DESC
    ) as rank_by_win_rate
FROM users u
JOIN user_game_statistics ugs ON u.id = ugs.user_id
WHERE u.is_active = TRUE AND u.is_deleted = FALSE
ORDER BY ugs.total_games_won DESC;

-- =====================================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================================

COMMENT ON TABLE users IS 'Core user accounts with authentication credentials';
COMMENT ON TABLE user_security IS 'Security-related data including login tracking and account protection';
COMMENT ON TABLE user_game_settings IS 'Game-specific user preferences matching localStorage structure';
COMMENT ON TABLE user_app_preferences IS 'Application-wide user preferences for UI and communication';
COMMENT ON TABLE user_game_statistics IS 'Comprehensive gameplay statistics and performance tracking';
COMMENT ON TABLE user_migration_log IS 'Tracks migration of data from localStorage to database';

COMMENT ON COLUMN user_game_settings.card_sorting_preferences IS 'Complex JSON object storing custom card ordering preferences from CardSortingPreferences.js';
COMMENT ON COLUMN user_game_settings.timer_duration IS 'Timer duration in seconds, validated range 15-300';
COMMENT ON COLUMN user_game_settings.timer_warning_time IS 'Warning time in seconds before timer expires';

COMMENT ON VIEW user_profiles IS 'Comprehensive user profile data for public display and API responses';
COMMENT ON VIEW leaderboard IS 'Ranked user performance for competitive features';
`;

/**
 * Run the migration
 */
const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction();
  
  try {
    logger.info('Starting enhanced authentication schema migration...');
    
    // Execute the complete schema
    await queryInterface.sequelize.query(SCHEMA_SQL, { transaction });
    
    await transaction.commit();
    logger.info('Enhanced authentication schema migration completed successfully');
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Enhanced authentication schema migration failed:', error);
    throw error;
  }
};

/**
 * Rollback the migration
 */
const down = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction();
  
  try {
    logger.info('Rolling back enhanced authentication schema migration...');
    
    // Drop views first
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS user_profiles CASCADE;', { transaction });
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS leaderboard CASCADE;', { transaction });
    
    // Drop triggers and functions
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS create_user_defaults_trigger ON users;', { transaction });
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS update_users_updated_at ON users;', { transaction });
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS update_user_security_updated_at ON user_security;', { transaction });
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS update_user_game_settings_updated_at ON user_game_settings;', { transaction });
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS update_user_app_preferences_updated_at ON user_app_preferences;', { transaction });
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS update_user_game_statistics_updated_at ON user_game_statistics;', { transaction });
    
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS create_user_defaults();', { transaction });
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS update_updated_at_column();', { transaction });
    
    // Drop tables in correct order (respecting foreign keys)
    await queryInterface.dropTable('user_audit_log', { transaction });
    await queryInterface.dropTable('user_migration_log', { transaction });
    await queryInterface.dropTable('user_game_type_statistics', { transaction });
    await queryInterface.dropTable('user_game_statistics', { transaction });
    await queryInterface.dropTable('user_app_preferences', { transaction });
    await queryInterface.dropTable('user_game_settings', { transaction });
    await queryInterface.dropTable('user_security', { transaction });
    await queryInterface.dropTable('users', { transaction });
    
    await transaction.commit();
    logger.info('Enhanced authentication schema migration rollback completed');
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Enhanced authentication schema migration rollback failed:', error);
    throw error;
  }
};

module.exports = {
  up,
  down
};