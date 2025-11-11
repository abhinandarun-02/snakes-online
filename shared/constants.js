// Game configuration constants
export const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    TICK_RATE: 30, // FPS
    MAX_PLAYERS: 8,
    MIN_PLAYERS: 2,
    
    // Game timing
    COUNTDOWN_SECONDS: 5,
    GAME_DURATION_SECONDS: 60,
    
    // Snake settings
    SNAKE_HEAD_RADIUS: 15,
    SNAKE_SMOOTHNESS: 0.2,
    
    // Food settings
    FOOD_RADIUS: 10,
    FOOD_MIN_X: 20,
    FOOD_MAX_X: 620,
    FOOD_MIN_Y: 20,
    FOOD_MAX_Y: 420,
};

export const GAME_MODES = {
    TIMED: 'timed',
    POINTS: 'points',
    SURVIVAL: 'survival',
    ENDLESS: 'endless',
    BATTLE_ROYALE: 'battle_royale'
};

export const GAME_MODE_CONFIGS = {
    [GAME_MODES.TIMED]: {
        name: 'Timed',
        description: 'Race against the clock! Player with highest score when time runs out wins.',
        defaultTime: 60,
        timeOptions: [30, 60, 90, 120, 180, 300],
        hasTimer: true,
        hasPointLimit: false
    },
    [GAME_MODES.POINTS]: {
        name: 'Points',
        description: 'First to reach the target score wins!',
        defaultPoints: 25,
        pointOptions: [10, 25, 50, 75, 100],
        hasTimer: false,
        hasPointLimit: true
    },
    [GAME_MODES.SURVIVAL]: {
        name: 'Survival',
        description: 'Last snake standing wins! Collide with walls or other snakes and you\'re out.',
        hasTimer: false,
        hasPointLimit: false,
        hasCollisions: true
    },
    [GAME_MODES.ENDLESS]: {
        name: 'Endless',
        description: 'No time limit, no score limit. Play until you quit!',
        hasTimer: false,
        hasPointLimit: false
    },
    [GAME_MODES.BATTLE_ROYALE]: {
        name: 'Battle Royale',
        description: 'Arena shrinks over time! Stay in bounds and be the last snake alive.',
        defaultTime: 180,
        timeOptions: [120, 180, 240, 300],
        hasTimer: true,
        hasPointLimit: false,
        hasShrinkingArena: true
    }
};

export const SPEED_SETTINGS = {
    SLOW: { name: 'Slow', multiplier: 0.7 },
    NORMAL: { name: 'Normal', multiplier: 1.0 },
    FAST: { name: 'Fast', multiplier: 1.5 },
    TURBO: { name: 'Turbo', multiplier: 2.0 }
};

export const DIFFICULTY_SETTINGS = {
    EASY: { name: 'Easy', foodSpawnRate: 1.2, growthRate: 1.0 },
    NORMAL: { name: 'Normal', foodSpawnRate: 1.0, growthRate: 1.0 },
    HARD: { name: 'Hard', foodSpawnRate: 0.8, growthRate: 1.5 }
};

export const COLORS = ["red", "blue", "green", "purple", "orange", "cyan", "magenta", "lime"];
