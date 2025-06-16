const { Card, Deck, Player, Game } = require('../src/models');


// =============================================================================
// CARD CLASS TESTS
// =============================================================================

function testCardClass() {
    console.log('=== TESTING CARD CLASS ===');
    
    // Test 1: Card creation and basic properties
    console.log('\n1. Card Creation:');
    const card1 = new Card('Hearts', '7');
    const card2 = new Card('Spades', '7');
    const card3 = new Card('Hearts', 'King');
    
    console.log('Card 1:', card1.toString()); // Should show "7 of Hearts"
    console.log('Card 2:', card2.toString()); // Should show "7 of Spades"
    console.log('Card 3:', card3.toString()); // Should show "King of Hearts"
    
    // Test 2: Card matching
    console.log('\n2. Card Matching:');
    console.log('Card1 matches Card2 (same rank):', card1.matches(card2)); // true
    console.log('Card1 matches Card3 (same suit):', card1.matches(card3)); // true
    console.log('Card2 matches Card3 (no match):', card2.matches(card3)); // false
    
    // Test 3: Special cards
    console.log('\n3. Special Cards:');
    const specialCards = [
        new Card('Hearts', 'Jack'),
        new Card('Clubs', 'Queen'), 
        new Card('Spades', 'Ace'),
        new Card('Diamonds', '2'),
        new Card('Hearts', '8')
    ];
    
    specialCards.forEach(card => {
        console.log(`${card.toString()}: Special=${card.isSpecial()}, Effect=${JSON.stringify(card.getEffect())}`);
    });
    
    // Test 4: Counter abilities
    console.log('\n4. Counter Abilities:');
    const ace = new Card('Hearts', 'Ace');
    const two = new Card('Hearts', '2');
    const twoSpades = new Card('Spades', '2');
    
    console.log('Ace can counter Ace:', ace.canCounter(ace)); // true
    console.log('2 of Hearts can counter Ace of Hearts:', two.canCounter(ace)); // true
    console.log('2 of Spades can counter Ace of Hearts:', twoSpades.canCounter(ace)); // false
}

// =============================================================================
// DECK CLASS TESTS
// =============================================================================

function testDeckClass() {
    console.log('\n\n=== TESTING DECK CLASS ===');
    
    // Test 1: Deck initialization
    console.log('\n1. Deck Initialization:');
    const deck = new Deck();
    console.log('Deck size:', deck.size()); // Should be 52
    console.log('Is empty:', deck.isEmpty()); // Should be false
    
    // Test 2: Shuffling (check if order changes)
    console.log('\n2. Shuffling:');
    const originalFirst = deck.cards[0].toString();
    deck.shuffle();
    const shuffledFirst = deck.cards[0].toString();
    console.log('Original first card:', originalFirst);
    console.log('After shuffle first card:', shuffledFirst);
    console.log('Order changed:', originalFirst !== shuffledFirst);
    
    // Test 3: Dealing cards
    console.log('\n3. Dealing Cards:');
    const singleCard = deck.deal();
    console.log('Dealt single card:', singleCard.toString());
    console.log('Deck size after dealing 1:', deck.size()); // Should be 51
    
    const multipleCards = deck.deal(5);
    console.log('Dealt 5 cards:', multipleCards.map(c => c.toString()));
    console.log('Deck size after dealing 5 more:', deck.size()); // Should be 46
    
    // Test 4: Empty deck
    console.log('\n4. Empty Deck:');
    const remainingCards = deck.deal(deck.size());
    console.log('Dealt all remaining cards, count:', remainingCards.length);
    console.log('Deck is now empty:', deck.isEmpty()); // Should be true
    console.log('Trying to deal from empty deck:', deck.deal()); // Should be undefined
}

// =============================================================================
// PLAYER CLASS TESTS
// =============================================================================

function testPlayerClass() {
    console.log('\n\n=== TESTING PLAYER CLASS ===');
    
    // Test 1: Player creation
    console.log('\n1. Player Creation:');
    const player = new Player('player1', 'Alice');
    console.log('Player ID:', player.id);
    console.log('Player name:', player.name);
    console.log('Initial hand size:', player.getHandSize()); // Should be 0
    
    // Test 2: Adding cards
    console.log('\n2. Adding Cards:');
    const testCards = [
        new Card('Hearts', '7'),
        new Card('Spades', '7'),
        new Card('Hearts', 'King'),
        new Card('Clubs', '8')
    ];
    
    player.addCards(testCards);
    console.log('Hand size after adding 4 cards:', player.getHandSize()); // Should be 4
    console.log('Player hand:', player.hand.map(c => c.toString()));
    
    // Test 3: Valid cards
    console.log('\n3. Valid Cards:');
    const topCard = new Card('Hearts', 'Queen');
    const validCards = player.getValidCards(topCard);
    console.log('Top card:', topCard.toString());
    console.log('Valid cards from hand:', validCards.map(c => c.toString()));
    
    // Test 4: Removing cards
    console.log('\n4. Removing Cards:');
    const cardToRemove = testCards[0]; // 7 of Hearts
    player.removeCards(cardToRemove);
    console.log('Hand after removing 7 of Hearts:', player.hand.map(c => c.toString()));
    console.log('Hand size:', player.getHandSize()); // Should be 3
    
    // Test 5: Win condition
    console.log('\n5. Win Condition:');
    console.log('Has player won:', player.hasWon()); // Should be false
    player.removeCards(player.hand); // Remove all cards
    console.log('Hand size after removing all:', player.getHandSize()); // Should be 0
    console.log('Has player won now:', player.hasWon()); // Should be true
}

// =============================================================================
// GAME CLASS TESTS
// =============================================================================

function testGameClass() {
    console.log('\n\n=== TESTING GAME CLASS ===');
    
    // Test 1: Game initialization
    console.log('\n1. Game Initialization:');
    const playerIds = ['p1', 'p2', 'p3'];
    const playerNames = ['Alice', 'Bob', 'Charlie'];
    const game = new Game(playerIds, playerNames);
    
    console.log('Number of players:', game.players.length);
    console.log('Player names:', game.players.map(p => p.name));
    console.log('Initial game state:', game.gameState);
    
    // Test 2: Starting game
    console.log('\n2. Starting Game:');
    const gameState = game.startGame();
    console.log('Game state after start:', gameState.gameState);
    console.log('Current player:', gameState.currentPlayer);
    console.log('Top card:', gameState.topCard.toString());
    console.log('Players hand sizes:', gameState.players.map(p => `${p.name}: ${p.handSize}`));
    
    // Test 3: Playing cards
    console.log('\n3. Playing Cards:');
    const currentPlayer = game.getCurrentPlayer();
    const playerHand = game.getPlayerHand(currentPlayer.id);
    console.log('Current player hand:', playerHand.map(c => c.toString()));
    
    const validCards = currentPlayer.getValidCards(game.getTopDiscardCard(), game.declaredSuit);
    console.log('Valid cards:', validCards.map(c => c.toString()));
    
    if (validCards.length > 0) {
        const cardToPlay = validCards[0];
        console.log('Playing card:', cardToPlay.toString());
        const result = game.playCards(currentPlayer.id, cardToPlay);
        console.log('Play result:', result.success ? 'Success' : result.error);
        
        if (result.success) {
            console.log('New current player:', result.gameState.currentPlayer);
            console.log('New top card:', result.gameState.topCard.toString());
        }
    }
    
    // Test 4: Drawing cards
    console.log('\n4. Drawing Cards:');
    const drawResult = game.drawCards(game.getCurrentPlayer().id, 2);
    console.log('Draw result:', drawResult.success ? 'Success' : drawResult.error);
    if (drawResult.success) {
        console.log('Drew cards:', drawResult.drawnCards.map(c => c.toString()));
    }
}

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

function testSpecialCardEffects() {
    console.log('\n\n=== TESTING SPECIAL CARD EFFECTS ===');
    
    const game = new Game(['p1', 'p2', 'p3'], ['Alice', 'Bob', 'Charlie']);
    game.startGame();
    
    console.log('\n1. Testing Skip (Jack):');
    const jack = new Card('Hearts', 'Jack');
    const player1 = game.getCurrentPlayer();
    console.log('Before Jack - Current player:', player1.name);
    
    // Manually add jack to player's hand for testing
    player1.addCards([jack]);
    const skipResult = game.playCards(player1.id, jack);
    console.log('Skip result:', skipResult.success);
    if (skipResult.success) {
        console.log('After Jack - Current player:', game.getCurrentPlayer().name);
    }
    
    console.log('\n2. Testing Reverse (Queen):');
    const queen = new Card('Hearts', 'Queen');
    const currentPlayer = game.getCurrentPlayer();
    console.log('Direction before Queen:', game.direction);
    
    currentPlayer.addCards([queen]);
    const reverseResult = game.playCards(currentPlayer.id, queen);
    console.log('Reverse result:', reverseResult.success);
    if (reverseResult.success) {
        console.log('Direction after Queen:', game.direction);
    }
    
    console.log('\n3. Testing Wild Card (8):');
    const eight = new Card('Clubs', '8');
    const wildPlayer = game.getCurrentPlayer();
    
    wildPlayer.addCards([eight]);
    const wildResult = game.playCards(wildPlayer.id, eight, 'Spades');
    console.log('Wild result:', wildResult.success);
    if (wildResult.success) {
        console.log('Declared suit:', game.declaredSuit);
    }
}

function testCardStacking() {
    console.log('\n\n=== TESTING CARD STACKING ===');
    
    const game = new Game(['p1', 'p2'], ['Alice', 'Bob']);
    game.startGame();
    
    // Test stacking same rank cards
    console.log('\n1. Testing Same Rank Stacking:');
    const player = game.getCurrentPlayer();
    const stackCards = [
        new Card('Hearts', '7'),
        new Card('Clubs', '7'),
        new Card('Spades', '7')
    ];
    
    // Set up a compatible top card
    game.discardPile = [new Card('Diamonds', '7')];
    
    player.addCards(stackCards);
    const stackResult = game.playCards(player.id, stackCards);
    console.log('Stack result:', stackResult.success);
    if (stackResult.success) {
        console.log('Successfully played 3 sevens');
        console.log('Player hand size after stacking:', player.getHandSize());
    }
    
    console.log('\n2. Testing Draw Card Stacking:');
    const player2 = game.getCurrentPlayer();
    const drawCards = [
        new Card('Hearts', 'Ace'),
        new Card('Hearts', '2')  // Same suit as Ace
    ];
    
    player2.addCards(drawCards);
    const drawStackResult = game.playCards(player2.id, drawCards);
    console.log('Draw stack result:', drawStackResult.success);
    if (drawStackResult.success) {
        console.log('Draw stack amount:', game.drawStack); // Should be 6 (4+2)
    }
}

function testTournamentFlow() {
    console.log('\n\n=== TESTING TOURNAMENT FLOW ===');
    
    const game = new Game(['p1', 'p2', 'p3'], ['Alice', 'Bob', 'Charlie']);
    game.startGame();
    
    console.log('Initial active players:', game.activePlayers.length);
    console.log('Round number:', game.roundNumber);
    
    // Simulate a player winning by emptying their hand
    const player1 = game.players[0];
    player1.hand = []; // Empty hand
    
    // Trigger win condition check
    const winResult = game.playCards(player1.id, []);
    console.log('After player wins:');
    console.log('Player 1 is safe:', player1.isSafe);
    console.log('Active players:', game.activePlayers.length);
    
    // Simulate eliminating last player
    if (game.activePlayers.length === 2) {
        const lastPlayer = game.activePlayers[1];
        lastPlayer.isEliminated = true;
        game.eliminatePlayer(lastPlayer);
        
        console.log('After elimination:');
        console.log('Game state:', game.gameState);
        console.log('Winner:', game.getWinner()?.name);
    }
}

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

function testErrorHandling() {
    console.log('\n\n=== TESTING ERROR HANDLING ===');
    
    const game = new Game(['p1', 'p2'], ['Alice', 'Bob']);
    game.startGame();
    
    console.log('\n1. Invalid Player Turn:');
    const wrongPlayer = game.players[1]; // Not current player
    const card = new Card('Hearts', '7');
    wrongPlayer.addCards([card]);
    
    const wrongTurnResult = game.playCards(wrongPlayer.id, card);
    console.log('Wrong turn result:', wrongTurnResult.error);
    
    console.log('\n2. Invalid Card Play:');
    const currentPlayer = game.getCurrentPlayer();
    const invalidCard = new Card('Clubs', '3'); // Assuming this doesn't match
    currentPlayer.addCards([invalidCard]);
    
    const invalidResult = game.playCards(currentPlayer.id, invalidCard);
    console.log('Invalid card result:', invalidResult.success ? 'Unexpected success' : invalidResult.error);
    
    console.log('\n3. Player Doesn\'t Have Card:');
    const nonExistentCard = new Card('Diamonds', 'King');
    const noCardResult = game.playCards(currentPlayer.id, nonExistentCard);
    console.log('No card result:', noCardResult.error);
    
    console.log('\n4. Wild Card Without Suit Declaration:');
    const wild = new Card('Hearts', '8');
    currentPlayer.addCards([wild]);
    const noSuitResult = game.playCards(currentPlayer.id, wild); // No declared suit
    console.log('No suit declaration result:', noSuitResult.error);
}

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

function testPerformance() {
    console.log('\n\n=== TESTING PERFORMANCE ===');
    
    console.log('\n1. Deck Shuffle Performance:');
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
        const deck = new Deck();
        deck.shuffle();
    }
    const end = Date.now();
    console.log(`1000 deck shuffles took ${end - start}ms`);
    
    console.log('\n2. Game State Retrieval:');
    const game = new Game(['p1', 'p2', 'p3', 'p4'], ['Alice', 'Bob', 'Charlie', 'Dave']);
    game.startGame();
    
    const stateStart = Date.now();
    for (let i = 0; i < 100; i++) {
        game.getGameState();
    }
    const stateEnd = Date.now();
    console.log(`100 game state retrievals took ${stateEnd - stateStart}ms`);
    
    console.log('\n3. Card Validation Performance:');
    const player = game.getCurrentPlayer();
    const validStart = Date.now();
    for (let i = 0; i < 100; i++) {
        player.getValidCards(game.getTopDiscardCard());
    }
    const validEnd = Date.now();
    console.log(`100 valid card checks took ${validEnd - validStart}ms`);
}

// =============================================================================
// RUN ALL TESTS
// =============================================================================

function runAllTests() {
    console.log('🃏 CRAZY 8\'S GAME CLASS TESTS 🃏');
    console.log('=====================================');
    
    try {
        testCardClass();
        testDeckClass();
        testPlayerClass();
        testGameClass();
        testSpecialCardEffects();
        testCardStacking();
        testTournamentFlow();
        testErrorHandling();
        testPerformance();
        
        console.log('\n\n✅ ALL TESTS COMPLETED!');
        console.log('Check the output above for any issues.');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        console.error('Stack trace:', error.stack);
    }
}

// =============================================================================
// MANUAL TESTING HELPERS
// =============================================================================

function createTestGame() {
    console.log('\n=== CREATING TEST GAME FOR MANUAL TESTING ===');
    
    const game = new Game(['human', 'ai1', 'ai2'], ['You', 'Computer 1', 'Computer 2']);
    game.startGame();
    
    console.log('Game created! Use these commands:');
    console.log('- game.getPlayerHand("human") // See your cards');
    console.log('- game.getGameState() // See current state');
    console.log('- game.playCards("human", card) // Play a card');
    console.log('- game.drawCards("human", 1) // Draw a card');
    
    const humanHand = game.getPlayerHand('human');
    console.log('\nYour starting hand:');
    humanHand.forEach((card, i) => {
        console.log(`${i}: ${card.toString()}`);
    });
    
    console.log('\nTop card:', game.getTopDiscardCard().toString());
    console.log('Current player:', game.getCurrentPlayer().name);
    
    return game;
}

function simulateGameRound(game) {
    console.log('\n=== SIMULATING GAME ROUND ===');
    
    let turnCount = 0;
    const maxTurns = 50; // Prevent infinite loops
    
    while (game.gameState === 'playing' && turnCount < maxTurns) {
        const currentPlayer = game.getCurrentPlayer();
        const hand = game.getPlayerHand(currentPlayer.id);
        const validCards = currentPlayer.getValidCards(game.getTopDiscardCard(), game.declaredSuit);
        
        console.log(`\nTurn ${turnCount + 1}: ${currentPlayer.name}`);
        console.log(`Hand size: ${hand.length}, Valid cards: ${validCards.length}`);
        
        if (validCards.length > 0) {
            // Play a random valid card
            const cardToPlay = validCards[Math.floor(Math.random() * validCards.length)];
            let declaredSuit = null;
            
            if (cardToPlay.rank === '8') {
                declaredSuit = ['Hearts', 'Diamonds', 'Clubs', 'Spades'][Math.floor(Math.random() * 4)];
            }
            
            console.log(`Playing: ${cardToPlay.toString()}${declaredSuit ? ` (declaring ${declaredSuit})` : ''}`);
            const result = game.playCards(currentPlayer.id, cardToPlay, declaredSuit);
            
            if (!result.success) {
                console.log('Play failed:', result.error);
                break;
            }
            
            if (result.gameWon) {
                console.log(`🎉 Game won by ${result.winner}!`);
                break;
            }
        } else {
            // Draw a card
            console.log('No valid cards, drawing...');
            const drawResult = game.drawCards(currentPlayer.id, game.drawStack || 1);
            if (!drawResult.success) {
                console.log('Draw failed:', drawResult.error);
                break;
            }
        }
        
        turnCount++;
    }
    
    if (turnCount >= maxTurns) {
        console.log('Game simulation stopped after maximum turns');
    }
    
    return game.getGameState();
}

// Export test functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testCardClass,
        testDeckClass,
        testPlayerClass,
        testGameClass,
        testSpecialCardEffects,
        testCardStacking,
        testTournamentFlow,
        testErrorHandling,
        testPerformance,
        createTestGame,
        simulateGameRound
    };
}

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
    runAllTests();
}