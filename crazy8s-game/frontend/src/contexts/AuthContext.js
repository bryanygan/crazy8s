import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllLocalSettings, transformSettingsForAPI, clearAllLocalSettings } from '../utils/settingsMigration';

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  register: () => {},
  logout: () => {},
  updateProfile: () => {},
  updateSettings: () => {},
  refreshToken: () => {},
  migrateLocalSettings: () => {}
});

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('auth_token');
    const storedUser = sessionStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && token) {
          const refreshed = await refreshToken();
          if (refreshed) {
            config.headers['Authorization'] = `Bearer ${refreshed}`;
            const retryResponse = await fetch(url, config);
            const retryData = await retryResponse.json();
            if (!retryResponse.ok) {
              throw new Error(retryData.error || 'Request failed');
            }
            return retryData;
          } else {
            logout();
            throw new Error('Session expired');
          }
        }
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API call failed: ${endpoint}`, error);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      // Handle both new format (data.data.token) and fallback format (data.data.user.token)
      const authToken = data.data?.token || data.data?.user?.token;
      const userData = data.data?.user || data.data;
      
      if (!authToken) {
        throw new Error('No authentication token received');
      }
      
      setToken(authToken);
      setUser(userData);
      
      sessionStorage.setItem('auth_token', authToken);
      sessionStorage.setItem('auth_user', JSON.stringify(userData));

      // Trigger automatic settings migration on first login
      setTimeout(async () => {
        await performAutoMigration(userData);
      }, 1000); // Small delay to ensure auth state is fully set

      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const data = await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      // Handle both new format (data.data.token) and fallback format (data.data.user.token)
      const authToken = data.data?.token || data.data?.user?.token;
      const newUser = data.data?.user || data.data;
      
      if (!authToken) {
        throw new Error('No authentication token received');
      }
      
      setToken(authToken);
      setUser(newUser);
      
      sessionStorage.setItem('auth_token', authToken);
      sessionStorage.setItem('auth_user', JSON.stringify(newUser));

      // Trigger automatic settings migration on first registration
      setTimeout(async () => {
        await performAutoMigration(newUser);
      }, 1000); // Small delay to ensure auth state is fully set

      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiCall('/api/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setToken(null);
      setUser(null);
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = sessionStorage.getItem('refresh_token');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const data = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshTokenValue}`
        }
      });

      if (!data.ok) {
        throw new Error('Token refresh failed');
      }

      const result = await data.json();
      const newToken = result.data.token;
      
      setToken(newToken);
      sessionStorage.setItem('auth_token', newToken);
      
      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const data = await apiCall('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });

      const updatedUser = data.data;
      setUser(updatedUser);
      sessionStorage.setItem('auth_user', JSON.stringify(updatedUser));

      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateSettings = async (settingsData) => {
    try {
      const data = await apiCall('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsData)
      });

      // Handle both possible response formats
      const settings = data.data || data.settings;
      const updatedUserData = data.user || user;
      
      const updatedUser = { ...updatedUserData, settings: settings };
      setUser(updatedUser);
      sessionStorage.setItem('auth_user', JSON.stringify(updatedUser));

      // Emit settings change event for real-time sync
      emitSettingsChange(settings, settingsData);

      return { success: true, settings: settings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Settings change event system
  const settingsListeners = new Set();
  
  const subscribeToSettingsChanges = (listener) => {
    settingsListeners.add(listener);
    return () => settingsListeners.delete(listener);
  };
  
  const emitSettingsChange = (newSettings, updatedKeys) => {
    settingsListeners.forEach(listener => {
      try {
        listener(newSettings, updatedKeys);
      } catch (error) {
        console.error('Settings listener error:', error);
      }
    });
  };

  const performAutoMigration = async (userData) => {
    if (!userData || !token) return;

    try {
      console.log('🔄 Performing automatic settings migration...');
      
      // Check if user already has settings (avoid duplicate migration)
      const hasExistingSettings = userData.settings && Object.keys(userData.settings).length > 0;
      
      if (hasExistingSettings && userData.settings.migrationTimestamp) {
        console.log('✅ User already has migrated settings, skipping migration');
        return;
      }

      // Look for localStorage settings to migrate
      const localSettings = getAllLocalSettings();
      const settingsToMigrate = Object.keys(localSettings);
      
      if (settingsToMigrate.length === 0) {
        console.log('ℹ️ No local settings found to migrate');
        return;
      }

      console.log(`🔄 Found ${settingsToMigrate.length} local settings to migrate:`, settingsToMigrate);
      
      // Migrate the most recent settings or merge multiple if needed
      let finalSettings = {};
      
      if (settingsToMigrate.length === 1) {
        // Single player settings
        const playerId = settingsToMigrate[0];
        finalSettings = transformSettingsForAPI(localSettings[playerId]);
      } else {
        // Multiple player settings - merge with preference for most recent
        const sortedSettings = settingsToMigrate.map(playerId => ({
          playerId,
          settings: localSettings[playerId],
          lastModified: new Date(localSettings[playerId]._metadata?.lastModified || 0)
        })).sort((a, b) => b.lastModified - a.lastModified);
        
        // Use most recent as base, merge others
        finalSettings = transformSettingsForAPI(sortedSettings[0].settings);
        
        // Merge game history and achievements from all players
        const allGameHistory = [];
        const allAchievements = [];
        
        sortedSettings.forEach(({ settings }) => {
          if (settings.gameHistory) allGameHistory.push(...settings.gameHistory);
          if (settings.achievements) allAchievements.push(...settings.achievements);
        });
        
        finalSettings.gameHistory = allGameHistory;
        finalSettings.achievements = [...new Set(allAchievements)];
      }
      
      // Perform migration
      const result = await updateSettings(finalSettings);
      
      if (result.success) {
        // Clean up localStorage
        const removedCount = clearAllLocalSettings();
        console.log(`✅ Successfully migrated settings and cleaned up ${removedCount} local storage entries`);
      } else {
        console.error('❌ Settings migration failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Auto migration error:', error);
    }
  };

  const migrateLocalSettings = async (playerId) => {
    if (!user || !token) return { success: false, error: 'Not authenticated' };

    try {
      const localKey = `crazy8s_settings_${playerId}`;
      const localSettings = localStorage.getItem(localKey);
      
      if (localSettings) {
        const settings = JSON.parse(localSettings);
        
        const transformedSettings = {
          sortByRank: settings.sortByRank || false,
          groupBySuit: settings.groupBySuit || false,
          experiencedMode: settings.experiencedMode || false,
          enableTimer: settings.enableTimer !== undefined ? settings.enableTimer : true,
          timerDuration: settings.timerDuration || 60,
          timerWarningTime: settings.timerWarningTime || 15,
          cardSortingPreferences: settings.cardSortingPreferences || {},
          migrationTimestamp: new Date().toISOString()
        };

        const result = await updateSettings(transformedSettings);
        
        if (result.success) {
          localStorage.removeItem(localKey);
          console.log(`✅ Successfully migrated settings for player ${playerId}`);
        }
        
        return result;
      }
      
      return { success: true, message: 'No local settings to migrate' };
    } catch (error) {
      console.error('❌ Settings migration failed:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    updateSettings,
    refreshToken,
    migrateLocalSettings,
    subscribeToSettingsChanges
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;