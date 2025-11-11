import { GAME_CONFIG } from '../shared/constants.js';
import { SnakeBody } from '../shared/SnakeBody.js';
import { gameState, createPlayer, checkFoodCollision } from './game.js';

export function setupSocketHandlers(io) {
    io.on("connection", (socket) => {
        console.log("Player connected:", socket.id);
        
        // Limit players
        if (io.sockets.sockets.size > GAME_CONFIG.MAX_PLAYERS) {
            return;
        }

        // Create new player
        gameState.players[socket.id] = createPlayer(socket.id);

        // Send initial state
        socket.emit("init", gameState);

        // Handle player ready
        socket.on("playerReady", () => {
            const player = gameState.players[socket.id];
            if (player) {
                player.ready = true;
                console.log(`Player ${socket.id} is ready`);
                checkAllPlayersReady(io);
            }
        });

        // Update mouse position
        socket.on("updateMouse", (mouse) => {
            const player = gameState.players[socket.id];
            if (player) {
                player.mouse.x = mouse.x;
                player.mouse.y = mouse.y;
                checkFoodCollision(player);
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log("Player disconnected:", socket.id);
            delete gameState.players[socket.id];
        });
    });
}

// ===== GAME FLOW MANAGEMENT =====
function checkAllPlayersReady(io) {
    const players = Object.values(gameState.players);
    if (players.length === 0) return;

    const allReady = players.every(p => p.ready);
    if (allReady && !gameState.timerRunning) {
        startCountdown(io);
    }
}

function startCountdown(io) {
    let countdown = GAME_CONFIG.COUNTDOWN_SECONDS;
    gameState.timerRunning = true;

    const interval = setInterval(() => {
        io.emit("countdown", countdown);
        console.log("Countdown:", countdown);

        if (countdown <= 0) {
            clearInterval(interval);

            // Reset players for new round
            Object.values(gameState.players).forEach(p => {
                p.score = 0;
                p.snakeBody = [new SnakeBody(GAME_CONFIG.SNAKE_HEAD_RADIUS, p.color, GAME_CONFIG.SNAKE_SMOOTHNESS)];
                p.ready = false;
            });

            io.emit("gameStart");
            console.log("Game started!");
            startGameTimer(io);
        }

        countdown--;
    }, 1000);
}

function startGameTimer(io) {
    let timeLeft = GAME_CONFIG.GAME_DURATION_SECONDS;

    const gameInterval = setInterval(() => {
        io.emit("timerUpdate", timeLeft);

        if (timeLeft <= 0) {
            clearInterval(gameInterval);

            // Send final scores
            const scores = Object.values(gameState.players).map(p => ({
                id: p.id,
                score: p.score,
            }));

            io.emit("gameOver", scores);

            // Reset for next round
            gameState.timerRunning = false;
            Object.values(gameState.players).forEach(p => (p.ready = false));
        }

        timeLeft--;
    }, 1000);
}
