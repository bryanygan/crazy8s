/**
 * lessons/index.js - Tutorial lesson definitions
 * Contains all tutorial modules and their lessons
 */

/**
 * Tutorial lesson structure and content
 * This is where all tutorial lessons are defined and organized
 */
export const tutorialLessons = {
    // Module 1: Basic Gameplay
    basics: {
        meta: {
            title: 'Basic Gameplay',
            description: 'Learn the fundamental rules of Crazy 8\'s',
            difficulty: 'beginner',
            estimatedTime: '10-15 minutes'
        },
        lessons: {
            basic_play: {
                title: 'Playing Your First Card',
                description: 'Learn how to play cards that match suit or rank',
                difficulty: 'beginner',
                estimatedTime: '3 minutes',
                objectives: [
                    {
                        id: 'play_matching_suit',
                        type: 'playCard',
                        description: 'Play a card that matches the suit of the top card',
                        requiredCard: { suit: 'Hearts', rank: '7' }
                    }
                ],
                requirements: [
                    {
                        type: 'mustPlayCard',
                        card: { suit: 'Hearts', rank: '7' },
                        severity: 'error'
                    }
                ],
                hints: [
                    {
                        context: 'card_playing',
                        title: 'Matching Cards',
                        content: 'Look for the 7 of Hearts in your hand. It matches the suit of the top card.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Hearts', rank: '7', id: 'tutorial_card_1' },
                    { suit: 'Diamonds', rank: 'Jack', id: 'tutorial_card_2' },
                    { suit: 'Clubs', rank: '9', id: 'tutorial_card_3' },
                    { suit: 'Spades', rank: 'Queen', id: 'tutorial_card_4' },
                    { suit: 'Hearts', rank: 'Ace', id: 'tutorial_card_5' },
                    { suit: 'Diamonds', rank: '3', id: 'tutorial_card_6' },
                    { suit: 'Clubs', rank: '8', id: 'tutorial_card_7' },
                    { suit: 'Spades', rank: '5', id: 'tutorial_card_8' }
                ],
                initialDiscardPile: [
                    { suit: 'Hearts', rank: '10', id: 'tutorial_discard_1' }
                ]
            },
            
            rank_matching: {
                title: 'Matching by Rank',
                description: 'Learn to play cards that match the rank instead of suit',
                difficulty: 'beginner',
                estimatedTime: '3 minutes',
                objectives: [
                    {
                        id: 'play_matching_rank',
                        type: 'playCard',
                        description: 'Play a card that matches the rank of the top card',
                        requiredCard: { suit: 'Clubs', rank: 'King' }
                    }
                ],
                requirements: [
                    {
                        type: 'mustPlayRank',
                        rank: 'King',
                        severity: 'error'
                    }
                ],
                hints: [
                    {
                        context: 'card_playing',
                        title: 'Rank Matching',
                        content: 'You can play any King on top of another King, regardless of suit.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Clubs', rank: 'King', id: 'tutorial_card_9' },
                    { suit: 'Hearts', rank: '4', id: 'tutorial_card_10' },
                    { suit: 'Diamonds', rank: '6', id: 'tutorial_card_11' },
                    { suit: 'Spades', rank: '9', id: 'tutorial_card_12' },
                    { suit: 'Hearts', rank: 'Jack', id: 'tutorial_card_13' },
                    { suit: 'Clubs', rank: '2', id: 'tutorial_card_14' },
                    { suit: 'Diamonds', rank: '8', id: 'tutorial_card_15' },
                    { suit: 'Spades', rank: '7', id: 'tutorial_card_16' }
                ],
                initialDiscardPile: [
                    { suit: 'Diamonds', rank: 'King', id: 'tutorial_discard_2' }
                ]
            }
        }
    },
    
    // Module 2: Special Cards
    special_cards: {
        meta: {
            title: 'Special Cards',
            description: 'Master the special effects of action cards',
            difficulty: 'intermediate',
            estimatedTime: '15-20 minutes'
        },
        lessons: {
            wild_cards: {
                title: 'Wild Cards (8s)',
                description: 'Learn how to use 8s to change the suit',
                difficulty: 'intermediate',
                estimatedTime: '5 minutes',
                objectives: [
                    {
                        id: 'play_wild_card',
                        type: 'playCard',
                        description: 'Play an 8 and declare a new suit',
                        requiredCard: { suit: 'Clubs', rank: '8' }
                    },
                    {
                        id: 'declare_suit',
                        type: 'declareSuit',
                        description: 'Declare Hearts as the new suit',
                        requiredSuit: 'Hearts'
                    }
                ],
                requirements: [
                    {
                        type: 'mustPlayRank',
                        rank: '8',
                        severity: 'error'
                    }
                ],
                hints: [
                    {
                        context: 'special_cards',
                        title: 'Wild Cards',
                        content: 'The 8 is a wild card. You can play it on any card and choose the new suit.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Declaring Suit',
                        content: 'After playing an 8, you must declare which suit the next player must follow.',
                        trigger: 'objective',
                        objectiveIndex: 1
                    }
                ],
                initialHand: [
                    { suit: 'Clubs', rank: '8', id: 'tutorial_card_17' },
                    { suit: 'Hearts', rank: '5', id: 'tutorial_card_18' },
                    { suit: 'Diamonds', rank: 'Queen', id: 'tutorial_card_19' },
                    { suit: 'Spades', rank: '3', id: 'tutorial_card_20' },
                    { suit: 'Hearts', rank: '9', id: 'tutorial_card_21' },
                    { suit: 'Clubs', rank: 'Jack', id: 'tutorial_card_22' },
                    { suit: 'Diamonds', rank: '4', id: 'tutorial_card_23' },
                    { suit: 'Spades', rank: '10', id: 'tutorial_card_24' }
                ],
                initialDiscardPile: [
                    { suit: 'Spades', rank: 'Ace', id: 'tutorial_discard_3' }
                ]
            },
            
            action_cards: {
                title: 'Action Cards',
                description: 'Learn about Jacks, Queens, Aces, and 2s',
                difficulty: 'intermediate',
                estimatedTime: '7 minutes',
                objectives: [
                    {
                        id: 'play_jack',
                        type: 'playCard',
                        description: 'Play a Jack to skip the opponent',
                        requiredCard: { suit: 'Hearts', rank: 'Jack' }
                    },
                    {
                        id: 'understand_skip',
                        type: 'gameState',
                        description: 'Understand that you keep your turn after playing a Jack',
                        property: 'currentPlayer',
                        value: 'You',
                        operator: 'equals'
                    }
                ],
                requirements: [
                    {
                        type: 'mustPlayRank',
                        rank: 'Jack',
                        severity: 'error'
                    }
                ],
                hints: [
                    {
                        context: 'special_cards',
                        title: 'Action Cards',
                        content: 'Jacks skip the next player, so you get to play again immediately.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Hearts', rank: 'Jack', id: 'tutorial_card_25' },
                    { suit: 'Diamonds', rank: '7', id: 'tutorial_card_26' },
                    { suit: 'Clubs', rank: 'Queen', id: 'tutorial_card_27' },
                    { suit: 'Spades', rank: '6', id: 'tutorial_card_28' },
                    { suit: 'Hearts', rank: '2', id: 'tutorial_card_29' },
                    { suit: 'Diamonds', rank: 'Ace', id: 'tutorial_card_30' },
                    { suit: 'Clubs', rank: '5', id: 'tutorial_card_31' },
                    { suit: 'Spades', rank: '8', id: 'tutorial_card_32' }
                ],
                initialDiscardPile: [
                    { suit: 'Hearts', rank: '9', id: 'tutorial_discard_4' }
                ]
            }
        }
    },
    
    // Module 3: Card Stacking
    stacking: {
        meta: {
            title: 'Card Stacking',
            description: 'Master the advanced card stacking mechanics',
            difficulty: 'advanced',
            estimatedTime: '20-25 minutes'
        },
        lessons: {
            basic_stacking: {
                title: 'Basic Stacking Rules',
                description: 'Learn to stack cards of the same rank',
                difficulty: 'advanced',
                estimatedTime: '8 minutes',
                objectives: [
                    {
                        id: 'select_multiple_cards',
                        type: 'selectCards',
                        description: 'Select two cards of the same rank',
                        count: 2,
                        specificCards: [
                            { suit: 'Hearts', rank: '7' },
                            { suit: 'Diamonds', rank: '7' }
                        ]
                    },
                    {
                        id: 'play_stacked_cards',
                        type: 'playCard',
                        description: 'Play the stacked cards together',
                        cardCount: 2
                    }
                ],
                requirements: [
                    {
                        type: 'mustSelectCount',
                        count: 2,
                        severity: 'warning'
                    }
                ],
                hints: [
                    {
                        context: 'stacking',
                        title: 'Same Rank Stacking',
                        content: 'You can stack multiple cards of the same rank together. Click to select each card.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Playing Stacks',
                        content: 'Once you have selected multiple cards, click "Play Cards" to play them all at once.',
                        trigger: 'objective',
                        objectiveIndex: 1
                    }
                ],
                initialHand: [
                    { suit: 'Hearts', rank: '7', id: 'tutorial_card_33' },
                    { suit: 'Diamonds', rank: '7', id: 'tutorial_card_34' },
                    { suit: 'Clubs', rank: 'King', id: 'tutorial_card_35' },
                    { suit: 'Spades', rank: '4', id: 'tutorial_card_36' },
                    { suit: 'Hearts', rank: 'Queen', id: 'tutorial_card_37' },
                    { suit: 'Diamonds', rank: '3', id: 'tutorial_card_38' },
                    { suit: 'Clubs', rank: '8', id: 'tutorial_card_39' },
                    { suit: 'Spades', rank: 'Ace', id: 'tutorial_card_40' }
                ],
                initialDiscardPile: [
                    { suit: 'Clubs', rank: '7', id: 'tutorial_discard_5' }
                ]
            }
        }
    }
};

/**
 * Get all available modules
 * @returns {Array<string>} Array of module IDs
 */
export const getAvailableModules = () => {
    return Object.keys(tutorialLessons);
};

/**
 * Get lessons for a specific module
 * @param {string} moduleId - Module identifier
 * @returns {Object|null} Module lessons or null if not found
 */
export const getModuleLessons = (moduleId) => {
    return tutorialLessons[moduleId] || null;
};

/**
 * Get a specific lesson
 * @param {string} moduleId - Module identifier
 * @param {string} lessonId - Lesson identifier
 * @returns {Object|null} Lesson data or null if not found
 */
export const getLesson = (moduleId, lessonId) => {
    const module = tutorialLessons[moduleId];
    if (!module) return null;
    
    return module.lessons[lessonId] || null;
};

/**
 * Validate lesson structure
 * @param {Object} lesson - Lesson to validate
 * @returns {Object} Validation result
 */
export const validateLessonStructure = (lesson) => {
    const errors = [];
    
    if (!lesson.title) errors.push('Missing lesson title');
    if (!lesson.description) errors.push('Missing lesson description');
    if (!lesson.objectives || !Array.isArray(lesson.objectives)) {
        errors.push('Missing or invalid objectives');
    } else {
        lesson.objectives.forEach((obj, index) => {
            if (!obj.id) errors.push(`Objective ${index} missing id`);
            if (!obj.type) errors.push(`Objective ${index} missing type`);
            if (!obj.description) errors.push(`Objective ${index} missing description`);
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

export default tutorialLessons;