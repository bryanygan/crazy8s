// Confetti function for celebrations
export const fireConfetti = () => {
  console.log('🎉 fireConfetti called');
  
  // Check if confetti is available (loaded from script tag)
  if (typeof window !== 'undefined' && window.confetti) {
    console.log('✅ Confetti library detected, firing confetti!');
    
    const count = 200;

    // Fire from left corner
    const leftCornerDefaults = { origin: { x: 0, y: 0.7 } };
    function fireLeft(particleRatio, opts) {
      window.confetti({
        ...leftCornerDefaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    // Fire from right corner  
    const rightCornerDefaults = { origin: { x: 1, y: 0.7 } };
    function fireRight(particleRatio, opts) {
      window.confetti({
        ...rightCornerDefaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    // Fire the sequence from both corners
    const sequences = [
      { ratio: 0.25, opts: { spread: 26, startVelocity: 55 } },
      { ratio: 0.2, opts: { spread: 60 } },
      { ratio: 0.35, opts: { spread: 100, decay: 0.91, scalar: 0.8 } },
      { ratio: 0.1, opts: { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 } },
      { ratio: 0.1, opts: { spread: 120, startVelocity: 45 } }
    ];

    sequences.forEach(({ ratio, opts }) => {
      fireLeft(ratio, opts);
      fireRight(ratio, opts);
    });
    
    console.log('🎉 Confetti sequences fired!');
  } else {
    console.warn('❌ Confetti library not loaded. Available:', typeof window !== 'undefined' ? Object.keys(window).filter(k => k.includes('confetti')) : 'window undefined');
  }
};