const Card = require('./Card');
const Deck = require('./Deck');
const Player = require('./Player');
const { createDeck, shuffleDeck } = require('../utils/deck');

class Game {
    constructor(playerIds, playerNames) {
        this.id = this.generateGameId();
        this.players = this.initializePlayers(playerIds, playerNames);
        this.deck = [];
        this.drawPile = [];
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.gameState = 'waiting'; // 'waiting', 'playing', 'finished'
        this.direction = 1; // 1 for clockwise, -1 for counterclockwise
        this.declaredSuit = null; // For wild cards (8s)
        this.drawStack = 0; // Accumulated draw cards from Aces/2s
        this.roundNumber = 1;
        this.activePlayers = [...this.players]; // Players still in the tournament
        this.safeePlayers = []; // Players who finished current round
        this.eliminatedPlayers = []; // Players eliminated from tournament
        this.pendingTurnPass = null; // Track if player needs to pass turn after drawing
        this.playersWhoHaveDrawn = new Set(); // Track who has drawn this turn
        this.debugMode = false; // Enable verbose debug logging
        this.autoPassTimers = new Map(); // timers for auto pass
        this.onAutoPass = null; // optional callback when auto pass occurs
    }

    generateGameId() {
        return 'game_' + Math.random().toString(36).substr(2, 9);
    }

    initializePlayers(playerIds, playerNames) {
        return playerIds.map((id, index) => ({
            id: id,
            name: playerNames[index] || `Player ${index + 1}`,
            hand: [],
            isSafe: false,
            isEliminated: false,
            isConnected: true
        }));
    }

    startGame() {
        if (this.players.length < 2 || this.players.length > 4) {
            return { 
                success: false, 
                error: 'Game requires 2-4 players' 
            };
        }

        // Create and shuffle deck
        this.deck = createDeck();
        this.deck = shuffleDeck(this.deck);
        this.drawPile = [...this.deck];

        // Deal 8 cards to each player
        this.dealCards();

        // Turn over first card for discard pile
        if (this.drawPile.length > 0) {
            const firstCard = this.drawPile.pop();
            this.discardPile.push(firstCard);
        } else {
            return { 
                success: false, 
                error: 'Not enough cards to start game' 
            };
        }

        // Set game state to playing and reset current player
        this.gameState = 'playing';
        this.currentPlayerIndex = 0;
        
        // Make sure activePlayers is properly set
        this.activePlayers = this.players.filter(p => !p.isEliminated);

        console.log(`Game ${this.id} started. Current player index: ${this.currentPlayerIndex}, Active players: ${this.activePlayers.length}`);
        console.log('Active players:', this.activePlayers.map(p => p.name));

        return {
            success: true,
            gameState: this.getGameState()
        };
    }

    dealCards() {
        const cardsPerPlayer = 8;
        
        // Clear all player hands
        this.players.forEach(player => {
            player.hand = [];
        });

        // Deal cards round-robin style
        for (let cardCount = 0; cardCount < cardsPerPlayer; cardCount++) {
            for (let playerIndex = 0; playerIndex < this.players.length; playerIndex++) {
                if (this.drawPile.length > 0) {
                    const card = this.drawPile.pop();
                    this.players[playerIndex].hand.push(card);
                } else {
                    throw new Error('Not enough cards in deck to deal to all players');
                }
            }
        }
    }

    getGameState() {
        const currentPlayer = this.getCurrentPlayer();
        const topCard = this.getTopDiscardCard();

        console.log(`Getting game state. Current player: ${currentPlayer ? currentPlayer.name : 'null'} (index: ${this.currentPlayerIndex})`);

        return {
            gameId: this.id,
            gameState: this.gameState,
            currentPlayer: currentPlayer ? currentPlayer.name : null,
            currentPlayerId: currentPlayer ? currentPlayer.id : null,
            topCard: topCard ? this.cardToString(topCard) : null,
            declaredSuit: this.declaredSuit,
            direction: this.direction,
            drawStack: this.drawStack,
            roundNumber: this.roundNumber,
            pendingTurnPass: this.pendingTurnPass, // New field
            players: this.players.map(player => ({
                id: player.id,
                name: player.name,
                handSize: player.hand.length,
                isSafe: player.isSafe,
                isEliminated: player.isEliminated,
                isConnected: player.isConnected,
                isCurrentPlayer: player.id === (currentPlayer ? currentPlayer.id : null)
            })),
            drawPileSize: this.drawPile.length,
            discardPileSize: this.discardPile.length
        };
    }

    getCurrentPlayer() {
        if (this.gameState !== 'playing') {
            console.log('Game not in playing state:', this.gameState);
            return null;
        }
        
        if (this.activePlayers.length === 0) {
            console.log('No active players');
            return null;
        }

        // Ensure currentPlayerIndex is within bounds
        if (this.currentPlayerIndex >= this.activePlayers.length) {
            console.log(`Current player index ${this.currentPlayerIndex} out of bounds, resetting to 0`);
            this.currentPlayerIndex = 0;
        }

        const currentPlayer = this.activePlayers[this.currentPlayerIndex];
        console.log(`Current player: ${currentPlayer ? currentPlayer.name : 'null'} at index ${this.currentPlayerIndex}`);
        return currentPlayer;
    }

    getTopDiscardCard() {
        return this.discardPile.length > 0 ? this.discardPile[this.discardPile.length - 1] : null;
    }

    getPlayerById(playerId) {
        return this.players.find(player => player.id === playerId);
    }

    getPlayerHand(playerId) {
        const player = this.getPlayerById(playerId);
        return player ? player.hand : [];
    }

    // Updated playCard method to handle both single cards and arrays
    playCard(playerId, cards, declaredSuit = null) {
        if (this.debugMode) {
            console.log('🐛 [DEBUG] playCard called:', {
                playerId,
                cards,
                declaredSuit,
                topCard: this.getTopDiscardCard()
                    ? this.cardToString(this.getTopDiscardCard())
                    : 'none',
                drawStack: this.drawStack
            });
        } else {
            console.log(`playCard called by ${playerId} with cards:`, cards);
        }
        
        // Normalize input - ensure cards is always an array
        const cardsToPlay = Array.isArray(cards) ? cards : [cards];
        
        // Validate player exists first
        const player = this.getPlayerById(playerId);
        if (!player) {
            return { 
                success: false, 
                error: 'Player not found' 
            };
        }

        // Validate game state
        if (this.gameState !== 'playing') {
            return { 
                success: false, 
                error: 'Game is not currently active' 
            };
        }

        // Validate it's the player's turn
        const currentPlayer = this.getCurrentPlayer();
        console.log(`Current player: ${currentPlayer ? currentPlayer.name : 'null'}, Playing player: ${player.name}`);
        
        if (!currentPlayer || currentPlayer.id !== playerId) {
            return {
                success: false,
                error: 'Not your turn'
            };
        }

        // Clear any pending turn pass when player makes a play
        if (this.pendingTurnPass === playerId) {
            this.pendingTurnPass = null;
        }

        this.playersWhoHaveDrawn.delete(playerId);

        // Validate player has all the cards
        for (const card of cardsToPlay) {
            const cardIndex = this.findCardInHand(player.hand, card);
            if (cardIndex === -1) {
                return {
                    success: false,
                    error: 'You do not have this card'
                };
            }
        }

        // Enhanced card stack validation with turn logic
        if (cardsToPlay.length > 1) {
            const stackValidation = this.validateCardStack(cardsToPlay);
            if (!stackValidation.isValid) {
                return {
                    success: false,
                    error: stackValidation.error
                };
            }
        }

        // Validate the play is legal using the first card
        const bottomCard = cardsToPlay[0];
        if (!this.isValidPlay(bottomCard, declaredSuit)) {
            return { 
                success: false, 
                error: 'Invalid card play' 
            };
        }

        // Remove cards from player's hand
        for (const card of cardsToPlay) {
            const cardIndex = this.findCardInHand(player.hand, card);
            if (cardIndex !== -1) {
                player.hand.splice(cardIndex, 1);
            }
        }

        // Add cards to discard pile
        this.discardPile.push(...cardsToPlay);

        // Handle multiple special card effects with proper turn management
        const totalDrawEffect = this.handleMultipleSpecialCards(cardsToPlay, declaredSuit);

        // Check win condition
        if (player.hand.length === 0) {
            player.isSafe = true;
            this.safeePlayers.push(player);
            this.checkRoundEnd();
        }
        // Note: We don't call nextPlayer() here anymore because 
        // handleMultipleSpecialCards now manages turn control properly

        if (this.debugMode) {
            console.log('🐛 [DEBUG] playCard result:', {
                newTopCard: this.cardToString(this.getTopDiscardCard()),
                drawStack: this.drawStack,
                nextPlayer: this.getCurrentPlayer()?.name
            });
        } else {
            console.log(`Card play successful. New current player: ${this.getCurrentPlayer()?.name}`);
        }

        return {
            success: true,
            message: this.generatePlayMessage(cardsToPlay, declaredSuit),
            gameState: this.getGameState(),
            cardsPlayed: cardsToPlay.map(card => this.cardToString(card))
        };
    }

    generatePlayMessage(cards, declaredSuit) {
        if (cards.length === 1) {
            const card = cards[0];
            let message = `Played ${card.rank} of ${card.suit}`;
            
            if (card.rank === '8' && declaredSuit) {
                message += ` and declared ${declaredSuit}`;
            }
            
            return message;
        } else {
            const rank = cards[0].rank;
            const suits = cards.map(card => card.suit).join(', ');
            return `Played ${cards.length} ${rank}s: ${suits}`;
        }
    }

    isValidPlay(card, declaredSuit = null) {
        const topCard = this.getTopDiscardCard();
        if (!topCard) return true; // First card can be anything

        // If there's a draw stack and player isn't countering, they must draw
        if (this.drawStack > 0 && !this.canCounterDraw(card)) {
            return false;
        }

        // 8s (wild cards) can be played on anything
        if (card.rank === '8') {
            // Must declare a suit when playing an 8
            if (!declaredSuit || !['Hearts', 'Diamonds', 'Clubs', 'Spades'].includes(declaredSuit)) {
                return false;
            }
            return true;
        }

        // Check if suit was declared by previous wild card
        const suitToMatch = this.declaredSuit || topCard.suit;

        // Card must match suit or rank
        return card.suit === suitToMatch || card.rank === topCard.rank;
    }

    canCounterDraw(card) {
        const topCard = this.getTopDiscardCard();
        if (!topCard || this.drawStack === 0) return false;

        // Aces can counter Aces or 2s of same suit
        if (card.rank === 'Ace') {
            return topCard.rank === 'Ace' || (topCard.rank === '2' && card.suit === topCard.suit);
        }

        // 2s can counter 2s or Aces of same suit  
        if (card.rank === '2') {
            return topCard.rank === '2' || (topCard.rank === 'Ace' && card.suit === topCard.suit);
        }

        return false;
    }

    handleSpecialCard(card, declaredSuit = null) {
        let drawEffect = 0;

        switch (card.rank) {
            case 'Jack': // Skip
                // Always skip the next player
                this.nextPlayer();
                // In a 1v1 game, the outer nextPlayer call will rotate
                // back to the current player, effectively keeping the turn
                break;

            case 'Queen': // Reverse
                // Always reverse direction
                this.direction *= -1;
                // No implicit skip - turn advancement handled by caller
                break;

            case 'Ace': // Draw 4
                drawEffect = 4;
                break;

            case '2': // Draw 2
                drawEffect = 2;
                break;

            case '8': // Wild card
                this.declaredSuit = declaredSuit;
                break;

            default:
                // Clear declared suit for non-special cards
                this.declaredSuit = null;
                break;
        }

        return drawEffect;
    }

    // Enhanced card stack validation with turn simulation
    validateCardStack(cards) {
        if (cards.length <= 1) {
            return { isValid: true };
        }

        if (this.debugMode) {
            console.log('🐛 [DEBUG] validating stack:', cards.map(c => `${c.rank} of ${c.suit}`));
        } else {
            console.log('Validating card stack:', cards.map(c => `${c.rank} of ${c.suit}`));
        }

        // Check each card-to-card transition in the stack
        for (let i = 1; i < cards.length; i++) {
            const prevCard = cards[i - 1];
            const currentCard = cards[i];
            
            console.log(`Checking transition: ${prevCard.rank} of ${prevCard.suit} → ${currentCard.rank} of ${currentCard.suit}`);
            
            // Cards must match by suit or rank
            const matchesSuit = prevCard.suit === currentCard.suit;
            const matchesRank = prevCard.rank === currentCard.rank;
            
            // Special case: Aces and 2s can stack with each other if same suit
            const isAce2Cross = (
                (prevCard.rank === 'Ace' && currentCard.rank === '2') ||
                (prevCard.rank === '2' && currentCard.rank === 'Ace')
            ) && prevCard.suit === currentCard.suit;
            
            console.log(`  Matches suit: ${matchesSuit}, Matches rank: ${matchesRank}, Ace/2 cross: ${isAce2Cross}`);
            
            // Basic matching requirement
            if (!matchesSuit && !matchesRank && !isAce2Cross) {
                console.log(`  ❌ Invalid transition - no suit/rank match!`);
                return {
                    isValid: false,
                    error: `Cannot stack ${currentCard.rank} of ${currentCard.suit} after ${prevCard.rank} of ${prevCard.suit}. Cards must match suit or rank.`
                };
            }
            
            // If different rank but same suit, validate turn chain logic
            if (matchesSuit && !matchesRank && !isAce2Cross) {
                const stackUpToHere = cards.slice(0, i);
                const wouldHaveTurnControl = this.simulateTurnControl(stackUpToHere);
                
                if (!wouldHaveTurnControl) {
                    console.log(`  ❌ Invalid transition - no turn control after previous cards!`);
                    return {
                        isValid: false,
                        error: `Cannot stack ${currentCard.rank} of ${currentCard.suit} after ${prevCard.rank} of ${prevCard.suit}. Previous cards don't maintain turn control.`
                    };
                }
            }
            
            console.log(`  ✅ Valid transition`);
        }
        
        if (this.debugMode) {
            console.log('🐛 [DEBUG] stack validation passed');
        } else {
            console.log('✅ Stack validation passed');
        }
        return { isValid: true };
    }

    // Simulate turn control for a card sequence
    simulateTurnControl(cardStack) {
        if (cardStack.length === 0) return true;

        const playerCount = this.activePlayers.length;
        let currentIndex = 0; // Start relative to the current player
        let direction = this.direction;
        let pendingSkips = 0;

        for (const card of cardStack) {
            if (card.rank === 'Jack') {
                // Accumulate skip effects; actual move applied when a non-Jack is processed
                if (playerCount !== 2) {
                    pendingSkips += 1;
                }
                continue;
            }

            if (pendingSkips > 0) {
                if (playerCount !== 2) {
                    currentIndex = (currentIndex + pendingSkips + 1) % playerCount;
                }
                pendingSkips = 0;
            }

            switch (card.rank) {
                case 'Queen':
                    direction *= -1;
                    currentIndex = (currentIndex + direction + playerCount) % playerCount;
                    break;
                case 'Ace':
                case '2':
                case '8':
                    currentIndex = (currentIndex + direction + playerCount) % playerCount;
                    break;
                default:
                    currentIndex = (currentIndex + direction + playerCount) % playerCount;
                    break;
            }
        }

        if (pendingSkips > 0) {
            if (playerCount !== 2) {
                currentIndex = (currentIndex + pendingSkips + 1) % playerCount;
            }
        }

        // Player keeps the turn only if we end back at index 0
        return currentIndex === 0;
    }

    // Fixed handleMultipleSpecialCards method for game.js
    handleMultipleSpecialCards(cards, declaredSuit = null) {
        console.log('🎮 Processing multiple special cards:', cards.map(c => `${c.rank} of ${c.suit}`));
        
        let totalDrawEffect = 0;
        let hasWild = false;
        
        // Simulate turn progression to determine final turn control
        const playerCount = this.activePlayers.length;
        let tempDirection = this.direction; // Track direction changes
        let totalSkips = 0; // Count total Jack skips
        let totalReverses = 0; // Count total Queen reverses
        let endsWithNormalCard = false; // Track if ends with normal card
        
        console.log(`🎮 Simulating turn progression (${playerCount} players, starting direction: ${tempDirection}):`);
        
        // Process each card in sequence for effects - DON'T call nextPlayer() here
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            console.log(`  Processing card ${i + 1}/${cards.length}: ${card.rank} of ${card.suit}`);

            switch (card.rank) {
                case 'Jack': // Skip
                    console.log('    Jack: Skip effect');
                    totalSkips += 1;
                    endsWithNormalCard = false;
                    break;

                case 'Queen': // Reverse
                    console.log('    Queen: Reverse effect');
                    totalReverses += 1;
                    endsWithNormalCard = false;
                    break;

                case 'Ace': // Draw 4
                    console.log('    Ace: +4 draw effect');
                    totalDrawEffect += 4;
                    endsWithNormalCard = false;
                    break;

                case '2': // Draw 2
                    console.log('    2: +2 draw effect');
                    totalDrawEffect += 2;
                    endsWithNormalCard = false;
                    break;

                case '8': // Wild card
                    console.log('    8: Wild card');
                    hasWild = true;
                    endsWithNormalCard = false;
                    break;

                default:
                    // Normal cards
                    console.log('    Normal card');
                    endsWithNormalCard = true;
                    break;
            }
        }

        // Calculate final direction after all Queen reverses
        if (totalReverses % 2 === 1) {
            tempDirection *= -1;
            console.log(`🎮 Applied ${totalReverses} reverses - direction is now ${tempDirection}`);
        }

        // Calculate final turn position
        let finalPlayerIndex = 0; // Start with current player (index 0)

        if (playerCount === 2) {
            // 2-player game logic
            let shouldPassTurn = false;
            
            // Handle Jacks (skips) - odd number = keep turn, even number = pass turn
            if (totalSkips > 0) {
                const keepTurnFromSkips = (totalSkips % 2 === 1);
                shouldPassTurn = !keepTurnFromSkips;
                console.log(`🎮 2-player Jacks: ${totalSkips} skips → ${keepTurnFromSkips ? 'keep turn' : 'pass turn'}`);
            }
            
            // Handle Queens (reverses) - odd number = pass turn, even number = keep turn
            if (totalReverses > 0) {
                const passTurnFromReverses = (totalReverses % 2 === 1);
                // If we already determined to pass from skips, this modifies it
                if (totalSkips > 0) {
                    // Both effects present - combine them
                    shouldPassTurn = shouldPassTurn !== passTurnFromReverses; // XOR logic
                } else {
                    // Only reverses
                    shouldPassTurn = passTurnFromReverses;
                }
                console.log(`🎮 2-player Queens: ${totalReverses} reverses → ${passTurnFromReverses ? 'pass turn' : 'keep turn'}`);
            }
            
            // Handle normal cards, draw cards, or wilds
            if (totalSkips === 0 && totalReverses === 0 && (endsWithNormalCard || totalDrawEffect > 0 || hasWild)) {
                shouldPassTurn = true;
                console.log(`🎮 2-player: Normal/Draw/Wild cards → pass turn`);
            }
            
            finalPlayerIndex = shouldPassTurn ? 1 : 0;
            console.log(`🎮 2-player final result: ${shouldPassTurn ? 'pass turn' : 'keep turn'} (index ${finalPlayerIndex})`);
            
        } else {
            // Multiplayer game logic (3+ players)
            if (totalSkips > 0) {
                // In multiplayer: each skip advances by 1, then +1 for normal turn
                finalPlayerIndex = (0 + totalSkips + 1) % playerCount;
                console.log(`🎮 Multiplayer: ${totalSkips} skips → advance to index ${finalPlayerIndex}`);
            } else if (endsWithNormalCard || totalDrawEffect > 0 || hasWild) {
                // Normal cards, draw cards, or wilds pass the turn
                finalPlayerIndex = (0 + tempDirection + playerCount) % playerCount;
                console.log(`🎮 Multiplayer: Normal turn advancement → index ${finalPlayerIndex}`);
            } else {
                // Only reverses with no other effects - just direction change and advance
                finalPlayerIndex = (0 + tempDirection + playerCount) % playerCount;
                console.log(`🎮 Multiplayer: Reverse only → index ${finalPlayerIndex}`);
            }
        }

        // Apply actual direction changes to the game
        if (tempDirection !== this.direction) {
            this.direction = tempDirection;
            console.log(`🎮 Direction changed to: ${this.direction}`);
        }

        // Apply draw effects
        if (totalDrawEffect > 0) {
            this.drawStack += totalDrawEffect;
            console.log(`🎮 Added ${totalDrawEffect} to draw stack, total: ${this.drawStack}`);
        }

        // Handle wild card suit declaration
        if (hasWild && declaredSuit) {
            this.declaredSuit = declaredSuit;
            console.log(`🎮 Set declared suit to: ${declaredSuit}`);
        } else if (!hasWild) {
            // Clear declared suit if no wilds in the stack
            this.declaredSuit = null;
            console.log('🎮 Cleared declared suit (no wilds)');
        }

        // Check if stack ends with penalty cards
        const lastCard = cards[cards.length - 1];
        const endsWithPenaltyCard = (lastCard.rank === 'Ace' || lastCard.rank === '2');
        
        // Set the final player - KEY FIX FOR PENALTY CARD LOGIC
        if (finalPlayerIndex === 0 && !endsWithPenaltyCard) {
            console.log('🎮 Turn control maintained - staying with current player (no penalty cards at end)');
            // Don't change currentPlayerIndex - player keeps the turn
        } else {
            // Either normal advancement OR stack ends with penalty cards
            let targetIndex;
            
            if (finalPlayerIndex === 0 && endsWithPenaltyCard) {
                // Player maintained turn control through special cards, but stack ends with penalty cards
                // Pass turn to next player in current direction
                const currentIndex = this.currentPlayerIndex;
                targetIndex = (currentIndex + this.direction + playerCount) % playerCount;
                console.log(`🎮 Turn control maintained through specials, but stack ends with penalty cards → pass to next player`);
            } else {
                // Normal advancement based on turn control calculation
                const currentIndex = this.currentPlayerIndex;
                targetIndex = (currentIndex + finalPlayerIndex) % playerCount;
                console.log(`🎮 Normal turn advancement based on special card effects`);
            }
            
            this.currentPlayerIndex = targetIndex;
            console.log(`🎮 Turn advanced to index ${targetIndex}: ${this.activePlayers[targetIndex]?.name}`);
        }

        console.log(`🎮 Final game state: Player ${this.currentPlayerIndex} (${this.getCurrentPlayer()?.name}) has the turn`);
        console.log(`🎮 Draw stack: ${this.drawStack} cards waiting for ${this.getCurrentPlayer()?.name}`);

        return totalDrawEffect;
    }

    // Enhanced drawCards method that doesn't automatically advance turn
    drawCards(playerId, count = 1) {
    const player = this.getPlayerById(playerId);
    if (!player) {
        return { 
            success: false, 
            error: 'Player not found' 
        };
    }

    // Validate it's the player's turn
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== playerId) {
        return { 
            success: false, 
            error: 'Not your turn' 
        };
    }

    // Check if player has already drawn this turn
    if (this.playersWhoHaveDrawn.has(playerId) && this.drawStack === 0) {
        return {
            success: false,
            error: 'You have already drawn a card this turn'
        };
    }

    let isFromSpecialCard = false;
    let actualDrawCount = count;
    
    // Handle draw stack
    if (this.drawStack > 0) {
        actualDrawCount = this.drawStack;
        this.drawStack = 0;
        isFromSpecialCard = true;
    }

    console.log(`🎲 ${player.name} needs to draw ${actualDrawCount} cards`);
    console.log(`  Current draw pile: ${this.drawPile.length} cards`);
    console.log(`  Current discard pile: ${this.discardPile.length} cards`);

    // Calculate total available cards before drawing
    const availableCards = this.drawPile.length + Math.max(0, this.discardPile.length - 1);
    console.log(`  Available cards for drawing: ${availableCards}`);

    // Determine if we need to add a new deck
    let needsNewDeck = false;
    let newDeckMessage = '';

    if (actualDrawCount > availableCards) {
        console.log(`  ⚠️  Need ${actualDrawCount} cards but only ${availableCards} available`);
        needsNewDeck = true;
    }

    // Attempt to get enough cards
    const drawnCards = [];
    let cardsStillNeeded = actualDrawCount;

    // Draw from existing draw pile first
    while (cardsStillNeeded > 0 && this.drawPile.length > 0) {
        const card = this.drawPile.pop();
        player.hand.push(card);
        drawnCards.push(card);
        cardsStillNeeded--;
    }

    console.log(`  Drew ${drawnCards.length} cards from draw pile, still need ${cardsStillNeeded}`);

    // If we still need cards, try to reshuffle discard pile
    if (cardsStillNeeded > 0) {
        const reshuffleSuccess = this.reshuffleDiscardPile();
        
        if (reshuffleSuccess) {
            // Draw from newly reshuffled cards
            while (cardsStillNeeded > 0 && this.drawPile.length > 0) {
                const card = this.drawPile.pop();
                player.hand.push(card);
                drawnCards.push(card);
                cardsStillNeeded--;
            }
            console.log(`  Drew ${actualDrawCount - cardsStillNeeded} more cards after reshuffle, still need ${cardsStillNeeded}`);
        }
    }

    // If we STILL need cards, add a new deck
    if (cardsStillNeeded > 0) {
        console.log(`  🆕 Adding new deck - still need ${cardsStillNeeded} cards`);
        const newCardsAdded = this.addNewDeck();
        newDeckMessage = `A new deck has been shuffled in due to high card demand! (+${newCardsAdded} cards)`;
        
        // Draw the remaining needed cards from the new deck
        while (cardsStillNeeded > 0 && this.drawPile.length > 0) {
            const card = this.drawPile.pop();
            player.hand.push(card);
            drawnCards.push(card);
            cardsStillNeeded--;
        }
        
        console.log(`  Drew final ${actualDrawCount - cardsStillNeeded} cards from new deck`);
    }

    // Final verification
    if (cardsStillNeeded > 0) {
        console.error(`  ❌ CRITICAL ERROR: Still need ${cardsStillNeeded} cards but no more available!`);
        return {
            success: false,
            error: `Could not draw enough cards - missing ${cardsStillNeeded} cards`
        };
    }

    console.log(`  ✅ Successfully drew ${drawnCards.length} cards total`);

    // Mark player as having drawn this turn (unless it's from special card effect)
    if (!isFromSpecialCard) {
        this.playersWhoHaveDrawn.add(playerId);
    }

    // Check which drawn cards can be played immediately
    const playableDrawnCards = this.getPlayableDrawnCards(drawnCards, playerId);
    const canPlayDrawnCard = playableDrawnCards.length > 0;

    // Handle turn progression based on card type
    if (isFromSpecialCard) {
        // After drawing penalty cards, player gets a chance to play if they can
        if (canPlayDrawnCard) {
            this.pendingTurnPass = playerId;
            console.log(`🎲 Player drew ${actualDrawCount} penalty cards and can play some - setting pending turn pass`);
        } else {
            // No playable cards after penalty draw - advance turn
            this.pendingTurnPass = null;
            this.nextPlayer();
            console.log(`🎲 Player drew ${actualDrawCount} penalty cards with no playable cards - turn advanced`);
        }
    } else {
        // Regular draw - set pending turn pass if cards can be played
        if (canPlayDrawnCard) {
            this.pendingTurnPass = playerId;
        } else {
            // No playable cards drawn - player must pass turn manually or auto-pass
            this.pendingTurnPass = playerId;
        }
    }

    const result = {
        success: true,
        drawnCards: drawnCards.map(card => this.cardToString(card)),
        playableDrawnCards: playableDrawnCards,
        canPlayDrawnCard: canPlayDrawnCard,
        fromSpecialCard: isFromSpecialCard,
        gameState: this.getGameState(),
        newDeckAdded: needsNewDeck,
        newDeckMessage: newDeckMessage
    };

    console.log(`🎲 Draw complete:`, {
        cardsDrawn: drawnCards.length,
        playerHandSize: player.hand.length,
        playableCards: playableDrawnCards.length,
        newDeckAdded: needsNewDeck
    });

    return result;
}

    // New method to get playable cards from drawn cards
    getPlayableDrawnCards(drawnCards, playerId) {
        const topCard = this.getTopDiscardCard();
        if (!topCard) return [];

        const playableCards = [];
        
        for (const card of drawnCards) {
            if (this.isValidPlay(card)) {
                playableCards.push(this.cardToString(card));
            }
        }

        return playableCards;
    }

    // New method to play a specific drawn card
    playDrawnCard(playerId, card, declaredSuit = null) {
        const player = this.getPlayerById(playerId);
        if (!player) {
            return { 
                success: false, 
                error: 'Player not found' 
            };
        }

        // Validate it's the player's turn and they have pending turn pass
        const currentPlayer = this.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.id !== playerId) {
            return { 
                success: false, 
                error: 'Not your turn' 
            };
        }

        if (this.pendingTurnPass !== playerId) {
            return {
                success: false,
                error: 'No pending card play available'
            };
        }

        // Validate player has the card
        const cardIndex = this.findCardInHand(player.hand, card);
        if (cardIndex === -1) {
            return {
                success: false,
                error: 'You do not have this card'
            };
        }

        // Validate the play is legal
        if (!this.isValidPlay(card, declaredSuit)) {
            return { 
                success: false, 
                error: 'Invalid card play' 
            };
        }

        // Remove card from player's hand
        player.hand.splice(cardIndex, 1);

        // Add card to discard pile
        this.discardPile.push(card);

        // Handle special card effects
        const drawEffect = this.handleSpecialCard(card, declaredSuit);
        if (drawEffect > 0) {
            this.drawStack += drawEffect;
        }

        // Clear pending turn pass
        this.pendingTurnPass = null;

        // Check win condition
        if (player.hand.length === 0) {
            player.isSafe = true;
            this.safeePlayers.push(player);
            this.checkRoundEnd();
        } else {
            this.nextPlayer();
        }

        return {
            success: true,
            message: `Played ${card.rank} of ${card.suit}${card.rank === '8' && declaredSuit ? ` and declared ${declaredSuit}` : ''}`,
            cardsPlayed: [this.cardToString(card)],
            gameState: this.getGameState()
        };
    }

    // New method to pass turn after drawing
    passTurnAfterDraw(playerId) {
        const player = this.getPlayerById(playerId);
        if (!player) {
            return { 
                success: false, 
                error: 'Player not found' 
            };
        }

        // Validate it's the player's turn and they have pending turn pass
        const currentPlayer = this.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.id !== playerId) {
            return { 
                success: false, 
                error: 'Not your turn' 
            };
        }

        if (this.pendingTurnPass !== playerId) {
            return {
                success: false,
                error: 'No pending turn pass available'
            };
        }

        // Clear pending turn pass and advance to next player
        this.cancelAutoPass(playerId);
        this.pendingTurnPass = null;
        this.playersWhoHaveDrawn.delete(playerId); // Clear draw tracking
        this.nextPlayer();

        return {
            success: true,
            message: 'Turn passed',
            gameState: this.getGameState()
        };
    }

    reshuffleDiscardPile() {
        console.log('🔄 Attempting to reshuffle discard pile...');
        console.log(`  Draw pile: ${this.drawPile.length} cards`);
        console.log(`  Discard pile: ${this.discardPile.length} cards`);
        
        if (this.discardPile.length <= 1) {
            console.log('  ❌ Cannot reshuffle - discard pile only has top card');
            return false; // Cannot reshuffle if only top card remains
        }

        // Keep top card, shuffle the rest back into draw pile
        const topCard = this.discardPile.pop();
        const cardsToShuffle = [...this.discardPile];
        
        // Shuffle the cards
        const { shuffleDeck } = require('../utils/deck');
        const shuffledCards = shuffleDeck(cardsToShuffle);
        
        // Add shuffled cards to draw pile
        this.drawPile.push(...shuffledCards);
        
        // Reset discard pile with just the top card
        this.discardPile = [topCard];
        
        console.log(`  ✅ Reshuffled ${shuffledCards.length} cards back into draw pile`);
        console.log(`  New draw pile size: ${this.drawPile.length}`);
        
        return true;
    }

    addNewDeck() {
        console.log('🆕 Adding new deck due to high card demand...');
        
        const { createDeck, shuffleDeck } = require('../utils/deck');
        const newDeck = createDeck();
        const shuffledNewDeck = shuffleDeck(newDeck);
        
        // Add the new deck to the draw pile
        this.drawPile.push(...shuffledNewDeck);
        
        console.log(`  ✅ Added fresh 52-card deck to draw pile`);
        console.log(`  New draw pile size: ${this.drawPile.length}`);
        
        return shuffledNewDeck.length;
    }


    nextPlayer() {
        if (this.activePlayers.length === 0) return;

        const oldIndex = this.currentPlayerIndex;
        this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.activePlayers.length) % this.activePlayers.length;

        this.playersWhoHaveDrawn.clear();
        if (this.debugMode) {
            console.log('🐛 [DEBUG] nextPlayer:', {
                from: oldIndex,
                to: this.currentPlayerIndex,
                player: this.activePlayers[this.currentPlayerIndex]?.name,
                direction: this.direction
            });
        } else {
            console.log(`Next player: ${oldIndex} -> ${this.currentPlayerIndex} (${this.activePlayers[this.currentPlayerIndex]?.name})`);
        }
    }

    checkRoundEnd() {
        const playersStillPlaying = this.activePlayers.filter(p => !p.isSafe && !p.isEliminated);
        
        if (playersStillPlaying.length <= 1) {
            // Round ends, eliminate last player
            if (playersStillPlaying.length === 1) {
                const lastPlayer = playersStillPlaying[0];
                lastPlayer.isEliminated = true;
                this.eliminatedPlayers.push(lastPlayer);
            }

            this.endRound();
        }
    }

    endRound() {
        // Update active players (remove eliminated)
        this.activePlayers = this.activePlayers.filter(p => !p.isEliminated);

        if (this.activePlayers.length <= 1) {
            // Tournament over
            this.gameState = 'finished';
            return;
        }

        // Start new round
        this.roundNumber++;
        this.startNewRound();
    }

    startNewRound() {
        // Clear any existing auto pass timers
        for (const timer of this.autoPassTimers.values()) {
            clearTimeout(timer);
        }
        this.autoPassTimers.clear();

        // Reset player states
        this.activePlayers.forEach(player => {
            player.isSafe = false;
            player.hand = [];
        });

        this.safeePlayers = [];
        this.drawStack = 0;
        this.declaredSuit = null;
        this.direction = 1;
        this.currentPlayerIndex = 0;
        this.pendingTurnPass = null;
        this.playersWhoHaveDrawn.clear();

        // Create new deck and deal cards
        this.deck = createDeck();
        this.deck = shuffleDeck(this.deck);
        this.drawPile = [...this.deck];
        this.discardPile = [];

        // Deal cards only to active players
        this.dealCardsToActivePlayers();

        // Start discard pile
        if (this.drawPile.length > 0) {
            const firstCard = this.drawPile.pop();
            this.discardPile.push(firstCard);
        }
    }

    dealCardsToActivePlayers() {
        const cardsPerPlayer = 8;
        
        for (let cardCount = 0; cardCount < cardsPerPlayer; cardCount++) {
            for (let player of this.activePlayers) {
                if (this.drawPile.length > 0) {
                    const card = this.drawPile.pop();
                    player.hand.push(card);
                }
            }
        }
    }

    playerHasPlayableCard(playerId) {
        const player = this.getPlayerById(playerId);
        if (!player) return false;

        const topCard = this.getTopDiscardCard();
        if (!topCard) return player.hand.length > 0;

        const suitToMatch = this.declaredSuit || topCard.suit;

        for (const card of player.hand) {
            if (card.rank === '8') {
                return true;
            }

            if (this.drawStack > 0) {
                if (this.canCounterDraw(card)) {
                    return true;
                }
                continue;
            }

            if (card.suit === suitToMatch || card.rank === topCard.rank) {
                return true;
            }
        }

        return false;
    }

    scheduleAutoPass(playerId, delay = 5000) {
        this.cancelAutoPass(playerId);
        const timer = setTimeout(() => {
            if (this.pendingTurnPass === playerId && !this.playerHasPlayableCard(playerId)) {
                const result = this.passTurnAfterDraw(playerId);
                if (result.success && typeof this.onAutoPass === 'function') {
                    this.onAutoPass(playerId);
                }
            }
            this.autoPassTimers.delete(playerId);
        }, delay);
        this.autoPassTimers.set(playerId, timer);
    }

    cancelAutoPass(playerId) {
        const timer = this.autoPassTimers.get(playerId);
        if (timer) {
            clearTimeout(timer);
            this.autoPassTimers.delete(playerId);
        }
    }

    findCardInHand(hand, targetCard) {
        return hand.findIndex(card => 
            card.suit === targetCard.suit && card.rank === targetCard.rank
        );
    }

    cardToString(card) {
        return `${card.rank} of ${card.suit}`;
    }

    getWinner() {
        if (this.gameState === 'finished' && this.activePlayers.length === 1) {
            return this.activePlayers[0];
        }
        return null;
    }

    resetForNewGame() {
        console.log(`🔄 Resetting game ${this.id} for new game`);
        
        // 1. Ensure the game state is 'finished' before proceeding
        if (this.gameState !== 'finished') {
            return { 
                success: false, 
                error: 'Cannot reset game - game is not finished' 
            };
        }

        // 2. Filter out any disconnected players from this.players
        const connectedPlayers = this.players.filter(player => player.isConnected);
        
        if (connectedPlayers.length < 2) {
            return { 
                success: false, 
                error: 'Cannot start new game - need at least 2 connected players' 
            };
        }

        console.log(`🔄 Resetting with ${connectedPlayers.length} connected players:`, 
            connectedPlayers.map(p => p.name));

        // Update players list to only include connected players
        this.players = connectedPlayers;
        this.activePlayers = [...connectedPlayers];

        // 3. Reset game properties
        this.gameState = 'playing';
        this.drawPile = [];
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.declaredSuit = null;
        this.drawStack = 0;
        this.direction = 1;
        this.roundNumber = 1;
        this.safeePlayers = [];
        this.eliminatedPlayers = [];
        this.pendingTurnPass = null;
        this.playersWhoHaveDrawn = new Set();

        // Clear any existing auto pass timers
        for (const timer of this.autoPassTimers.values()) {
            clearTimeout(timer);
        }
        this.autoPassTimers.clear();

        console.log(`🔄 Game properties reset`);

        // 4. Reset the remaining players' status
        this.players.forEach(player => {
            player.isSafe = false;
            player.isEliminated = false;
            player.hand = [];
            console.log(`🔄 Reset player ${player.name} status`);
        });

        // 5. Re-create and shuffle the deck
        try {
            this.deck = createDeck();
            this.deck = shuffleDeck(this.deck);
            this.drawPile = [...this.deck];
            console.log(`🔄 New deck created and shuffled: ${this.drawPile.length} cards`);
        } catch (error) {
            return { 
                success: false, 
                error: 'Failed to create new deck: ' + error.message 
            };
        }

        // 6. Deal 8 new cards to each of the remaining, connected players
        try {
            this.dealCards();
            console.log(`🔄 Dealt 8 cards to each player`);
            
            // Verify dealing was successful
            const allPlayersHave8Cards = this.players.every(player => player.hand.length === 8);
            if (!allPlayersHave8Cards) {
                return { 
                    success: false, 
                    error: 'Failed to deal cards properly to all players' 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: 'Failed to deal cards: ' + error.message 
            };
        }

        // 7. Set up the initial discard pile
        try {
            if (this.drawPile.length > 0) {
                const firstCard = this.drawPile.pop();
                this.discardPile.push(firstCard);
                console.log(`🔄 Initial discard card: ${this.cardToString(firstCard)}`);
            } else {
                return { 
                    success: false, 
                    error: 'Not enough cards to start discard pile' 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: 'Failed to set up discard pile: ' + error.message 
            };
        }

        console.log(`🔄 Game ${this.id} successfully reset for new game`);
        console.log(`   Players: ${this.players.map(p => p.name).join(', ')}`);
        console.log(`   Current player: ${this.getCurrentPlayer()?.name}`);
        console.log(`   Draw pile: ${this.drawPile.length} cards`);
        console.log(`   Discard pile: ${this.discardPile.length} cards`);

        // 8. Return success status
        return {
            success: true,
            message: `New game started with ${this.players.length} players`,
            gameState: this.getGameState()
        };
    }

    // Static method for finding games (for controller use)
    static games = new Map();

    static findById(gameId) {
        return Game.games.get(gameId);
    }

    static addGame(game) {
        Game.games.set(game.id, game);
        return game;
    }

    static removeGame(gameId) {
        Game.games.delete(gameId);
    }
}

module.exports = Game;