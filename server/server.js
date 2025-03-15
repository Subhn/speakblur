import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Basic route for API health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SpeakBlur API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Something went wrong!' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Not Found' });
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite's default development port
    methods: ["GET", "POST"],
    credentials: true
  }
});

const users = new Map();

io.on('connection', (socket) => {
  console.log('User connected');

  // Send initial users count
  io.emit('users_count', users.size);

  socket.on('join', (username) => {
    users.set(socket.id, username);
    io.emit('users_count', users.size);
    io.emit('message', {
      id: Date.now().toString(),
      text: `${username} has joined the chat`, // ✅ Corrected template literal
      username: 'System',
      timestamp: Date.now()
    });
  });

  socket.on('message', (message) => {
    io.emit('message', message);
  });

  socket.on('leave', (username) => {
    users.delete(socket.id);
    io.emit('users_count', users.size);
    io.emit('user_left', username);
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      io.emit('users_count', users.size);
      io.emit('user_left', username);
    }
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`); // ✅ Corrected template literal
});

export default server;
