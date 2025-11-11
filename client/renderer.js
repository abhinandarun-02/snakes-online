// Rendering module
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawFood(food) {
        this.ctx.fillStyle = "grey";
        this.ctx.beginPath();
        this.ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSnakeBody(snakeBody) {
        for (let ball of snakeBody) {
            this.drawCircle(ball);
        }
    }

    drawCircle(ball) {
        // Draw outer circle (border)
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 0.2;
        this.ctx.stroke();
        this.ctx.closePath();

        // Draw inner circle (colored)
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = ball.color;
        this.ctx.fill();
        this.ctx.closePath();
    }

    drawPlayerScore(player) {
        this.ctx.fillStyle = "black";
        this.ctx.fillText(
            `P${player.id.substring(0, 4)}: ${player.score}`,
            player.snakeBody[0].x,
            player.snakeBody[0].y - 20
        );
    }
}
