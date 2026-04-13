require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`ERROR: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const clientUrl = process.env.CLIENT_URL ? 
        (process.env.CLIENT_URL.endsWith('/') ? process.env.CLIENT_URL.slice(0, -1) : process.env.CLIENT_URL) : 
        null;

      const whitelist = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        clientUrl,
      ].filter(Boolean);
      
      const isLocalhost = origin.startsWith('http://localhost:');
      if (whitelist.includes(origin) || (process.env.NODE_ENV === 'development' && isLocalhost)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true // Support older clients if any
});


// Expose io to routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('New client connected for real-time updates');
  
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their notification room`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const serverInstance = server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  serverInstance.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  if (serverInstance) {
    serverInstance.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle termination signals
const gracefulShutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
