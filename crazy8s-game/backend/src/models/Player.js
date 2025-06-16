class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.hand = [];
        this.isEliminated = false;
        this.isSafe = false;
    }

    addCards(cards) {
        if (Array.isArray(cards)) {
            this.hand.push(...cards);
        } else {
            this.hand.push(cards);
        }
    }

    removeCards(cards) {
        if (!Array.isArray(cards)) {
            cards = [cards];
        }
        
        for (const card of cards) {
            const index = this.hand.findIndex(c => 
                c.suit === card.suit && c.rank === card.rank
            );
            if (index !== -1) {
                this.hand.splice(index, 1);
            }
        }
    }

    hasCards(cards) {
        if (!Array.isArray(cards)) {
            cards = [cards];
        }
        
        return cards.every(card => 
            this.hand.some(c => c.suit === card.suit && c.rank === card.rank)
        );
    }

    getValidCards(topCard, declaredSuit = null) {
        const targetSuit = declaredSuit || topCard.suit;
        return this.hand.filter(card => 
            card.rank === '8' || 
            card.suit === targetSuit || 
            card.rank === topCard.rank
        );
    }

    hasWon() {
        return this.hand.length === 0;
    }

    getHandSize() {
        return this.hand.length;
    }

    reset() {
        this.hand = [];
        this.isSafe = false;
    }
}

module.exports = Player;