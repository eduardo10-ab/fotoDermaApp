import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { User, Lock, ArrowLeft } from 'lucide-react';
import doctorImg from '../img/doctor.png';

const Login = () => {
  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  // Hooks para autenticación y navegación
  const { login, loginWithGoogle, savedAccounts } = useAuth();
  const location = useLocation();

  /**
   * Efecto para detectar parámetros de URL y configurar el estado inicial
   * - mode=add: Indica que se está agregando una nueva cuenta
   * - switch_account: Email de cuenta para cambio rápido
   */
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const mode = urlParams.get('mode');
    const switchAccountEmail = urlParams.get('switch_account');

    if (mode === 'add') {
      setIsAddingAccount(true);
    }

    if (switchAccountEmail) {
      setEmail(decodeURIComponent(switchAccountEmail));
    }
  }, [location]);

  /**
   * Maneja el envío del formulario de login con email/contraseña
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      // Mapear errores de Firebase a mensajes amigables para el usuario
      if (result.error.includes('user-not-found')) {
        setError('No existe una cuenta con este email');
      } else if (result.error.includes('wrong-password')) {
        setError('Contraseña incorrecta');
      } else if (result.error.includes('too-many-requests')) {
        setError('Demasiados intentos fallidos. Intenta más tarde');
      } else if (result.error.includes('user-disabled')) {
        setError('Esta cuenta ha sido deshabilitada');
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    }
    
    setLoading(false);
  };

  /**
   * Maneja el login con Google OAuth
   */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    const result = await loginWithGoogle();
    
    if (!result.success) {
      setError('Error al iniciar sesión con Google: ' + result.error);
    }
    
    setLoading(false);
  };

  /**
   * Regresa a la vista de selección de cuentas guardadas
   */
  const handleBackToAccounts = () => {
    setIsAddingAccount(false);
    // Limpiar parámetros de URL
    window.history.replaceState({}, document.title, '/login');
  };

  /**
   * Vista de selección de cuentas guardadas
   * Se muestra cuando hay cuentas guardadas y no se está agregando una nueva
   */
  if (!isAddingAccount && savedAccounts.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Panel izquierdo - Selección de cuentas */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Seleccionar cuenta</h2>
              <p className="text-sm text-gray-600">
                Elige una cuenta para continuar
              </p>
            </div>

            {/* Lista de cuentas guardadas */}
            <div className="space-y-3">
              {savedAccounts.map((account) => (
                <button
                  key={account.uid}
                  onClick={() => {
                    setEmail(account.email);
                    setIsAddingAccount(true);
                  }}
                  className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3 text-left"
                >
                  {/* Avatar de la cuenta */}
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    {account.photoURL ? (
                      <img 
                        src={account.photoURL} 
                        alt="Profile" 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User size={24} className="text-teal-700" />
                    )}
                  </div>
                  {/* Información de la cuenta */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      Dr. {account.displayName || account.email?.split('@')[0]}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {account.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Botón para usar otra cuenta */}
            <div className="mt-6">
              <button
                onClick={() => setIsAddingAccount(true)}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition duration-200 flex items-center justify-center space-x-2"
              >
                <User size={20} />
                <span>Usar otra cuenta</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel derecho - Ilustración */}
        <div
          className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: '#233F4C' }}>
          {/* Patrón de puntos de fondo */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full" style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '30px 30px'
            }}></div>
          </div>
          
          {/* Logo de la aplicación */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-white flex items-center space-x-2">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
            </svg>
            <span className="text-2xl font-bold">FotoDerma</span>
          </div>

          {/* Ilustración del doctor */}
          <div className="relative z-10 text-center">
            <div className="relative flex items-center justify-center mb-12">
              <div className="w-80 h-80 bg-white/10 rounded-full"></div>
              <div className="absolute">
                <img src={doctorImg} alt='Doctor Illustration' className='w-96 h-96 object-contain' />
              </div>
            </div>
            <p className="text-white/80 text-lg">
              Sistema de gestión médica dermatológica
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Vista del formulario de login principal
   */
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Panel izquierdo - Formulario de login */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          {/* Botón para regresar a cuentas guardadas (si existen) */}
          {savedAccounts.length > 0 && (
            <button
              onClick={handleBackToAccounts}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Volver a cuentas guardadas</span>
            </button>
          )}

          {/* Encabezado del formulario */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {savedAccounts.length > 0 ? 'Agregar cuenta' : 'Bienvenido'}
            </h2>
          </div>

          {/* Formulario de login */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Campo de email */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-4 bg-gray-100 rounded-lg placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all duration-200 border-0"
                  placeholder="Usuario"
                />
              </div>
            </div>

            {/* Campo de contraseña */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-4 bg-gray-100 rounded-lg placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all duration-200 border-0"
                  placeholder="Contraseña"
                />
              </div>
            </div>

            {/* Botón de login con email/contraseña */}
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#233F4C' }}
              className="w-full text-white font-semibold py-4 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

            {/* Separador */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">o</span>
              </div>
            </div>

            {/* Botón de login con Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-4 rounded-lg border border-gray-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {/* Icono de Google */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{loading ? 'Conectando...' : 'Iniciar sesión con Google'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Panel derecho - Ilustración */}
      <div
        className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: '#233F4C' }}>
        {/* Patrón de puntos de fondo */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>
        
        {/* Logo de la aplicación */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-white flex items-center space-x-2">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
          </svg>
          <span className="text-2xl font-bold">FotoDerma</span>
        </div>

        {/* Ilustración del doctor */}
        <div className="relative z-10 text-center">
          <div className="relative flex items-center justify-center mb-12">
            <div className="w-80 h-80 bg-white/10 rounded-full"></div>
            <div className="absolute">
              <img src={doctorImg} alt='Doctor Illustration' className='w-100 h-100 object-contain' />
            </div>
          </div>
          <p className="text-white/80 text-lg">
            Sistema de gestión médica dermatológica
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;