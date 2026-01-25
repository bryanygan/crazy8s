import React from 'react';
import { ProtectedRoute } from './index';
import { colors, shadows, borderRadius } from '../../utils/theme';

// Example component showing how to use ProtectedRoute
const AuthExample = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: colors.dark, marginBottom: '30px' }}>
        Authentication Examples
      </h2>

      {/* Example 1: Protected content that requires authentication */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: colors.dark }}>Protected Content (Requires Auth)</h3>
        <ProtectedRoute requireAuth={true} showAuthPrompt={true}>
          <div style={{
            padding: '20px',
            backgroundColor: colors.secondaryLight,
            borderRadius: borderRadius.medium,
            border: `2px solid ${colors.secondary}`
          }}>
            <h4 style={{ color: colors.dark, margin: '0 0 10px 0' }}>
              🎉 Authenticated User Content
            </h4>
            <p style={{ color: colors.darkGray, margin: 0 }}>
              This content is only visible to authenticated users. You can see your 
              game statistics, saved preferences, and access premium features here.
            </p>
          </div>
        </ProtectedRoute>
      </div>

      {/* Example 2: Guest-only content */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: colors.dark }}>Guest-Only Content</h3>
        <ProtectedRoute 
          requireAuth={false} 
          fallback={
            <div style={{
              padding: '20px',
              backgroundColor: colors.primaryLight,
              borderRadius: borderRadius.medium,
              border: `2px solid ${colors.primary}`
            }}>
              <h4 style={{ color: colors.dark, margin: '0 0 10px 0' }}>
                👤 Already Signed In
              </h4>
              <p style={{ color: colors.darkGray, margin: 0 }}>
                You're already authenticated! This content is only shown to guests.
              </p>
            </div>
          }
        >
          <div style={{
            padding: '20px',
            backgroundColor: colors.background,
            borderRadius: borderRadius.medium,
            border: `2px dashed ${colors.border}`
          }}>
            <h4 style={{ color: colors.dark, margin: '0 0 10px 0' }}>
              👋 Welcome, Guest!
            </h4>
            <p style={{ color: colors.darkGray, margin: 0 }}>
              This content is only visible to guest users. Consider creating 
              an account to unlock additional features!
            </p>
          </div>
        </ProtectedRoute>
      </div>

      {/* Example 3: Conditional content with custom fallback */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: colors.dark }}>Custom Fallback Example</h3>
        <ProtectedRoute 
          requireAuth={true} 
          fallback={
            <div style={{
              padding: '20px',
              backgroundColor: colors.background,
              borderRadius: borderRadius.medium,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔐</div>
              <p style={{ color: colors.darkGray, margin: 0 }}>
                This is a custom fallback message for unauthenticated users.
              </p>
            </div>
          }
        >
          <div style={{
            padding: '20px',
            backgroundColor: colors.white,
            borderRadius: borderRadius.medium,
            boxShadow: shadows.medium
          }}>
            <h4 style={{ color: colors.dark, margin: '0 0 10px 0' }}>
              🏆 Premium Feature
            </h4>
            <p style={{ color: colors.darkGray, margin: 0 }}>
              This is a premium feature only available to authenticated users.
              Custom fallback content is shown when not authenticated.
            </p>
          </div>
        </ProtectedRoute>
      </div>

      {/* Usage Documentation */}
      <div style={{
        padding: '20px',
        backgroundColor: colors.background,
        borderRadius: borderRadius.medium,
        marginTop: '40px'
      }}>
        <h3 style={{ color: colors.dark, marginBottom: '15px' }}>
          📚 ProtectedRoute Usage
        </h3>
        <div style={{ fontSize: '14px', color: colors.darkGray, lineHeight: '1.6' }}>
          <p><strong>Props:</strong></p>
          <ul>
            <li><code>requireAuth</code> - Whether authentication is required (default: true)</li>
            <li><code>showAuthPrompt</code> - Show authentication prompt when not authenticated</li>
            <li><code>fallback</code> - Custom component to show when condition not met</li>
            <li><code>children</code> - Content to show when condition is met</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthExample;