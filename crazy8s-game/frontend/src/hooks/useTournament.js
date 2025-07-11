import { useState } from 'react';

export const useTournament = () => {
  const [showRoundEndModal, setShowRoundEndModal] = useState(false);
  const [roundEndData, setRoundEndData] = useState(null);
  const [nextRoundTimer, setNextRoundTimer] = useState(0);
  const [showTournamentWinnerModal, setShowTournamentWinnerModal] = useState(false);
  const [tournamentWinnerData, setTournamentWinnerData] = useState(null);
  const [tournamentStatus, setTournamentStatus] = useState(null);

  return {
    showRoundEndModal,
    setShowRoundEndModal,
    roundEndData,
    setRoundEndData,
    nextRoundTimer,
    setNextRoundTimer,
    showTournamentWinnerModal,
    setShowTournamentWinnerModal,
    tournamentWinnerData,
    setTournamentWinnerData,
    tournamentStatus,
    setTournamentStatus
  };
};