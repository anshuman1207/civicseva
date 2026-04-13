const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const complaintRoutes = require('./routes/complaintRoutes');
const authRoutes = require('./routes/authRoutes');
const commentRoutes = require('./routes/commentRoutes');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// 1. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Gzip compression for all responses
app.use(compression());

const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// 2. Rate Limiting
app.use('/api', apiLimiter);

// Specific rate limiting for sensitive auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);


// 3. Body Parser & Sanitization
app.use(express.json({ limit: '10kb' })); // Body limit to prevent DOS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
// Express 5 workaround: req.query is a getter, so we make it writable
app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Clean CLIENT_URL (remove trailing slash if present)
const clientUrl = process.env.CLIENT_URL ? 
  (process.env.CLIENT_URL.endsWith('/') ? process.env.CLIENT_URL.slice(0, -1) : process.env.CLIENT_URL) : 
  null;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  clientUrl,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow any localhost port
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.warn(`CORS Rejected: Origin ${origin} not in whitelist:`, allowedOrigins);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Production request logger
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 1000 || res.statusCode >= 400) {
        console.log(`[${req.method}] ${req.originalUrl} ${res.statusCode} ${duration}ms`);
      }
    });
    next();
  });
}

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/complaints', complaintRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/authority', require('./routes/authorityRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Welcome Route
app.get('/', (req, res) => {
  res.send('CivicSeva API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
