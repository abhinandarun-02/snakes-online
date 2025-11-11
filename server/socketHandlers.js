import { GAME_CONFIG } from '../shared/constants.js';
import { SnakeBody } from '../shared/SnakeBody.js';
import { gameState, createPlayer, checkFoodCollision, spawnFood } from './game.js';

// Room management
const rooms = new Map();

export function getRooms() {
    return Array.from(rooms.values());
}

function createRoom(roomId, roomName, adminId) {
    return {
        id: roomId,
        name: roomName,
        admin: adminId,
        players: [],
        gameState: {
            players: {},
            food: { x: 300, y: 300, radius: GAME_CONFIG.FOOD_RADIUS },
            timerRunning: false
        },
        maxPlayers: GAME_CONFIG.MAX_PLAYERS
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
        socket.on("createRoom", (roomName) => {
            const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const room = createRoom(roomId, roomName, socket.id);
            rooms.set(roomId, room);
            
            console.log(`Room created: ${roomName} by ${socket.id}`);
            io.emit("roomsList", getRoomsList());
        });

        socket.on("joinRoom", (roomId) => {
            const room = rooms.get(roomId);
            
            if (!room) {
                socket.emit("error", "Room not found");
                return;
            }

            if (room.players.length >= room.maxPlayers) {
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
        maxPlayers: room.maxPlayers
    }));
}

function getRoomData(room) {
    return {
        id: room.id,
        name: room.name,
        admin: room.admin,
        players: room.players,
        maxPlayers: room.maxPlayers
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
            io.to(room.id).emit("gameStart");
            console.log(`Game started in room ${room.name}!`);
            startGameTimer(io, room);
        }

        countdown--;
    }, 1000);
}

function startGameTimer(io, room) {
    let timeLeft = GAME_CONFIG.GAME_DURATION_SECONDS;

    const gameInterval = setInterval(() => {
        io.to(room.id).emit("timerUpdate", timeLeft);

        if (timeLeft <= 0) {
            clearInterval(gameInterval);

            // Send final scores
            const scores = room.players.map(p => {
                const player = room.gameState.players[p.id];
                return {
                    id: p.id,
                    score: player ? player.score : 0,
                };
            });

            io.to(room.id).emit("gameOver", scores);

            // Reset for next round
            room.gameState.timerRunning = false;
            room.players.forEach(p => (p.ready = false));
            io.to(room.id).emit("roomUpdate", getRoomData(room));
        }

        timeLeft--;
    }, 1000);
}
