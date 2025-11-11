import { GAME_CONFIG, GAME_MODES, GAME_MODE_CONFIGS, SPEED_SETTINGS, DIFFICULTY_SETTINGS } from '../shared/constants.js';
import { SnakeBody } from '../shared/SnakeBody.js';
import { gameState, createPlayer, checkFoodCollision, spawnFood } from './game.js';

// Room management
const rooms = new Map();

export function getRooms() {
    return Array.from(rooms.values());
}

function createRoom(roomId, roomName, adminId, config = {}) {
    const gameMode = config.gameMode || GAME_MODES.TIMED;
    const modeConfig = GAME_MODE_CONFIGS[gameMode];
    
    return {
        id: roomId,
        name: roomName,
        admin: adminId,
        players: [],
        config: {
            gameMode: gameMode,
            maxPlayers: config.maxPlayers || GAME_CONFIG.MAX_PLAYERS,
            timeLimit: config.timeLimit || (modeConfig.defaultTime || 60),
            pointLimit: config.pointLimit || (modeConfig.defaultPoints || 25),
            speed: config.speed || 'NORMAL',
            difficulty: config.difficulty || 'NORMAL',
            isPublic: config.isPublic !== undefined ? config.isPublic : true
        },
        gameState: {
            players: {},
            food: { x: 300, y: 300, radius: GAME_CONFIG.FOOD_RADIUS },
            timerRunning: false,
            gameStarted: false,
            timeElapsed: 0,
            arenaSize: { width: GAME_CONFIG.CANVAS_WIDTH, height: GAME_CONFIG.CANVAS_HEIGHT }
        },
        maxPlayers: config.maxPlayers || GAME_CONFIG.MAX_PLAYERS
    };
}

export function setupSocketHandlers(io) {
    io.on("connection", (socket) => {
        console.log("Player connected:", socket.id);
        
        // Initialize player name
        socket.playerName = "Player";
        
        // Send current rooms list
        sendRoomsList(socket);

        // Handle player name setting
        socket.on("setPlayerName", (name) => {
            const newName = name || "Player";
            socket.playerName = newName;
            console.log(`Player ${socket.id} set name to: ${socket.playerName}`);

            // If player is already in a room, update their entry and notify room
            const roomId = socket.currentRoom;
            if (roomId) {
                const room = rooms.get(roomId);
                if (room) {
                    // Update player in room.players
                    const p = room.players.find(pl => pl.id === socket.id);
                    if (p) p.name = socket.playerName;

                    // Update player in room.gameState.players
                    const gp = room.gameState.players[socket.id];
                    if (gp) gp.name = socket.playerName;

                    io.to(roomId).emit("roomUpdate", getRoomData(room));
                    io.emit("roomsList", getRoomsList());
                }
            }
        });

        // ===== ROOM MANAGEMENT =====
        socket.on("createRoom", (data) => {
            const roomName = typeof data === 'string' ? data : data.name;
            const config = typeof data === 'object' ? data : {};
            
            const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const room = createRoom(roomId, roomName, socket.id, config);
            rooms.set(roomId, room);
            
            console.log(`Room created: ${roomName} by ${socket.id} with config:`, room.config);
            io.emit("roomsList", getRoomsList());
        });

        socket.on("joinRoom", (roomId) => {
            const room = rooms.get(roomId);
            
            if (!room) {
                socket.emit("error", "Room not found");
                return;
            }

            if (room.players.length >= room.config.maxPlayers) {
                socket.emit("error", "Room is full");
                return;
            }

            // Leave current room if in one
            leaveCurrentRoom(socket);

            // Join new room
            socket.join(roomId);
            socket.currentRoom = roomId;
            
            const player = {
                id: socket.id,
                name: socket.playerName || "Player",
                ready: false
            };
            
            room.players.push(player);
            room.gameState.players[socket.id] = createPlayer(socket.id, socket.playerName || "Player");

            console.log(`Player ${socket.playerName} (${socket.id}) joined room ${room.name}`);
            
            socket.emit("joinedRoom", getRoomData(room));
            io.to(roomId).emit("roomUpdate", getRoomData(room));
            io.emit("roomsList", getRoomsList());
        });

        socket.on("leaveRoom", () => {
            leaveCurrentRoom(socket);
            socket.emit("leftRoom");
            sendRoomsList(socket);
        });

        socket.on("deleteRoom", () => {
            const roomId = socket.currentRoom;
            if (!roomId) return;

            const room = rooms.get(roomId);
            if (!room || room.admin !== socket.id) {
                socket.emit("error", "Only admin can delete the room");
                return;
            }

            // Notify all players in room
            io.to(roomId).emit("leftRoom");
            
            // Remove all players from room
            room.players.forEach(player => {
                const playerSocket = io.sockets.sockets.get(player.id);
                if (playerSocket) {
                    playerSocket.leave(roomId);
                    playerSocket.currentRoom = null;
                }
            });

            rooms.delete(roomId);
            console.log(`Room ${room.name} deleted by admin`);
            io.emit("roomsList", getRoomsList());
        });

        socket.on("updateRoomConfig", (newConfig) => {
            const roomId = socket.currentRoom;
            if (!roomId) return;

            const room = rooms.get(roomId);
            if (!room || room.admin !== socket.id) {
                socket.emit("error", "Only admin can update room configuration");
                return;
            }

            // Don't allow editing if game has started
            if (room.gameState && room.gameState.gameStarted) {
                socket.emit("error", "Cannot update configuration after game has started");
                return;
            }

            // Update room configuration
            room.config = {
                ...room.config,
                gameMode: newConfig.gameMode,
                timeLimit: newConfig.timeLimit,
                pointLimit: newConfig.pointLimit,
                maxPlayers: newConfig.maxPlayers,
                speed: newConfig.speed,
                difficulty: newConfig.difficulty,
                isPublic: newConfig.isPublic !== undefined ? newConfig.isPublic : room.config.isPublic
            };

            // Update the maxPlayers field at room level for compatibility
            room.maxPlayers = newConfig.maxPlayers;

            console.log(`Room ${room.name} configuration updated by admin`);
            
            // Notify all players in the room
            io.to(roomId).emit("roomUpdate", getRoomData(room));
            
            // Update rooms list for lobby
            io.emit("roomsList", getRoomsList());
        });

        // Handle player ready
        socket.on("playerReady", () => {
            const roomId = socket.currentRoom;
            if (!roomId) return;

            const room = rooms.get(roomId);
            if (!room) return;

            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                player.ready = true;
                console.log(`Player ${socket.id} is ready in room ${room.name}`);
                io.to(roomId).emit("roomUpdate", getRoomData(room));
                checkAllPlayersReady(io, room);
            }
        });

        // Update mouse position
        socket.on("updateMouse", (mouse) => {
            const roomId = socket.currentRoom;
            if (!roomId) return;

            const room = rooms.get(roomId);
            if (!room) return;

            const player = room.gameState.players[socket.id];
            if (player) {
                player.mouse.x = mouse.x;
                player.mouse.y = mouse.y;
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log("Player disconnected:", socket.id);
            leaveCurrentRoom(socket);
            io.emit("roomsList", getRoomsList());
        });
    });
}

// ===== HELPER FUNCTIONS =====
function leaveCurrentRoom(socket) {
    const roomId = socket.currentRoom;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    // Remove player from room
    room.players = room.players.filter(p => p.id !== socket.id);
    delete room.gameState.players[socket.id];

    const wasAdmin = room.admin === socket.id;

    // If room is empty, delete it
    if (room.players.length === 0) {
        rooms.delete(roomId);
        console.log(`Room ${room.name} deleted (empty)`);
    } else if (wasAdmin) {
        // Transfer admin to next player
        room.admin = room.players[0].id;
        console.log(`Admin transferred to ${room.admin} in room ${room.name}`);
        socket.to(roomId).emit("roomUpdate", getRoomData(room));
    } else {
        socket.to(roomId).emit("roomUpdate", getRoomData(room));
    }

    socket.leave(roomId);
    socket.currentRoom = null;
}

function sendRoomsList(socket) {
    socket.emit("roomsList", getRoomsList());
}

function getRoomsList() {
    return Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        playerCount: room.players.length,
        maxPlayers: room.config.maxPlayers,
        gameMode: room.config.gameMode,
        isPublic: room.config.isPublic
    }));
}

function getRoomData(room) {
    return {
        id: room.id,
        name: room.name,
        admin: room.admin,
        players: room.players,
        config: room.config,
        maxPlayers: room.config.maxPlayers,
        gameState: {
            gameStarted: room.gameState.gameStarted || false,
            timerRunning: room.gameState.timerRunning || false
        }
    };
}

function spawnFoodInRoom(room) {
    room.gameState.food = {
        x: Math.random() * (GAME_CONFIG.FOOD_MAX_X - GAME_CONFIG.FOOD_MIN_X) + GAME_CONFIG.FOOD_MIN_X,
        y: Math.random() * (GAME_CONFIG.FOOD_MAX_Y - GAME_CONFIG.FOOD_MIN_Y) + GAME_CONFIG.FOOD_MIN_Y,
        radius: GAME_CONFIG.FOOD_RADIUS,
    };
}

// ===== GAME FLOW MANAGEMENT =====
function checkAllPlayersReady(io, room) {
    if (room.players.length === 0) return;

    const allReady = room.players.every(p => p.ready);
    if (allReady && !room.gameState.timerRunning) {
        startCountdown(io, room);
    }
}

function startCountdown(io, room) {
    let countdown = GAME_CONFIG.COUNTDOWN_SECONDS;
    room.gameState.timerRunning = true;

    const interval = setInterval(() => {
        io.to(room.id).emit("countdown", countdown);
        console.log(`Countdown in room ${room.name}:`, countdown);

        if (countdown <= 0) {
            clearInterval(interval);

            // Reset players for new round
            room.players.forEach(p => {
                const player = room.gameState.players[p.id];
                if (player) {
                    player.score = 0;
                    player.snakeBody = [new SnakeBody(GAME_CONFIG.SNAKE_HEAD_RADIUS, player.color, GAME_CONFIG.SNAKE_SMOOTHNESS)];
                }
                p.ready = false;
            });

            spawnFoodInRoom(room);
            room.gameState.gameStarted = true;
            io.to(room.id).emit("gameStart");
            console.log(`Game started in room ${room.name}!`);
            startGameTimer(io, room);
        }

        countdown--;
    }, 1000);
}

function startGameTimer(io, room) {
    const gameMode = room.config.gameMode;
    const modeConfig = GAME_MODE_CONFIGS[gameMode];
    
    // For point-based or endless modes, no timer needed
    if (gameMode === GAME_MODES.POINTS || gameMode === GAME_MODES.ENDLESS) {
        // Just monitor for win conditions
        const checkInterval = setInterval(() => {
            if (gameMode === GAME_MODES.POINTS) {
                checkPointBasedWin(io, room, checkInterval);
            }
        }, 1000);
        return;
    }
    
    // For timed modes
    let timeLeft = room.config.timeLimit;

    const gameInterval = setInterval(() => {
        room.gameState.timeElapsed++;
        io.to(room.id).emit("timerUpdate", timeLeft);

        // Check for Battle Royale arena shrinking
        if (gameMode === GAME_MODES.BATTLE_ROYALE && modeConfig.hasShrinkingArena) {
            shrinkArena(room, io);
        }

        if (timeLeft <= 0) {
            clearInterval(gameInterval);
            endGame(io, room);
        }

        timeLeft--;
    }, 1000);
}

function checkPointBasedWin(io, room, checkInterval) {
    const winner = room.players.find(p => {
        const player = room.gameState.players[p.id];
        return player && player.score >= room.config.pointLimit;
    });
    
    if (winner) {
        clearInterval(checkInterval);
        endGame(io, room, winner.id);
    }
}

function shrinkArena(room, io) {
    const elapsed = room.gameState.timeElapsed;
    const shrinkRate = 2; // pixels per second
    
    if (elapsed % 5 === 0) { // Shrink every 5 seconds
        const newWidth = Math.max(400, room.gameState.arenaSize.width - shrinkRate * 5);
        const newHeight = Math.max(300, room.gameState.arenaSize.height - shrinkRate * 5);
        
        room.gameState.arenaSize = { width: newWidth, height: newHeight };
        io.to(room.id).emit("arenaShrink", room.gameState.arenaSize);
    }
}

function endGame(io, room, winnerId = null) {
    // Send final scores
    const scores = room.players.map(p => {
        const player = room.gameState.players[p.id];
        return {
            id: p.id,
            name: p.name,
            score: player ? player.score : 0,
            isWinner: winnerId ? p.id === winnerId : false
        };
    });

    // Sort by score
    scores.sort((a, b) => b.score - a.score);
    
    // If no specific winner, highest score wins
    if (!winnerId && scores.length > 0) {
        scores[0].isWinner = true;
    }

    io.to(room.id).emit("gameOver", scores);

    // Reset for next round
    room.gameState.timerRunning = false;
    room.gameState.gameStarted = false;
    room.gameState.timeElapsed = 0;
    room.gameState.arenaSize = { width: GAME_CONFIG.CANVAS_WIDTH, height: GAME_CONFIG.CANVAS_HEIGHT };
    room.players.forEach(p => (p.ready = false));
    io.to(room.id).emit("roomUpdate", getRoomData(room));
}
