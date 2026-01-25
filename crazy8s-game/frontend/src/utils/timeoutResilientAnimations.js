/**
 * Timeout-Resilient Animation System
 * 
 * Provides robust animation handling that gracefully handles timeouts and interruptions:
 * - Card animations with timeout protection
 * - State transition animations with fallback
 * - Stacking sequence animations with resilience
 * - Turn transition animations with timeout handling
 */

import { GAME_TIMEOUTS, UI_TIMEOUTS } from '../config/timeouts';

// Animation state management
class AnimationManager {
  constructor() {
    this.activeAnimations = new Map();
    this.animationQueue = [];
    this.isProcessingQueue = false;
    this.globalTimeout = null;
  }
  
  // Register an animation with timeout protection
  registerAnimation(id, animation, options = {}) {
    const {
      timeout = GAME_TIMEOUTS.CARD_ANIMATION_DURATION * 2, // 2x safety margin
      onTimeout = null,
      onComplete = null,
      priority = 'normal', // 'high', 'normal', 'low'
      skipOnOverload = false
    } = options;
    
    // Check if we're overloaded with animations
    if (skipOnOverload && this.activeAnimations.size > 10) {
      console.warn(`⚠️ Animation overload detected, skipping animation: ${id}`);
      if (onComplete) onComplete();
      return Promise.resolve();
    }
    
    const animationPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.warn(`⏰ Animation timeout: ${id} (${timeout}ms)`);
        this.activeAnimations.delete(id);
        
        if (onTimeout) {
          onTimeout();
        } else {
          // Default timeout behavior: complete immediately
          console.log(`🏃 Fast-forwarding timed out animation: ${id}`);
        }
        
        resolve();
      }, timeout);
      
      const animationInfo = {
        id,
        animation,
        timeoutId,
        priority,
        startTime: Date.now(),
        resolve,
        reject,
        onComplete
      };
      
      this.activeAnimations.set(id, animationInfo);
      
      // Execute animation
      try {
        const result = animation();
        
        // Handle different return types
        if (result && typeof result.then === 'function') {
          // Animation returns a promise
          result
            .then(() => {
              this.completeAnimation(id);
              resolve();
            })
            .catch((error) => {
              this.completeAnimation(id, error);
              reject(error);
            });
        } else {
          // Synchronous animation or no return value
          this.completeAnimation(id);
          resolve();
        }
      } catch (error) {
        this.completeAnimation(id, error);
        reject(error);
      }
    });
    
    return animationPromise;
  }
  
  // Complete an animation
  completeAnimation(id, error = null) {
    const animation = this.activeAnimations.get(id);
    if (!animation) return;
    
    clearTimeout(animation.timeoutId);
    this.activeAnimations.delete(id);
    
    const duration = Date.now() - animation.startTime;
    console.log(`✅ Animation completed: ${id} (${duration}ms)`);
    
    if (animation.onComplete) {
      animation.onComplete(error);
    }
  }
  
  // Cancel an animation
  cancelAnimation(id) {
    const animation = this.activeAnimations.get(id);
    if (!animation) return false;
    
    clearTimeout(animation.timeoutId);
    this.activeAnimations.delete(id);
    
    console.log(`❌ Animation cancelled: ${id}`);
    return true;
  }
  
  // Cancel all animations of a certain priority or lower
  cancelLowerPriorityAnimations(minPriority = 'normal') {
    const priorityLevels = { low: 0, normal: 1, high: 2 };
    const minLevel = priorityLevels[minPriority];
    
    let cancelledCount = 0;
    for (const [id, animation] of this.activeAnimations) {
      if (priorityLevels[animation.priority] < minLevel) {
        this.cancelAnimation(id);
        cancelledCount++;
      }
    }
    
    if (cancelledCount > 0) {
      console.log(`🧹 Cancelled ${cancelledCount} lower priority animations`);
    }
    
    return cancelledCount;
  }
  
  // Queue animations for sequential execution
  queueAnimation(animation, options = {}) {
    return new Promise((resolve, reject) => {
      const queueItem = {
        animation,
        options,
        resolve,
        reject,
        id: `queued_${Date.now()}_${Math.random()}`
      };
      
      this.animationQueue.push(queueItem);
      this.processQueue();
    });
  }
  
  // Process animation queue
  async processQueue() {
    if (this.isProcessingQueue || this.animationQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.animationQueue.length > 0) {
      const item = this.animationQueue.shift();
      
      try {
        await this.registerAnimation(item.id, item.animation, item.options);
        item.resolve();
      } catch (error) {
        item.reject(error);
      }
    }
    
    this.isProcessingQueue = false;
  }
  
  // Get animation statistics
  getStats() {
    return {
      active: this.activeAnimations.size,
      queued: this.animationQueue.length,
      isProcessingQueue: this.isProcessingQueue
    };
  }
  
  // Emergency cleanup - cancel all animations
  emergencyCleanup() {
    console.warn('🚨 Emergency animation cleanup initiated');
    
    for (const [id, animation] of this.activeAnimations) {
      clearTimeout(animation.timeoutId);
    }
    
    this.activeAnimations.clear();
    this.animationQueue.length = 0;
    this.isProcessingQueue = false;
    
    if (this.globalTimeout) {
      clearTimeout(this.globalTimeout);
      this.globalTimeout = null;
    }
  }
}

// Global animation manager instance
const globalAnimationManager = new AnimationManager();

// Timeout-resilient card animation
export const animateCard = (element, animationType, options = {}) => {
  if (!element) {
    console.warn('⚠️ Card animation called with null element');
    return Promise.resolve();
  }
  
  const {
    duration = GAME_TIMEOUTS.CARD_ANIMATION_DURATION,
    target = null,
    onComplete = null,
    priority = 'normal'
  } = options;
  
  const animationId = `card_${element.id || 'unknown'}_${animationType}_${Date.now()}`;
  
  const animation = () => {
    return new Promise((resolve) => {
      const startStyles = window.getComputedStyle(element);
      
      switch (animationType) {
        case 'play':
          element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
          element.style.transform = 'translateY(-100px) scale(0.8)';
          element.style.opacity = '0';
          
          // Trigger animation
          requestAnimationFrame(() => {
            element.style.transform = 'translateY(0) scale(1)';
            element.style.opacity = '1';
          });
          break;
          
        case 'draw':
          element.style.transition = `transform ${duration}ms ease-in-out`;
          element.style.transform = 'translateX(-200px) rotate(-10deg)';
          
          requestAnimationFrame(() => {
            element.style.transform = 'translateX(0) rotate(0deg)';
          });
          break;
          
        case 'stack':
          element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
          element.style.transform = 'scale(1.1) rotate(5deg)';
          element.style.zIndex = '1000';
          
          setTimeout(() => {
            element.style.transform = 'scale(1) rotate(0deg)';
            element.style.zIndex = '';
          }, duration / 2);
          break;
          
        case 'bounce':
          element.style.transition = `transform ${duration}ms ease-in-out`;
          element.style.transform = 'translateY(-20px)';
          
          setTimeout(() => {
            element.style.transform = 'translateY(0)';
          }, duration / 2);
          break;
          
        default:
          console.warn(`Unknown card animation type: ${animationType}`);
          resolve();
          return;
      }
      
      // Wait for animation to complete
      const cleanup = () => {
        element.style.transition = '';
        element.style.transform = '';
        element.style.opacity = '';
        element.style.zIndex = '';
        
        if (onComplete) onComplete();
        resolve();
      };
      
      setTimeout(cleanup, duration);
    });
  };
  
  return globalAnimationManager.registerAnimation(animationId, animation, {
    timeout: duration * 2,
    priority,
    onTimeout: () => {
      // Immediate cleanup on timeout
      element.style.transition = '';
      element.style.transform = '';
      element.style.opacity = '';
      element.style.zIndex = '';
      
      if (onComplete) onComplete();
    }
  });
};

// Timeout-resilient stacking sequence
export const animateCardStack = (cards, options = {}) => {
  const {
    staggerDelay = 100,
    maxConcurrent = 5,
    onProgress = null,
    onComplete = null
  } = options;
  
  if (!cards || cards.length === 0) {
    if (onComplete) onComplete();
    return Promise.resolve();
  }
  
  const animationId = `stack_sequence_${Date.now()}`;
  
  const animation = async () => {
    const chunks = [];
    for (let i = 0; i < cards.length; i += maxConcurrent) {
      chunks.push(cards.slice(i, i + maxConcurrent));
    }
    
    let completed = 0;
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map((card, index) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            animateCard(card, 'stack', {
              onComplete: () => {
                completed++;
                if (onProgress) {
                  onProgress(completed, cards.length);
                }
                resolve();
              }
            });
          }, index * staggerDelay);
        });
      });
      
      await Promise.all(chunkPromises);
    }
    
    if (onComplete) onComplete();
  };
  
  return globalAnimationManager.registerAnimation(animationId, animation, {
    timeout: (cards.length * staggerDelay + GAME_TIMEOUTS.STACK_ANIMATION_DURATION) * 2,
    priority: 'high',
    onTimeout: () => {
      console.warn('⏰ Card stack animation timed out, completing immediately');
      if (onComplete) onComplete();
    }
  });
};

// Timeout-resilient turn transition
export const animateTurnTransition = (currentPlayerElement, nextPlayerElement, options = {}) => {
  const {
    duration = GAME_TIMEOUTS.TRANSITION_ANIMATION_DURATION,
    onComplete = null
  } = options;
  
  const animationId = `turn_transition_${Date.now()}`;
  
  const animation = () => {
    return new Promise((resolve) => {
      // Animate current player out
      if (currentPlayerElement) {
        currentPlayerElement.style.transition = `all ${duration}ms ease-out`;
        currentPlayerElement.style.transform = 'scale(1)';
        currentPlayerElement.style.opacity = '0.6';
      }
      
      // Animate next player in
      if (nextPlayerElement) {
        nextPlayerElement.style.transition = `all ${duration}ms ease-in`;
        nextPlayerElement.style.transform = 'scale(1.05)';
        nextPlayerElement.style.opacity = '1';
      }
      
      // Cleanup after animation
      setTimeout(() => {
        if (currentPlayerElement) {
          currentPlayerElement.style.transition = '';
          currentPlayerElement.style.transform = '';
          currentPlayerElement.style.opacity = '';
        }
        
        if (nextPlayerElement) {
          nextPlayerElement.style.transition = '';
          nextPlayerElement.style.transform = '';
          nextPlayerElement.style.opacity = '';
        }
        
        if (onComplete) onComplete();
        resolve();
      }, duration);
    });
  };
  
  return globalAnimationManager.registerAnimation(animationId, animation, {
    timeout: duration * 3,
    priority: 'high',
    onTimeout: () => {
      // Immediate cleanup on timeout
      [currentPlayerElement, nextPlayerElement].forEach((element) => {
        if (element) {
          element.style.transition = '';
          element.style.transform = '';
          element.style.opacity = '';
        }
      });
      
      if (onComplete) onComplete();
    }
  });
};

// Timeout-resilient confetti animation
export const animateConfetti = (container, options = {}) => {
  const {
    duration = GAME_TIMEOUTS.CONFETTI_ANIMATION_DURATION,
    particleCount = 100,
    onComplete = null
  } = options;
  
  const animationId = `confetti_${Date.now()}`;
  
  const animation = () => {
    return new Promise((resolve) => {
      const particles = [];
      
      // Create confetti particles
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
          position: absolute;
          width: 8px;
          height: 8px;
          background: hsl(${Math.random() * 360}, 70%, 60%);
          pointer-events: none;
          left: ${Math.random() * 100}%;
          top: -10px;
          transform: rotate(${Math.random() * 360}deg);
          animation: confettiFall ${duration}ms ease-out forwards;
        `;
        
        container.appendChild(particle);
        particles.push(particle);
      }
      
      // Cleanup particles after animation
      setTimeout(() => {
        particles.forEach(particle => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        });
        
        if (onComplete) onComplete();
        resolve();
      }, duration);
    });
  };
  
  return globalAnimationManager.registerAnimation(animationId, animation, {
    timeout: duration * 2,
    priority: 'low',
    skipOnOverload: true, // Skip confetti if we're overloaded
    onTimeout: () => {
      // Emergency cleanup - remove all confetti particles
      const particles = container.querySelectorAll('[style*="confettiFall"]');
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
      
      if (onComplete) onComplete();
    }
  });
};

// Utility function to batch animations with timeout protection
export const batchAnimations = (animations, options = {}) => {
  const {
    parallel = true,
    timeout = 10000, // 10s total timeout
    onProgress = null,
    onComplete = null,
    stopOnError = false
  } = options;
  
  const batchId = `batch_${Date.now()}`;
  
  const batchAnimation = async () => {
    let completed = 0;
    const total = animations.length;
    
    const updateProgress = () => {
      completed++;
      if (onProgress) {
        onProgress(completed, total);
      }
    };
    
    if (parallel) {
      // Run animations in parallel
      const promises = animations.map(async (animationFn) => {
        try {
          await animationFn();
          updateProgress();
        } catch (error) {
          updateProgress();
          if (stopOnError) throw error;
          console.warn('Animation in batch failed:', error);
        }
      });
      
      await Promise.all(promises);
    } else {
      // Run animations sequentially
      for (const animationFn of animations) {
        try {
          await animationFn();
          updateProgress();
        } catch (error) {
          updateProgress();
          if (stopOnError) throw error;
          console.warn('Animation in batch failed:', error);
        }
      }
    }
    
    if (onComplete) onComplete();
  };
  
  return globalAnimationManager.registerAnimation(batchId, batchAnimation, {
    timeout,
    priority: 'high',
    onTimeout: () => {
      console.warn('⏰ Animation batch timed out');
      if (onComplete) onComplete();
    }
  });
};

// Emergency animation cleanup (for critical timeouts)
export const emergencyAnimationCleanup = () => {
  globalAnimationManager.emergencyCleanup();
};

// Get animation system statistics
export const getAnimationStats = () => {
  return globalAnimationManager.getStats();
};

// Cancel animations by priority
export const cancelLowerPriorityAnimations = (priority = 'normal') => {
  return globalAnimationManager.cancelLowerPriorityAnimations(priority);
};

// Add CSS keyframes for animations
const addAnimationStyles = () => {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes confettiFall {
      0% {
        transform: translateY(-10px) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
    
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
        transform: translate3d(0, 0, 0);
      }
      40%, 43% {
        animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
        transform: translate3d(0, -8px, 0);
      }
      70% {
        animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
        transform: translate3d(0, -4px, 0);
      }
      90% {
        transform: translate3d(0, -2px, 0);
      }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  
  document.head.appendChild(styleSheet);
};

// Initialize animation styles on module load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAnimationStyles);
  } else {
    addAnimationStyles();
  }
}

console.log('🎬 Timeout-resilient animation system initialized');