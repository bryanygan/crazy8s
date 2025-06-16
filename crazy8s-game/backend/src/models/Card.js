class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }

    matches(otherCard) {
        return this.suit === otherCard.suit || this.rank === otherCard.rank;
    }

    isSpecial() {
        return ['Jack', 'Queen', 'Ace', '2', '8'].includes(this.rank);
    }

    getEffect() {
        switch (this.rank) {
            case 'Jack': return { type: 'skip' };
            case 'Queen': return { type: 'reverse' };
            case 'Ace': return { type: 'draw', amount: 4 };
            case '2': return { type: 'draw', amount: 2 };
            case '8': return { type: 'wild' };
            default: return { type: 'normal' };
        }
    }

    canCounter(targetCard) {
        if (targetCard.rank === 'Ace') {
            return this.rank === 'Ace' || (this.rank === '2' && this.suit === targetCard.suit);
        }
        if (targetCard.rank === '2') {
            return this.rank === '2' || (this.rank === 'Ace' && this.suit === targetCard.suit);
        }
        return false;
    }

    toString() {
        return `${this.rank} of ${this.suit}`;
    }
}

module.exports = Card;