import { GAME_CONFIG, COLORS } from '../shared/constants.js';
import { SnakeBody } from '../shared/SnakeBody.js';

// ===== GAME STATE =====
export const gameState = {
    players: {},
    food: { x: 300, y: 300, radius: GAME_CONFIG.FOOD_RADIUS },
    timerRunning: false
};

// ===== FOOD MANAGEMENT =====
export function spawnFood() {
    gameState.food = {
        x: Math.random() * (GAME_CONFIG.FOOD_MAX_X - GAME_CONFIG.FOOD_MIN_X) + GAME_CONFIG.FOOD_MIN_X,
        y: Math.random() * (GAME_CONFIG.FOOD_MAX_Y - GAME_CONFIG.FOOD_MIN_Y) + GAME_CONFIG.FOOD_MIN_Y,
        radius: GAME_CONFIG.FOOD_RADIUS,
    };
}

export function checkFoodCollision(player) {
    const head = player.snakeBody[0];
    const dx = head.x - gameState.food.x;
    const dy = head.y - gameState.food.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < head.radius + gameState.food.radius) {
        player.score += 1;

        // Add new segment at last position
        const lastBall = player.snakeBody[player.snakeBody.length - 1];
        let ballbody = new SnakeBody(lastBall.radius, player.color, GAME_CONFIG.SNAKE_SMOOTHNESS);
        ballbody.x = lastBall.x - (2 * lastBall.radius);
        ballbody.y = lastBall.y;
        player.snakeBody.push(ballbody);
        spawnFood();
    }
}

// ===== GAME UPDATE =====
export function updateGame() {
    for (const id in gameState.players) {
        const player = gameState.players[id];
        updateSnakeBody(player);
        checkFoodCollision(player);
    }
}

export function updateSnakeBody(player) {
    const BALLS = player.snakeBody;
    const smoothVar = GAME_CONFIG.SNAKE_SMOOTHNESS;

    // Move head toward mouse
    BALLS[0].x += (player.mouse.x - BALLS[0].x) * smoothVar;
    BALLS[0].y += (player.mouse.y - BALLS[0].y) * smoothVar;

    // Update rest of the body
    for (let j = 1; j < BALLS.length; j++) {
        const dx = BALLS[j - 1].x - BALLS[j].x;
        const dy = BALLS[j - 1].y - BALLS[j].y;
        const angle = Math.atan2(dy, dx);

        const targetX = BALLS[j - 1].x - BALLS[j].radius * 2 * Math.cos(angle);
        const targetY = BALLS[j - 1].y - BALLS[j].radius * 2 * Math.sin(angle);

        BALLS[j].x += (targetX - BALLS[j].x) * smoothVar;
        BALLS[j].y += (targetY - BALLS[j].y) * smoothVar;
    }
}

// ===== PLAYER MANAGEMENT =====
export function createPlayer(socketId, playerName = "Player") {
    return {
        id: socketId,
        name: playerName,
        snakeBody: [new SnakeBody(GAME_CONFIG.SNAKE_HEAD_RADIUS, getRandomColor(), GAME_CONFIG.SNAKE_SMOOTHNESS)],
        score: 0,
        mouse: { x: 0, y: 0 },
        ready: false
    };
}

export function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}
