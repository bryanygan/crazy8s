#!/usr/bin/env node

/**
 * Test script to verify duplicate game creation fix using single socket
 * Tests the duplicate prevention mechanism more accurately by simulating
 * real-world scenarios where a user might double-click or network issues
 * cause duplicate requests from the same client session.
 */

const io = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3001';

function logResult(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function testSingleSocketDuplicates(playerName, testName, emitCount = 2, delayMs = 50) {
  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      timeout: 10000
    });

    const gameIds = new Set();
    let gameUpdateCount = 0;
    let errorCount = 0;
    let duplicateBlockedCount = 0;
    let emitsSent = 0;

    socket.on('connect', () => {
      logResult(`Connected for ${testName}`, 'info');
      
      // Send multiple createGame requests from same socket
      for (let i = 0; i < emitCount; i++) {
        setTimeout(() => {
          emitsSent++;
          logResult(`Sending createGame request ${emitsSent}/${emitCount} (delay: ${i * delayMs}ms)`, 'info');
          socket.emit('createGame', { playerName });
        }, i * delayMs);
      }

      // Disconnect after test period
      setTimeout(() => {
        socket.disconnect();
      }, 8000);
    });

    socket.on('gameUpdate', (data) => {
      gameUpdateCount++;
      if (data.gameId) {
        gameIds.add(data.gameId);
        logResult(`Game created: ${data.gameId} (Update #${gameUpdateCount})`, 'success');
      }
    });

    socket.on('error', (error) => {
      errorCount++;
      const errorMsg = error.message || error;
      if (errorMsg.includes('too frequent') || errorMsg.includes('already in a game')) {
        duplicateBlockedCount++;
        logResult(`Duplicate request BLOCKED: ${errorMsg}`, 'success');
      } else {
        logResult(`Error received: ${errorMsg}`, 'error');
      }
    });

    socket.on('disconnect', () => {
      logResult(`Disconnected from ${testName}`, 'info');
      
      const result = {
        testName,
        emitsSent,
        gamesCreated: gameIds.size,
        notifications: gameUpdateCount,
        errors: errorCount,
        duplicatesBlocked: duplicateBlockedCount,
        gameIds: [...gameIds],
        success: gameIds.size <= 1 && duplicateBlockedCount >= 0
      };

      // Analyze results
      if (gameIds.size > 1) {
        logResult(`❌ DUPLICATE GAMES CREATED! ${gameIds.size} games: ${result.gameIds.join(', ')}`, 'error');
        result.success = false;
      } else if (gameIds.size === 1 && duplicateBlockedCount > 0) {
        logResult(`✅ SUCCESS: One game created, ${duplicateBlockedCount} duplicates blocked`, 'success');
      } else if (gameIds.size === 1 && duplicateBlockedCount === 0) {
        logResult(`✅ SUCCESS: Single game created (no duplicates attempted)`, 'success');
      } else if (gameIds.size === 0 && duplicateBlockedCount > 0) {
        logResult(`⚠️ No games created but duplicates blocked (unexpected)`, 'info');
      } else {
        logResult(`⚠️ No games created (errors: ${errorCount})`, 'info');
      }

      resolve(result);
    });
  });
}

async function runComprehensiveTests() {
  console.log('🧪 Comprehensive Duplicate Game Creation Prevention Test');
  console.log('=' .repeat(70));
  
  const testResults = [];

  try {
    // Test 1: Normal single request (baseline)
    logResult('Test 1: Single game creation (baseline)', 'info');
    const result1 = await testSingleSocketDuplicates('TestPlayer1', 'Single Request', 1, 0);
    testResults.push(result1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Double-click simulation (50ms apart)
    logResult('Test 2: Double-click (50ms delay)', 'info');
    const result2 = await testSingleSocketDuplicates('TestPlayer2', 'Double-click 50ms', 2, 50);
    testResults.push(result2);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Very rapid double-click (10ms apart)
    logResult('Test 3: Very rapid double-click (10ms delay)', 'info');
    const result3 = await testSingleSocketDuplicates('TestPlayer3', 'Double-click 10ms', 2, 10);
    testResults.push(result3);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Triple-click simulation (100ms apart)
    logResult('Test 4: Triple-click (100ms delay)', 'info');
    const result4 = await testSingleSocketDuplicates('TestPlayer4', 'Triple-click 100ms', 3, 100);
    testResults.push(result4);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 5: Slow requests (3 seconds apart - should allow both)
    logResult('Test 5: Slow requests (3 second delay - should work)', 'info');
    const result5 = await testSingleSocketDuplicates('TestPlayer5', 'Slow requests 3s', 2, 3000);
    testResults.push(result5);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test results summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('=' .repeat(70));
    
    let allTestsPassed = true;
    let totalDuplicatesBlocked = 0;
    let totalDuplicatesCreated = 0;

    testResults.forEach((result, index) => {
      const testNum = index + 1;
      console.log(`\n🧪 Test ${testNum}: ${result.testName}`);
      console.log(`   Requests sent: ${result.emitsSent}`);
      console.log(`   Games created: ${result.gamesCreated}`);
      console.log(`   Notifications: ${result.notifications}`);
      console.log(`   Errors/Blocked: ${result.errors} (${result.duplicatesBlocked} duplicate blocks)`);
      console.log(`   Result: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
      
      if (result.gameIds.length > 0) {
        console.log(`   Game IDs: ${result.gameIds.join(', ')}`);
      }

      if (!result.success) {
        allTestsPassed = false;
      }

      totalDuplicatesBlocked += result.duplicatesBlocked;
      if (result.gamesCreated > 1) {
        totalDuplicatesCreated += (result.gamesCreated - 1);
      }
    });

    console.log(`\n📈 FINAL SUMMARY:`);
    console.log(`   Tests passed: ${testResults.filter(r => r.success).length}/${testResults.length}`);
    console.log(`   Duplicates blocked: ${totalDuplicatesBlocked}`);
    console.log(`   Duplicates created: ${totalDuplicatesCreated}`);
    
    if (allTestsPassed && totalDuplicatesCreated === 0) {
      logResult('🎉 ALL TESTS PASSED - Duplicate prevention is working!', 'success');
      return true;
    } else {
      logResult(`❌ SOME TESTS FAILED - Duplicate prevention needs improvement`, 'error');
      return false;
    }

  } catch (error) {
    logResult(`Test suite failed: ${error.message}`, 'error');
    return false;
  }
}

// Main execution
async function main() {
  const success = await runComprehensiveTests();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSingleSocketDuplicates, runComprehensiveTests };