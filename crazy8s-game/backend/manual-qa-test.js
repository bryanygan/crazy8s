const SessionStore = require('./src/stores/SessionStore');
const SessionPersistence = require('./src/utils/sessionPersistence');

console.log('=== Manual QA Test: Session Persistence Edge Cases ===');

async function runQATests() {
    try {
        // Test 1: Create session and test basic persistence
        console.log('\n1. Testing basic session creation and persistence...');
        const testSessionId = 'test-session-' + Date.now();
        SessionStore.createSession(testSessionId, 'test-socket', 'TestPlayer', 'test-game');
        
        const loadedData = SessionPersistence.loadSessionData(testSessionId);
        console.log('Session loaded successfully:', loadedData !== null);
        console.log('Player name matches:', loadedData && loadedData.playerName === 'TestPlayer');
        
        // Test 2: Test session migration
        console.log('\n2. Testing session migration (simulating reconnection)...');
        const newSocketId = 'new-socket-' + Date.now();
        const migratedSession = SessionPersistence.migrateSession(testSessionId, newSocketId);
        console.log('Session migration result:', migratedSession !== null);
        
        // Test 3: Test invalid session handling
        console.log('\n3. Testing invalid session handling...');
        const invalidData = SessionPersistence.loadSessionData('non-existent-session');
        console.log('Invalid session handled correctly:', invalidData === null);
        
        // Test 4: Test session stats
        console.log('\n4. Testing session statistics...');
        const stats = SessionPersistence.getSessionStats();
        console.log('Session stats retrieved:', stats && typeof stats.total === 'number');
        console.log('Stats object:', JSON.stringify(stats, null, 2));
        
        // Test 5: Test multiple reconnections simulation
        console.log('\n5. Testing multiple reconnection scenario...');
        for (let i = 0; i < 3; i++) {
            const socketId = 'socket-' + i + '-' + Date.now();
            const result = SessionPersistence.migrateSession(testSessionId, socketId);
            console.log(`Reconnection ${i + 1}:`, result !== null);
        }
        
        // Test 6: Test concurrent access
        console.log('\n6. Testing concurrent session access...');
        const concurrentResults = [];
        for (let i = 0; i < 5; i++) {
            const data = SessionPersistence.loadSessionData(testSessionId);
            concurrentResults.push(data !== null);
        }
        console.log('Concurrent access results:', concurrentResults);
        
        // Test 7: Cleanup test session
        console.log('\n7. Testing session cleanup...');
        const cleanupResult = SessionPersistence.clearSessionData(testSessionId);
        console.log('Session cleanup successful:', cleanupResult);
        
        // Test 8: Test cleanup of non-existent session
        console.log('\n8. Testing cleanup of non-existent session...');
        const invalidCleanup = SessionPersistence.clearSessionData('non-existent');
        console.log('Invalid cleanup handled correctly:', invalidCleanup === false);
        
        console.log('\n=== Manual QA Complete ===');
        
    } catch (error) {
        console.error('QA Test Error:', error);
    }
}

runQATests();