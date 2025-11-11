# Snakes Online 🐍

A real-time multiplayer snake game built with Node.js, Express, Socket.IO, and HTML5 Canvas.

## Project Structure

```
snakes-online/
├── server/                  # Server-side code
│   ├── index.js             # Express server setup & main entry point
│   ├── game.js              # Game logic, state management, collisions
│   └── socketHandlers.js    # Socket.IO event handlers & game flow
│
├── client/                  # Client-side code
│   ├── index.html           # Main HTML page
│   ├── game.js              # Game controller & socket listeners
│   ├── renderer.js          # Canvas rendering logic
│   └── styles.css           # UI styling
│
├── shared/                  # Shared code between client & server
│   ├── constants.js         # Game configuration constants
│   └── SnakeBody.js         # Snake segment class
│
├── package.json
└── README.md
```

## Installation

```bash
npm install
```

## Running the Game

```bash
npm start
```

Then open your browser to `http://localhost:3000`

## How to Play

1. **Join**: Open the game in your browser (up to 3 players)
2. **Ready Up**: Click the "Ready" button
3. **Play**: Once all players are ready, a 5-second countdown begins
4. **Control**: Move your mouse to control your snake
5. **Objective**: Eat food to grow your snake and increase your score
6. **Win**: Have the highest score when the 60-second timer ends

## Architecture

### Server (`server/`)
- **index.js**: Main server file that sets up Express and Socket.IO
- **game.js**: Core game logic including collision detection, snake movement, and state updates
- **socketHandlers.js**: Manages all Socket.IO events and game flow (ready, countdown, game timer)

### Client (`client/`)
- **index.html**: Main page with canvas and UI elements
- **game.js**: Client-side game controller that handles socket events and coordinates rendering
- **renderer.js**: Handles all Canvas drawing operations
- **styles.css**: UI styling and layout

### Shared (`shared/`)
- **constants.js**: Game configuration (canvas size, tick rate, timings, etc.)
- **SnakeBody.js**: Shared class for snake body segments

## Features

- Real-time multiplayer (up to 3 players)
- Smooth snake movement following mouse cursor
- Collision detection for food consumption
- 60-second timed rounds
- Ready-up system with countdown
- Score tracking and winner determination
- Responsive canvas rendering at 30 FPS

## Technologies

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5 Canvas, JavaScript (ES6 modules)
- **Real-time Communication**: WebSockets via Socket.IO
