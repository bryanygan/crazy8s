import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ 
  children, 
  fallback = null, 
  requireAuth = true,
  showAuthPrompt = false 
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        color: '#7f8c8d'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #ecf0f1',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div>Loading...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    if (showAuthPrompt) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          margin: '20px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            🔒
          </div>
          <h3 style={{
            color: '#2c3e50',
            marginBottom: '15px',
            fontSize: '24px'
          }}>
            Authentication Required
          </h3>
          <p style={{
            color: '#7f8c8d',
            marginBottom: '25px',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            This feature requires you to be signed in to your account.
            <br />
            Please sign in or create an account to continue.
          </p>
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => window.location.reload()} // This would trigger auth modal in real app
              style={{
                padding: '12px 24px',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              🔑 Sign In
            </button>
            <button
              onClick={() => window.location.reload()} // This would trigger auth modal in real app
              style={{
                padding: '12px 24px',
                backgroundColor: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#229954'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
            >
              📝 Create Account
            </button>
          </div>
        </div>
      );
    }

    return fallback;
  }

  if (!requireAuth && isAuthenticated) {
    return fallback;
  }

  return children;
};

export default ProtectedRoute;