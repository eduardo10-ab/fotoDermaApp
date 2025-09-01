const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Configurar zona horaria
process.env.TZ = 'America/El_Salvador';

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const consultationRoutes = require('./routes/consultationRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración CORS - UNA SOLA VEZ
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://fotodermaapp.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Middleware de seguridad
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }
}));

// Compresión
app.use(compression());

// CORS - aplicar una sola vez
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    skip: function (req, res) { 
      return res.statusCode < 400; 
    }
  }));
} else {
  app.use(morgan('dev'));
}

// Middleware de logging personalizado (simplificado)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/consultations', consultationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Para Vercel, exportar la app
module.exports = app;

// Solo iniciar servidor si se ejecuta directamente (no en Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`FotoDerma API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
}