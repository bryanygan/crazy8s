import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { colors, shadows, borderRadius, transitions } from '../../utils/theme';

const Register = ({ onClose, onSwitchToLogin, onGuestMode }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one letter and one number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      const result = await register(registrationData);
      
      if (result.success) {
        onClose();
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.authOverlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        backgroundColor: colors.formBackground,
        borderRadius: borderRadius.large,
        padding: '30px',
        width: '450px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: shadows.large,
        position: 'relative',
        border: `1px solid ${colors.border}`
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
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{
            fontSize: '32px',
            marginBottom: '10px'
          }}>
            🎮
          </div>
          <h2 style={{
            margin: '0 0 5px 0',
            color: colors.dark,
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            Join the Game!
          </h2>
          <p style={{
            margin: 0,
            color: colors.darkGray,
            fontSize: '14px'
          }}>
            Create your account and start playing Crazy 8's
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              color: '#2c3e50',
              fontSize: '14px'
            }}>
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: `2px solid ${errors.username ? '#e74c3c' : '#ddd'}`,
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Choose a unique username"
              disabled={isLoading}
            />
            {errors.username && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '3px' }}>
                {errors.username}
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
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
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

          {/* Display Name Field */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              color: '#2c3e50',
              fontSize: '14px'
            }}>
              Display Name *
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: `2px solid ${errors.displayName ? '#e74c3c' : '#ddd'}`,
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Name shown to other players"
              disabled={isLoading}
            />
            {errors.displayName && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '3px' }}>
                {errors.displayName}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              color: '#2c3e50',
              fontSize: '14px'
            }}>
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: `2px solid ${errors.password ? '#e74c3c' : '#ddd'}`,
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="At least 8 characters"
              disabled={isLoading}
            />
            {errors.password && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '3px' }}>
                {errors.password}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              color: '#2c3e50',
              fontSize: '14px'
            }}>
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: `2px solid ${errors.confirmPassword ? '#e74c3c' : '#ddd'}`,
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Re-enter your password"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '3px' }}>
                {errors.confirmPassword}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: isLoading ? colors.lightGray : colors.secondary,
              color: colors.white,
              border: 'none',
              borderRadius: borderRadius.medium,
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              transition: transitions.fast,
              boxShadow: shadows.small
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = colors.secondaryHover)}
            onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = colors.secondary)}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Creating Account...
              </span>
            ) : (
              '🎮 Create Account'
            )}
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '15px 0',
            color: '#7f8c8d'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
            <span style={{ padding: '0 15px', fontSize: '14px' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
          </div>

          {/* Guest Mode Button */}
          <button
            type="button"
            onClick={onGuestMode}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#95a5a6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '15px'
            }}
          >
            Continue as Guest
          </button>

          {/* Login Link */}
          <div style={{ textAlign: 'center', fontSize: '14px', color: '#7f8c8d' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: '#3498db',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px'
              }}
            >
              Sign in here
            </button>
          </div>
        </form>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Register;