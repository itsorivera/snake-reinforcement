export class SnakeGame {
    gridSize: number = 20;
    snake: { x: number, y: number }[] = [];
    food: { x: number, y: number } = { x: 0, y: 0 };
    direction: number = 3; // 0:L, 1:R, 2:U, 3:D
    score: number = 0;
    isGameOver: boolean = false;

    constructor() {
        this.reset();
    }

    reset() {
        this.snake = [{ x: 10, y: 10 }];
        this.direction = 3;
        this.score = 0;
        this.isGameOver = false;
        this.placeFood();
    }

    placeFood() {
        while (true) {
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);
            if (!this.snake.some(s => s.x === x && s.y === y)) {
                this.food = { x, y };
                break;
            }
        }
    }

    step(action: number) {
        if (this.isGameOver) return;

        // Prevent moving backwards
        if (!((action === 0 && this.direction === 1) ||
            (action === 1 && this.direction === 0) ||
            (action === 2 && this.direction === 3) ||
            (action === 3 && this.direction === 2))) {
            this.direction = action;
        }

        const head = { ...this.snake[0] };
        if (this.direction === 0) head.x -= 1;
        else if (this.direction === 1) head.x += 1;
        else if (this.direction === 2) head.y -= 1;
        else if (this.direction === 3) head.y += 1;

        if (this.checkCollision(head.x, head.y)) {
            this.isGameOver = true;
            return;
        }

        this.snake.unshift(head);
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 1;
            this.placeFood();
        } else {
            this.snake.pop();
        }
    }

    checkCollision(x: number, y: number) {
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return true;
        if (this.snake.some(s => s.x === x && s.y === y)) return true;
        return false;
    }

    getObservation(): number[] {
        const head = this.snake[0];
        const danger = [
            this.checkCollision(head.x, head.y - 1) ? 1.0 : 0.0,
            this.checkCollision(head.x, head.y + 1) ? 1.0 : 0.0,
            this.checkCollision(head.x - 1, head.y) ? 1.0 : 0.0,
            this.checkCollision(head.x + 1, head.y) ? 1.0 : 0.0,
        ];

        const dir = [0, 0, 0, 0];
        dir[this.direction] = 1.0;

        const food = [
            this.food.y < head.y ? 1.0 : 0.0, // Up
            this.food.x < head.x ? 1.0 : 0.0, // Left
            this.food.x > head.x ? 1.0 : 0.0, // Right
        ];

        return [...danger, ...dir, ...food];
    }
}
