// useToast.js - Toast management hook
import { useState, useCallback } from 'react';

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const newToast = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: Date.now(),
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      return updated.slice(0, 3);
    });
  }, []);

  const removeToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return { toasts, addToast, removeToast, clearToasts };
};

export default useToast;
