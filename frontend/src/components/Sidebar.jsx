import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, UserPlus, Search, Settings, Menu, X } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si la pantalla es móvil para mostrar/ocultar elementos
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Cerrar menú móvil automáticamente al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Configuración de elementos del menú de navegación
  const menuItems = [
    {
      name: 'Inicio',
      icon: Home,
      path: '/',
      active: location.pathname === '/' || location.pathname === '/dashboard'
    },
    {
      name: 'Crear expediente',
      icon: UserPlus,
      path: '/new-patient',
      active: location.pathname === '/new-patient'
    },
    {
      name: 'Buscar expediente',
      icon: Search,
      path: '/patients',
      active: location.pathname === '/patients' || location.pathname.startsWith('/patients/')
    },
    {
      name: 'Configuracion',
      icon: Settings,
      path: '/settings',
      active: location.pathname === '/settings'
    }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Botón hamburguesa para dispositivos móviles */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <button
            onClick={toggleMobileMenu}
            className=" text-white p-3 ml-3 rounded-xl shadow-lg hover:bg-teal-800 transition-colors"
             style={{ backgroundColor: '#233F4C' }}
            aria-label="Abrir menú"
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* Overlay de fondo para cerrar menú en móvil */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar principal */}
        <div className={`
          text-white min-h-screen flex flex-col rounded-r-lg
          ${isMobile 
            ? `fixed top-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'w-80 fixed left-0 top-0 z-10'
          }
        `}
      style={{ backgroundColor: '#233F4C' }}>
        {/* Header con logo y botón de cierre */}
       <div className="p-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo de la aplicación */}
            <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
            </svg>
            <h1 className="text-2xl font-bold">FotoDermaApp</h1>
          </div>
          
          {/* Botón de cierre para móvil */}
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white hover:text-gray-200 transition-colors md:hidden"
              aria-label="Cerrar menú"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 px-4 pb-4">
          <ul className="space-y-12 mt-10 font-bold">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-6 py-6 rounded-3xl transition-all duration-200 ${
                    item.active
                      ? 'bg-white/90 shadow-sm'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                  style={item.active ? { 
                    color: '#233F4C' 
                  } : {}}
                  onClick={() => isMobile && setIsMobileMenuOpen(false)}
                >
                  <item.icon size={28} />
                  <span className="text-xl">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer con información de copyright */}
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-white text-center">
            © 2025 FotoDermaApp
          </div>
        </div>
      </div>

      {/* Espaciador para evitar solapamiento en desktop */}
      {!isMobile && <div className="w-80 flex-shrink-0" />}
    </>
  );
};

export default Sidebar;