import { useState } from 'react';

export const usePlayerHand = () => {
  const [playerHand, setPlayerHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [validCards, setValidCards] = useState([]);

  return {
    playerHand,
    setPlayerHand,
    selectedCards,
    setSelectedCards,
    validCards,
    setValidCards
  };
};