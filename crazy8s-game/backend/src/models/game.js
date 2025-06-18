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
        console.log(`playCard called by ${playerId} with cards:`, cards);
        
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

        console.log(`Card play successful. New current player: ${this.getCurrentPlayer()?.name}`);

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
                if (this.activePlayers.length === 2) {
                    // In 1v1, Jack acts as a normal card (no skip effect)
                    // Turn will pass normally after this play
                } else {
                    // Skip the next player in multiplayer games
                    this.nextPlayer();
                }
                break;

            case 'Queen': // Reverse
                if (this.activePlayers.length === 2) {
                    // In 2-player game, Queen acts like Skip
                    this.nextPlayer();
                } else {
                    // Reverse direction
                    this.direction *= -1;
                }
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

        console.log('Validating card stack:', cards.map(c => `${c.rank} of ${c.suit}`));

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
        
        console.log('✅ Stack validation passed');
        return { isValid: true };
    }

    // Simulate turn control for a card sequence
    simulateTurnControl(cardStack) {
        if (cardStack.length === 0) return true;
        
        const isOneVsOne = this.activePlayers.length === 2;
        let currentPlayerHasTurn = true; // We start with control
        
        for (const card of cardStack) {
            switch (card.rank) {
                case 'Jack':
                    if (isOneVsOne) {
                        // In 1v1, Jack acts as a normal card (turn passes)
                        currentPlayerHasTurn = false;
                    } else {
                        // Jack skips opponent, back to us
                        currentPlayerHasTurn = true;
                    }
                    break;
                    
                case 'Queen':
                    if (isOneVsOne) {
                        // In 1v1, Queen acts as skip
                        currentPlayerHasTurn = true;
                    } else {
                        // In multiplayer, Queen reverses direction
                        currentPlayerHasTurn = !currentPlayerHasTurn;
                    }
                    break;
                    
                case 'Ace':
                case '2':
                case '8':
                    // These have effects but pass turn to next player
                    currentPlayerHasTurn = false;
                    break;
                    
                default:
                    // Non-special cards pass the turn
                    currentPlayerHasTurn = false;
                    break;
            }
        }
        
        return currentPlayerHasTurn;
    }

    // Fixed handleMultipleSpecialCards method for game.js
    handleMultipleSpecialCards(cards, declaredSuit = null) {
        console.log('🎮 Processing multiple special cards:', cards.map(c => `${c.rank} of ${c.suit}`));
        
        let totalDrawEffect = 0;
        let hasWild = false;
        
        // Instead of counting effects and applying at end, simulate actual turn flow
        let currentPlayerHasTurn = true; // We start with the turn
        
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            console.log(`  Processing card ${i + 1}/${cards.length}: ${card.rank} of ${card.suit}, currentPlayerHasTurn: ${currentPlayerHasTurn}`);
            
            switch (card.rank) {
                case 'Jack': // Skip
                    if (this.activePlayers.length === 2) {
                        console.log('    Jack (1v1): Acts as normal card');
                        currentPlayerHasTurn = false;
                    } else {
                        console.log('    Jack: Skipping next player');
                        // Skip one player and end our turn
                        this.nextPlayer();
                        currentPlayerHasTurn = false;
                    }
                    break;

                case 'Queen': // Reverse
                    if (this.activePlayers.length === 2) {
                        // In 2-player game, Queen acts as Skip
                        if (currentPlayerHasTurn) {
                            console.log('    Queen (2P): Skipping opponent, keeping turn');
                            currentPlayerHasTurn = true;
                        } else {
                            console.log('    Queen (2P): Getting turn back from skip');
                            currentPlayerHasTurn = true;
                        }
                    } else {
                        // In multi-player, Queen reverses direction
                        console.log('    Queen (Multi): Reversing direction');
                        this.direction *= -1;
                        // After reverse, turn passes to next player in new direction
                        currentPlayerHasTurn = false;
                    }
                    break;

                case 'Ace': // Draw 4
                    console.log('    Ace: +4 draw effect, passing turn');
                    totalDrawEffect += 4;
                    currentPlayerHasTurn = false;
                    break;

                case '2': // Draw 2
                    console.log('    2: +2 draw effect, passing turn');
                    totalDrawEffect += 2;
                    currentPlayerHasTurn = false;
                    break;

                case '8': // Wild card
                    console.log('    8: Wild card, passing turn');
                    hasWild = true;
                    currentPlayerHasTurn = false;
                    break;

                default:
                    // Normal cards pass the turn
                    console.log('    Normal card: Passing turn');
                    currentPlayerHasTurn = false;
                    break;
            }
        }
        
        console.log(`🎮 Final turn control after sequence: currentPlayerHasTurn = ${currentPlayerHasTurn}`);
        
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

        // If we don't have turn control after the sequence, advance to next player
        if (!currentPlayerHasTurn) {
            console.log('🎮 Turn control lost, advancing to next player');
            this.nextPlayer();
        } else {
            console.log('🎮 Turn control maintained, staying with current player');
        }

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

    const drawnCards = [];
    for (let i = 0; i < actualDrawCount; i++) {
        if (this.drawPile.length === 0) {
            this.reshuffleDiscardPile();
        }

        if (this.drawPile.length > 0) {
            const card = this.drawPile.pop();
            player.hand.push(card);
            drawnCards.push(card);
        } else {
            break; // No more cards available
        }
    }

    // Mark player as having drawn this turn (unless it's from special card effect)
    if (!isFromSpecialCard) {
        this.playersWhoHaveDrawn.add(playerId);
    }

    // Check which drawn cards can be played immediately
    const playableDrawnCards = this.getPlayableDrawnCards(drawnCards, playerId);
    const canPlayDrawnCard = playableDrawnCards.length > 0;

    // Set pending turn pass flag only if cards can be played
    if (canPlayDrawnCard) {
        this.pendingTurnPass = playerId;
    } else {
        // No playable cards drawn - auto-advance turn
        this.pendingTurnPass = null;
        if (isFromSpecialCard) {
            // Special card draw - auto advance
            this.nextPlayer();
        } else {
            // Regular draw with no playable cards - set pending for frontend to handle
            this.pendingTurnPass = playerId;
        }
    }

    return {
        success: true,
        drawnCards: drawnCards.map(card => this.cardToString(card)),
        playableDrawnCards: playableDrawnCards,
        canPlayDrawnCard: canPlayDrawnCard,
        fromSpecialCard: isFromSpecialCard,
        gameState: this.getGameState()
    };
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
        if (this.discardPile.length <= 1) return;

        // Keep top card, shuffle the rest back into draw pile
        const topCard = this.discardPile.pop();
        this.drawPile = shuffleDeck([...this.discardPile]);
        this.discardPile = [topCard];
    }

    nextPlayer() {
        if (this.activePlayers.length === 0) return;

        const oldIndex = this.currentPlayerIndex;
        this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.activePlayers.length) % this.activePlayers.length;
        
        this.playersWhoHaveDrawn.clear();
        console.log(`Next player: ${oldIndex} -> ${this.currentPlayerIndex} (${this.activePlayers[this.currentPlayerIndex]?.name})`);
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