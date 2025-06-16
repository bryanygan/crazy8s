# Crazy 8's Game

## Project Overview
Crazy 8's is a multiplayer card game that allows players to compete against each other in real-time. This project is structured into a backend and a frontend, utilizing Express for the server and Socket.IO for real-time communication.

## Directory Structure
The project is organized as follows:

```
crazy8s-game
├── backend
│   ├── src
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── socket.js
│   │   ├── controllers
│   │   │   └── gameController.js
│   │   ├── models
│   │   │   └── game.js
│   │   ├── routes
│   │   │   └── gameRoutes.js
│   │   └── utils
│   │       └── deck.js
│   ├── package.json
│   └── README.md
├── frontend
│   ├── public
│   │   └── index.html
│   ├── src
│   │   ├── index.js
│   │   ├── components
│   │   │   ├── GameBoard.js
│   │   │   ├── PlayerHand.js
│   │   │   └── Chat.js
│   │   └── styles
│   │       └── main.css
│   ├── package.json
│   └── README.md
└── README.md
```

## Backend
The backend is built using Node.js and Express. It handles game logic, player interactions, and real-time communication through Socket.IO.

### Key Files
- **app.js**: Initializes the Express application and sets up middleware.
- **server.js**: Entry point for the server, starting the Express app and setting up Socket.IO.
- **socket.js**: Manages Socket.IO connections and events.
- **controllers/gameController.js**: Handles game-related requests.
- **models/game.js**: Defines the Game class and manages game state.
- **routes/gameRoutes.js**: Sets up API endpoints for game actions.
- **utils/deck.js**: Contains utility functions for card management.

## Frontend
The frontend is built using React and provides the user interface for the game.

### Key Files
- **index.html**: Main HTML file for the React application.
- **index.js**: Entry point for the React app.
- **components/GameBoard.js**: Represents the main game interface.
- **components/PlayerHand.js**: Displays the player's cards.
- **components/Chat.js**: Allows players to communicate.
- **styles/main.css**: Contains styles for the application.

## Setup Instructions
1. Clone the repository.
2. Navigate to the `backend` directory and run `npm install` to install backend dependencies.
3. Navigate to the `frontend` directory and run `npm install` to install frontend dependencies.
4. Start the backend server by running `node src/server.js`.
5. Start the frontend application by running `npm start` in the `frontend` directory.

## API Details
Refer to the backend README for detailed API endpoints and usage.

## Game Rules
For the rules of Crazy 8's, please refer to the main README file located in the root directory.