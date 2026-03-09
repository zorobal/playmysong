require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const authRoutes = require('./routes/auth');
const requestsRoutes = require('./routes/requests');
const youtubeRoutes = require('./routes/youtube');

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/requests', requestsRoutes);
app.use('/youtube', youtubeRoutes);

// Simple health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Socket.IO
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join_establishment', (establishmentId) => {
    socket.join(`est_${establishmentId}`);
  });

  socket.on('disconnect', () => {
    // console.log('Socket disconnected:', socket.id);
  });
});

// Expose io to services via app.locals
app.locals.io = io;
app.locals.prisma = prisma;

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
