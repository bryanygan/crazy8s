// This file contains utility functions for managing the deck of cards, including shuffling and dealing cards.

const crypto = require('crypto');

const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];

// Function to generate unique card ID
function generateCardId() {
    return `card_${crypto.randomUUID()}`;
}

// Function to create a new deck of cards
function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ 
                id: generateCardId(),
                suit, 
                rank 
            });
        }
    }
    return deck;
}

// Function to shuffle the deck
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Function to deal cards to players
function dealCards(deck, numPlayers, cardsPerPlayer) {
    const hands = Array.from({ length: numPlayers }, () => []);
    for (let i = 0; i < cardsPerPlayer; i++) {
        for (let j = 0; j < numPlayers; j++) {
            if (deck.length > 0) {
                hands[j].push(deck.pop());
            }
        }
    }
    return hands;
}

module.exports = {
    createDeck,
    shuffleDeck,
    dealCards,
};