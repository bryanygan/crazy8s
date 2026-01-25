import { useState, useCallback } from 'react';

/**
 * Custom hook for managing toast notifications
 * 
 * @returns {Object} Toast management object
 * @returns {Array} returns.toasts - Array of active toast notifications
 * @returns {Function} returns.addToast - Function to add a new toast notification
 * @returns {Function} returns.removeToast - Function to remove a toast by ID
 * @returns {Function} returns.setToasts - Function to set all toasts
 * 
 * @example
 * const { toasts, addToast, removeToast } = useToasts();
 * 
 * // Add a success toast
 * addToast('Operation completed successfully!', 'success');
 * 
 * // Add an error toast
 * addToast('Something went wrong', 'error');
 */
export const useToasts = () => {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a new toast notification
   * @param {string} message - The message to display
   * @param {string} [type='info'] - The type of toast ('info', 'success', 'error', 'warning')
   */
  const addToast = useCallback((message, type = 'info') => {
    const newToast = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: Date.now()
    };

    setToasts(prevToasts => {
      const newToasts = [newToast, ...prevToasts];
      
      // If we have more than 3 toasts, remove the oldest ones
      if (newToasts.length > 3) {
        return newToasts.slice(0, 3);
      }
      
      return newToasts;
    });
  }, []);

  /**
   * Remove a toast notification by ID
   * @param {number|string} toastId - The unique ID of the toast to remove
   */
  const removeToast = useCallback((toastId) => {
    console.log(`🗑️ Removing toast with ID: ${toastId}`);
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId));
  }, []);

  return { toasts, addToast, removeToast, setToasts };
};