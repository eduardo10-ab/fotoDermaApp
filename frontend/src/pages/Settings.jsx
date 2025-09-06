import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, LogOut, User, ChevronDown} from 'lucide-react';

const Settings = () => {
  // Estados del componente
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  
  // Hooks de autenticación y referencia para el dropdown
  const { user, logout, savedAccounts, switchAccount } = useAuth();
  const dropdownRef = useRef(null);

  /**
   * Efecto para cargar y aplicar el nivel de zoom guardado
   * Se ejecuta al montar el componente
   */
  useEffect(() => {
    // Recuperar el valor de zoom guardado en localStorage
    const savedZoom = localStorage.getItem('appZoomLevel');
    
    if (savedZoom) {
      const zoomValue = parseInt(savedZoom);
      setZoomLevel(zoomValue);
      
      // Aplicar el zoom guardado al documento
      if (zoomValue === 100) {
        document.documentElement.style.fontSize = '';
      } else {
        const remValue = (zoomValue / 100) * 1;
        document.documentElement.style.fontSize = `${remValue}rem`;
      }
    }
  }, []);

  /**
   * Efecto para cerrar el dropdown cuando se hace clic fuera de él
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Maneja el cambio en el nivel de zoom de la aplicación
   * Aplica el zoom al documento y lo guarda en localStorage
   */
  const handleZoomChange = (e) => {
    const newZoomLevel = parseInt(e.target.value);
    setZoomLevel(newZoomLevel);
    
    // Aplicar zoom usando rem para mejor compatibilidad
    if (newZoomLevel === 100) {
      // Para 100%, usar el valor por defecto del navegador
      document.documentElement.style.fontSize = '';
    } else {
      // Convertir porcentaje a rem
      const remValue = (newZoomLevel / 100) * 1;
      document.documentElement.style.fontSize = `${remValue}rem`;
    }
    
    // Persistir configuración entre navegaciones
    localStorage.setItem('appZoomLevel', newZoomLevel.toString());
  };

  /**
   * Redirige al login en modo "agregar cuenta"
   */
  const handleAddAccount = () => {
    setIsAccountDropdownOpen(false);
    window.location.href = '/login?mode=add';
  };

  /**
   * Cambia a una cuenta diferente de las guardadas
   */
  const handleSwitchAccount = async (account) => {
    const result = await switchAccount(account);
    if (result.success) {
      setIsAccountDropdownOpen(false);
    }
  };

  /**
   * Cierra la sesión actual
   */
  const handleLogout = async () => {
    setIsAccountDropdownOpen(false);
    await logout();
  };

  /**
   * Obtiene el nombre para mostrar del usuario actual
   * Prioriza displayName, luego email, y por último "Usuario"
   */
  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'Usuario';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8" style={{ marginTop: '60px' }}>
      {/* Sección de configuración de cuenta */}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 mt-11">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Cuenta</h1>
        
        <div className="bg-gray-100 rounded-lg">
          {/* Dropdown de cuentas */}
          <div className="relative" ref={dropdownRef}>
            {/* Botón principal de la cuenta activa */}
            <button
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="w-full flex items-center justify-between p-4 text-white rounded-2xl hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              style={{ backgroundColor: '#233F4C' }}
            >
              <div className="flex items-center space-x-3">
                {/* Avatar del usuario */}
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <span className="font-medium text-sm">
                  Dr. {getUserDisplayName()}
                </span>
              </div>
              {/* Icono de chevron con animación */}
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${
                  isAccountDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* Menú desplegable */}
            {isAccountDropdownOpen && (
              <div className="absolute left-0 right-0 m-2 mb-5 bg-white rounded-2xl shadow-lg border border-gray-200 py-1 z-50">
                {/* Sección del usuario actual */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      {user?.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Profile" 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User size={20} className="text-teal-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Dr. {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                      <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full mt-1">
                        Cuenta activa
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sección de cuentas guardadas para cambio rápido */}
                {savedAccounts && savedAccounts.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Cambiar cuenta
                      </p>
                    </div>
                    {savedAccounts.map((account) => (
                      <button
                        key={account.uid}
                        onClick={() => handleSwitchAccount(account)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {account.photoURL ? (
                            <img 
                              src={account.photoURL} 
                              alt="Profile" 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <User size={16} className="text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            Dr. {account.displayName || account.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {account.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Opciones del menú */}
                <div className="border-t border-gray-100 py-1">
                  {/* Agregar nueva cuenta */}
                  <button
                    onClick={handleAddAccount}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#233F4C' }}>
                      <UserPlus size={16} className="text-white" />
                    </div>
                    <span className="text-sm font-medium">Agregar cuenta</span>
                  </button>

                  {/* Cerrar sesión */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center space-x-3 text-red-600"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <LogOut size={16} className="text-red-600" />
                    </div>
                    <span className="text-sm font-medium">Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección de configuración de visualización */}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Visualización</h1>
        
        <div className="bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Zoom de la aplicación</h2>
          
          <div className="space-y-4">
            {/* Indicadores de escala */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>80</span>
              <span>100</span>
              <span>120</span>
            </div>
            
            {/* Control deslizante de zoom */}
            <div className="relative">
              <input
                type="range"
                min="80"
                max="120"
                step="20"
                value={zoomLevel}
                onChange={handleZoomChange}
                className="w-full h-2 bg-gray-300 rounded-2xl appearance-none cursor-pointer slider"
              />
            </div>
            
            {/* Indicador del valor actual */}
            <div className="text-center mt-2">
              <span className="text-sm font-medium text-gray-700">
                Zoom actual: {zoomLevel}%
              </span>
            </div>
          </div>
        </div>

       
      </div>
 {/* Sección de Soporte */}
        <div className="bg-white rounded-lg p-6 mt-6">
          <div className="flex items-center space-x-3 mb-6">
            
            <h2 className="text-3xl font-bold text-gray-800">Soporte de la aplicación</h2>
          </div>
          
          <div className="bg-gray-100 rounded-xl p-4  border-gray-200">
            <div className="text-center space-y-4">
              <div>
               
                <h3 className="text-xl text-gray-800 font-semibold mt-1">Soporte técnico especializado</h3>
                 <h4 className="text-lg font-semibold text-gray-600 ">Joel Fuentes</h4>
              </div>
              
              <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                {/* Información de contacto telefónico */}
                 <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-800">Correo electrónico</p>
                    <p className="text-sm text-gray-600 font-semibold">fuentesjoel723@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-8 p-4 border-2 bg-gray-50 rounded-xl  border-gray-200">
               
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-800">Teléfono</p>
                    <p className="text-sm text-gray-600 font-semibold">+503 7722 0472</p>
                  </div>
                </div>
                
                {/* Información de contacto por correo */}
               
              </div>      
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Para asistencia técnica, dudas o problemas con la aplicación, no dudes en contactarnos.
                </p>
              </div>
            </div>
          </div>
        </div>
      {/* Estilos CSS personalizados para el control deslizante */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider {
            background: #d1d5db;
          }
          
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 24px;
            height: 24px;
            background: #374151;
            border-radius: 50%;
            cursor: pointer;
            position: relative;
            z-index: 2;
          }
          
          .slider::-moz-range-thumb {
            width: 24px;
            height: 24px;
            background: #374151;
            border-radius: 50%;
            cursor: pointer;
            border: none;
            position: relative;
            z-index: 2;
          }
          
          .slider::-webkit-slider-track {
            height: 8px;
            background: #d1d5db;
            border-radius: 4px;
          }
          
          .slider::-moz-range-track {
            height: 8px;
            background: #d1d5db;
            border-radius: 4px;
            border: none;
          }
        `
      }} />
    </div>
  );
};

export default Settings;