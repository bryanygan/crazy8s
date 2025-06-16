const express = require('express');
const gameRoutes = require('./routes/gameRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/games', gameRoutes);

module.exports = app;