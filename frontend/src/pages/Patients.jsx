import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import PatientCard from '../components/PatientCard';
import { patientsAPI } from '../services/api';

const Patients = () => {
  // Estados del componente
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Filtra los pacientes basado en la consulta de búsqueda
   * Busca coincidencias en nombre, apellido y enfermedad
   */
  const filterPatients = useCallback(() => {
    // Si no hay término de búsqueda, mostrar lista vacía
    if (!searchQuery.trim()) {
      setFilteredPatients([]);
      return;
    }

    // Filtrar pacientes por nombre, apellido o enfermedad (insensible a mayúsculas)
    const filtered = patients.filter(patient => 
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.disease.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  /**
   * Efecto que filtra los pacientes cuando cambia la consulta de búsqueda
   * Solo se ejecuta si ya se ha realizado al menos una búsqueda
   */
  useEffect(() => {
    if (hasSearched) {
      filterPatients();
    }
  }, [searchQuery, patients, hasSearched, filterPatients]);

  /**
   * Obtiene todos los pacientes desde la API
   * Se ejecuta cuando el usuario realiza una búsqueda
   */
  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      // Llamada a la API para obtener todos los pacientes
      const response = await patientsAPI.getPatients();  // ✅ Este sí existe
      
      // Normalizar la respuesta (manejar diferentes estructuras de datos)
      const patients = Array.isArray(response.data) 
        ? response.data 
        : Array.isArray(response.data.data) 
          ? response.data.data 
          : [];
      
      setPatients(patients);
      setHasSearched(true);
    } catch (error) {
      // En caso de error, limpiar la lista y marcar como búsqueda realizada
      setPatients([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el envío del formulario de búsqueda
   * Inicia la búsqueda solo si hay un término válido
   */
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchPatients();
    }
  };

  /**
   * Limpia todos los estados de búsqueda y resultados
   * Regresa a la interfaz inicial
   */
  const clearSearch = () => {
    setSearchQuery('');
    setPatients([]);
    setFilteredPatients([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" style={{ marginTop: '60px' }}>
      {/* Barra de búsqueda */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <form onSubmit={handleSearch} className="flex space-x-4">
          {/* Campo de búsqueda */}
          <div className="flex-1 relative rounded-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar paciente por nombre o enfermedad"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border bg-gray-100 border-gray-100 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>
          
          {/* Botón de búsqueda */}
          <button
            type="submit"
            disabled={!searchQuery.trim() || loading}
            className="bg-slate-700 hover:bg-slate-800 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          
          {/* Botón de limpiar (solo visible después de buscar) */}
          {hasSearched && (
            <button
              type="button"
              onClick={clearSearch}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="text-lg text-gray-600">Buscando pacientes...</div>
        </div>
      )}

      {/* Contador de resultados */}
      {hasSearched && !loading && searchQuery && (
        <div className="text-gray-600">
          Se encontraron {filteredPatients.length} resultado{filteredPatients.length !== 1 ? 's' : ''} para "{searchQuery}"
        </div>
      )}

      {/* Renderizado condicional de resultados */}
      {hasSearched && !loading ? (
        // Si hay resultados, mostrar grid de pacientes
        filteredPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        ) : (
          // Si no hay resultados después de buscar
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              {searchQuery ? 'No se encontraron pacientes con ese criterio' : 'Realiza una búsqueda para ver los pacientes'}
            </div>
          </div>
        )
      ) : !loading && !hasSearched ? (
        // Estado inicial antes de la primera búsqueda
        <div className="text-center py-16">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-gray-500 text-lg mb-2">Buscar Pacientes</div>
          <div className="text-gray-400">Ingresa el nombre del paciente o enfermedad para buscar</div>
        </div>
      ) : null}
    </div>
  );
};

export default Patients;