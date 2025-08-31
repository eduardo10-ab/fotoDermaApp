import React from 'react';
import { Calendar } from 'lucide-react';

/**
 * Componente para mostrar información resumida de una consulta médica
 * Incluye fechas, enfermedad y botón para ver detalles completos
 */
const ConsultationCard = ({ consultation, onViewDetails }) => {
  // Formatear fecha en formato DD/MM/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Generar texto de fecha considerando si hay seguimientos
  const getDisplayDateText = () => {
    const originalDate = formatDate(consultation.date);
    
    // Si tiene seguimientos, mostrar primera consulta y último seguimiento
    if (consultation.followUps && consultation.followUps.length > 0) {
      const sortedFollowUps = consultation.followUps.sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastFollowUpDate = formatDate(sortedFollowUps[0].date);
      
      return `Primera consulta: ${originalDate} | Último seguimiento: ${lastFollowUpDate}`;
    }
    
    // Si no hay seguimientos, mostrar solo la fecha original
    return `Fecha: ${originalDate}`;
  };

  // Extraer solo el nombre de la enfermedad sin información adicional
  const getDisplayDisease = () => {
    if (!consultation.disease) return 'No especificada';
    
    // Limpiar el campo disease removiendo información de fechas si existe
    let cleanDisease = consultation.disease;
    
    // Remover texto de seguimientos que pueda haberse agregado por error
    cleanDisease = cleanDisease.replace(/\n.*ultimo seguimiento.*$/gi, '');
    cleanDisease = cleanDisease.replace(/con seguimiento.*$/gi, '');
    cleanDisease = cleanDisease.trim();
    
    return cleanDisease || 'No especificada';
  };

  return (
    <div className="bg-gray-100 rounded-xl p-6 mb-4 hover:bg-gray-50 transition-colors">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div className="flex-1">
          {/* Información de fechas con indicador de seguimiento */}
          <div className="flex items-center text-gray-600 mb-2">
            <Calendar size={16} className="mr-2" />
            <span className="text-sm font-medium">{getDisplayDateText()}</span>
            {consultation.hasFollowUp && (
              <span className="ml-3 text-xs bg-gray-500 text-white px-2 py-1 rounded-lg">
                Consulta con seguimiento
              </span>
            )}
          </div>
          
          {/* Nombre de la enfermedad */}
          <div className="mb-2">
            <span className="text-sm text-gray-600">Enfermedad: </span>
            <span className="font-medium">{getDisplayDisease()}</span>
          </div>
        </div>
        
        {/* Botón para ver detalles completos */}
        <div className="lg:ml-4 lg:mt-1">
          <button
            onClick={() => onViewDetails(consultation)}
            className="w-full lg:w-auto bg-slate-700 hover:bg-slate-800 text-white px-6 py-6 rounded-2xl font-medium transition-colors whitespace-nowrap"
          >
            Ver consulta completa
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultationCard;