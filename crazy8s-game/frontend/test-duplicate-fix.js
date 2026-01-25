#!/usr/bin/env node

/**
 * Test script to verify duplicate game creation fix
 * Tests the fix for preventing duplicate games from being created
 * when users double-click or encounter slow network conditions.
 */

const io = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3001';

let testResults = {
  gamesCreated: 0,
  notifications: 0,
  errors: 0,
  duplicates: 0
};

function logResult(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function createTestSocket(playerName, testType, emitCount = 1) {
  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      forceNew: true,
      timeout: 10000
    });

    const gameIds = new Set();
    let gameUpdateCount = 0;
    let errorCount = 0;
    let emitsSent = 0;

    socket.on('connect', () => {
      logResult(`Connected for test: ${testType}`, 'info');
      
      // Send create game requests based on test type
      for (let i = 0; i < emitCount; i++) {
        setTimeout(() => {
          emitsSent++;
          logResult(`Sending createGame request ${emitsSent}/${emitCount}`, 'info');
          socket.emit('createGame', { playerName });
        }, i * 50); // 50ms delay between emissions
      }

      // Disconnect after test period
      setTimeout(() => {
        socket.disconnect();
      }, 5000);
    });

    socket.on('gameUpdate', (data) => {
      gameUpdateCount++;
      if (data.gameId) {
        gameIds.add(data.gameId);
        testResults.gamesCreated++;
        testResults.notifications++;
        logResult(`Game created: ${data.gameId} (Update #${gameUpdateCount})`, 'success');
      }
    });

    socket.on('error', (error) => {
      errorCount++;
      testResults.errors++;
      logResult(`Error received: ${error.message || error}`, 'error');
    });

    socket.on('disconnect', () => {
      logResult(`Disconnected from test: ${testType}`, 'info');
      
      // Check for duplicates
      let hasDuplicates = false;
      
      if (gameIds.size > 1) {
        testResults.duplicates++;
        hasDuplicates = true;
        logResult(`DUPLICATE GAMES! Got ${gameIds.size} different game IDs: ${[...gameIds].join(', ')}`, 'error');
      } else if (gameUpdateCount > 1 && gameIds.size === 1) {
        testResults.duplicates++;
        hasDuplicates = true;
        logResult(`DUPLICATE NOTIFICATIONS! Got ${gameUpdateCount} notifications for same game ${[...gameIds][0]}`, 'error');
      }
      
      if (!hasDuplicates && gameIds.size === 1) {
        logResult(`✅ Test passed: Single game created (${[...gameIds][0]}) with ${gameUpdateCount} notification(s)`, 'success');
      } else if (!hasDuplicates && gameIds.size === 0) {
        logResult(`⚠️ No games created (possibly due to errors: ${errorCount})`, 'info');
      }

      resolve({
        gamesCreated: gameIds.size,
        notifications: gameUpdateCount,
        errors: errorCount,
        gameIds: [...gameIds],
        emitsSent: emitsSent,
        hasDuplicates
      });
    });
  });
}

async function runTestSuite() {
  console.log('🧪 Starting Duplicate Game Creation Fix Test Suite');
  console.log('=' .repeat(60));
  
  // Reset results
  testResults = { gamesCreated: 0, notifications: 0, errors: 0, duplicates: 0 };

  try {
    // Test 1: Normal single game creation
    logResult('Test 1: Normal single game creation', 'info');
    const result1 = await createTestSocket('TestPlayer1', 'Normal Creation', 1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Double-click simulation (2 rapid requests)
    logResult('Test 2: Double-click protection', 'info');
    const result2 = await createTestSocket('TestPlayer2', 'Double-click Test', 2);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Multiple rapid requests (simulating network issues)
    logResult('Test 3: Multiple rapid requests', 'info');
    const result3 = await createTestSocket('TestPlayer3', 'Rapid Requests Test', 3);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 DETAILED TEST RESULTS');
    console.log('=' .repeat(60));
    
    const allResults = [result1, result2, result3];
    allResults.forEach((result, index) => {
      const testNum = index + 1;
      console.log(`\nTest ${testNum}:`);
      console.log(`  - Emits sent: ${result.emitsSent}`);
      console.log(`  - Games created: ${result.gamesCreated}`);
      console.log(`  - Notifications: ${result.notifications}`);
      console.log(`  - Errors: ${result.errors}`);
      console.log(`  - Has duplicates: ${result.hasDuplicates ? 'YES ❌' : 'NO ✅'}`);
      if (result.gameIds.length > 0) {
        console.log(`  - Game IDs: ${result.gameIds.join(', ')}`);
      }
    });

    console.log(`\n📈 OVERALL SUMMARY:`);
    console.log(`  - Total games created: ${testResults.gamesCreated}`);
    console.log(`  - Total notifications: ${testResults.notifications}`);
    console.log(`  - Total errors: ${testResults.errors}`);
    console.log(`  - Duplicates detected: ${testResults.duplicates}`);
    
    if (testResults.duplicates === 0) {
      logResult('🎉 ALL TESTS PASSED - No duplicates detected!', 'success');
      return true;
    } else {
      logResult(`❌ TESTS FAILED - ${testResults.duplicates} duplicate issues detected!`, 'error');
      return false;
    }

  } catch (error) {
    logResult(`Test suite failed: ${error.message}`, 'error');
    return false;
  }
}

// Main execution
async function main() {
  const success = await runTestSuite();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createTestSocket, runTestSuite };