/**
 * Frontend Timeout Configuration
 *
 * Centralized timeout values for animations, API requests,
 * UI feedback, and connection quality adaptation.
 */

// Game animation timeouts (milliseconds)
export const GAME_TIMEOUTS = {
  CARD_ANIMATION_DURATION: 300,
  STACK_ANIMATION_DURATION: 500,
  TRANSITION_ANIMATION_DURATION: 400,
  CONFETTI_ANIMATION_DURATION: 3000,
};

// UI feedback timeouts (milliseconds)
export const UI_TIMEOUTS = {
  LOADING_SPINNER_DELAY: 300,
  TOAST_ERROR_DURATION: 5000,
};

// API request timeouts (milliseconds)
export const API_TIMEOUTS = {
  DEFAULT_REQUEST_TIMEOUT: 10000,
  AUTH_REQUEST_TIMEOUT: 15000,
  UPLOAD_REQUEST_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY_BASE: 1000,
  RETRY_DELAY_MAX: 10000,
  RETRY_BACKOFF_FACTOR: 2,
};

// Multipliers applied to timeouts based on connection quality
export const CONNECTION_QUALITY_MULTIPLIERS = {
  EXCELLENT: 0.8,
  GOOD: 1.0,
  FAIR: 1.5,
  POOR: 2.5,
  UNKNOWN: 1.0,
};

/**
 * Calculate an adaptive timeout based on connection quality.
 * @param {number} baseTimeout - Base timeout in milliseconds
 * @param {object} options - Options including connectionQuality
 * @returns {number} Adjusted timeout
 */
export function calculateAdaptiveTimeout(baseTimeout, options = {}) {
  const { connectionQuality = 'UNKNOWN' } = options;
  const multiplier = CONNECTION_QUALITY_MULTIPLIERS[connectionQuality] || 1.0;
  return Math.round(baseTimeout * multiplier);
}
