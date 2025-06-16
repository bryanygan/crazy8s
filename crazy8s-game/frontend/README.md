# Crazy 8's Game Frontend

## Overview
This is the frontend for the Crazy 8's game, built using React. It connects to the backend server via Socket.IO for real-time gameplay and player interactions.

## Project Structure
- **public/index.html**: The main HTML file that serves the React application.
- **src/index.js**: The entry point for the React app, rendering the main application component.
- **src/components/**: Contains React components for the game.
  - **GameBoard.js**: Represents the main game interface.
  - **PlayerHand.js**: Displays the cards in a player's hand.
  - **Chat.js**: Allows players to communicate during the game.
- **src/styles/main.css**: Contains the styles for the frontend application.

## Setup Instructions
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

## Component Details
- **GameBoard**: Manages the game state and renders the game interface.
- **PlayerHand**: Displays the player's cards and allows them to make moves.
- **Chat**: Facilitates communication between players during the game.

## Real-time Communication
The frontend uses Socket.IO to handle real-time interactions with the backend, ensuring that all players receive updates about the game state instantly.

## License
This project is licensed under the MIT License.