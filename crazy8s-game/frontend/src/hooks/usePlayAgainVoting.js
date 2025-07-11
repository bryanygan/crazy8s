import { useState } from 'react';

export const usePlayAgainVoting = () => {
  const [playAgainVotes, setPlayAgainVotes] = useState({
    votedPlayers: [],
    totalPlayers: 0,
    allVoted: false,
    creatorVoted: false,
    canStartGame: false,
    gameCreator: null
  });

  const votePlayAgain = (playerId) => {
    setPlayAgainVotes(prev => ({
      ...prev,
      votedPlayers: [...prev.votedPlayers, playerId]
    }));
  };

  const resetVotes = () => {
    setPlayAgainVotes({
      votedPlayers: [],
      totalPlayers: 0,
      allVoted: false,
      creatorVoted: false,
      canStartGame: false,
      gameCreator: null
    });
  };

  return {
    playAgainVotes,
    setPlayAgainVotes,
    votePlayAgain,
    resetVotes
  };
};