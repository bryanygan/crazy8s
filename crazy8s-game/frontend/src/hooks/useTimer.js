import { useState, useRef, useCallback } from 'react';

export const useTimer = (initialSettings = {}) => {
  const [globalTimer, setGlobalTimer] = useState({
    timeLeft: initialSettings.timerDuration || 60,
    isWarning: false,
    isActive: false
  });

  // Refs to access latest timer values inside stable callbacks
  const timerDurationRef = useRef(initialSettings.timerDuration || 60);
  const timerWarningTimeRef = useRef(initialSettings.timerWarningTime || 15);

  const startTimer = useCallback((duration) => {
    const timerDuration = duration || timerDurationRef.current;
    setGlobalTimer({
      timeLeft: timerDuration,
      isWarning: false,
      isActive: true
    });
  }, []);

  const stopTimer = useCallback(() => {
    setGlobalTimer(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  const resetTimer = useCallback(() => {
    setGlobalTimer({
      timeLeft: timerDurationRef.current,
      isWarning: false,
      isActive: false
    });
  }, []);

  // Update refs when settings change
  const updateTimerSettings = useCallback((settings) => {
    timerDurationRef.current = settings.timerDuration;
    timerWarningTimeRef.current = settings.timerWarningTime;
  }, []);

  return {
    globalTimer,
    setGlobalTimer,
    startTimer,
    stopTimer,
    resetTimer,
    updateTimerSettings,
    timerDurationRef,
    timerWarningTimeRef
  };
};