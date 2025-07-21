#!/usr/bin/env node

/**
 * Test with very short delays to ensure we hit the 2-second window
 */

const io = require('socket.io-client');
const SERVER_URL = 'http://localhost:3001';

function testShortDelays() {
  return new Promise((resolve) => {
    const socket = io(SERVER_URL);
    
    let events = [];
    const startTime = Date.now();
    
    socket.on('connect', () => {
      console.log(`Connected with socket ID: ${socket.id}`);
      
      // Send first request
      console.log('Sending request 1...');
      socket.emit('createGame', { playerName: 'TestPlayer' });
      
      // Send second request after just 10ms 
      setTimeout(() => {
        console.log('Sending request 2 (after 10ms)...');
        socket.emit('createGame', { playerName: 'TestPlayer' });
      }, 10);
      
      // Send third request after 50ms
      setTimeout(() => {
        console.log('Sending request 3 (after 50ms)...');
        socket.emit('createGame', { playerName: 'TestPlayer' });
      }, 50);
      
      // Send fourth request after 1 second (still within 2 second window)
      setTimeout(() => {
        console.log('Sending request 4 (after 1000ms)...');
        socket.emit('createGame', { playerName: 'TestPlayer' });
      }, 1000);

      // Disconnect after 3 seconds
      setTimeout(() => {
        socket.disconnect();
      }, 3000);
    });

    socket.on('gameUpdate', (data) => {
      const elapsed = Date.now() - startTime;
      console.log(`[+${elapsed}ms] Game created: ${data.gameId}`);
      events.push({ type: 'game', elapsed, gameId: data.gameId });
    });

    socket.on('error', (error) => {
      const elapsed = Date.now() - startTime;
      const errorMsg = error.message || error;
      console.log(`[+${elapsed}ms] Error: ${errorMsg}`);
      events.push({ type: 'error', elapsed, error: errorMsg });
    });

    socket.on('disconnect', () => {
      console.log('\n📊 Results:');
      
      const games = events.filter(e => e.type === 'game');
      const errors = events.filter(e => e.type === 'error');
      
      console.log(`Games created: ${games.length}`);
      console.log(`Errors/blocks: ${errors.length}`);
      
      if (games.length > 1) {
        console.log('❌ Duplicate prevention FAILED');
      } else if (games.length === 1 && errors.length > 0) {
        console.log('✅ Duplicate prevention WORKING');
      } else {
        console.log('⚠️ Unclear result');
      }
      
      resolve({ games: games.length, errors: errors.length });
    });
  });
}

async function main() {
  console.log('Testing with very short delays to trigger duplicate prevention...\n');
  await testShortDelays();
}

if (require.main === module) {
  main().catch(console.error);
}