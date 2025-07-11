import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Authentication modal component that handles login, registration, and profile views
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback function to close the modal
 * 
 * @returns {JSX.Element|null} The authentication modal component
 * 
 * @example
 * <AuthModal onClose={() => setShowModal(false)} />
 */
const AuthModal = ({ onClose }) => {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState(isAuthenticated ? 'profile' : 'login');

  const handleGuestMode = () => {
    onClose();
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
  };

  const handleSwitchToRegister = () => {
    setCurrentView('register');
  };


  if (currentView === 'login') {
    return (
      <Login
        onClose={onClose}
        onSwitchToRegister={handleSwitchToRegister}
        onGuestMode={handleGuestMode}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <Register
        onClose={onClose}
        onSwitchToLogin={handleSwitchToLogin}
        onGuestMode={handleGuestMode}
      />
    );
  }

  if (currentView === 'profile') {
    return (
      <Profile
        onClose={onClose}
      />
    );
  }

  return null;
};

export default AuthModal;