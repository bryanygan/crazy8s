import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { colors, shadows, borderRadius, transitions } from '../../utils/theme';

const Login = ({ onClose, onSwitchToRegister, onGuestMode }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
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
    
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Username or email is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const result = await login(formData);
      
      if (result.success) {
        onClose();
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'Login failed. Please try again.' });
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
        width: '400px',
        maxWidth: '90vw',
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
            color: colors.darkGray,
            padding: '5px',
            borderRadius: borderRadius.small,
            transition: transitions.fast
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = colors.background}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{
            fontSize: '32px',
            marginBottom: '10px'
          }}>
            🎴
          </div>
          <h2 style={{
            margin: '0 0 5px 0',
            color: colors.dark,
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            Welcome Back!
          </h2>
          <p style={{
            margin: 0,
            color: colors.darkGray,
            fontSize: '14px'
          }}>
            Sign in to continue your Crazy 8's journey
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: colors.dark,
              fontSize: '14px'
            }}>
              Username or Email
            </label>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${errors.identifier ? colors.error : colors.inputBorder}`,
                borderRadius: borderRadius.medium,
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: transitions.fast,
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = colors.inputFocus}
              onBlur={(e) => e.target.style.borderColor = errors.identifier ? colors.error : colors.inputBorder}
              placeholder="Enter your username or email"
              disabled={isLoading}
            />
            {errors.identifier && (
              <div style={{ 
                color: colors.error, 
                fontSize: '13px', 
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>⚠️</span>
                {errors.identifier}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: colors.dark,
              fontSize: '14px'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${errors.password ? colors.error : colors.inputBorder}`,
                borderRadius: borderRadius.medium,
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: transitions.fast,
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = colors.inputFocus}
              onBlur={(e) => e.target.style.borderColor = errors.password ? colors.error : colors.inputBorder}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {errors.password && (
              <div style={{ 
                color: colors.error, 
                fontSize: '13px', 
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>⚠️</span>
                {errors.password}
              </div>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div style={{
              backgroundColor: colors.background,
              border: `1px solid ${colors.error}`,
              color: colors.error,
              padding: '12px 16px',
              borderRadius: borderRadius.medium,
              marginBottom: '20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>❌</span>
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
              backgroundColor: isLoading ? colors.lightGray : colors.primary,
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
            onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = colors.primaryHover)}
            onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = colors.primary)}
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
                Signing In...
              </span>
            ) : (
              '🔑 Sign In'
            )}
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            color: colors.darkGray
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }}></div>
            <span style={{ padding: '0 15px', fontSize: '13px', fontWeight: '500' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }}></div>
          </div>

          {/* Guest Mode Button */}
          <button
            type="button"
            onClick={onGuestMode}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: colors.lightGray,
              color: colors.white,
              border: 'none',
              borderRadius: borderRadius.medium,
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '20px',
              transition: transitions.fast,
              boxShadow: shadows.small
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = colors.darkGray}
            onMouseLeave={(e) => e.target.style.backgroundColor = colors.lightGray}
          >
            👤 Continue as Guest
          </button>

          {/* Register Link */}
          <div style={{ 
            textAlign: 'center', 
            fontSize: '14px', 
            color: colors.darkGray,
            padding: '10px 0'
          }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              style={{
                background: 'none',
                border: 'none',
                color: colors.secondary,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '2px 4px',
                borderRadius: borderRadius.small,
                transition: transitions.fast
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colors.secondaryLight;
                e.target.style.textDecoration = 'none';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.textDecoration = 'underline';
              }}
            >
              Create one here
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

export default Login;