import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import NewPatient from './pages/NewPatient';
import NewConsultation from './pages/NewConsultation';
import Settings from './pages/Settings';

import './App.css';

// Layout Component
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Protected Route Component - Simplificado
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  console.log('🔒 ProtectedRoute - User:', user ? 'Logged in' : 'Not logged in', 'Loading:', loading);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }
  
  if (!user) {
    console.log('🚫 ProtectedRoute - Redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('✅ ProtectedRoute - Showing protected content');
  return (
    <Layout>
      {children}
    </Layout>
  );
};

// App Routes Component - ELIMINADO EL CHEQUEO DUPLICADO
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/patients" element={<Patients />} />
      <Route path="/patients/:id" element={<PatientDetails />} />
      <Route path="/patient-details/:patientId" element={<PatientDetails />} />
      <Route path="/new-patient" element={<NewPatient />} />
      <Route path="/new-consultation/:patientId" element={<NewConsultation />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  // Aplicar zoom guardado al inicializar la aplicación
  useEffect(() => {
    const savedZoom = localStorage.getItem('appZoomLevel');
    if (savedZoom) {
      const zoomValue = parseInt(savedZoom);
      if (zoomValue === 100) {
        document.documentElement.style.fontSize = '';
      } else {
        const remValue = (zoomValue / 100) * 1;
        document.documentElement.style.fontSize = `${remValue}rem`;
      }
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Ruta pública de login */}
            <Route path="/login" element={<LoginRoute />} />
            
            {/* Todas las demás rutas son protegidas */}
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <AppRoutes />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Componente separado para manejar la ruta de login
const LoginRoute = () => {
  const { user, loading } = useAuth();
  
  console.log('🔒 LoginRoute - User:', user ? 'Logged in' : 'Not logged in', 'Loading:', loading);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }
  
  // Si ya está logueado, redirigir al dashboard
  if (user) {
    console.log('✅ LoginRoute - User logged in, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('👤 LoginRoute - Showing login form');
  return <Login />;
};

export default App;