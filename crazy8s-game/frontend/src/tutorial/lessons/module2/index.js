/**
 * Module 2: Special Cards Introduction
 * 
 * Interactive lessons for teaching all 5 special cards in Crazy 8's
 * This module builds on basic rules from Module 1
 */

import SpecialCardIntro from './SpecialCardIntro';
import JackLesson from './JackLesson';
import QueenLesson from './QueenLesson';
import AceLesson from './AceLesson';
import TwoLesson from './TwoLesson';
import EightLesson from './EightLesson';

// Module 2 lesson sequence
export const module2Lessons = [
    {
        id: 'special-card-intro',
        component: SpecialCardIntro,
        title: 'Special Cards Overview',
        description: 'Introduction to all 5 special cards',
        estimatedTime: '2 minutes',
        difficulty: 'beginner',
        prerequisites: ['basic-rules-complete'],
        order: 1
    },
    {
        id: 'jack-lesson',
        component: JackLesson,
        title: 'Jack: Skip Power',
        description: 'Master the Jack card and its skip mechanics',
        estimatedTime: '3 minutes',
        difficulty: 'beginner',
        prerequisites: ['special-card-intro'],
        order: 2
    },
    {
        id: 'queen-lesson',
        component: QueenLesson,
        title: 'Queen: Reverse Power',
        description: 'Learn direction reversal and 2-player behavior',
        estimatedTime: '3 minutes',
        difficulty: 'beginner',
        prerequisites: ['jack-lesson'],
        order: 3
    },
    {
        id: 'ace-lesson',
        component: AceLesson,
        title: 'Ace: Draw 4 Power',
        description: 'Master draw 4 mechanics and counter introduction',
        estimatedTime: '4 minutes',
        difficulty: 'beginner',
        prerequisites: ['queen-lesson'],
        order: 4
    },
    {
        id: 'two-lesson',
        component: TwoLesson,
        title: 'Two: Draw 2 Power',
        description: 'Learn draw 2 mechanics and stacking preview',
        estimatedTime: '4 minutes',
        difficulty: 'intermediate',
        prerequisites: ['ace-lesson'],
        order: 5
    },
    {
        id: 'eight-lesson',
        component: EightLesson,
        title: 'Eight: Wild Card Power',
        description: 'Master wild card mechanics and suit selection',
        estimatedTime: '5 minutes',
        difficulty: 'intermediate',
        prerequisites: ['two-lesson'],
        order: 6
    }
];

// Module 2 configuration
export const module2Config = {
    id: 'module-2',
    title: 'Special Cards Introduction',
    description: 'Master all 5 special cards and their unique powers',
    estimatedTime: '21 minutes',
    difficulty: 'beginner-to-intermediate',
    lessons: module2Lessons,
    completionRequirements: {
        minimumScore: 80,
        requiredObjectives: [
            'understand-special-cards',
            'learn-skip-mechanics',
            'learn-reverse-mechanics',
            'understand-draw-effects',
            'learn-stacking-basics',
            'understand-wild-power'
        ]
    }
};

// Individual lesson exports
export {
    SpecialCardIntro,
    JackLesson,
    QueenLesson,
    AceLesson,
    TwoLesson,
    EightLesson
};

// Default export
export default module2Config;