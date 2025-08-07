import React, { useState } from 'react';
import { DragProvider } from '../contexts/DragContext';
import { CardSelectionProvider, useCardSelection } from '../contexts/CardSelectionContext';
import GameBoard from './GameBoard';
import Card from './Card';
import DragPreview from './DragPreview';
import { useDragHandler } from '../hooks/useDragHandler';

const DropHandlerTest = () => {
  // Sample hand cards for testing
  const [handCards, setHandCards] = useState([
    { id: 'h1', suit: 'Hearts', rank: '7' },
    { id: 'h2', suit: 'Spades', rank: '7' },
    { id: 'h3', suit: 'Hearts', rank: '8' },
    { id: 'h4', suit: 'Clubs', rank: 'King' },
    { id: 'h5', suit: 'Diamonds', rank: 'Ace' },
    { id: 'h6', suit: 'Hearts', rank: 'Queen' },
  ]);
  
  const [gameState, setGameState] = useState({
    discardPile: [{ id: 'd1', suit: 'Hearts', rank: '6' }],
    currentPlayer: 0,
    players: 2
  });

  // Handle successful card play with comprehensive validation
  const handlePlayCards = (playedCards) => {
    console.log('🎯 HAND VALIDATION - handlePlayCards called with:', {
      playedCardsCount: playedCards?.length,
      playedCards: playedCards?.map(c => `${c.rank}${c.suit[0]}`) || [],
      currentHandSize: handCards.length
    });
    
    if (!playedCards || playedCards.length === 0) {
      console.error('❌ HAND VALIDATION FAILED: No cards provided to handlePlayCards');
      return;
    }

    // Validate that all played cards exist in current hand
    const invalidCards = playedCards.filter(playedCard => 
      !handCards.some(handCard => 
        handCard.id === playedCard.id || 
        (handCard.suit === playedCard.suit && handCard.rank === playedCard.rank)
      )
    );

    if (invalidCards.length > 0) {
      console.error('❌ HAND VALIDATION FAILED: Attempting to play cards not in hand:', 
        invalidCards.map(c => `${c.rank}${c.suit[0]}`));
      return;
    }
    
    // Remove played cards from hand
    setHandCards(prevHand => {
      console.log('🔄 Removing cards from hand:', {
        beforeCount: prevHand.length,
        cardsToRemove: playedCards.map(c => `${c.rank}${c.suit[0]}`)
      });
      
      const newHand = prevHand.filter(handCard => 
        !playedCards.some(playedCard => 
          handCard.id === playedCard.id || 
          (handCard.suit === playedCard.suit && handCard.rank === playedCard.rank)
        )
      );
      
      console.log('✅ Hand updated successfully:', {
        afterCount: newHand.length,
        cardsRemoved: prevHand.length - newHand.length,
        remainingCards: newHand.map(c => `${c.rank}${c.suit[0]}`)
      });
      
      return newHand;
    });
    
    // Update game state
    setGameState(prevState => ({
      ...prevState,
      discardPile: [...prevState.discardPile, ...playedCards],
      lastPlayedCards: playedCards
    }));
    
    console.log('🎯 Card play completed successfully');
  };

  // Determine valid cards (simplified logic for testing)
  const getValidCards = () => {
    if (gameState.discardPile.length === 0) return handCards;
    
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    return handCards.filter(card => 
      card.suit === topCard.suit || 
      card.rank === topCard.rank || 
      card.rank === '8' // 8s are always playable
    );
  };

  const validCards = getValidCards();

  return (
    <DragProvider>
      <CardSelectionProvider>
        <TestContainer 
          handCards={handCards}
          validCards={validCards}
          gameState={gameState}
          onPlayCards={handlePlayCards}
        />
      </CardSelectionProvider>
    </DragProvider>
  );
};

const TestContainer = ({ handCards, validCards, gameState, onPlayCards }) => {
  const { selectedCards } = useCardSelection();
  
  // Use drag handler for global drop handling
  useDragHandler((zoneId, draggedCards) => {
    console.log('🎯 DropHandlerTest.useDragHandler called:', { zoneId, draggedCards });
    
    if (zoneId === 'discard-pile') {
      console.log('✅ Valid drop zone - letting GameBoard handle validation');
      // GameBoard will handle validation and return true/false
      return true; // Let GameBoard handle the validation
    }
    
    console.log('❌ Invalid drop zone');
    return false; // Invalid drop zone
  });

  return (
    <div style={{ 
      padding: '20px', 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: '#2c3e50',
          marginBottom: '20px' 
        }}>
          Drop Handler Test
        </h1>
        
        <div style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#34495e' }}>Instructions</h3>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#7f8c8d' }}>
            1. Click cards to select them (Ctrl+click for multi-select)
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#7f8c8d' }}>
            2. Drag selected cards to the discard pile
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#7f8c8d' }}>
            3. Valid plays will be accepted, invalid plays will return to hand
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#e74c3c' }}>
            Top card: <strong>{gameState.discardPile[gameState.discardPile.length - 1]?.rank} of {gameState.discardPile[gameState.discardPile.length - 1]?.suit}</strong>
          </p>
        </div>

        {/* Game Board */}
        <GameBoard 
          gameState={gameState}
          onPlayCards={onPlayCards}
          players={2}
        />

        {/* Player Hand */}
        <div style={{
          backgroundColor: '#2ecc71',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '800px'
        }}>
          <div style={{
            color: 'white',
            textAlign: 'center',
            marginBottom: '15px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Your Hand ({handCards.length} cards)
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            minHeight: '120px',
            alignItems: 'center'
          }}>
            {handCards.map(card => {
              const isPlayable = validCards.some(vc => 
                vc.id === card.id || (vc.suit === card.suit && vc.rank === card.rank)
              );
              
              return (
                <Card
                  key={card.id}
                  card={card}
                  isPlayable={isPlayable}
                  settings={{ experiencedMode: false }}
                  allCards={handCards}
                />
              );
            })}
          </div>
        </div>

        {/* Game State Info */}
        <div style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '600px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#34495e' }}>Game State</h3>
          <p><strong>Cards in Hand:</strong> {handCards.length}</p>
          <p><strong>Cards in Discard:</strong> {gameState.discardPile.length}</p>
          <p><strong>Valid Cards:</strong> {validCards.length}</p>
          <div style={{ marginTop: '10px' }}>
            <strong>Valid Cards to Play:</strong> {
              validCards.map(card => `${card.rank}${card.suit[0]}`).join(', ') || 'None'
            }
          </div>
          <div style={{ marginTop: '10px', color: '#e74c3c' }}>
            <strong>Currently Selected:</strong> {
              selectedCards.length > 0 
                ? selectedCards.map(card => `${card.rank}${card.suit[0]}`).join(', ')
                : 'None'
            } ({selectedCards.length} cards)
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#7f8c8d' }}>
            <strong>Selection Details:</strong> {
              selectedCards.length > 0 
                ? JSON.stringify(selectedCards.map(c => ({ rank: c.rank, suit: c.suit, id: c.id })))
                : 'No selection'
            }
          </div>
          
          {/* Internal Selection State Debug */}
          <SelectionStateDebug />
        </div>

        {/* Drag Preview */}
        <DragPreview />
      </div>
    </div>
  );
};

const SelectionStateDebug = () => {
  const { selectedCards, selectionOrder, lastSelectedCard, isCardSelected, getSelectionIndex } = useCardSelection();
  
  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '10px',
      borderRadius: '5px',
      marginTop: '10px',
      fontSize: '11px',
      color: '#495057'
    }}>
      <div><strong>🔍 Selection State Debug:</strong></div>
      <div>Selected Count: {selectedCards.length}</div>
      <div>Selection Order: [{selectionOrder.join(', ')}]</div>
      <div>Last Selected: {lastSelectedCard ? `${lastSelectedCard.rank}${lastSelectedCard.suit[0]}` : 'None'}</div>
      
      {selectedCards.length > 0 && (
        <div style={{ marginTop: '5px' }}>
          <strong>Card States:</strong>
          {selectedCards.map((card, index) => (
            <div key={card.id || `${card.suit}-${card.rank}`} style={{ marginLeft: '10px' }}>
              {`${card.rank}${card.suit[0]}`}: selected={isCardSelected(card).toString()}, index={getSelectionIndex(card)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TestContainer = ({ handCards, validCards, gameState, onPlayCards }) => {
  const { selectedCards } = useCardSelection();
  
  // Use drag handler for global drop handling
  useDragHandler((zoneId, draggedCards) => {
    console.log('🎯 DropHandlerTest.useDragHandler called:', { zoneId, draggedCards });
    
    if (zoneId === 'discard-pile') {
      console.log('✅ Valid drop zone - letting GameBoard handle validation');
      // GameBoard will handle validation and return true/false
      return true; // Let GameBoard handle the validation
    }
    
    console.log('❌ Invalid drop zone');
    return false; // Invalid drop zone
  });

  return (
    <div style={{ 
      padding: '20px', 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: '#2c3e50',
          marginBottom: '20px' 
        }}>
          Drop Handler Test
        </h1>
        
        <div style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#34495e' }}>Instructions</h3>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#7f8c8d' }}>
            1. Click cards to select them (Ctrl+click for multi-select)
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#7f8c8d' }}>
            2. Drag selected cards to the discard pile
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#7f8c8d' }}>
            3. Valid plays will be accepted, invalid plays will return to hand
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#e74c3c' }}>
            Top card: <strong>{gameState.discardPile[gameState.discardPile.length - 1]?.rank} of {gameState.discardPile[gameState.discardPile.length - 1]?.suit}</strong>
          </p>
        </div>

        {/* Game Board */}
        <GameBoard 
          gameState={gameState}
          onPlayCards={onPlayCards}
          players={2}
        />

        {/* Player Hand */}
        <div style={{
          backgroundColor: '#2ecc71',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '800px'
        }}>
          <div style={{
            color: 'white',
            textAlign: 'center',
            marginBottom: '15px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Your Hand ({handCards.length} cards)
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            minHeight: '120px',
            alignItems: 'center'
          }}>
            {handCards.map(card => {
              const isPlayable = validCards.some(vc => 
                vc.id === card.id || (vc.suit === card.suit && vc.rank === card.rank)
              );
              
              return (
                <Card
                  key={card.id}
                  card={card}
                  isPlayable={isPlayable}
                  settings={{ experiencedMode: false }}
                  allCards={handCards}
                />
              );
            })}
          </div>
        </div>

        {/* Game State Info */}
        <div style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '600px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#34495e' }}>Game State</h3>
          <p><strong>Cards in Hand:</strong> {handCards.length}</p>
          <p><strong>Cards in Discard:</strong> {gameState.discardPile.length}</p>
          <p><strong>Valid Cards:</strong> {validCards.length}</p>
          <div style={{ marginTop: '10px' }}>
            <strong>Valid Cards to Play:</strong> {
              validCards.map(card => `${card.rank}${card.suit[0]}`).join(', ') || 'None'
            }
          </div>
          <div style={{ marginTop: '10px', color: '#e74c3c' }}>
            <strong>Currently Selected:</strong> {
              selectedCards.length > 0 
                ? selectedCards.map(card => `${card.rank}${card.suit[0]}`).join(', ')
                : 'None'
            } ({selectedCards.length} cards)
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#7f8c8d' }}>
            <strong>Selection Details:</strong> {
              selectedCards.length > 0 
                ? JSON.stringify(selectedCards.map(c => ({ rank: c.rank, suit: c.suit, id: c.id })))
                : 'No selection'
            }
          </div>
          
          {/* Internal Selection State Debug */}
          <SelectionStateDebug />
        </div>

        {/* Drag Preview */}
        <DragPreview />
      </div>
    </div>
  );
};

export default DropHandlerTest;