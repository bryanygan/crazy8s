import React from 'react';
import Card from './Card';
import { isSameCard } from '../../utils/cardUtils';

const PlayerHand = ({ cards, validCards = [], selectedCards = [], onCardSelect, settings = {} }) => {

  // Helper function to get rank value for sorting
  const getRankValue = (rank) => {
    // Use custom rank order from settings if available
    const rankOrder = settings.cardSortingPreferences?.customRankOrder ||
                      ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
    const index = rankOrder.indexOf(rank);
    return index === -1 ? rankOrder.length : index; // Place unknown cards at the end
  };

  // Helper function to get suit order
  const getSuitValue = (suit) => {
    const suitOrder = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    return suitOrder.indexOf(suit);
  };

  // Updated card organizing function
  const organizeCards = () => {
    let organizedCards = [...cards];

    // Sort by rank if enabled
    if (settings.sortByRank) {
      organizedCards.sort((a, b) => {
        const rankA = getRankValue(a.rank);
        const rankB = getRankValue(b.rank);

        if (rankA !== rankB) {
          return rankA - rankB;
        }

        // If ranks are the same, sort by suit as a tiebreaker
        return getSuitValue(a.suit) - getSuitValue(b.suit);
      });
    }

    // Group by suit if enabled (applied after rank sorting)
    if (settings.groupBySuit) {
      organizedCards.sort((a, b) => {
        const suitA = getSuitValue(a.suit);
        const suitB = getSuitValue(b.suit);

        if (suitA !== suitB) {
          return suitA - suitB;
        }

        // If suits are the same, maintain the rank order established above
        return getRankValue(a.rank) - getRankValue(b.rank);
      });
    }

    return organizedCards;
  };

  const organizedCards = organizeCards();

  // Group cards by suit if grouping is enabled
  const getCardGroups = () => {
    if (!settings.groupBySuit) {
      return [{ suit: null, cards: organizedCards }];
    }

    const groups = [];
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];

    suits.forEach(suit => {
      const suitCards = organizedCards.filter(card => card.suit === suit);
      if (suitCards.length > 0) {
        groups.push({ suit, cards: suitCards });
      }
    });

    return groups;
  };

  const cardGroups = getCardGroups();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '20px 0',
      padding: '15px 15px 25px 15px',
      backgroundColor: '#2ecc71',
      borderRadius: '15px',
      minHeight: '180px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      overflow: 'visible'
    }}>
      <div style={{
        color: '#fff',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '10px',
        textAlign: 'center'
      }}>
        Your Hand ({cards.length} cards)
      </div>

      {cards.length === 0 ? (
        <div style={{ color: '#fff', fontSize: '16px', fontStyle: 'italic' }}>
          No cards in hand
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible',
          paddingTop: '20px',
          paddingBottom: '10px',
          position: 'relative',
          minHeight: '110px'
        }}>
          {cardGroups.map((group, groupIndex) => (
            <div key={groupIndex} style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {group.cards.map((card) => {
                const isPlayable = validCards.some(vc => isSameCard(vc, card));
                const isSelected = selectedCards.some(sc => isSameCard(sc, card));
                const selectedIndex = selectedCards.findIndex(sc => isSameCard(sc, card));
                const isBottomCard = selectedIndex === 0;
                const cardKey = card.id || `${card.suit}-${card.rank}`;

                return (
                  <Card
                    key={cardKey}
                    card={card}
                    isPlayable={isPlayable}
                    isSelected={isSelected}
                    selectedIndex={selectedIndex}
                    isBottomCard={isBottomCard && selectedCards.length > 1}
                    settings={settings}
                    onCardSelect={onCardSelect}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerHand;
