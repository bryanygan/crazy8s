# Crazy 8's Game Backend

## Overview
This is the backend for the Crazy 8's game, built using Node.js, Express, and Socket.IO. The backend handles game logic, player interactions, and real-time communication between players.

## Directory Structure
- **src/**: Contains the main application code.
  - **app.js**: Initializes the Express application and sets up middleware.
  - **server.js**: Entry point for the server, starting the Express app and setting up Socket.IO.
  - **socket.js**: Manages Socket.IO connections and events.
  - **controllers/**: Contains game-related request handlers.
    - **gameController.js**: Functions for starting a game, making moves, and managing game state.
  - **models/**: Defines the data structures and logic for the game.
    - **game.js**: Manages the game state, player actions, and game rules.
  - **routes/**: Sets up API endpoints for the game.
    - **gameRoutes.js**: Links routes to controller functions.
  - **utils/**: Utility functions for the game.
    - **deck.js**: Functions for managing the deck of cards.

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the backend directory:
   ```
   cd crazy8s-game/backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```

## API Endpoints
- **POST /api/game/start**: Starts a new game.
- **POST /api/game/move**: Makes a move in the game.
- **GET /api/game/state**: Retrieves the current game state.

## Real-Time Communication
The backend uses Socket.IO to enable real-time interactions between players. Events are emitted and listened to for actions such as making moves and updating game state.

## License
This project is licensed under the MIT License.