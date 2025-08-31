# FotoDerma - Aplicación Médica para Dermatología

FotoDerma es una aplicación web completa para médicos dermatólogos que permite gestionar pacientes, crear expedientes médicos, realizar consultas y almacenar fotografías médicas de forma segura.

## Características

- **Autenticación segura** con Firebase Auth (email/contraseña y Google)
- **Gestión de pacientes** completa con expedientes médicos
- **Consultas médicas** con diagnósticos y fotografías
- **Búsqueda avanzada** de pacientes
- **Historial clínico** completo por paciente
- **Almacenamiento seguro** de fotografías en Firebase Storage
- **Interfaz moderna** y responsiva con React + Tailwind CSS
- **Configuraciones personalizables** (idioma, zoom)

## Tecnologías

### Frontend
- **React** 18.2.0
- **Tailwind CSS** 3.3.0
- **React Router DOM** 6.14.1
- **Axios** para peticiones HTTP
- **Firebase SDK** 9.23.0
- **Lucide React** para iconos

### Backend
- **Node.js** + **Express** 4.18.2
- **Firebase Admin SDK** 11.10.1
- **Multer** para manejo de archivos
- **Helmet** para seguridad
- **CORS** configurado
- **Rate Limiting** implementado

### Base de Datos
- **Firebase Firestore** para datos
- **Firebase Storage** para fotografías
- **Firebase Authentication** para usuarios

## Estructura del Proyecto

```
fotoderma/
├── frontend/                 # Aplicación React
│   ├── public/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── PatientCard.jsx
│   │   │   ├── ConsultationCard.jsx
│   │   │   ├── PhotoUploader.jsx
│   │   │   └── LanguageSwitcher.jsx
│   │   ├── context/         # Context API
│   │   │   └── AuthContext.jsx
│   │   ├── pages/           # Páginas de la aplicación
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Patients.jsx
│   │   │   ├── PatientDetails.jsx
│   │   │   ├── NewPatient.jsx
│   │   │   ├── NewConsultation.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/        # Servicios y APIs
│   │   │   ├── firebase.js
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env
└── backend/                  # API Node.js
    ├── config/
    │   └── firebase.js      # Configuración Firebase Admin
    ├── controllers/         # Controladores de la API
    │   ├── authController.js
    │   ├── patientController.js
    │   └── consultationController.js
    ├── middlewares/         # Middlewares
    │   └── authMiddleware.js
    ├── routes/              # Rutas de la API
    │   ├── authRoutes.js
    │   ├── patientRoutes.js
    │   └── consultationRoutes.js
    ├── server.js
    ├── package.json
    └── .env
```

## Instalación y Configuración

### Prerrequisitos
- Node.js >= 16.0.0
- npm o yarn
- Cuenta de Firebase con proyecto configurado

### 1. Configuración de Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Authentication (Email/Password y Google)
3. Crear base de datos Firestore
4. Habilitar Storage
5. Generar clave privada para el Admin SDK

### 2. Instalación del Backend

```bash
cd backend
npm install
```

Configurar variables de entorno en `.env`:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_PRIVATE_KEY_ID=tu_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_clave_privada\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu_project_id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=tu_client_id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
FIREBASE_STORAGE_BUCKET=tu_project_id.appspot.com
```

Iniciar el servidor:
```bash
npm run dev
```

### 3. Instalación del Frontend

```bash
cd frontend
npm install
```

Configurar variables de entorno en `.env`:
```env
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=tu_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id

REACT_APP_API_URL=http://localhost:3001/api
```

Iniciar la aplicación:
```bash
npm start
```

## Uso de la Aplicación

### Autenticación
- Registro/Login con email y contraseña
- Login con cuenta de Google
- Sesiones seguras con JWT tokens

### Gestión de Pacientes
- Crear nuevos expedientes con datos básicos
- Buscar pacientes por nombre o enfermedad
- Ver listado de pacientes recientes

### Consultas Médicas
- Crear consultas vinculadas a pacientes
- Subir múltiples fotografías por consulta
- Registrar diagnósticos detallados
- Ver historial clínico completo

### Configuraciones
- Cambiar idioma (Español/Inglés)
- Ajustar nivel de zoom de la aplicación
- Gestión de cuentas

## Seguridad

- Autenticación basada en Firebase Auth
- Tokens JWT verificados en cada petición
- Rate limiting para prevenir abuso
- Validación de datos en backend
- CORS configurado correctamente
- Headers de seguridad con Helmet

## API Endpoints

### Autenticación
- `POST /api/auth/verify` - Verificar token
- `GET /api/auth/me` - Obtener perfil usuario
- `PUT /api/auth/profile` - Actualizar perfil

### Pacientes
- `GET /api/patients` - Listar pacientes
- `POST /api/patients` - Crear paciente
- `GET /api/patients/:id` - Obtener paciente
- `PUT /api/patients/:id` - Actualizar paciente
- `DELETE /api/patients/:id` - Eliminar paciente
- `GET /api/patients/search?q=término` - Buscar pacientes

### Consultas
- `GET /api/consultations/patient/:patientId` - Consultas por paciente
- `POST /api/consultations` - Crear consulta
- `GET /api/consultations/:id` - Obtener consulta
- `PUT /api/consultations/:id` - Actualizar consulta
- `DELETE /api/consultations/:id` - Eliminar consulta
- `POST /api/consultations/:id/photos` - Subir fotografías

## Despliegue

### Frontend (Vercel)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Backend (Render/Heroku)
1. Configurar variables de entorno
2. Configurar build command: `npm install`
3. Configurar start command: `npm start`

### Base de Datos
- Firebase Firestore (automático)
- Firebase Storage (automático)

## Contribución

1. Fork el proyecto
2. Crear una rama para la nueva feature (`git checkout -b feature/nueva-feature`)
3. Commit los cambios (`git commit -am 'Agregar nueva feature'`)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Crear un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## Soporte

Para soporte técnico o preguntas:
- Email: fuentesjoel723@gmail.com


## 📋 Roadmap

- [ ] Integración con IA para análisis de imágenes
- [ ] Reportes médicos en PDF
- [ ] Sistema de notificaciones
- [ ] App móvil React Native
- [ ] Integración con sistemas hospitalarios
- [ ] Modo offline con sincronización

---

**FotoDerma v1.0.0** - Desarrollado para profesionales de la salud