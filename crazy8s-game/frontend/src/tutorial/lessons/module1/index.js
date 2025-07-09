/**
 * Module 1: Basic Game Rules - Index
 * Exports all lessons from the basic rules module
 */

import WelcomeLesson from './WelcomeLesson';
import CardMatchingLesson from './CardMatchingLesson';
import DrawingCardsLesson from './DrawingCardsLesson';
import TurnOrderLesson from './TurnOrderLesson';

/**
 * Module 1 configuration - Basic Game Rules
 * Complete learning path for Crazy 8's fundamentals
 */
export const Module1Config = {
    id: 'basic-rules',
    title: 'Basic Game Rules',
    description: 'Learn the fundamental rules and mechanics of Crazy 8\'s',
    estimatedTime: '5 minutes',
    difficulty: 'beginner',
    prerequisites: [],
    objectives: [
        'Understand the goal of Crazy 8\'s',
        'Master card matching by suit and rank',
        'Learn when and how to draw cards',
        'Understand turn progression and game flow'
    ],
    lessons: [
        {
            id: 'welcome-crazy8s',
            component: WelcomeLesson,
            title: 'Welcome to Crazy 8\'s!',
            description: 'Animated introduction to the game',
            estimatedTime: '2 minutes',
            difficulty: 'beginner',
            order: 1,
            required: true
        },
        {
            id: 'card-matching',
            component: CardMatchingLesson,
            title: 'Card Matching Practice',
            description: 'Interactive practice with card matching rules',
            estimatedTime: '3 minutes',
            difficulty: 'beginner',
            order: 2,
            required: true,
            prerequisites: ['welcome-crazy8s']
        },
        {
            id: 'drawing-cards',
            component: DrawingCardsLesson,
            title: 'Drawing Cards',
            description: 'Learn when and how to draw from the deck',
            estimatedTime: '3 minutes',
            difficulty: 'beginner',
            order: 3,
            required: true,
            prerequisites: ['card-matching']
        },
        {
            id: 'turn-order',
            component: TurnOrderLesson,
            title: 'Turn Order & Game Flow',
            description: 'Understand how turns progress in the game',
            estimatedTime: '3 minutes',
            difficulty: 'beginner',
            order: 4,
            required: true,
            prerequisites: ['drawing-cards']
        }
    ],
    completionCriteria: {
        minimumScore: 70,
        requiredLessons: ['welcome-crazy8s', 'card-matching', 'drawing-cards', 'turn-order'],
        allowRetries: true,
        maxRetries: 3
    },
    rewards: {
        points: 100,
        badges: ['first-steps', 'rule-master'],
        unlocksModules: ['advanced-strategies']
    }
};

/**
 * Get lesson component by ID
 * @param {string} lessonId - The lesson identifier
 * @returns {React.Component|null} The lesson component or null if not found
 */
export const getLessonComponent = (lessonId) => {
    const lesson = Module1Config.lessons.find(l => l.id === lessonId);
    return lesson ? lesson.component : null;
};

/**
 * Get lesson configuration by ID
 * @param {string} lessonId - The lesson identifier
 * @returns {Object|null} The lesson configuration or null if not found
 */
export const getLessonConfig = (lessonId) => {
    return Module1Config.lessons.find(l => l.id === lessonId) || null;
};

/**
 * Check if a lesson is unlocked based on prerequisites
 * @param {string} lessonId - The lesson identifier
 * @param {Array} completedLessons - Array of completed lesson IDs
 * @returns {boolean} Whether the lesson is unlocked
 */
export const isLessonUnlocked = (lessonId, completedLessons = []) => {
    const lesson = getLessonConfig(lessonId);
    if (!lesson) return false;
    
    // First lesson is always unlocked
    if (lesson.order === 1) return true;
    
    // Check if all prerequisites are completed
    const prerequisites = lesson.prerequisites || [];
    return prerequisites.every(prereq => completedLessons.includes(prereq));
};

/**
 * Get the next lesson in the sequence
 * @param {string} currentLessonId - Current lesson identifier
 * @param {Array} completedLessons - Array of completed lesson IDs
 * @returns {Object|null} Next lesson configuration or null if none
 */
export const getNextLesson = (currentLessonId, completedLessons = []) => {
    const currentLesson = getLessonConfig(currentLessonId);
    if (!currentLesson) return null;
    
    const nextOrder = currentLesson.order + 1;
    const nextLesson = Module1Config.lessons.find(l => l.order === nextOrder);
    
    if (nextLesson && isLessonUnlocked(nextLesson.id, completedLessons)) {
        return nextLesson;
    }
    
    return null;
};

/**
 * Get the previous lesson in the sequence
 * @param {string} currentLessonId - Current lesson identifier
 * @returns {Object|null} Previous lesson configuration or null if none
 */
export const getPreviousLesson = (currentLessonId) => {
    const currentLesson = getLessonConfig(currentLessonId);
    if (!currentLesson) return null;
    
    const prevOrder = currentLesson.order - 1;
    return Module1Config.lessons.find(l => l.order === prevOrder) || null;
};

/**
 * Calculate module progress
 * @param {Array} completedLessons - Array of completed lesson IDs
 * @returns {Object} Progress information
 */
export const calculateModuleProgress = (completedLessons = []) => {
    const totalLessons = Module1Config.lessons.length;
    const requiredLessons = Module1Config.lessons.filter(l => l.required);
    const completedRequiredCount = requiredLessons.filter(l => 
        completedLessons.includes(l.id)
    ).length;
    const completedTotalCount = Module1Config.lessons.filter(l => 
        completedLessons.includes(l.id)
    ).length;
    
    return {
        totalLessons,
        requiredLessons: requiredLessons.length,
        completedTotal: completedTotalCount,
        completedRequired: completedRequiredCount,
        percentageTotal: Math.round((completedTotalCount / totalLessons) * 100),
        percentageRequired: Math.round((completedRequiredCount / requiredLessons.length) * 100),
        isComplete: completedRequiredCount === requiredLessons.length,
        nextLesson: getNextAvailableLesson(completedLessons)
    };
};

/**
 * Get the next available lesson that can be started
 * @param {Array} completedLessons - Array of completed lesson IDs
 * @returns {Object|null} Next available lesson or null if module complete
 */
export const getNextAvailableLesson = (completedLessons = []) => {
    // Find first incomplete lesson that has prerequisites met
    for (const lesson of Module1Config.lessons) {
        if (!completedLessons.includes(lesson.id) && 
            isLessonUnlocked(lesson.id, completedLessons)) {
            return lesson;
        }
    }
    return null;
};

/**
 * Validate module completion
 * @param {Array} completedLessons - Array of completed lesson IDs
 * @param {Object} lessonScores - Map of lesson IDs to scores
 * @returns {Object} Validation result
 */
export const validateModuleCompletion = (completedLessons = [], lessonScores = {}) => {
    const progress = calculateModuleProgress(completedLessons);
    const criteria = Module1Config.completionCriteria;
    
    // Check required lessons
    const requiredComplete = criteria.requiredLessons.every(lessonId => 
        completedLessons.includes(lessonId)
    );
    
    // Check minimum scores
    const scoresValid = criteria.requiredLessons.every(lessonId => {
        const score = lessonScores[lessonId] || 0;
        return score >= criteria.minimumScore;
    });
    
    return {
        isComplete: requiredComplete && scoresValid,
        requiredLessonsComplete: requiredComplete,
        scoresValid,
        missingRequiredLessons: criteria.requiredLessons.filter(lessonId => 
            !completedLessons.includes(lessonId)
        ),
        lowScoreLessons: criteria.requiredLessons.filter(lessonId => {
            const score = lessonScores[lessonId] || 0;
            return score < criteria.minimumScore;
        }),
        progress
    };
};

// Export individual lesson components
export {
    WelcomeLesson,
    CardMatchingLesson,
    DrawingCardsLesson,
    TurnOrderLesson
};

// Export default module configuration
export default Module1Config;