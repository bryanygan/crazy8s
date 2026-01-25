import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SettingsPanel from './SettingsPanel';

const Profile = ({ onClose }) => {
  const { user, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!profileData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (profileData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }
    
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setSuccessMessage('');
    
    try {
      const result = await updateProfile(profileData);
      
      if (result.success) {
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'Profile update failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '30px',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            padding: '5px'
          }}
        >
          ×
        </button>

        {/* Header */}
        <h2 style={{
          margin: '0 0 20px 0',
          color: '#2c3e50',
          textAlign: 'center',
          fontSize: '24px'
        }}>
          My Profile
        </h2>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #ecf0f1',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: activeTab === 'profile' ? '#3498db' : '#7f8c8d',
              borderBottom: activeTab === 'profile' ? '2px solid #3498db' : '2px solid transparent',
              fontSize: '16px'
            }}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: activeTab === 'stats' ? '#3498db' : '#7f8c8d',
              borderBottom: activeTab === 'stats' ? '2px solid #3498db' : '2px solid transparent',
              fontSize: '16px'
            }}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: activeTab === 'settings' ? '#3498db' : '#7f8c8d',
              borderBottom: activeTab === 'settings' ? '2px solid #3498db' : '2px solid transparent',
              fontSize: '16px'
            }}
          >
            Settings
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate}>
            {/* User Info Display */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Username:</strong> {user.username}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}
              </div>
              <div>
                <strong>Account Status:</strong> {user.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                color: '#155724',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                {successMessage}
              </div>
            )}

            {/* Display Name Field */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
                color: '#2c3e50',
                fontSize: '14px'
              }}>
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={profileData.displayName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `2px solid ${errors.displayName ? '#e74c3c' : '#ddd'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Your display name"
                disabled={isLoading}
              />
              {errors.displayName && (
                <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '3px' }}>
                  {errors.displayName}
                </div>
              )}
            </div>

            {/* Email Field */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
                color: '#2c3e50',
                fontSize: '14px'
              }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `2px solid ${errors.email ? '#e74c3c' : '#ddd'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="your.email@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '3px' }}>
                  {errors.email}
                </div>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div style={{
                backgroundColor: '#ffeaa7',
                border: '1px solid #e17055',
                color: '#2d3436',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                {errors.general}
              </div>
            )}

            {/* Update Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: isLoading ? '#bdc3c7' : '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginBottom: '15px'
              }}
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
                Game Statistics
              </h3>
              <div style={{ color: '#7f8c8d', fontSize: '16px' }}>
                Statistics will be available once you start playing games!
              </div>
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#95a5a6' }}>
                Your game history, win/loss ratio, and other statistics will appear here.
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <SettingsPanel />
          </div>
        )}

        {/* Logout Button */}
        <div style={{
          borderTop: '1px solid #ecf0f1',
          paddingTop: '20px',
          marginTop: '20px'
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#e74c3c',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;