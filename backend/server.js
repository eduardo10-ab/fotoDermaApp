const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Configurar zona horaria
process.env.TZ = 'America/El_Salvador';

const app = express();

// CORS configuration - UNA SOLA VEZ
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://fotodermaapp.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware - aplicar en orden correcto
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    skip: function (req, res) { 
      return res.statusCode < 400; 
    }
  }));
} else {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'FotoDerma API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'FotoDerma API - Backend funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      patients: '/api/patients',
      consultations: '/api/consultations'
    }
  });
});

// Import routes with error handling
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
} catch (error) {
  console.log('Warning: authRoutes not found');
}

try {
  const patientRoutes = require('./routes/patientRoutes');
  app.use('/api/patients', patientRoutes);
} catch (error) {
  console.log('Warning: patientRoutes not found');
}

try {
  const consultationRoutes = require('./routes/consultationRoutes');
  app.use('/api/consultations', consultationRoutes);
} catch (error) {
  console.log('Warning: consultationRoutes not found');
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export for Vercel
module.exports = app;