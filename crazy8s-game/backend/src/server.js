const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');

const server = http.createServer(app);
const io = socketIo(server);

// Set up Socket.IO connections
io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    // Handle player events here

    socket.on('disconnect', () => {
        console.log('A player disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});