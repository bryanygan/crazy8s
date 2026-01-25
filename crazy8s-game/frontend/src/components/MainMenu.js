import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';
import gameBackground from '../game-background.jpg';
import { FaUserFriends, FaPlay, FaUsers, FaCog, FaLock, FaRocket, FaSignInAlt } from "react-icons/fa";
import { GoTrophy } from "react-icons/go";
import { LuCrown } from "react-icons/lu";

const MainMenu = ({ onGameCreated, onGameJoined }) => {
  const { isAuthenticated, user, login, register, logout } = useAuth();
  const { socket } = useConnection();
  
  const [currentView, setCurrentView] = useState('main'); // 'main', 'startGame', 'joinGame', 'login', 'signup'
  const [formData, setFormData] = useState({
    name: '',
    gameId: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (currentView === 'startGame') {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
    }
    
    if (currentView === 'joinGame') {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (!formData.gameId.trim()) {
        newErrors.gameId = 'Game ID is required';
      }
    }
    
    if (currentView === 'login') {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
    }
    
    if (currentView === 'signup') {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartGame = async () => {
    if (!validateForm()) return;
    
    // Prevent double-clicks by checking if already loading
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('🎮 Creating game as:', formData.name);
      // Remove duplicate socket emission - only call the callback which will handle emission
      if (onGameCreated) {
        onGameCreated({ 
          playerName: formData.name.trim(),
          // Pass callback to reset loading state
          resetLoading: () => setIsLoading(false)
        });
      }
    } catch (error) {
      setErrors({ general: 'Failed to create game' });
      setIsLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      console.log('🚪 Joining game:', formData.gameId, 'as', formData.name);
      socket.emit('joinGame', {
        gameId: formData.gameId.trim(),
        playerName: formData.name.trim()
      });
      
      if (onGameJoined) {
        onGameJoined({ 
          gameId: formData.gameId.trim(),
          playerName: formData.name.trim()
        });
      }
    } catch (error) {
      setErrors({ general: 'Failed to join game' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await login({
        username: formData.username.trim(),
        password: formData.password
      });
      setCurrentView('main');
    } catch (error) {
      setErrors({ general: error.message || 'Login failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const result = await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
      
      if (result.success) {
        setCurrentView('main');
        resetForm();
      } else {
        setErrors({ general: result.error || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ general: error.message || 'Registration failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gameId: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  const handleBack = () => {
    resetForm();
    setCurrentView('main');
  };

  const renderInput = (field, label, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '5px', 
        fontWeight: 'bold', 
        color: '#2c3e50' 
      }}>
        {label}:
      </label>
      <input
        type={type}
        value={formData[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px',
          border: errors[field] ? '2px solid #e74c3c' : '2px solid #ddd',
          borderRadius: '8px',
          fontSize: '16px',
          boxSizing: 'border-box'
        }}
      />
      {errors[field] && (
        <div style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
          {errors[field]}
        </div>
      )}
    </div>
  );

  const renderButton = (text, onClick, isPrimary = true, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        padding: '15px 30px',
        backgroundColor: disabled || isLoading ? '#bdc3c7' : (isPrimary ? '#3498db' : '#95a5a6'),
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.2s ease',
        minWidth: '120px'
      }}
    >
      {isLoading ? 'Loading...' : text}
    </button>
  );

  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  };

  const cardStyle = {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '30px',
    color: '#2c3e50'
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  };

  // Main Menu View
  if (currentView === 'main') {
    return (
      <div 
        style={{
          minHeight: '100vh',
          backgroundImage: `url(${gameBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Overlay gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
          zIndex: 1
        }} />
        
        {/* Floating card suit elements */}
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '40px',
          fontSize: '60px',
          color: 'rgba(255,255,255,0.1)',
          zIndex: 2,
          animation: 'float 3s ease-in-out infinite'
        }}>♠</div>
        <div style={{
          position: 'absolute',
          top: '160px',
          right: '80px',
          fontSize: '50px',
          color: 'rgba(255,0,0,0.1)',
          zIndex: 2,
          animation: 'float 3s ease-in-out infinite',
          animationDelay: '1s'
        }}>♥</div>
        <div style={{
          position: 'absolute',
          bottom: '160px',
          left: '80px',
          fontSize: '40px',
          color: 'rgba(255,165,0,0.1)',
          zIndex: 2,
          animation: 'float 3s ease-in-out infinite',
          animationDelay: '2s'
        }}>♦</div>
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '160px',
          fontSize: '50px',
          color: 'rgba(255,255,255,0.1)',
          zIndex: 2,
          animation: 'float 3s ease-in-out infinite',
          animationDelay: '3s'
        }}>♣</div>

        {/* Top navigation bar */}
        <nav style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="glass-effect button-enhanced" style={{
              padding: '12px',
              border: 'none',
              borderRadius: '12px',
              color: 'hsl(var(--foreground))',
              cursor: 'pointer',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              transition: 'var(--transition-smooth)'
            }}>
              <FaCog />
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {!isAuthenticated ? (
              <>
                <button
                  className="glass-effect button-enhanced"
                  onClick={() => setCurrentView('login')}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid hsl(var(--border) / 0.3)',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <FaLock />Login
                </button>
                <button
                  className="button-enhanced"
                  onClick={() => setCurrentView('signup')}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--primary-gradient)',
                    border: '1px solid hsl(var(--primary) / 0.3)',
                    borderRadius: '8px',
                    color: 'hsl(var(--primary-foreground))',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'var(--transition-smooth)',
                    boxShadow: 'var(--shadow-primary)'
                  }}
                >
                  📝 Sign Up
                </button>
              </>
            ) : (
              <div className="glass-effect" style={{
                padding: '8px 16px',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid hsl(var(--success) / 0.3)',
                boxShadow: 'var(--shadow-accent)'
              }}>
                👋 {user?.displayName || user?.username}
                <button
                  className="button-enhanced"
                  onClick={logout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'hsl(var(--muted-foreground))',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '12px',
                    marginLeft: '8px',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Main content */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 120px)',
          padding: '24px'
        }}>
          
          {/* Game title */}
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h1 className="title-gradient bounce-in-animation" style={{
              fontSize: 'clamp(4rem, 8vw, 9rem)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              marginBottom: '24px',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              padding: '16px 0'
            }}>
              Crazy 8's
            </h1>
            <p style={{
              fontSize: '20px',
              color: 'rgba(255,255,255,0.8)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.5,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400
            }}>
              The classic card game reimagined with modern style and exciting gameplay
            </p>
          </div>

          {/* Main action buttons */}
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 640 ? 'column' : 'row',
            gap: '24px',
            marginBottom: '64px'
          }}>
            <button 
              className="button-enhanced pulse-glow-animation"
              onClick={() => setCurrentView('startGame')}
              onMouseEnter={() => setIsHovered('start')}
              onMouseLeave={() => setIsHovered(null)}
              style={{
                height: '64px',
                padding: '0 48px',
                fontSize: '20px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                background: 'var(--primary-gradient)',
                border: '2px solid hsl(var(--primary) / 0.3)',
                borderRadius: '16px',
                color: 'hsl(var(--primary-foreground))',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'var(--transition-bounce)',
                transform: isHovered === 'start' ? 'scale(1.05)' : 'scale(1)',
                boxShadow: 'var(--shadow-primary)',
                letterSpacing: '0.025em'
              }}
            >
              <span style={{ 
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                transform: isHovered === 'start' ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}><FaPlay /></span>
              Create Game
            </button>
            
            <button 
              className="button-enhanced"
              onClick={() => setCurrentView('joinGame')}
              onMouseEnter={() => setIsHovered('join')}
              onMouseLeave={() => setIsHovered(null)}
              style={{
                height: '64px',
                padding: '0 48px',
                fontSize: '20px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                background: 'var(--secondary-gradient)',
                border: '2px solid hsl(var(--secondary) / 0.3)',
                borderRadius: '16px',
                color: 'hsl(var(--secondary-foreground))',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'var(--transition-bounce)',
                transform: isHovered === 'join' ? 'scale(1.05)' : 'scale(1)',
                boxShadow: 'var(--shadow-secondary)',
                letterSpacing: '0.025em'
              }}
            >
              <span style={{ 
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                transform: isHovered === 'join' ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}><FaUsers /></span>
              Join Game
            </button>
          </div>

          {/* Feature cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
            gap: '24px',
            maxWidth: '1024px',
            width: '100%'
          }}>
            <div 
              className="arena-card group"
              style={{
                background: 'var(--card-gradient)',
                border: '1px solid hsl(var(--border) / 0.5)',
                borderRadius: '8px',
                padding: '24px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={(e) => {
                const card = e.currentTarget;
                const iconBg = card.querySelector('.icon-bg');
                const icon = card.querySelector('.icon-svg');
                
                card.style.transform = 'scale(1.05)';
                card.style.boxShadow = '0 0 0 1px hsl(var(--primary) / 0.2), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                
                if (iconBg) {
                  iconBg.style.backgroundColor = 'hsl(var(--primary) / 0.2)';
                }
                if (icon) {
                  icon.style.color = 'hsl(var(--primary-glow))';
                }
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget;
                const iconBg = card.querySelector('.icon-bg');
                const icon = card.querySelector('.icon-svg');
                
                card.style.transform = 'scale(1)';
                card.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                
                if (iconBg) {
                  iconBg.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
                }
                if (icon) {
                  icon.style.color = 'hsl(var(--primary))';
                }
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '16px',
                pointerEvents: 'none'
              }}>
                <div 
                  className="icon-bg"
                  style={{
                    padding: '16px',
                    background: 'hsl(var(--primary) / 0.1)',
                    borderRadius: '50%',
                    transition: 'background-color 0.3s ease'
                  }}
                >
                  <FaUserFriends 
                    className="icon-svg"
                    size={32}
                    color="hsl(var(--primary))"
                    style={{ transition: 'color 0.3s ease' }}
                  />
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: 'hsl(var(--foreground))',
                  margin: 0
                }}>Friends</h3>
                <p style={{
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  margin: 0,
                  fontFamily: 'Inter, sans-serif'
                }}>Connect with friends and challenge them to matches</p>
                <button 
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--foreground))',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    e.target.style.backgroundColor = 'hsl(var(--accent))';
                    e.target.style.color = 'hsl(var(--accent-foreground))';
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'hsl(var(--foreground))';
                  }}
                >
                  View Friends
                </button>
              </div>
            </div>

            <div 
              className="arena-card group"
              style={{
                background: 'var(--card-gradient)',
                border: '1px solid hsl(var(--border) / 0.5)',
                borderRadius: '8px',
                padding: '24px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={(e) => {
                const card = e.currentTarget;
                const iconBg = card.querySelector('.icon-bg');
                const icon = card.querySelector('.icon-svg');
                
                card.style.transform = 'scale(1.05)';
                card.style.boxShadow = '0 0 0 1px hsl(var(--accent) / 0.2), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                
                if (iconBg) {
                  iconBg.style.backgroundColor = 'hsl(var(--accent) / 0.2)';
                }
                if (icon) {
                  icon.style.color = 'hsl(45 93% 70%)'; // Brighter accent
                }
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget;
                const iconBg = card.querySelector('.icon-bg');
                const icon = card.querySelector('.icon-svg');
                
                card.style.transform = 'scale(1)';
                card.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                
                if (iconBg) {
                  iconBg.style.backgroundColor = 'hsl(var(--accent) / 0.1)';
                }
                if (icon) {
                  icon.style.color = 'hsl(var(--accent))';
                }
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '16px',
                pointerEvents: 'none'
              }}>
                <div 
                  className="icon-bg"
                  style={{
                    padding: '16px',
                    background: 'hsl(var(--accent) / 0.1)',
                    borderRadius: '50%',
                    transition: 'background-color 0.3s ease'
                  }}
                >
                  <GoTrophy 
                    className="icon-svg"
                    size={32}
                    color="hsl(var(--accent))"
                    style={{ transition: 'color 0.3s ease' }}
                  />
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: 'hsl(var(--foreground))',
                  margin: 0
                }}>Leaderboards</h3>
                <p style={{
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  margin: 0,
                  fontFamily: 'Inter, sans-serif'
                }}>Compete for the top spot on global rankings</p>
                <button 
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--foreground))',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    e.target.style.backgroundColor = 'hsl(var(--accent))';
                    e.target.style.color = 'hsl(var(--accent-foreground))';
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'hsl(var(--foreground))';
                  }}
                >
                  View Rankings
                </button>
              </div>
            </div>

            <div 
              className="arena-card group"
              style={{
                background: 'var(--card-gradient)',
                border: '1px solid hsl(var(--border) / 0.5)',
                borderRadius: '8px',
                padding: '24px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={(e) => {
                const card = e.currentTarget;
                const iconBg = card.querySelector('.icon-bg');
                const icon = card.querySelector('.icon-svg');
                
                card.style.transform = 'scale(1.05)';
                card.style.boxShadow = '0 0 0 1px hsl(var(--secondary) / 0.2), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                
                if (iconBg) {
                  iconBg.style.backgroundColor = 'hsl(var(--secondary) / 0.2)';
                }
                if (icon) {
                  icon.style.color = 'hsl(220 91% 70%)'; // Brighter secondary
                }
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget;
                const iconBg = card.querySelector('.icon-bg');
                const icon = card.querySelector('.icon-svg');
                
                card.style.transform = 'scale(1)';
                card.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                
                if (iconBg) {
                  iconBg.style.backgroundColor = 'hsl(var(--secondary) / 0.1)';
                }
                if (icon) {
                  icon.style.color = 'hsl(var(--secondary))';
                }
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '16px',
                pointerEvents: 'none'
              }}>
                <div 
                  className="icon-bg"
                  style={{
                    padding: '16px',
                    background: 'hsl(var(--secondary) / 0.1)',
                    borderRadius: '50%',
                    transition: 'background-color 0.3s ease'
                  }}
                >
                  <LuCrown 
                    className="icon-svg"
                    size={32}
                    color="hsl(var(--secondary))"
                    style={{ transition: 'color 0.3s ease' }}
                  />
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: 'hsl(var(--foreground))',
                  margin: 0
                }}>Tournaments</h3>
                <p style={{
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  margin: 0,
                  fontFamily: 'Inter, sans-serif'
                }}>Join competitive tournaments and win prizes</p>
                <button 
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--foreground))',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    e.target.style.backgroundColor = 'hsl(var(--accent))';
                    e.target.style.color = 'hsl(var(--accent-foreground))';
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'hsl(var(--foreground))';
                  }}
                >
                  Join Tournament
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom decorative gradient */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '128px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
          zIndex: 2
        }} />
        
        {errors.general && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: 1000,
            backdropFilter: 'blur(10px)'
          }}>
            {errors.general}
          </div>
        )}
      </div>
    );
  }

  // Start Game View
  if (currentView === 'startGame') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}><FaRocket style={{ marginRight: '8px', verticalAlign: 'middle' }} />Start New Game</h2>
          
          {renderInput('name', 'Your Name', 'text', 'Enter your name')}
          
          <div style={buttonContainerStyle}>
            {renderButton('Back', handleBack, false)}
            {renderButton('Create Game', handleStartGame)}
          </div>
          
          {errors.general && (
            <div style={{ color: '#e74c3c', marginTop: '15px' }}>
              {errors.general}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Join Game View
  if (currentView === 'joinGame') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>🚪 Join Game</h2>
          
          {renderInput('name', 'Your Name', 'text', 'Enter your name')}
          {renderInput('gameId', 'Game ID', 'text', 'Enter game ID')}
          
          <div style={buttonContainerStyle}>
            {renderButton('Back', handleBack, false)}
            {renderButton('Join Game', handleJoinGame)}
          </div>
          
          {errors.general && (
            <div style={{ color: '#e74c3c', marginTop: '15px' }}>
              {errors.general}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Login View
  if (currentView === 'login') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}><FaSignInAlt style={{ marginRight: '8px', verticalAlign: 'middle' }} />Login</h2>
          
          {renderInput('username', 'Username', 'text', 'Enter username')}
          {renderInput('password', 'Password', 'password', 'Enter password')}
          
          <div style={buttonContainerStyle}>
            {renderButton('Back', handleBack, false)}
            {renderButton('Login', handleLogin)}
          </div>
          
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={() => setCurrentView('signup')}
              style={{
                background: 'none',
                border: 'none',
                color: '#3498db',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Don't have an account? Sign up
            </button>
          </div>
          
          {errors.general && (
            <div style={{ color: '#e74c3c', marginTop: '15px' }}>
              {errors.general}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Sign Up View
  if (currentView === 'signup') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>📝 Sign Up</h2>
          
          {renderInput('username', 'Username', 'text', 'Enter username')}
          {renderInput('email', 'Email', 'email', 'Enter email')}
          {renderInput('password', 'Password', 'password', 'Enter password')}
          {renderInput('confirmPassword', 'Confirm Password', 'password', 'Confirm password')}
          
          <div style={buttonContainerStyle}>
            {renderButton('Back', handleBack, false)}
            {renderButton('Sign Up', handleSignup)}
          </div>
          
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={() => setCurrentView('login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#3498db',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Already have an account? Login
            </button>
          </div>
          
          {errors.general && (
            <div style={{ color: '#e74c3c', marginTop: '15px' }}>
              {errors.general}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default MainMenu;