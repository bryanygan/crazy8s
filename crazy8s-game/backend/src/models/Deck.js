const Card = require('./Card');

class Deck {
    constructor() {
        this.cards = [];
        this.initialize();
    }

    initialize() {
        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
        
        this.cards = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        return this;
    }

    deal(count = 1) {
        if (count === 1) {
            return this.cards.pop();
        }
        const dealtCards = [];
        for (let i = 0; i < count && this.cards.length > 0; i++) {
            dealtCards.push(this.cards.pop());
        }
        return dealtCards;
    }

    size() {
        return this.cards.length;
    }

    isEmpty() {
        return this.cards.length === 0;
    }
}

module.exports = Deck;