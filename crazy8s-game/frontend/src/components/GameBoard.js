import React, { useState, useCallback } from 'react';
import DropZone from './DropZone';
import StackedCards from './StackedCards';
import { canStackCardsFrontend } from '../utils/cardValidation';
import { useDrag } from '../contexts/DragContext';

const GameBoard = ({ gameState, onPlayCards, players = 2 }) => {
    const [discardPile, setDiscardPile] = useState([]);
    const [lastPlayedCards, setLastPlayedCards] = useState([]);
    const { endDrag } = useDrag();
    
    // Handle drop on discard pile with comprehensive validation
    const handleDiscardDrop = useCallback((zoneId, draggedCards) => {
        console.log('🎯 DROP VALIDATION - Drop attempted on discard pile:', { 
            zoneId, 
            draggedCardsCount: draggedCards?.length,
            draggedCards: draggedCards?.map(c => `${c.rank}${c.suit[0]}`) || [],
            discardPileTop: discardPile.length > 0 ? `${discardPile[discardPile.length - 1].rank}${discardPile[discardPile.length - 1].suit[0]}` : 'empty'
        });
        
        // Input validation
        if (!draggedCards || draggedCards.length === 0) {
            console.log('❌ DROP VALIDATION FAILED: No cards to drop');
            return false;
        }

        // Validate cards are properly formatted
        for (let i = 0; i < draggedCards.length; i++) {
            const card = draggedCards[i];
            if (!card || !card.suit || !card.rank) {
                console.error('❌ DROP VALIDATION FAILED: Invalid card format at index', i, card);
                return false;
            }
        }

        // For empty discard pile, any valid card is acceptable
        if (discardPile.length === 0) {
            console.log('✅ Empty discard pile - accepting cards:', draggedCards.map(c => `${c.rank}${c.suit[0]}`));
            const newDiscardPile = [...discardPile, ...draggedCards];
            setDiscardPile(newDiscardPile);
            setLastPlayedCards(draggedCards);
            
            console.log('🔄 Calling onPlayCards with validated cards:', draggedCards);
            if (onPlayCards) {
                try {
                    onPlayCards(draggedCards);
                    console.log('✅ onPlayCards completed successfully');
                } catch (error) {
                    console.error('❌ Error in onPlayCards:', error);
                    return false;
                }
            }
            return true;
        }

        // Validate the card stack can be played on the discard pile
        console.log('🔍 Validating play:', {
            topCard: `${discardPile[discardPile.length - 1].rank}${discardPile[discardPile.length - 1].suit[0]}`,
            firstDraggedCard: `${draggedCards[0].rank}${draggedCards[0].suit[0]}`,
            allDraggedCards: draggedCards.map(c => `${c.rank}${c.suit[0]}`)
        });
        
        const isValidPlay = canStackCardsFrontend(discardPile, draggedCards[0], players);
        
        if (isValidPlay) {
            console.log('✅ VALID PLAY - Processing drop:', {
                cardsToAdd: draggedCards.map(c => `${c.rank}${c.suit[0]}`),
                newPileSize: discardPile.length + draggedCards.length
            });
            
            const newDiscardPile = [...discardPile, ...draggedCards];
            setDiscardPile(newDiscardPile);
            setLastPlayedCards(draggedCards);
            
            console.log('🔄 Calling onPlayCards with validated cards:', draggedCards);
            if (onPlayCards) {
                try {
                    onPlayCards(draggedCards);
                    console.log('✅ onPlayCards completed successfully');
                } catch (error) {
                    console.error('❌ Error in onPlayCards:', error);
                    // Don't return false here as the cards were already added to discard pile
                }
            }
            return true;
        } else {
            console.log('❌ INVALID PLAY - Cards will return to hand:', {
                topCard: `${discardPile[discardPile.length - 1].rank}${discardPile[discardPile.length - 1].suit[0]}`,
                attemptedCards: draggedCards.map(c => `${c.rank}${c.suit[0]}`)
            });
            return false;
        }
    }, [discardPile, players, onPlayCards]);

    return (
        <div className="game-board" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '400px',
            padding: '20px',
            backgroundColor: '#2c5530',
            borderRadius: '12px',
            margin: '20px',
            position: 'relative'
        }}>
            <h2 style={{ color: 'white', marginBottom: '30px' }}>Game Board</h2>
            
            {/* Discard Pile Area */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '30px',
                marginBottom: '20px'
            }}>
                {/* Draw Pile (Static for now) */}
                <div style={{
                    width: '80px',
                    height: '112px',
                    backgroundColor: '#1a3d1f',
                    border: '2px solid #34495e',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    textAlign: 'center'
                }}>
                    Draw<br/>Pile
                </div>

                {/* Discard Pile Drop Zone */}
                <DropZone
                    id="discard-pile"
                    acceptCards={true}
                    onDrop={handleDiscardDrop}
                    label="Discard Pile"
                    style={{
                        backgroundColor: discardPile.length > 0 ? 'transparent' : '#e8f4fd',
                        border: discardPile.length > 0 ? 'none' : '2px dashed #3498db',
                        minWidth: '120px',
                        minHeight: '140px',
                        position: 'relative'
                    }}
                >
                    {discardPile.length > 0 && (
                        <StackedCards
                            cards={discardPile}
                            position={{ x: 0, y: 0 }}
                            stackDirection="horizontal"
                            maxVisible={5}
                            offset={8}
                            showCount={true}
                        />
                    )}
                </DropZone>
            </div>

            {/* Game Info */}
            {lastPlayedCards.length > 0 && (
                <div style={{
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    padding: '10px',
                    borderRadius: '6px',
                    marginTop: '20px'
                }}>
                    Last played: {lastPlayedCards.map(card => `${card.rank} of ${card.suit}`).join(', ')}
                </div>
            )}

            {/* Instructions */}
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '12px',
                textAlign: 'center'
            }}>
                Drag cards from your hand to the discard pile
            </div>
        </div>
    );
};

export default GameBoard;