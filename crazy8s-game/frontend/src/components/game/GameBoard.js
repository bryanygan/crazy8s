import React from 'react';
import { FaBullseye, FaSync, FaBook } from 'react-icons/fa';

const GameBoard = ({ gameState, onDrawCard, topCard, drawPileSize }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px',
      backgroundColor: '#27ae60',
      borderRadius: '20px',
      margin: '20px 0',
      minHeight: '180px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        gap: '40px',
        alignItems: 'flex-start',
        justifyContent: 'center'
      }}>
        {/* Draw Pile Column */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
            Draw Pile
          </div>
          <div
            onClick={onDrawCard}
            style={{
              width: '80px',
              height: '120px',
              backgroundColor: '#34495e',
              border: '3px solid #2c3e50',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            <div style={{ color: '#fff', textAlign: 'center', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold' }}>DRAW</div>
              <div>({drawPileSize})</div>
            </div>
          </div>

          {/* Draw Stack indicator under draw pile */}
          {gameState.drawStack > 0 && (
            <div style={{
              color: '#fff',
              backgroundColor: '#e67e22',
              padding: '4px 8px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              animation: 'pulse 2s infinite',
              textAlign: 'center',
              minWidth: '60px'
            }}>
              <FaBook style={{ marginRight: '4px', fontSize: '8px' }} />+{gameState.drawStack}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div style={{
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '24px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          alignSelf: 'flex-start',
          marginTop: '80px'
        }}>
          →
        </div>

        {/* Top Card Column */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
            Top Card
          </div>
          {topCard ? (
            <div
              style={{
                width: '90px',        // Increased from 60px
                height: '135px',      // Increased from 90px
                border: '3px solid #fff',  // Made border white and thicker
                borderRadius: '12px',  // Slightly larger border radius
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#fff',
                fontSize: '14px',     // Increased font size
                padding: '6px',       // Increased padding
                color: topCard.suit === 'Hearts' || topCard.suit === 'Diamonds' ? '#e74c3c' : '#2c3e50',
                boxShadow: '0 6px 12px rgba(0,0,0,0.3)',  // Enhanced shadow
                transform: 'scale(1)',
                transition: 'transform 0.2s ease',
                opacity: 1,           // Ensure it's not greyed out
                flexShrink: 0,
                minWidth: '90px',
                maxWidth: '90px'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                {topCard.rank}
              </div>
              <div style={{ fontSize: '24px' }}>  {/* Increased symbol size */}
                {topCard.suit === 'Hearts' ? '♥' :
                 topCard.suit === 'Diamonds' ? '♦' :
                 topCard.suit === 'Clubs' ? '♣' : '♠'}
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '12px', transform: 'rotate(180deg)' }}>
                {topCard.rank}
              </div>
            </div>
          ) : (
            <div style={{
              width: '90px',        // Increased to match
              height: '135px',      // Increased to match
              border: '2px dashed #fff',
              borderRadius: '12px', // Increased to match
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              Empty
            </div>
          )}

          {/* Reversed indicator under top card */}
          {gameState.direction === -1 && (
            <div style={{
              color: '#fff',
              backgroundColor: '#9b59b6',
              padding: '4px 8px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              textAlign: 'center',
              minWidth: '60px'
            }}>
              <FaSync style={{ marginRight: '4px', fontSize: '8px' }} />Reversed
            </div>
          )}
        </div>
      </div>

      {/* Declared Suit Indicator (centered) */}
      {gameState.declaredSuit && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '15px'
        }}>
          <div style={{
            color: '#fff',
            backgroundColor: '#e74c3c',
            padding: '8px 15px',
            borderRadius: '15px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <FaBullseye style={{ marginRight: '8px' }} />Current Suit: {gameState.declaredSuit}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
