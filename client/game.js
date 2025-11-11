// Game logic and state management
import { Renderer } from './renderer.js';

export class Game {
    constructor(canvas, socket) {
        this.canvas = canvas;
        this.socket = socket;
        this.renderer = new Renderer(canvas);
        this.gameState = null;
        this.onStateUpdate = null; // Callback for state updates
        
        this.setupSocketListeners();
        this.setupInputHandlers();
    }

    setupInputHandlers() {
        this.canvas.addEventListener("mousemove", (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouse = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            this.socket.emit("updateMouse", mouse);
        });
    }

    setupSocketListeners() {
        this.socket.on("init", (state) => {
            this.gameState = state;
            if (this.onStateUpdate) {
                this.onStateUpdate(state);
            }
        });

        this.socket.on("state", (state) => {
            this.gameState = state;
            this.render();
            if (this.onStateUpdate) {
                this.onStateUpdate(state);
            }
        });
    }

    updateSnakeBody(mouseX, mouseY, BALLS) {
        const smoothVar = 0.2;

        // Move head toward mouse
        BALLS[0].x += (mouseX - BALLS[0].x) * smoothVar;
        BALLS[0].y += (mouseY - BALLS[0].y) * smoothVar;

        // Update body segments
        for (let j = 1; j < BALLS.length; j++) {
            const dx = BALLS[j - 1].x - BALLS[j].x;
            const dy = BALLS[j - 1].y - BALLS[j].y;
            const angle = Math.atan2(dy, dx);

            const targetX = BALLS[j - 1].x - BALLS[j].radius * Math.cos(angle);
            const targetY = BALLS[j - 1].y - BALLS[j].radius * Math.sin(angle);

            BALLS[j].x += (targetX - BALLS[j].x) * smoothVar;
            BALLS[j].y += (targetY - BALLS[j].y) * smoothVar;
        }
    }

    render() {
        if (!this.gameState) return;

        this.renderer.clear();
        this.renderer.drawFood(this.gameState.food);

        // Draw all players
        for (let id in this.gameState.players) {
            const player = this.gameState.players[id];
            
            // Update snake body with smooth following
            this.updateSnakeBody(player.mouse.x, player.mouse.y, player.snakeBody);
            
            this.renderer.drawSnakeBody(player.snakeBody);
            this.renderer.drawPlayerScore(player);
        }
    }
}
