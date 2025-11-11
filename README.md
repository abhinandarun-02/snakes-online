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

1. **Enter the lobby**: Open the game and pick a room (or create your own public room).
2. **Configure or chill**: Room admins can tweak mode, limits, speed, and difficulty before the match.
3. **Ready up**: Hit the "Ready" button when you are set. Everyone sees ready status in real time.
4. **Countdown**: A short countdown gives every player a moment before snakes spawn.
5. **Move**: Glide your mouse cursor to steer your snake smoothly around the arena.
6. **Score**: Eat food to grow longer and climb the live leaderboard.
7. **Win**: When the timer or point limit completes, the leaderboard locks in and a winner is crowned.

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

- Real-time multiplayer rooms with admin-configurable game modes, limits, and player caps
- Lobby with live rooms list, in-room ready indicators, and host controls
- Integrated chat panel for each room
- Responsive in-room UI with an embedded live leaderboard during matches
- Smooth mouse-driven snake movement rendered at 30 FPS
- Collision detection, food spawning, and balanced growth curves
- Timed, points, survival, endless, and battle royale modes (with shrinking arena)
- Game-over summary highlighting podium finishers and personal results

## Technologies

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5 Canvas, JavaScript (ES6 modules)
- **Real-time Communication**: WebSockets via Socket.IO
