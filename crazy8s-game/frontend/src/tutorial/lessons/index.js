/**
 * lessons/index.js - Tutorial lesson definitions
 * Contains all tutorial modules and their lessons
 * Complete coverage of Crazy 8's rules and strategies
 */

/**
 * Tutorial lesson structure and content
 * This is where all tutorial lessons are defined and organized
 */
export const tutorialLessons = {
    // =========================================================================
    // Module 1: Basic Gameplay
    // =========================================================================
    basics: {
        meta: {
            title: 'Basic Gameplay',
            description: 'Learn the fundamental rules of Crazy 8\'s',
            difficulty: 'beginner',
            estimatedTime: '10-15 minutes',
            order: 1
        },
        lessons: {
            welcome: {
                title: 'Welcome to Crazy 8\'s',
                description: 'Welcome! The goal of Crazy 8\'s is to be the first player to get rid of all your cards. You play cards that match either the SUIT (♥♦♣♠) or RANK (2-10, J, Q, K, A) of the top card on the discard pile. 8s are wild and can be played on anything!',
                difficulty: 'beginner',
                estimatedTime: '2 minutes',
                isIntroLesson: true,
                objectives: [
                    {
                        id: 'read_intro',
                        type: 'acknowledgement',
                        description: 'Click "Continue" when you\'re ready to start learning',
                        requiresAcknowledgement: true
                    }
                ],
                requirements: [],
                hints: [
                    {
                        context: 'lesson_objectives',
                        title: 'How to Play',
                        content: 'On your turn, play a card that matches the top card\'s suit OR rank. If you can\'t play, draw from the deck.',
                        trigger: 'start'
                    },
                    {
                        context: 'lesson_objectives',
                        title: 'Special Cards',
                        content: '8s are wild (play anytime). Other special cards: Jacks skip, Queens reverse, Aces make opponents draw, 2s stack!',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Hearts', rank: '7', id: 'welcome_card_1' },
                    { suit: 'Diamonds', rank: 'Jack', id: 'welcome_card_2' },
                    { suit: 'Clubs', rank: '9', id: 'welcome_card_3' },
                    { suit: 'Spades', rank: 'Queen', id: 'welcome_card_4' },
                    { suit: 'Hearts', rank: '8', id: 'welcome_card_5' }
                ],
                initialDiscardPile: [
                    { suit: 'Hearts', rank: '10', id: 'welcome_discard_1' }
                ],
                gameStateModifiers: {
                    tutorial: { introRead: false }
                }
            },

            rules_overview: {
                title: 'The Rules',
                description: 'Here are the key rules you need to know:\n\n• MATCHING: Play cards that match the top card\'s SUIT (♥♦♣♠) or RANK (7, Jack, Queen, etc.)\n\n• DRAWING: If you can\'t play, draw one card from the deck\n\n• WINNING: First player to empty their hand wins!\n\n• 8s ARE WILD: Play any 8 at any time and choose the next suit',
                difficulty: 'beginner',
                estimatedTime: '1 minute',
                isIntroLesson: true,
                objectives: [
                    {
                        id: 'learn_rules',
                        type: 'acknowledgement',
                        description: 'Click "Continue" to learn about special cards',
                        requiresAcknowledgement: true
                    }
                ],
                requirements: [],
                hints: [
                    {
                        context: 'lesson_objectives',
                        title: 'Pro Tip',
                        content: 'Try to save your 8s for when you really need them - they\'re your most powerful cards!',
                        trigger: 'start'
                    }
                ],
                initialHand: [],
                initialDiscardPile: []
            },

            special_cards_intro: {
                title: 'Special Cards',
                description: 'These cards have special effects when played:\n\n• 8 (Wild): Play anytime, choose the next suit\n\n• 2 (Draw Two): Next player draws 2 cards (can be stacked!)\n\n• Jack (Skip): Skips the next player\'s turn\n\n• Queen (Reverse): Reverses play direction\n\n• Ace (Draw One): Next player draws 1 card',
                difficulty: 'beginner',
                estimatedTime: '1 minute',
                isIntroLesson: true,
                objectives: [
                    {
                        id: 'learn_specials',
                        type: 'acknowledgement',
                        description: 'Click "Continue" to start practicing',
                        requiresAcknowledgement: true
                    }
                ],
                requirements: [],
                hints: [
                    {
                        context: 'lesson_objectives',
                        title: 'Stacking',
                        content: 'When someone plays a 2, you can stack another 2 on top! The next player then has to draw 4 cards (or stack again).',
                        trigger: 'start'
                    }
                ],
                initialHand: [],
                initialDiscardPile: []
            },

            ready_to_play: {
                title: 'Ready to Play!',
                description: 'You now know the basics of Crazy 8\'s!\n\nTo practice with hands-on lessons:\n\n1. Close this tutorial\n2. Click "Create Game" on the main menu\n3. Once in a game, click the "?" Help button to continue learning\n\nOr, just jump into a game and have fun - you\'ll learn as you play!',
                difficulty: 'beginner',
                estimatedTime: '1 minute',
                isIntroLesson: true,
                isFinalIntro: true,
                objectives: [
                    {
                        id: 'ready',
                        type: 'acknowledgement',
                        description: 'Click "Start Playing" to close and create a game',
                        requiresAcknowledgement: true
                    }
                ],
                requirements: [],
                hints: [
                    {
                        context: 'lesson_objectives',
                        title: 'Good Luck!',
                        content: 'Remember: match by suit or rank, 8s are wild, and have fun!',
                        trigger: 'start'
                    }
                ],
                initialHand: [],
                initialDiscardPile: []
            },

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
                        content: 'Look for the 7 of Hearts in your hand. It matches the suit of the top card (Hearts).',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_selection',
                        title: 'How to Play',
                        content: 'Click on a card to select it, then click the "Play" button to play it.',
                        trigger: 'start'
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
                        content: 'You can play any King on top of another King, regardless of suit. Find the King of Clubs in your hand.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Two Ways to Match',
                        content: 'Remember: you can always match by SUIT (same color symbol) or by RANK (same number/letter).',
                        trigger: 'start'
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
            },

            drawing_cards: {
                title: 'Drawing Cards',
                description: 'Learn when and how to draw cards from the deck',
                difficulty: 'beginner',
                estimatedTime: '3 minutes',
                objectives: [
                    {
                        id: 'draw_card',
                        type: 'drawCard',
                        description: 'Draw a card from the deck when you can\'t play',
                        handSize: 9
                    }
                ],
                requirements: [],
                hints: [
                    {
                        context: 'drawing',
                        title: 'When to Draw',
                        content: 'If you don\'t have any cards that match the top card\'s suit or rank, you must draw from the deck.',
                        trigger: 'start'
                    },
                    {
                        context: 'drawing',
                        title: 'How to Draw',
                        content: 'Click on the Draw Pile on the left side of the game board to draw a card.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'drawing',
                        title: 'After Drawing',
                        content: 'After drawing, you can play the drawn card if it\'s valid, or pass your turn if you still can\'t play.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Clubs', rank: '3', id: 'draw_card_1' },
                    { suit: 'Clubs', rank: '5', id: 'draw_card_2' },
                    { suit: 'Clubs', rank: '9', id: 'draw_card_3' },
                    { suit: 'Spades', rank: '4', id: 'draw_card_4' },
                    { suit: 'Spades', rank: '6', id: 'draw_card_5' },
                    { suit: 'Spades', rank: '10', id: 'draw_card_6' },
                    { suit: 'Diamonds', rank: '2', id: 'draw_card_7' },
                    { suit: 'Diamonds', rank: '7', id: 'draw_card_8' }
                ],
                initialDiscardPile: [
                    { suit: 'Hearts', rank: 'King', id: 'draw_discard_1' }
                ],
                drawPileSize: 30
            },

            turn_order: {
                title: 'Understanding Turns',
                description: 'Learn how turns work and when you can play',
                difficulty: 'beginner',
                estimatedTime: '3 minutes',
                objectives: [
                    {
                        id: 'wait_for_turn',
                        type: 'gameState',
                        description: 'Understand that you can only play on your turn',
                        property: 'tutorial.turnUnderstood',
                        value: true,
                        operator: 'equals'
                    },
                    {
                        id: 'play_on_turn',
                        type: 'playCard',
                        description: 'Play a card when it\'s your turn',
                        requiredCard: { suit: 'Hearts', rank: '5' }
                    }
                ],
                requirements: [],
                hints: [
                    {
                        context: 'lesson_objectives',
                        title: 'Turn Order',
                        content: 'Players take turns clockwise. You\'ll see "Your Turn" highlighted when it\'s time to play.',
                        trigger: 'start'
                    },
                    {
                        context: 'lesson_objectives',
                        title: 'Turn Indicator',
                        content: 'Look at the player list - the current player is highlighted. Wait for your turn before playing.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Your Turn',
                        content: 'It\'s your turn now! Play the 5 of Hearts to complete this lesson.',
                        trigger: 'objective',
                        objectiveIndex: 1
                    }
                ],
                initialHand: [
                    { suit: 'Hearts', rank: '5', id: 'turn_card_1' },
                    { suit: 'Diamonds', rank: 'Jack', id: 'turn_card_2' },
                    { suit: 'Clubs', rank: '9', id: 'turn_card_3' },
                    { suit: 'Spades', rank: 'Queen', id: 'turn_card_4' },
                    { suit: 'Hearts', rank: 'Ace', id: 'turn_card_5' }
                ],
                initialDiscardPile: [
                    { suit: 'Hearts', rank: '10', id: 'turn_discard_1' }
                ],
                gameStateModifiers: {
                    tutorial: { turnUnderstood: false }
                }
            }
        }
    },

    // =========================================================================
    // Module 2: Special Cards
    // =========================================================================
    special_cards: {
        meta: {
            title: 'Special Cards',
            description: 'Master the special effects of action cards',
            difficulty: 'intermediate',
            estimatedTime: '20-25 minutes',
            order: 2
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
                        content: 'The 8 is a wild card - the most powerful card in Crazy 8\'s! You can play it on ANY card.',
                        trigger: 'start'
                    },
                    {
                        context: 'special_cards',
                        title: 'Playing 8s',
                        content: 'Find the 8 of Clubs in your hand and play it.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Declaring Suit',
                        content: 'After playing an 8, you choose the suit that the next player must follow. Pick Hearts!',
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

            jack_lesson: {
                title: 'Jacks - Skip Effect',
                description: 'Learn how Jacks skip the next player',
                difficulty: 'intermediate',
                estimatedTime: '4 minutes',
                objectives: [
                    {
                        id: 'play_jack',
                        type: 'playCard',
                        description: 'Play a Jack to skip the next player',
                        requiredCard: { suit: 'Hearts', rank: 'Jack' }
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
                        title: 'Jack Effect',
                        content: 'When you play a Jack, the next player\'s turn is skipped! In a 2-player game, you get to play again.',
                        trigger: 'start'
                    },
                    {
                        context: 'special_cards',
                        title: 'Strategic Use',
                        content: 'Jacks are great when your opponent is about to win - skip their turn to buy yourself time!',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Play Your Jack',
                        content: 'Play the Jack of Hearts now to see the skip effect in action.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Hearts', rank: 'Jack', id: 'jack_card_1' },
                    { suit: 'Diamonds', rank: '7', id: 'jack_card_2' },
                    { suit: 'Clubs', rank: '5', id: 'jack_card_3' },
                    { suit: 'Spades', rank: '9', id: 'jack_card_4' },
                    { suit: 'Hearts', rank: '3', id: 'jack_card_5' }
                ],
                initialDiscardPile: [
                    { suit: 'Hearts', rank: '6', id: 'jack_discard_1' }
                ]
            },

            queen_lesson: {
                title: 'Queens - Reverse Direction',
                description: 'Learn how Queens reverse the play direction',
                difficulty: 'intermediate',
                estimatedTime: '4 minutes',
                objectives: [
                    {
                        id: 'play_queen',
                        type: 'playCard',
                        description: 'Play a Queen to reverse the direction',
                        requiredCard: { suit: 'Diamonds', rank: 'Queen' }
                    }
                ],
                requirements: [
                    {
                        type: 'mustPlayRank',
                        rank: 'Queen',
                        severity: 'error'
                    }
                ],
                hints: [
                    {
                        context: 'special_cards',
                        title: 'Queen Effect',
                        content: 'Queens reverse the direction of play! If play was going clockwise, it now goes counter-clockwise.',
                        trigger: 'start'
                    },
                    {
                        context: 'special_cards',
                        title: 'Direction Indicator',
                        content: 'Watch for the "Reversed" indicator on the game board after you play a Queen.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Play Your Queen',
                        content: 'Play the Queen of Diamonds to reverse the direction.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Diamonds', rank: 'Queen', id: 'queen_card_1' },
                    { suit: 'Hearts', rank: '4', id: 'queen_card_2' },
                    { suit: 'Clubs', rank: '10', id: 'queen_card_3' },
                    { suit: 'Spades', rank: '6', id: 'queen_card_4' },
                    { suit: 'Diamonds', rank: '2', id: 'queen_card_5' }
                ],
                initialDiscardPile: [
                    { suit: 'Diamonds', rank: '9', id: 'queen_discard_1' }
                ]
            },

            two_lesson: {
                title: '2s - Draw Two Penalty',
                description: 'Learn how 2s force the next player to draw',
                difficulty: 'intermediate',
                estimatedTime: '4 minutes',
                objectives: [
                    {
                        id: 'play_two',
                        type: 'playCard',
                        description: 'Play a 2 to make the opponent draw cards',
                        requiredCard: { suit: 'Clubs', rank: '2' }
                    }
                ],
                requirements: [
                    {
                        type: 'mustPlayRank',
                        rank: '2',
                        severity: 'error'
                    }
                ],
                hints: [
                    {
                        context: 'special_cards',
                        title: '2 Effect',
                        content: 'When you play a 2, the next player must draw 2 cards! They can\'t play until they draw.',
                        trigger: 'start'
                    },
                    {
                        context: 'special_cards',
                        title: 'Stacking 2s',
                        content: 'If the next player has a 2, they can play it to pass the penalty along - making it 4 cards!',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Play Your 2',
                        content: 'Play the 2 of Clubs to penalize your opponent.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Clubs', rank: '2', id: 'two_card_1' },
                    { suit: 'Hearts', rank: '7', id: 'two_card_2' },
                    { suit: 'Diamonds', rank: 'Jack', id: 'two_card_3' },
                    { suit: 'Spades', rank: '5', id: 'two_card_4' },
                    { suit: 'Hearts', rank: 'King', id: 'two_card_5' }
                ],
                initialDiscardPile: [
                    { suit: 'Clubs', rank: '8', id: 'two_discard_1' }
                ],
                declaredSuit: 'Clubs'
            },

            ace_lesson: {
                title: 'Aces - Draw Four Penalty',
                description: 'Learn how Aces force a heavy draw penalty',
                difficulty: 'intermediate',
                estimatedTime: '4 minutes',
                objectives: [
                    {
                        id: 'play_ace',
                        type: 'playCard',
                        description: 'Play an Ace for a massive draw penalty',
                        requiredCard: { suit: 'Spades', rank: 'Ace' }
                    }
                ],
                requirements: [
                    {
                        type: 'mustPlayRank',
                        rank: 'Ace',
                        severity: 'error'
                    }
                ],
                hints: [
                    {
                        context: 'special_cards',
                        title: 'Ace Effect',
                        content: 'Aces are powerful! They force the next player to draw FOUR cards!',
                        trigger: 'start'
                    },
                    {
                        context: 'special_cards',
                        title: 'Stacking Aces',
                        content: 'Just like 2s, Aces can be stacked. If they play an Ace back, the penalty becomes 8 cards!',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Play Your Ace',
                        content: 'Play the Ace of Spades to deliver a devastating blow.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Spades', rank: 'Ace', id: 'ace_card_1' },
                    { suit: 'Hearts', rank: '6', id: 'ace_card_2' },
                    { suit: 'Diamonds', rank: '9', id: 'ace_card_3' },
                    { suit: 'Clubs', rank: 'King', id: 'ace_card_4' },
                    { suit: 'Spades', rank: '3', id: 'ace_card_5' }
                ],
                initialDiscardPile: [
                    { suit: 'Spades', rank: '7', id: 'ace_discard_1' }
                ]
            },

            eight_lesson: {
                title: 'Mastering Wild 8s',
                description: 'Advanced strategies for using wild cards effectively',
                difficulty: 'intermediate',
                estimatedTime: '5 minutes',
                objectives: [
                    {
                        id: 'strategic_eight',
                        type: 'playCard',
                        description: 'Use an 8 strategically to change to a suit you have many of',
                        requiredCard: { suit: 'Hearts', rank: '8' }
                    },
                    {
                        id: 'declare_strategic_suit',
                        type: 'declareSuit',
                        description: 'Declare Diamonds (the suit you have most cards in)',
                        requiredSuit: 'Diamonds'
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
                        title: 'Strategic 8s',
                        content: 'Don\'t just play 8s randomly! Declare a suit that you have multiple cards in.',
                        trigger: 'start'
                    },
                    {
                        context: 'special_cards',
                        title: 'Check Your Hand',
                        content: 'Look at your hand - you have 3 Diamonds. Playing an 8 and declaring Diamonds sets you up well!',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Declare Diamonds',
                        content: 'Now declare Diamonds as the suit - you\'ll be able to play your next cards easily!',
                        trigger: 'objective',
                        objectiveIndex: 1
                    }
                ],
                initialHand: [
                    { suit: 'Hearts', rank: '8', id: 'eight_m_card_1' },
                    { suit: 'Diamonds', rank: '3', id: 'eight_m_card_2' },
                    { suit: 'Diamonds', rank: '7', id: 'eight_m_card_3' },
                    { suit: 'Diamonds', rank: 'Queen', id: 'eight_m_card_4' },
                    { suit: 'Clubs', rank: '5', id: 'eight_m_card_5' },
                    { suit: 'Spades', rank: '9', id: 'eight_m_card_6' }
                ],
                initialDiscardPile: [
                    { suit: 'Spades', rank: 'Jack', id: 'eight_m_discard_1' }
                ]
            },

            action_cards: {
                title: 'Action Cards Summary',
                description: 'Review all special card effects',
                difficulty: 'intermediate',
                estimatedTime: '3 minutes',
                objectives: [
                    {
                        id: 'review_complete',
                        type: 'gameState',
                        description: 'Review all the special card effects you\'ve learned',
                        property: 'tutorial.reviewComplete',
                        value: true,
                        operator: 'equals'
                    }
                ],
                requirements: [],
                hints: [
                    {
                        context: 'special_cards',
                        title: 'Card Summary',
                        content: '8: Wild card - play on anything, declare new suit\nJack: Skip next player\nQueen: Reverse direction\n2: Next player draws 2\nAce: Next player draws 4',
                        trigger: 'start'
                    },
                    {
                        context: 'special_cards',
                        title: 'Stacking Penalties',
                        content: '2s and Aces can be stacked! If you\'re hit with a 2, play your own 2 to pass it along (now +4). Same with Aces (+8).',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Hearts', rank: 'Jack', id: 'summary_card_1' },
                    { suit: 'Diamonds', rank: 'Queen', id: 'summary_card_2' },
                    { suit: 'Clubs', rank: '2', id: 'summary_card_3' },
                    { suit: 'Spades', rank: 'Ace', id: 'summary_card_4' },
                    { suit: 'Hearts', rank: '8', id: 'summary_card_5' }
                ],
                initialDiscardPile: [
                    { suit: 'Hearts', rank: '5', id: 'summary_discard_1' }
                ],
                gameStateModifiers: {
                    tutorial: { reviewComplete: false }
                }
            }
        }
    },

    // =========================================================================
    // Module 3: Card Stacking
    // =========================================================================
    stacking: {
        meta: {
            title: 'Card Stacking',
            description: 'Master the advanced card stacking mechanics',
            difficulty: 'advanced',
            estimatedTime: '15-20 minutes',
            order: 3
        },
        lessons: {
            basic_stacking: {
                title: 'Basic Stacking Rules',
                description: 'Learn to stack cards of the same rank',
                difficulty: 'advanced',
                estimatedTime: '5 minutes',
                objectives: [
                    {
                        id: 'select_multiple_cards',
                        type: 'selectCards',
                        description: 'Select two cards of the same rank (both 7s)',
                        count: 2,
                        specificCards: [
                            { suit: 'Hearts', rank: '7' },
                            { suit: 'Diamonds', rank: '7' }
                        ]
                    },
                    {
                        id: 'play_stacked_cards',
                        type: 'playCard',
                        description: 'Play both cards together',
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
                        content: 'You can play multiple cards of the same rank at once! This is called stacking.',
                        trigger: 'start'
                    },
                    {
                        context: 'card_selection',
                        title: 'Selecting Multiple Cards',
                        content: 'Click on the 7 of Hearts, then click on the 7 of Diamonds to select both.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Playing the Stack',
                        content: 'Now click "Play Cards" to play both 7s at the same time!',
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
            },

            advanced_stacking: {
                title: 'Chain Stacking',
                description: 'Learn to create powerful card chains',
                difficulty: 'advanced',
                estimatedTime: '6 minutes',
                objectives: [
                    {
                        id: 'stack_three_cards',
                        type: 'selectCards',
                        description: 'Select three cards of the same rank',
                        count: 3,
                        specificCards: [
                            { suit: 'Hearts', rank: '5' },
                            { suit: 'Diamonds', rank: '5' },
                            { suit: 'Clubs', rank: '5' }
                        ]
                    },
                    {
                        id: 'play_triple_stack',
                        type: 'playCard',
                        description: 'Play all three cards at once',
                        cardCount: 3
                    }
                ],
                requirements: [
                    {
                        type: 'mustSelectCount',
                        count: 3,
                        severity: 'warning'
                    }
                ],
                hints: [
                    {
                        context: 'stacking',
                        title: 'Triple Stack',
                        content: 'You can stack 3 or even 4 cards of the same rank! The more you stack, the faster you empty your hand.',
                        trigger: 'start'
                    },
                    {
                        context: 'stacking',
                        title: 'Why Stack?',
                        content: 'Stacking lets you play multiple cards in one turn, getting you closer to winning!',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_selection',
                        title: 'Select All Three 5s',
                        content: 'Click on the 5 of Hearts, 5 of Diamonds, and 5 of Clubs.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Hearts', rank: '5', id: 'chain_card_1' },
                    { suit: 'Diamonds', rank: '5', id: 'chain_card_2' },
                    { suit: 'Clubs', rank: '5', id: 'chain_card_3' },
                    { suit: 'Spades', rank: 'Jack', id: 'chain_card_4' },
                    { suit: 'Hearts', rank: 'Queen', id: 'chain_card_5' },
                    { suit: 'Diamonds', rank: '9', id: 'chain_card_6' }
                ],
                initialDiscardPile: [
                    { suit: 'Spades', rank: '5', id: 'chain_discard_1' }
                ]
            },

            defensive_stacking: {
                title: 'Defensive Stacking',
                description: 'Use stacking to counter opponent attacks',
                difficulty: 'advanced',
                estimatedTime: '6 minutes',
                objectives: [
                    {
                        id: 'stack_twos',
                        type: 'selectCards',
                        description: 'Stack two 2s to pass the penalty and double it',
                        count: 2,
                        specificCards: [
                            { suit: 'Hearts', rank: '2' },
                            { suit: 'Spades', rank: '2' }
                        ]
                    },
                    {
                        id: 'counter_attack',
                        type: 'playCard',
                        description: 'Play both 2s to make opponent draw 6 cards total',
                        cardCount: 2
                    }
                ],
                requirements: [
                    {
                        type: 'mustPlayRank',
                        rank: '2',
                        severity: 'error'
                    }
                ],
                hints: [
                    {
                        context: 'stacking',
                        title: 'Defensive Play',
                        content: 'When facing a draw penalty, you can stack your own penalty cards to pass it along - and make it worse!',
                        trigger: 'start'
                    },
                    {
                        context: 'stacking',
                        title: 'The Setup',
                        content: 'Your opponent played a 2 - you must draw 2 cards... unless you have 2s of your own!',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'stacking',
                        title: 'Double Counter',
                        content: 'By playing TWO 2s, you pass the penalty AND add to it. The opponent now draws 6 cards (2 + 2 + 2)!',
                        trigger: 'objective',
                        objectiveIndex: 1
                    }
                ],
                initialHand: [
                    { suit: 'Hearts', rank: '2', id: 'def_card_1' },
                    { suit: 'Spades', rank: '2', id: 'def_card_2' },
                    { suit: 'Diamonds', rank: 'King', id: 'def_card_3' },
                    { suit: 'Clubs', rank: '7', id: 'def_card_4' },
                    { suit: 'Hearts', rank: 'Jack', id: 'def_card_5' }
                ],
                initialDiscardPile: [
                    { suit: 'Clubs', rank: '2', id: 'def_discard_1' }
                ],
                drawStack: 2,
                gameStateModifiers: {
                    drawStack: 2
                }
            }
        }
    },

    // =========================================================================
    // Module 4: Strategy
    // =========================================================================
    strategy: {
        meta: {
            title: 'Advanced Strategy',
            description: 'Master winning strategies and tactics',
            difficulty: 'advanced',
            estimatedTime: '15-20 minutes',
            order: 4
        },
        lessons: {
            hand_management: {
                title: 'Hand Management',
                description: 'Learn when to hold and when to play cards',
                difficulty: 'advanced',
                estimatedTime: '5 minutes',
                objectives: [
                    {
                        id: 'save_eight',
                        type: 'playCard',
                        description: 'Play a regular card instead of your 8 - save the wild card!',
                        requiredCard: { suit: 'Hearts', rank: '6' }
                    }
                ],
                requirements: [
                    {
                        type: 'mustPlayCard',
                        card: { suit: 'Hearts', rank: '6' },
                        severity: 'error'
                    }
                ],
                hints: [
                    {
                        context: 'lesson_objectives',
                        title: 'Save Your Power Cards',
                        content: 'Don\'t play your 8s immediately! Save them for when you really need them.',
                        trigger: 'start'
                    },
                    {
                        context: 'lesson_objectives',
                        title: 'When to Save 8s',
                        content: 'Keep 8s for: 1) When you have no other plays, 2) When you need to change suit strategically, 3) Endgame situations.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Play Smart',
                        content: 'You have an 8, but you can also play the 6 of Hearts. Save the 8 for later - play the 6!',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Hearts', rank: '6', id: 'mgmt_card_1' },
                    { suit: 'Hearts', rank: '8', id: 'mgmt_card_2' },
                    { suit: 'Diamonds', rank: 'King', id: 'mgmt_card_3' },
                    { suit: 'Clubs', rank: '4', id: 'mgmt_card_4' },
                    { suit: 'Spades', rank: '10', id: 'mgmt_card_5' }
                ],
                initialDiscardPile: [
                    { suit: 'Hearts', rank: '9', id: 'mgmt_discard_1' }
                ]
            },

            reading_opponents: {
                title: 'Reading Opponents',
                description: 'Learn to track what cards opponents might have',
                difficulty: 'advanced',
                estimatedTime: '5 minutes',
                objectives: [
                    {
                        id: 'avoid_suit',
                        type: 'playCard',
                        description: 'Play a card that changes from Spades (opponent has many Spades)',
                        requiredCard: { suit: 'Diamonds', rank: '7' }
                    }
                ],
                requirements: [
                    {
                        type: 'mustPlayCard',
                        card: { suit: 'Diamonds', rank: '7' },
                        severity: 'error'
                    }
                ],
                hints: [
                    {
                        context: 'lesson_objectives',
                        title: 'Watch Your Opponents',
                        content: 'Pay attention to what suits opponents draw and can\'t play - this tells you what they DON\'T have.',
                        trigger: 'start'
                    },
                    {
                        context: 'lesson_objectives',
                        title: 'Reading the Signs',
                        content: 'If an opponent keeps drawing when Spades is the active suit, they probably don\'t have Spades.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Change the Suit',
                        content: 'Your opponent has been playing lots of Spades. Change to Diamonds by playing the 7 of Diamonds (matches the rank).',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Spades', rank: '3', id: 'read_card_1' },
                    { suit: 'Spades', rank: '9', id: 'read_card_2' },
                    { suit: 'Diamonds', rank: '7', id: 'read_card_3' },
                    { suit: 'Clubs', rank: 'Queen', id: 'read_card_4' },
                    { suit: 'Hearts', rank: '5', id: 'read_card_5' }
                ],
                initialDiscardPile: [
                    { suit: 'Spades', rank: '7', id: 'read_discard_1' }
                ]
            },

            endgame_tactics: {
                title: 'Endgame Tactics',
                description: 'Strategies for winning when you\'re close to victory',
                difficulty: 'advanced',
                estimatedTime: '5 minutes',
                objectives: [
                    {
                        id: 'use_eight_endgame',
                        type: 'playCard',
                        description: 'Use your saved 8 to guarantee a winning position',
                        requiredCard: { suit: 'Clubs', rank: '8' }
                    },
                    {
                        id: 'declare_winning_suit',
                        type: 'declareSuit',
                        description: 'Declare the suit of your last card (Hearts)',
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
                        context: 'lesson_objectives',
                        title: 'Endgame Setup',
                        content: 'When you\'re down to 2 cards, think ahead! Set up your last card to be playable.',
                        trigger: 'start'
                    },
                    {
                        context: 'lesson_objectives',
                        title: 'The Perfect Play',
                        content: 'You have an 8 and a Heart. Play the 8 and declare Hearts - your last card is guaranteed playable!',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'card_playing',
                        title: 'Secure the Win',
                        content: 'Play the 8 of Clubs and declare Hearts. Next turn, you\'ll play your last card and win!',
                        trigger: 'objective',
                        objectiveIndex: 1
                    }
                ],
                initialHand: [
                    { suit: 'Clubs', rank: '8', id: 'end_card_1' },
                    { suit: 'Hearts', rank: '4', id: 'end_card_2' }
                ],
                initialDiscardPile: [
                    { suit: 'Spades', rank: 'King', id: 'end_discard_1' }
                ]
            },

            winning_mindset: {
                title: 'Putting It All Together',
                description: 'Final tips for consistent victories',
                difficulty: 'advanced',
                estimatedTime: '4 minutes',
                objectives: [
                    {
                        id: 'complete_tutorial',
                        type: 'gameState',
                        description: 'Complete the tutorial and become a Crazy 8\'s master!',
                        property: 'tutorial.completed',
                        value: true,
                        operator: 'equals'
                    }
                ],
                requirements: [],
                hints: [
                    {
                        context: 'lesson_objectives',
                        title: 'Key Strategies',
                        content: '1. Save your 8s and action cards for critical moments\n2. Watch what opponents play and draw\n3. Think ahead - set up your next plays',
                        trigger: 'start'
                    },
                    {
                        context: 'lesson_objectives',
                        title: 'Card Counting',
                        content: 'Track which cards have been played. If three Aces are gone, the fourth is safe to hold.',
                        trigger: 'objective',
                        objectiveIndex: 0
                    },
                    {
                        context: 'lesson_objectives',
                        title: 'Congratulations!',
                        content: 'You\'ve completed the Crazy 8\'s tutorial! You\'re now ready to play competitively. Good luck!',
                        trigger: 'objective',
                        objectiveIndex: 0
                    }
                ],
                initialHand: [
                    { suit: 'Hearts', rank: '7', id: 'final_card_1' },
                    { suit: 'Diamonds', rank: 'Jack', id: 'final_card_2' },
                    { suit: 'Clubs', rank: '8', id: 'final_card_3' },
                    { suit: 'Spades', rank: '2', id: 'final_card_4' },
                    { suit: 'Hearts', rank: 'Queen', id: 'final_card_5' }
                ],
                initialDiscardPile: [
                    { suit: 'Hearts', rank: '5', id: 'final_discard_1' }
                ],
                gameStateModifiers: {
                    tutorial: { completed: false }
                }
            }
        }
    }
};

/**
 * Get all available modules
 * @returns {Array<string>} Array of module IDs sorted by order
 */
export const getAvailableModules = () => {
    return Object.keys(tutorialLessons).sort((a, b) => {
        const orderA = tutorialLessons[a].meta.order || 999;
        const orderB = tutorialLessons[b].meta.order || 999;
        return orderA - orderB;
    });
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
 * Get total lesson count across all modules
 * @returns {number} Total number of lessons
 */
export const getTotalLessonCount = () => {
    let count = 0;
    for (const moduleId of Object.keys(tutorialLessons)) {
        count += Object.keys(tutorialLessons[moduleId].lessons).length;
    }
    return count;
};

/**
 * Get lesson count for a specific module
 * @param {string} moduleId - Module identifier
 * @returns {number} Number of lessons in the module
 */
export const getModuleLessonCount = (moduleId) => {
    const module = tutorialLessons[moduleId];
    if (!module) return 0;
    return Object.keys(module.lessons).length;
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

/**
 * Get next lesson in sequence
 * @param {string} currentModuleId - Current module ID
 * @param {string} currentLessonId - Current lesson ID
 * @returns {Object|null} Next lesson info or null if at end
 */
export const getNextLessonInfo = (currentModuleId, currentLessonId) => {
    const module = tutorialLessons[currentModuleId];
    if (!module) return null;

    const lessonIds = Object.keys(module.lessons);
    const currentIndex = lessonIds.indexOf(currentLessonId);

    // Check for next lesson in same module
    if (currentIndex < lessonIds.length - 1) {
        return {
            moduleId: currentModuleId,
            lessonId: lessonIds[currentIndex + 1]
        };
    }

    // Check for first lesson in next module
    const moduleIds = getAvailableModules();
    const moduleIndex = moduleIds.indexOf(currentModuleId);

    if (moduleIndex < moduleIds.length - 1) {
        const nextModuleId = moduleIds[moduleIndex + 1];
        const nextModule = tutorialLessons[nextModuleId];
        const firstLessonId = Object.keys(nextModule.lessons)[0];

        return {
            moduleId: nextModuleId,
            lessonId: firstLessonId
        };
    }

    return null; // At the end of all lessons
};

export default tutorialLessons;
