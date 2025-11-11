import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { GAME_CONFIG } from '../shared/constants.js';
import { updateSnakeBody } from './game.js';
import { SnakeBody } from '../shared/SnakeBody.js';
import { setupSocketHandlers, getRooms } from './socketHandlers.js';

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

// Broadcast game state at configured tick rate for each room
setInterval(() => {
    const rooms = getRooms();
    
    rooms.forEach(room => {
        // Update game state for this room
        for (const id in room.gameState.players) {
            const player = room.gameState.players[id];
            updateSnakeBody(player);
            
            // Check food collision for this room
            checkRoomFoodCollision(player, room);
        }
        
        // Broadcast to room
        io.to(room.id).emit("state", room.gameState);
    });
}, 1000 / GAME_CONFIG.TICK_RATE);

// Room-specific food collision check
function checkRoomFoodCollision(player, room) {
    const head = player.snakeBody[0];
    const food = room.gameState.food;
    const dx = head.x - food.x;
    const dy = head.y - food.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < head.radius + food.radius) {
        player.score += 1;

        // Add new segment at last position
        const lastBall = player.snakeBody[player.snakeBody.length - 1];
        const ballbody = new SnakeBody(GAME_CONFIG.SNAKE_HEAD_RADIUS, player.color, GAME_CONFIG.SNAKE_SMOOTHNESS);
        ballbody.x = lastBall.x - (2 * lastBall.radius);
        ballbody.y = lastBall.y;
        player.snakeBody.push(ballbody);
        
        // Spawn new food in this room
        room.gameState.food = {
            x: Math.random() * (GAME_CONFIG.FOOD_MAX_X - GAME_CONFIG.FOOD_MIN_X) + GAME_CONFIG.FOOD_MIN_X,
            y: Math.random() * (GAME_CONFIG.FOOD_MAX_Y - GAME_CONFIG.FOOD_MIN_Y) + GAME_CONFIG.FOOD_MIN_Y,
            radius: GAME_CONFIG.FOOD_RADIUS,
        };
    }
}

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
