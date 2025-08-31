import React from 'react';

/**
 * Componente placeholder para cambio de idioma
 * Implementación futura para soporte multiidioma
 */
const LanguageSwitcher = () => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Idioma:</span>
      <select className="text-sm border rounded px-2 py-1">
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;