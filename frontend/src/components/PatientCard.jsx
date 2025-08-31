import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

/**
 * Componente de tarjeta para mostrar información básica del paciente
 * Incluye foto, nombre, edad y diagnóstico con diseño tipo card
 */
const PatientCard = ({ patient }) => {
  return (
    <Link to={`/patients/${patient.id}`}>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border">
        {/* Contenedor de foto del paciente con overlay */}
        <div className="relative h-48 bg-gradient-to-br from-slate-600 via-teal-800 to-teal-600">
          {patient.photo ? (
            <img 
              src={patient.photo} 
              alt={`${patient.firstName} ${patient.lastName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            // Placeholder cuando no hay foto
            <div className="w-full h-full flex items-center justify-center">
              <User size={64} className="text-white/70" />
            </div>
          )}
          
          {/* Overlay semitransparente para mejorar legibilidad del texto */}
          <div className="absolute inset-0 bg-black/25"></div>
          
          {/* Información del paciente en la parte superior */}
          <div className="absolute top-4 left-4 right-4">
            <h3 className="text-white font-bold text-xl leading-tight">
              {patient.firstName} {patient.lastName}
            </h3>
            <p className="text-white/90 text-sm mt-1">
              {patient.age} años
            </p>
          </div>

          {/* Diagnóstico en la parte inferior */}
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white font-semibold text-lg">
              {patient.disease || 'Sin diagnóstico'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PatientCard;