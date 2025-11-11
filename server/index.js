import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { GAME_CONFIG } from '../shared/constants.js';
import { gameState, updateGame } from './game.js';
import { setupSocketHandlers } from './socketHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

const PORT = process.env.PORT || 3000;

// Setup socket handlers
setupSocketHandlers(io);

// Broadcast game state at configured tick rate
setInterval(() => {
    updateGame();
    io.emit("state", gameState);
}, 1000 / GAME_CONFIG.TICK_RATE);

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
