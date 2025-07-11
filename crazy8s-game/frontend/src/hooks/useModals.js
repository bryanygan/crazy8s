import { useState } from 'react';

export const useModals = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [showSuitSelector, setShowSuitSelector] = useState(false);

  const toggleModal = (modalName, value) => {
    switch (modalName) {
      case 'settings':
        setShowSettings(value);
        break;
      case 'auth':
        setShowAuthModal(value);
        break;
      case 'userDashboard':
        setShowUserDashboard(value);
        break;
      case 'suitSelector':
        setShowSuitSelector(value);
        break;
      default:
        console.warn(`Unknown modal: ${modalName}`);
    }
  };

  return {
    showSettings,
    showAuthModal,
    showUserDashboard,
    showSuitSelector,
    setShowSettings,
    setShowAuthModal,
    setShowUserDashboard,
    setShowSuitSelector,
    toggleModal
  };
};