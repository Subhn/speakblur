import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5174", "https://speakblur.netlify.app"],
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: ["http://localhost:5174", "https://speakblur.netlify.app"],
  methods: ["GET", "POST"]
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

const users = new Map();
const messages = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.emit('previousMessages', messages);

  socket.on('join', (username) => {
    console.log('User joined:', username);
    users.set(socket.id, username);

    io.emit('userCount', users.size);
    const joinMessage = {
      id: Date.now().toString(),
      text: `${username} has joined the chat`,
      username: 'System',
      timestamp: Date.now()
    };
    messages.push(joinMessage);
    io.emit('message', joinMessage);
  });

  socket.on('message', (message) => {
    console.log('Message received:', message);
    messages.push(message);
    io.emit('message', message);
  });

  socket.on('messageUpdate', (updatedMessage) => {
    const index = messages.findIndex(m => m.id === updatedMessage.id);
    if (index !== -1) {
      messages[index] = updatedMessage;
      io.emit('messageUpdate', updatedMessage);
    }
  });

  socket.on('reaction', ({ messageId, emoji, username }) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      if (!message.reactions) {
        message.reactions = {};
      }
      if (!message.reactions[emoji]) {
        message.reactions[emoji] = [];
      }
      const userIndex = message.reactions[emoji].indexOf(username);
      if (userIndex === -1) {
        message.reactions[emoji].push(username);
      } else {
        message.reactions[emoji].splice(userIndex, 1);
        if (message.reactions[emoji].length === 0) {
          delete message.reactions[emoji];
        }
      }
      io.emit('messageUpdate', message);
    }
  });

  socket.on('leave', (username) => {
    console.log('User left:', username);
    users.delete(socket.id);
    io.emit('userCount', users.size);
    const leaveMessage = {
      id: Date.now().toString(),
      text: `${username} has left the chat`,
      username: 'System',
      timestamp: Date.now()
    };
    messages.push(leaveMessage);
    io.emit('message', leaveMessage);
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      console.log('User disconnected:', username);
      users.delete(socket.id);
      io.emit('userCount', users.size);
      const disconnectMessage = {
        id: Date.now().toString(),
        text: `${username} has left the chat`,
        username: 'System',
        timestamp: Date.now()
      };
      messages.push(disconnectMessage);
      io.emit('message', disconnectMessage);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server is ready`);
});
