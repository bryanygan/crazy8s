import React from 'react';

const PlayerHand = ({ cards, onCardPlay }) => {
    const handleCardClick = (card) => {
        onCardPlay(card);
    };

    return (
        <div className="player-hand">
            {cards.map((card, index) => (
                <div key={index} className="card" onClick={() => handleCardClick(card)}>
                    {card}
                </div>
            ))}
        </div>
    );
};

export default PlayerHand;