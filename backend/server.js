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

// CORS configuration - más permisivo para desarrollo y específico para producción
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman) en desarrollo
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://fotodermaapp.netlify.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // En desarrollo, permitir requests sin origin
    if (process.env.NODE_ENV !== 'production' && !origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ]
};

// Middleware - aplicar en orden correcto
app.use(cors(corsOptions));

// Helmet con configuraciones más permisivas para desarrollo
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Deshabilitado para evitar problemas con uploads
}));

app.use(compression());

// Rate limiting - más permisivo en desarrollo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Más requests en desarrollo
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting solo a rutas API
app.use('/api/', limiter);

// Body parsing con límites apropiados
app.use(express.json({ 
  limit: '50mb', // Aumentado para imágenes
  extended: true 
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb' 
}));

// Logging mejorado
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    skip: function (req, res) { 
      return res.statusCode < 400; 
    }
  }));
} else {
  // En desarrollo, mostrar todas las requests
  app.use(morgan('dev'));
}

// Middleware para logging de requests importantes
app.use('/api', (req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  if (req.headers.authorization) {
    console.log('🔑 Authorization header presente');
  } else {
    console.log('⚠️ Sin Authorization header');
  }
  next();
});

// Health check endpoint - ANTES de las rutas API
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'FotoDerma Backend funcionando correctamente',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      root: '/',
      auth: '/api/auth',
      patients: '/api/patients',
      consultations: '/api/consultations'
    },
    cors: {
      allowedOrigins: corsOptions.origin
    }
  });
});

// Root endpoint mejorado
app.get('/', (req, res) => {
  res.json({
    message: 'FotoDerma API - Backend funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    status: 'active',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      patients: '/api/patients',
      consultations: '/api/consultations'
    },
    documentation: 'https://github.com/tu-repo/fotoderma-api'
  });
});

// Middleware para manejar preflight OPTIONS requests
app.options('*', cors(corsOptions));

// Import routes with better error handling
console.log('🔄 Cargando rutas...');

try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✅ AuthRoutes cargadas');
} catch (error) {
  console.error('❌ Error cargando authRoutes:', error.message);
}

try {
  const patientRoutes = require('./routes/patientRoutes');
  app.use('/api/patients', patientRoutes);
  console.log('✅ PatientRoutes cargadas');
} catch (error) {
  console.error('❌ Error cargando patientRoutes:', error.message);
}

try {
  const consultationRoutes = require('./routes/consultationRoutes');
  app.use('/api/consultations', consultationRoutes);
  console.log('✅ ConsultationRoutes cargadas');
} catch (error) {
  console.error('❌ Error cargando consultationRoutes:', error.message);
}

// Middleware para rutas no encontradas - mejorado
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({ 
    error: 'Route not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      health: 'GET /health',
      root: 'GET /',
      auth: {
        verify: 'POST /api/auth/verify',
        me: 'GET /api/auth/me',
        profile: 'PUT /api/auth/profile'
      },
      patients: {
        list: 'GET /api/patients',
        create: 'POST /api/patients',
        get: 'GET /api/patients/:id',
        update: 'PUT /api/patients/:id',
        delete: 'DELETE /api/patients/:id',
        search: 'GET /api/patients/search'
      },
      consultations: {
        byPatient: 'GET /api/consultations/patient/:patientId',
        get: 'GET /api/consultations/:id',
        create: 'POST /api/consultations',
        followup: 'POST /api/consultations/followup',
        update: 'PUT /api/consultations/:id',
        delete: 'DELETE /api/consultations/:id',
        uploadPhotos: 'POST /api/consultations/:id/photos'
      }
    }
  });
});

// Error handling middleware mejorado
app.use((err, req, res, next) => {
  console.error('💥 Error capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Errores específicos
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      message: 'The provided ID is not valid'
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this data already exists'
    });
  }
  
  // Error genérico
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : message,
    message: status >= 500 ? 'Something went wrong on our end' : message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
});

// Manejo de procesos no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

// Logging del inicio del servidor
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Agregar antes de las rutas existentes
app.get('/debug', (req, res) => {
  res.json({
    message: 'Debug endpoint',
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Export para Vercel
module.exports = app;