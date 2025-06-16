const socketIO = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIO(server);

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });

        // Add more event listeners for game actions here
        socket.on('joinGame', (gameId) => {
            socket.join(gameId);
            console.log(`User ${socket.id} joined game ${gameId}`);
        });

        socket.on('makeMove', (data) => {
            // Handle the move logic
            console.log(`User ${socket.id} made a move:`, data);
            // Emit the move to other players
            socket.to(data.gameId).emit('moveMade', data);
        });

        // Additional events can be added as needed
    });
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = {
    initSocket,
    getIO,
};