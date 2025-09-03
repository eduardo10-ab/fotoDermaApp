import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, Maximize2, User, Filter, X } from 'lucide-react';
import ConsultationCard from '../components/ConsultationCard';
import FollowUpModal from '../components/FollowUpModal';
import { patientsAPI, consultationsAPI  } from '../services/api-fixed';
import { useNavigate } from 'react-router-dom';
import {ArrowLeft } from 'lucide-react';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para el modal de seguimiento
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpConsultation, setFollowUpConsultation] = useState(null);
  
  // Estados para filtros de consultas
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [dateFilter, setDateFilter] = useState('desc');
  const [diseaseFilter, setDiseaseFilter] = useState('none');
  const [activeFilters, setActiveFilters] = useState(0);

  // Estados para filtros de fotos
  const [showPhotoFilterMenu, setShowPhotoFilterMenu] = useState(false);
  const [photoDateFilter, setPhotoDateFilter] = useState('desc');
  const [filteredPhotos, setFilteredPhotos] = useState([]);

  /**
   * Obtiene los datos del paciente y sus consultas
   * Optimizado para hacer solo los requests necesarios
   */
  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Hacer requests en paralelo pero con mejor manejo de errores
      const [patientResponse, consultationsResponse] = await Promise.all([
        patientsAPI.getById(id),
        consultationsAPI.getByPatientId(id).catch(err => {
          console.error('Error cargando consultas:', err);
          return { data: [] };
        })
      ]);
      
      const patientData = patientResponse.data?.data || patientResponse.data;
      const consultationsData = Array.isArray(consultationsResponse.data) 
        ? consultationsResponse.data 
        : consultationsResponse.data?.data || [];
      
      setPatient(patientData);
      setConsultations(consultationsData);
      
    } catch (error) {
      console.error('Error cargando datos del paciente:', error);
      setError(error.message || 'Error al cargar los datos del paciente');
      setPatient(null);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  /**
   * Aplica filtros a las consultas del paciente
   */
  const applyFilters = useCallback(() => {
    let filtered = [...consultations];
    let filtersCount = 0;

    // Aplicar filtro de fecha
    if (dateFilter !== 'desc') {
      filtersCount++;
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);
      return dateFilter === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Aplicar filtro de enfermedad
    if (diseaseFilter !== 'none') {
      filtersCount++;
      filtered.sort((a, b) => {
        const diseaseA = (a.disease || '').toLowerCase().trim();
        const diseaseB = (b.disease || '').toLowerCase().trim();
        
        if (!diseaseA && !diseaseB) return 0;
        if (!diseaseA) return diseaseFilter === 'asc' ? 1 : -1;
        if (!diseaseB) return diseaseFilter === 'asc' ? -1 : 1;
        
        return diseaseFilter === 'asc' 
          ? diseaseA.localeCompare(diseaseB)
          : diseaseB.localeCompare(diseaseA);
      });
    }

    setFilteredConsultations(filtered);
    setActiveFilters(filtersCount);
  }, [consultations, dateFilter, diseaseFilter]);

  /**
   * Aplica filtros a las fotos de la consulta seleccionada
   * Optimizado para evitar re-renders innecesarios
   */
  const applyPhotoFilters = useCallback(() => {
    if (!selectedConsultation?.photos?.length) {
      setFilteredPhotos([]);
      return;
    }

    const filtered = [...selectedConsultation.photos].sort((a, b) => {
      const dateA = new Date(a.uploadedAt || a.createdAt || a.date || selectedConsultation.date);
      const dateB = new Date(b.uploadedAt || b.createdAt || b.date || selectedConsultation.date);
      
      const isValidDateA = !isNaN(dateA.getTime());
      const isValidDateB = !isNaN(dateB.getTime());
      
      if (!isValidDateA && !isValidDateB) return 0;
      if (!isValidDateA) return photoDateFilter === 'asc' ? 1 : -1;
      if (!isValidDateB) return photoDateFilter === 'asc' ? -1 : 1;
      
      return photoDateFilter === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredPhotos(filtered);
  }, [selectedConsultation, photoDateFilter]);

  // ✅ SOLUCIÓN: Un solo useEffect para cargar datos cuando cambie el ID
  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  // ✅ SOLUCIÓN: Un solo useEffect para aplicar filtros de consultas
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ✅ SOLUCIÓN: Un solo useEffect optimizado para filtros de fotos
  useEffect(() => {
    if (selectedConsultation?.photos?.length > 0) {
      applyPhotoFilters();
    } else {
      setFilteredPhotos([]);
    }
  }, [applyPhotoFilters, selectedConsultation?.photos?.length]);

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'date') {
      setDateFilter(value);
    } else if (filterType === 'disease') {
      setDiseaseFilter(value);
    }
  };

  const handlePhotoFilterChange = (value) => {
    setPhotoDateFilter(value);
  };

  const clearFilters = () => {
    setDateFilter('desc');
    setDiseaseFilter('none');
    setShowFilterMenu(false);
  };

  const clearPhotoFilters = () => {
    setPhotoDateFilter('desc');
    setShowPhotoFilterMenu(false);
  };

  /**
   * Maneja la selección de una consulta para ver detalles
   * Optimizado para evitar cálculos innecesarios
   */
  const handleViewConsultationDetails = (consultation) => {
    // Buscar consultas relacionadas con la misma enfermedad
    const relatedConsultations = consultations.filter(c => 
      c.disease === consultation.disease && c.disease && c.disease.trim() !== ''
    ).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    // Combinar información si hay consultas relacionadas
    if (relatedConsultations.length > 1) {
      const combinedConsultation = {
        ...consultation,
        allConsultations: relatedConsultations,
        photos: relatedConsultations.flatMap(c => c.photos || []),
        diagnoses: relatedConsultations.map(c => ({
          date: c.date,
          diagnosis: c.diagnosis,
          isFollowUp: c.isFollowUp || false,
          id: c.id
        }))
      };
      setSelectedConsultation(combinedConsultation);
    } else {
      setSelectedConsultation(consultation);
    }
  };

  const handleBackToHistory = () => {
    setSelectedConsultation(null);
    setShowFollowUpModal(false);
    setFollowUpConsultation(null);
    setPhotoDateFilter('desc');
    setShowPhotoFilterMenu(false);
  };

  const handleFollowUp = (consultation) => {
    setFollowUpConsultation(consultation);
    setShowFollowUpModal(true);
  };

  const handleSaveFollowUp = async (followUpData) => {
    try {
      await fetchPatientData();
    } catch (error) {
      console.error('Error recargando datos:', error);
      await fetchPatientData();
    } finally {
      setShowFollowUpModal(false);
      setFollowUpConsultation(null);
    }
  };

  const handleCloseFollowUpModal = () => {
    setShowFollowUpModal(false);
    setFollowUpConsultation(null);
  };

  const getPatientProfilePhoto = (patient) => {
    if (patient.photo) return patient.photo;
    if (patient.photos && patient.photos.length > 0) {
      return patient.photos[0].url || patient.photos[0];
    }
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getFilterText = () => {
    const filters = [];
    
    if (dateFilter === 'asc') {
      filters.push('Fecha: Más antiguo primero');
    } else if (dateFilter === 'desc' && (diseaseFilter !== 'none' || activeFilters > 0)) {
      filters.push('Fecha: Más reciente primero');
    }
    
    if (diseaseFilter === 'asc') {
      filters.push('Enfermedad: A-Z');
    } else if (diseaseFilter === 'desc') {
      filters.push('Enfermedad: Z-A');
    }
    
    return filters.length > 0 ? filters.join(' • ') : 'Filtrar';
  };

  const getPhotoFilterText = () => {
    return photoDateFilter === 'asc' ? 'Más antiguas primero' : 'Más recientes primero';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div>
        <div className="text-lg text-gray-600">Cargando datos del paciente...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">Error: {error}</div>
        <button 
          onClick={fetchPatientData}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">Paciente no encontrado</div>
        <Link to="/" className="text-teal-600 hover:text-teal-700 mt-2 inline-block">
          Volver al inicio
        </Link>
      </div>
    );
  }

  // Vista de detalles de consulta seleccionada
  if (selectedConsultation) {
    return (
      <div className="p-6 min-h-screen rounded-lg max-w-5xl mx-auto" style={{ marginTop: '20px' }}>
        <button
          onClick={handleBackToHistory}
          className="text-teal-900 hover:text-teal-700 font-bold py-5 text-lg"
        >
          ← Volver al historial
        </button>
        
        <div className="bg-white rounded-xl shadow-sm p-11 border border-gray-200">
          <h1 className="text-4xl font-bold text-gray-700 mb-10">Historial Clínico</h1>
          
          {/* Información de las fechas de consulta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Fecha de consulta</h3>
              {selectedConsultation.allConsultations && selectedConsultation.allConsultations.length > 1 ? (
                <div className="space-y-1">
                  {selectedConsultation.allConsultations.map((consultation, index) => (
                    <div key={consultation.id} className="flex items-center space-x-2">
                      <p className="text-gray-700">
                        {formatDate(consultation.date)}
                        {index === 0 && ' (más reciente)'}
                        {index === selectedConsultation.allConsultations.length - 1 && index > 0 && ' (inicial)'}
                      </p>
                      {consultation.isFollowUp && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Seguimiento
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700 mb-3">{formatDate(selectedConsultation.date)}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Enfermedad</h3>
              <p className="text-gray-700 mb-3 text-l">{selectedConsultation.disease || 'No especificada'}</p>
            </div>
          </div>

          {/* Diagnósticos */}
          <div className="mb-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {selectedConsultation.diagnoses && selectedConsultation.diagnoses.length > 1 
                ? 'Diagnósticos' 
                : 'Diagnóstico'}
            </h2>
            
            {selectedConsultation.diagnoses && selectedConsultation.diagnoses.length > 1 ? (
              <div className="space-y-4">
                {selectedConsultation.diagnoses.map((diagnosisEntry, index) => (
                  <div key={diagnosisEntry.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        {formatDate(diagnosisEntry.date)}
                        {index === 0 && ' (más reciente)'}
                      </span>
                      {diagnosisEntry.isFollowUp && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Seguimiento
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {diagnosisEntry.diagnosis}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-100 border border-slate-300 rounded-2xl px-8 py-6 mb-5 border-shadow-sm">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedConsultation.diagnosis || 'Sin diagnóstico registrado'}
                </p>
              </div>
            )}
          </div>

          {/* Fotos con filtro optimizado */}
          <div className="mb-6 mt-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-700">
                Fotos de la consulta ({filteredPhotos.length || selectedConsultation.photos?.length || 0})
              </h2>
              
              {/* Filtro de fotos */}
              {selectedConsultation.photos && selectedConsultation.photos.length > 1 && (
                <div className="relative">
                  <button 
                    onClick={() => setShowPhotoFilterMenu(!showPhotoFilterMenu)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 text-sm px-3 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    <Filter size={16} />
                    <span>{getPhotoFilterText()}</span>
                    <ChevronDown size={16} className={`transition-transform ${showPhotoFilterMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showPhotoFilterMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-gray-800">Ordenar fotos</h3>
                          <button
                            onClick={() => setShowPhotoFilterMenu(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Por fecha
                          </label>
                          <select
                            value={photoDateFilter}
                            onChange={(e) => handlePhotoFilterChange(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-900 focus:border-teal-900"
                          >
                            <option value="desc">Más recientes primero</option>
                            <option value="asc">Más antiguas primero</option>
                          </select>
                        </div>

                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <button
                            onClick={clearPhotoFilters}
                            className="text-sm text-gray-600 hover:text-gray-700"
                          >
                            Limpiar
                          </button>
                          <button
                            onClick={() => setShowPhotoFilterMenu(false)}
                            className="hover:bg-gray-400 text-white px-4 py-2 rounded-md text-sm"
                            style={{ backgroundColor: '#233F4C' }}
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {(selectedConsultation.photos && selectedConsultation.photos.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(filteredPhotos.length > 0 ? filteredPhotos : selectedConsultation.photos).map((photo, index) => (
                  <div key={photo.id || index} className="relative group">
                    <img
                      src={photo.url || photo}
                      alt={`Foto de consulta ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-64 bg-gray-200 rounded-lg items-center justify-center">
                      <span className="text-gray-500">Imagen no disponible</span>
                    </div>

                    <button 
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => window.open(photo.url || photo, '_blank')}
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No hay fotos disponibles para esta consulta</p>
              </div>
            )}
          </div>

          {/* Botón de Dar Seguimiento */}
          {selectedConsultation.disease && selectedConsultation.disease.trim() && (
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => handleFollowUp(selectedConsultation)}
                className="bg-slate-700 hover:bg-slate-800 text-white px-10 py-5 rounded-xl font-medium transition-colors"
              >
                Dar seguimiento
              </button>
            </div>
          )}
        </div>

        {/* Modal dentro de la vista de detalles */}
        {showFollowUpModal && followUpConsultation && (
          <FollowUpModal
            isOpen={showFollowUpModal}
            onClose={handleCloseFollowUpModal}
            originalConsultation={followUpConsultation}
            onSave={handleSaveFollowUp}
            setSelectedConsultation={setSelectedConsultation}
            setShowFollowUpModal={setShowFollowUpModal}
            setFollowUpConsultation={setFollowUpConsultation}
          />
        )}
      </div>
    );
  }

  // Vista principal del paciente
  return (
    <>
      <div className="space-y-6 max-w-5xl mx-auto" style={{ marginTop: '50px' }}>
        {/* Botón de retroceso */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 ml- py-1 text-teal-900 hover:text-teal-600 font-bold rounded-lg transition-colors text-lg"
          >
            <ArrowLeft size={20} />
            <span>Volver al inicio</span>
          </button>
        </div>
        
        {/* Información general del paciente */}
        <div className="bg-white rounded-xl p-6 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Información general del paciente</h1>
          
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex flex-row items-start space-x-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                {getPatientProfilePhoto(patient) ? (
                  <img
                    src={getPatientProfilePhoto(patient)}
                    alt={`${patient.firstName} ${patient.lastName}`}
                    className="w-full h-full rounded-lg object-cover shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`${getPatientProfilePhoto(patient) ? 'hidden' : 'flex'} w-full h-full rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 items-center justify-center`}>
                  <User size={32} className="text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-600">Nombres:</span>
                    <span className="ml-2 text-gray-800">{patient.firstName}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Apellidos:</span>
                    <span className="ml-2 text-gray-800">{patient.lastName}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Edad:</span>
                    <span className="ml-2 text-gray-800">{patient.age} años</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:ml-auto lg:mt-0 mt-4">
              <Link
                to={`/new-consultation/${patient.id}`}
                className="bg-slate-700 hover:bg-slate-800 text-white px-11 py-5 mr-6 rounded-2xl font-bold transition-colors whitespace-nowrap text-center block w-full lg:w-auto"
              >
                Nueva consulta
              </Link>
            </div>
          </div>
        </div>

        {/* Historial clínico */}
        <div className="bg-white rounded-xl p-6 max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Historial Clínico</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {consultations.length} consulta{consultations.length !== 1 ? 's' : ''}
              </span>
              
              <div className="relative">
                <button 
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`flex items-center space-x-2 text-gray-600 hover:text-gray-700 text-sm px-3 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors ${
                    activeFilters > 0 ? 'bg-teal-50 border-teal-900 text-[#233F4C]' : ''
                  }`}
                >
                  <Filter size={16} />
                  <span>{getFilterText()}</span>
                  {activeFilters > 0 && (
                    <span className="bg-teal-900 text-white text-xs rounded-full px-2 py-0.5">
                      {activeFilters}
                    </span>
                  )}
                  <ChevronDown size={16} className={`transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                </button>

                {showFilterMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Filtros</h3>
                        <button
                          onClick={() => setShowFilterMenu(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ordenar por fecha
                        </label>
                        <select
                          value={dateFilter}
                          onChange={(e) => handleFilterChange('date', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-900 focus:border-teal-900"
                        >
                          <option value="desc">Más reciente primero</option>
                          <option value="asc">Más antiguo primero</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ordenar por enfermedad
                        </label>
                        <select
                          value={diseaseFilter}
                          onChange={(e) => handleFilterChange('disease', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-900 focus:border-teal-900"
                        >
                          <option value="none">Sin ordenar</option>
                          <option value="asc">A - Z</option>
                          <option value="desc">Z - A</option>
                        </select>
                      </div>

                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <button
                          onClick={clearFilters}
                          className="text-sm text-gray-600 hover:text-gray-700"
                        >
                          Limpiar filtros
                        </button>
                        <button
                          onClick={() => setShowFilterMenu(false)}
                          className="hover:bg-gray-400 text-white px-4 py-2 rounded-md text-sm"
                          style={{ backgroundColor: '#233F4C' }}
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredConsultations.length > 0 ? (
            <div className="space-y-4">
              {filteredConsultations.map((consultation) => (
                <ConsultationCard
                  key={consultation.id}
                  consultation={consultation}
                  onViewDetails={handleViewConsultationDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-gray-500 mb-4">No hay consultas registradas para este paciente</div>
              <Link
                to={`/new-consultation/${patient.id}`}
                className="hover:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-block"
                style={{ backgroundColor: '#233F4C' }}
              >
                Crear primera consulta
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modal en la vista principal */}
      {!selectedConsultation && showFollowUpModal && followUpConsultation && (
        <FollowUpModal
          isOpen={showFollowUpModal}
          onClose={handleCloseFollowUpModal}
          originalConsultation={followUpConsultation}
          onSave={handleSaveFollowUp}
          setSelectedConsultation={setSelectedConsultation}
          setShowFollowUpModal={setShowFollowUpModal}
          setFollowUpConsultation={setFollowUpConsultation}
        />
      )}
    </>
  );
};

export default PatientDetails;