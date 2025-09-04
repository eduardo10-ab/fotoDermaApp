import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ChevronDown, LogOut, UserPlus } from 'lucide-react';

const Navbar = () => {
  const { user, logout, savedAccounts, switchAccount } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);

  // Detectar tamaño de pantalla para diseño responsive
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Cerrar dropdown cuando se hace clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Manejar cierre de sesión
  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      setIsDropdownOpen(false);
    }
  };

  // Cambiar entre cuentas guardadas
  const handleSwitchAccount = async (account) => {
    const result = await switchAccount(account);
    if (result.success) {
      setIsDropdownOpen(false);
    }
  };

  // Redirigir a login para agregar nueva cuenta
  const handleAddAccount = () => {
    setIsDropdownOpen(false);
    window.location.href = '/login?mode=add';
  };

  // Obtener nombre de usuario para mostrar
  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'Usuario';
  };

  return (
    <header className={`
      fixed top-0 right-0 py-4 bg-gray-100 mx-5 px-3
      ${isMobile 
        ? 'left-0 z-30' // z-index reducido en móvil para que quede debajo del overlay del sidebar
        : 'left-80 z-40' // z-index normal en desktop
      }
    `}>
      <div className="flex justify-end items-center">
        {/* Dropdown del perfil de usuario */}
        <div className="relative z-50" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-3 text-white px-4 py-2 rounded-full hover:bg-teal-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
           style={{ backgroundColor: '#233F4C' }}>
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
            <ChevronDown 
              size={16} 
              className={`transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {/* Menu desplegable */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[70]">
                {/* Información del usuario actual */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
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

                {/* Lista de cuentas guardadas */}
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
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
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
                  <button
                    onClick={handleAddAccount}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#233F4C' }}>
                      <UserPlus size={16} className="text-white" />
                    </div>
                    <span className="text-sm font-medium">Agregar cuenta</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center space-x-3 text-red-600"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <LogOut size={16} className="text-red-600" />
                    </div>
                    <span className="text-sm font-medium">Cerrar sesión</span>
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;