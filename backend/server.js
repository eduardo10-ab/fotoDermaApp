const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
process.env.TZ = 'America/El_Salvador';

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const consultationRoutes = require('./routes/consultationRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false // Para compatibilidad con Vercel
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration - ACTUALIZADO con variables existentes
const corsOptions = {
  origin: [
    'http://localhost:3000', // desarrollo local con Vite
    'http://localhost:5173', // puerto por defecto de Vite dev server
    process.env.FRONTEND_URL, // URL de Netlify desde variable de entorno
    // Agrega aquí tu URL de Netlify cuando la tengas
    // 'https://fotoderma-app.netlify.app'
  ].filter(Boolean), // filtra valores undefined
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging - Solo errores en producción
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    skip: function (req, res) { 
      return res.statusCode < 400; 
    }
  }));
} else {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'FotoDerma API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint para verificar que la API funciona
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
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server (solo si no es importado como módulo)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`FotoDerma API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
}

// IMPORTANTE: Esta línea debe estar al final
module.exports = app;