import confetti from 'canvas-confetti';

// Confetti function for celebrations
export const fireConfetti = () => {
  const count = 200;

  // Fire from left corner
  const leftCornerDefaults = { origin: { x: 0, y: 0.7 } };
  function fireLeft(particleRatio, opts) {
    confetti({
      ...leftCornerDefaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  // Fire from right corner
  const rightCornerDefaults = { origin: { x: 1, y: 0.7 } };
  function fireRight(particleRatio, opts) {
    confetti({
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
};
