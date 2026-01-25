/**
 * Timeout Stress Test
 * 
 * Tests the optimized timeout configurations under various high-load scenarios
 * including 8-player games, rapid card stacking, and network disruptions.
 */

const io = require('socket.io-client');
const logger = require('../utils/logger');
const { performance } = require('perf_hooks');

// Test configuration
const TEST_CONFIG = {
    serverUrl: process.env.TEST_SERVER_URL || 'http://localhost:3001',
    scenarios: {
        eightPlayerGame: {
            playerCount: 8,
            actionsPerPlayer: 50,
            actionDelay: 100 // ms between actions
        },
        rapidCardStacking: {
            playerCount: 4,
            stackingSequences: 20,
            cardsPerSequence: 8,
            stackDelay: 50 // ms between stack operations
        },
        networkDisruption: {
            playerCount: 6,
            disconnectDuration: 3000, // 3 seconds
            reconnectAttempts: 5
        },
        complexQueries: {
            playerCount: 8,
            simultaneousQueries: 10,
            queryComplexity: 'high' // triggers complex game state updates
        }
    },
    metrics: {
        timeouts: {},
        successes: {},
        averageResponseTimes: {},
        maxResponseTimes: {}
    }
};

class TimeoutStressTest {
    constructor() {
        this.sockets = [];
        this.testResults = {
            scenarios: {},
            summary: {
                totalTimeouts: 0,
                totalSuccesses: 0,
                criticalFailures: []
            }
        };
    }

    /**
     * Run all timeout stress test scenarios
     */
    async runAllTests() {
        logger.info('Starting timeout stress tests...');
        console.log('\n🚀 Starting Backend Timeout Stress Tests\n');

        try {
            // Test 1: 8-Player Game Load
            await this.testEightPlayerGameLoad();
            
            // Test 2: Rapid Card Stacking
            await this.testRapidCardStacking();
            
            // Test 3: Network Disruption Handling
            await this.testNetworkDisruption();
            
            // Test 4: Complex Query Load
            await this.testComplexQueryLoad();
            
            // Generate report
            this.generateTestReport();
            
        } catch (error) {
            logger.error('Test suite failed:', error);
            console.error('❌ Test suite failed:', error.message);
        } finally {
            this.cleanup();
        }
    }

    /**
     * Test 1: 8-Player Game with Heavy Load
     */
    async testEightPlayerGameLoad() {
        console.log('📊 Test 1: 8-Player Game Load Test');
        const scenario = 'eightPlayerGame';
        const config = TEST_CONFIG.scenarios[scenario];
        
        this.testResults.scenarios[scenario] = {
            startTime: Date.now(),
            timeouts: 0,
            successes: 0,
            responseTimes: []
        };

        try {
            // Create 8 player connections
            const players = await this.createPlayers(config.playerCount);
            
            // Create a game
            const gameId = await this.createGame(players[0]);
            
            // All players join the game
            await this.allPlayersJoinGame(players, gameId);
            
            // Simulate heavy game activity
            await this.simulateGameActivity(players, gameId, config.actionsPerPlayer, config.actionDelay);
            
            // Record results
            this.testResults.scenarios[scenario].endTime = Date.now();
            this.testResults.scenarios[scenario].duration = 
                this.testResults.scenarios[scenario].endTime - this.testResults.scenarios[scenario].startTime;
            
            console.log(`✅ 8-Player test completed: ${this.testResults.scenarios[scenario].successes} successes, ${this.testResults.scenarios[scenario].timeouts} timeouts`);
            
        } catch (error) {
            console.error(`❌ 8-Player test failed: ${error.message}`);
            this.testResults.scenarios[scenario].error = error.message;
        }
    }

    /**
     * Test 2: Rapid Card Stacking Scenario
     */
    async testRapidCardStacking() {
        console.log('\n📊 Test 2: Rapid Card Stacking Test');
        const scenario = 'rapidCardStacking';
        const config = TEST_CONFIG.scenarios[scenario];
        
        this.testResults.scenarios[scenario] = {
            startTime: Date.now(),
            timeouts: 0,
            successes: 0,
            responseTimes: []
        };

        try {
            const players = await this.createPlayers(config.playerCount);
            const gameId = await this.createGame(players[0]);
            await this.allPlayersJoinGame(players, gameId);
            
            // Simulate rapid card stacking
            for (let i = 0; i < config.stackingSequences; i++) {
                const player = players[i % config.playerCount];
                await this.simulateCardStacking(player, gameId, config.cardsPerSequence, config.stackDelay);
            }
            
            this.testResults.scenarios[scenario].endTime = Date.now();
            this.testResults.scenarios[scenario].duration = 
                this.testResults.scenarios[scenario].endTime - this.testResults.scenarios[scenario].startTime;
            
            console.log(`✅ Card stacking test completed: ${this.testResults.scenarios[scenario].successes} successes, ${this.testResults.scenarios[scenario].timeouts} timeouts`);
            
        } catch (error) {
            console.error(`❌ Card stacking test failed: ${error.message}`);
            this.testResults.scenarios[scenario].error = error.message;
        }
    }

    /**
     * Test 3: Network Disruption and Reconnection
     */
    async testNetworkDisruption() {
        console.log('\n📊 Test 3: Network Disruption Test');
        const scenario = 'networkDisruption';
        const config = TEST_CONFIG.scenarios[scenario];
        
        this.testResults.scenarios[scenario] = {
            startTime: Date.now(),
            timeouts: 0,
            successes: 0,
            reconnections: 0,
            responseTimes: []
        };

        try {
            const players = await this.createPlayers(config.playerCount);
            const gameId = await this.createGame(players[0]);
            await this.allPlayersJoinGame(players, gameId);
            
            // Simulate network disruptions
            for (let i = 0; i < config.reconnectAttempts; i++) {
                // Disconnect half the players
                const playersToDisconnect = players.slice(0, Math.floor(config.playerCount / 2));
                
                for (const player of playersToDisconnect) {
                    player.socket.disconnect();
                }
                
                // Wait for disconnect duration
                await this.delay(config.disconnectDuration);
                
                // Reconnect players
                for (const player of playersToDisconnect) {
                    await this.reconnectPlayer(player, gameId);
                }
            }
            
            this.testResults.scenarios[scenario].endTime = Date.now();
            this.testResults.scenarios[scenario].duration = 
                this.testResults.scenarios[scenario].endTime - this.testResults.scenarios[scenario].startTime;
            
            console.log(`✅ Network disruption test completed: ${this.testResults.scenarios[scenario].reconnections} successful reconnections`);
            
        } catch (error) {
            console.error(`❌ Network disruption test failed: ${error.message}`);
            this.testResults.scenarios[scenario].error = error.message;
        }
    }

    /**
     * Test 4: Complex Query Load
     */
    async testComplexQueryLoad() {
        console.log('\n📊 Test 4: Complex Query Load Test');
        const scenario = 'complexQueries';
        const config = TEST_CONFIG.scenarios[scenario];
        
        this.testResults.scenarios[scenario] = {
            startTime: Date.now(),
            timeouts: 0,
            successes: 0,
            queryTimes: []
        };

        try {
            const players = await this.createPlayers(config.playerCount);
            const gameId = await this.createGame(players[0]);
            await this.allPlayersJoinGame(players, gameId);
            
            // Generate complex game state
            await this.setupComplexGameState(players, gameId);
            
            // Execute simultaneous complex queries
            const queryPromises = [];
            for (let i = 0; i < config.simultaneousQueries; i++) {
                queryPromises.push(this.executeComplexQuery(players[i % config.playerCount], gameId));
            }
            
            const results = await Promise.allSettled(queryPromises);
            
            // Count successes and failures
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    this.testResults.scenarios[scenario].successes++;
                } else {
                    this.testResults.scenarios[scenario].timeouts++;
                }
            });
            
            this.testResults.scenarios[scenario].endTime = Date.now();
            this.testResults.scenarios[scenario].duration = 
                this.testResults.scenarios[scenario].endTime - this.testResults.scenarios[scenario].startTime;
            
            console.log(`✅ Complex query test completed: ${this.testResults.scenarios[scenario].successes} successes, ${this.testResults.scenarios[scenario].timeouts} timeouts`);
            
        } catch (error) {
            console.error(`❌ Complex query test failed: ${error.message}`);
            this.testResults.scenarios[scenario].error = error.message;
        }
    }

    /**
     * Helper: Create player connections
     */
    async createPlayers(count) {
        const players = [];
        
        for (let i = 0; i < count; i++) {
            const socket = io(TEST_CONFIG.serverUrl, {
                transports: ['websocket'],
                reconnection: false
            });
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
                
                socket.on('connect', () => {
                    clearTimeout(timeout);
                    players.push({
                        id: i,
                        name: `Player${i + 1}`,
                        socket: socket
                    });
                    resolve();
                });
                
                socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
        }
        
        this.sockets.push(...players.map(p => p.socket));
        return players;
    }

    /**
     * Helper: Create a game
     */
    async createGame(player) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Create game timeout')), 15000);
            
            player.socket.emit('createGame', {
                gameName: 'Stress Test Game',
                maxPlayers: 8,
                timerDuration: 60
            });
            
            player.socket.once('gameCreated', (data) => {
                clearTimeout(timeout);
                resolve(data.gameId);
            });
            
            player.socket.once('error', (error) => {
                clearTimeout(timeout);
                reject(new Error(error.message));
            });
        });
    }

    /**
     * Helper: All players join game
     */
    async allPlayersJoinGame(players, gameId) {
        const joinPromises = players.map(player => {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Join game timeout')), 10000);
                
                player.socket.emit('joinGame', {
                    gameId: gameId,
                    playerName: player.name
                });
                
                player.socket.once('gameJoined', () => {
                    clearTimeout(timeout);
                    resolve();
                });
                
                player.socket.once('error', (error) => {
                    clearTimeout(timeout);
                    reject(new Error(error.message));
                });
            });
        });
        
        await Promise.all(joinPromises);
    }

    /**
     * Helper: Simulate game activity
     */
    async simulateGameActivity(players, gameId, actionsPerPlayer, actionDelay) {
        for (let i = 0; i < actionsPerPlayer; i++) {
            for (const player of players) {
                const startTime = performance.now();
                
                try {
                    await this.performGameAction(player, gameId);
                    const responseTime = performance.now() - startTime;
                    
                    this.testResults.scenarios.eightPlayerGame.responseTimes.push(responseTime);
                    this.testResults.scenarios.eightPlayerGame.successes++;
                    
                } catch (error) {
                    this.testResults.scenarios.eightPlayerGame.timeouts++;
                }
                
                await this.delay(actionDelay);
            }
        }
    }

    /**
     * Helper: Perform a game action
     */
    async performGameAction(player, gameId) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Action timeout'));
            }, 30000); // 30 second timeout
            
            player.socket.emit('makeMove', {
                gameId: gameId,
                action: 'playCard',
                card: { rank: '7', suit: 'hearts' }
            });
            
            player.socket.once('moveProcessed', () => {
                clearTimeout(timeout);
                resolve();
            });
            
            player.socket.once('error', () => {
                clearTimeout(timeout);
                reject(new Error('Move failed'));
            });
        });
    }

    /**
     * Helper: Simulate card stacking
     */
    async simulateCardStacking(player, gameId, cardsPerSequence, stackDelay) {
        for (let i = 0; i < cardsPerSequence; i++) {
            const startTime = performance.now();
            
            try {
                await this.performStackAction(player, gameId, i);
                const responseTime = performance.now() - startTime;
                
                this.testResults.scenarios.rapidCardStacking.responseTimes.push(responseTime);
                this.testResults.scenarios.rapidCardStacking.successes++;
                
            } catch (error) {
                this.testResults.scenarios.rapidCardStacking.timeouts++;
            }
            
            await this.delay(stackDelay);
        }
    }

    /**
     * Helper: Perform stack action
     */
    async performStackAction(player, gameId, stackIndex) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Stack action timeout'));
            }, 15000);
            
            player.socket.emit('makeMove', {
                gameId: gameId,
                action: 'stackCard',
                card: { rank: '2', suit: 'spades' },
                stackIndex: stackIndex
            });
            
            player.socket.once('stackProcessed', () => {
                clearTimeout(timeout);
                resolve();
            });
            
            player.socket.once('error', () => {
                clearTimeout(timeout);
                reject(new Error('Stack failed'));
            });
        });
    }

    /**
     * Helper: Reconnect player
     */
    async reconnectPlayer(player, gameId) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Reconnection timeout'));
            }, 30000);
            
            player.socket.connect();
            
            player.socket.once('connect', () => {
                player.socket.emit('manual_reconnect', {
                    gameId: gameId,
                    playerName: player.name
                });
            });
            
            player.socket.once('manual_reconnect_success', () => {
                clearTimeout(timeout);
                this.testResults.scenarios.networkDisruption.reconnections++;
                resolve();
            });
            
            player.socket.once('manual_reconnect_failed', () => {
                clearTimeout(timeout);
                reject(new Error('Reconnection failed'));
            });
        });
    }

    /**
     * Helper: Setup complex game state
     */
    async setupComplexGameState(players, gameId) {
        // Add multiple stacked cards
        for (let i = 0; i < 5; i++) {
            await this.performStackAction(players[0], gameId, i);
        }
        
        // Add active effects
        await this.performGameAction(players[1], gameId);
        
        // Fill player hands
        for (const player of players) {
            for (let i = 0; i < 10; i++) {
                await this.drawCard(player, gameId);
            }
        }
    }

    /**
     * Helper: Draw card
     */
    async drawCard(player, gameId) {
        return new Promise((resolve) => {
            player.socket.emit('drawCard', { gameId });
            setTimeout(resolve, 100);
        });
    }

    /**
     * Helper: Execute complex query
     */
    async executeComplexQuery(player, gameId) {
        const startTime = performance.now();
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Query timeout'));
            }, 60000); // 60 second timeout for complex queries
            
            player.socket.emit('getCompleteGameState', {
                gameId: gameId,
                includeHistory: true,
                includeStatistics: true
            });
            
            player.socket.once('completeGameState', () => {
                clearTimeout(timeout);
                const queryTime = performance.now() - startTime;
                this.testResults.scenarios.complexQueries.queryTimes.push(queryTime);
                resolve();
            });
            
            player.socket.once('error', () => {
                clearTimeout(timeout);
                reject(new Error('Query failed'));
            });
        });
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        console.log('\n📋 TIMEOUT STRESS TEST REPORT');
        console.log('================================\n');
        
        // Calculate summary statistics
        let totalTests = 0;
        let totalSuccesses = 0;
        let totalTimeouts = 0;
        
        Object.entries(this.testResults.scenarios).forEach(([scenario, results]) => {
            console.log(`📊 ${scenario.toUpperCase()}`);
            
            if (results.error) {
                console.log(`   Status: ❌ FAILED - ${results.error}`);
            } else {
                const successRate = results.successes / (results.successes + results.timeouts) * 100;
                console.log(`   Status: ${successRate >= 95 ? '✅' : successRate >= 80 ? '⚠️' : '❌'} ${successRate.toFixed(1)}% success rate`);
                console.log(`   Duration: ${(results.duration / 1000).toFixed(2)}s`);
                console.log(`   Successes: ${results.successes}`);
                console.log(`   Timeouts: ${results.timeouts}`);
                
                if (results.responseTimes && results.responseTimes.length > 0) {
                    const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
                    const maxResponseTime = Math.max(...results.responseTimes);
                    console.log(`   Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
                    console.log(`   Max Response Time: ${maxResponseTime.toFixed(2)}ms`);
                }
                
                if (results.reconnections !== undefined) {
                    console.log(`   Successful Reconnections: ${results.reconnections}`);
                }
                
                totalTests += results.successes + results.timeouts;
                totalSuccesses += results.successes;
                totalTimeouts += results.timeouts;
            }
            
            console.log('');
        });
        
        // Overall summary
        const overallSuccessRate = totalTests > 0 ? (totalSuccesses / totalTests * 100) : 0;
        
        console.log('📊 OVERALL SUMMARY');
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Total Successes: ${totalSuccesses}`);
        console.log(`   Total Timeouts: ${totalTimeouts}`);
        console.log(`   Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`);
        console.log(`   Status: ${overallSuccessRate >= 95 ? '✅ EXCELLENT' : overallSuccessRate >= 80 ? '⚠️ GOOD' : '❌ NEEDS IMPROVEMENT'}`);
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS');
        
        if (this.testResults.scenarios.eightPlayerGame?.timeouts > 5) {
            console.log('   - Consider further increasing timeouts for 8-player games');
        }
        
        if (this.testResults.scenarios.rapidCardStacking?.timeouts > 3) {
            console.log('   - Action throttling may be too restrictive for rapid play');
        }
        
        if (this.testResults.scenarios.networkDisruption?.reconnections < 
            TEST_CONFIG.scenarios.networkDisruption.reconnectAttempts * TEST_CONFIG.scenarios.networkDisruption.playerCount / 2) {
            console.log('   - Reconnection logic may need improvement');
        }
        
        if (this.testResults.scenarios.complexQueries?.timeouts > 2) {
            console.log('   - Database query optimization needed for complex operations');
        }
        
        console.log('\n✅ Test suite completed\n');
    }

    /**
     * Helper: Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cleanup connections
     */
    cleanup() {
        this.sockets.forEach(socket => {
            if (socket.connected) {
                socket.disconnect();
            }
        });
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new TimeoutStressTest();
    tester.runAllTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = TimeoutStressTest;