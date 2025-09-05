import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PatientCard from '../components/PatientCard';
import { patientsAPI, consultationsAPI } from '../services/api-fixed';

const Dashboard = () => {
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // ✅ SOLUCIÓN: Un solo useEffect que maneja ambos casos
  useEffect(() => {
    fetchRecentPatients();
  }, [location.pathname]); // Se ejecuta al montar Y cuando cambia la ruta

  
  /**
   * Obtiene y ordena los pacientes por actividad reciente
   * Considera tanto la fecha de creación/actualización del paciente
   * como la fecha más reciente de sus consultas
   */
  const fetchRecentPatients = async () => {
    try {
      setLoading(true);
      
      // ✅ CORREGIDO: Usar getPatients() en lugar de getAll()
      const response = await patientsAPI.getPatients();
      
      const patients = Array.isArray(response.data) 
        ? response.data 
        : Array.isArray(response.data.data) 
          ? response.data.data 
          : [];
      
      if (patients.length === 0) {
        setRecentPatients([]);
        return;
      }
      
      // ✅ OPTIMIZACIÓN: Procesar pacientes con mejor manejo de errores
      const patientsWithActivity = await Promise.all(
        patients.map(async (patient) => {
          try {
            // ✅ CORREGIDO: Usar getConsultationsByPatient() en lugar de getByPatientId()
            const consultationsResponse = await consultationsAPI.getConsultationsByPatient(patient.id);
            const consultations = Array.isArray(consultationsResponse.data) 
              ? consultationsResponse.data 
              : consultationsResponse.data?.data || [];
            
            const patientCreatedDate = new Date(patient.updatedAt || patient.createdAt || patient.consultationDate);
            let latestActivity = patientCreatedDate.getTime();
            
            if (consultations.length > 0) {
              const latestConsultationDate = Math.max(
                ...consultations.map(consultation => {
                  const consultationDate = new Date(
                    consultation.updatedAt || consultation.createdAt || consultation.date
                  );
                  return consultationDate.getTime();
                })
              );
              
              latestActivity = Math.max(patientCreatedDate.getTime(), latestConsultationDate);
            }
            
            return { 
              ...patient, 
              latestActivity,
              consultationsCount: consultations.length 
            };
            
          } catch (consultationError) {
            console.error(`Error obteniendo consultas para paciente ${patient.id}:`, consultationError);
            const patientDate = new Date(patient.updatedAt || patient.createdAt || patient.consultationDate);
            return { 
              ...patient, 
              latestActivity: patientDate.getTime(),
              consultationsCount: 0 
            };
          }
        })
      );
      
      // Ordenar pacientes por actividad más reciente
      const sortedPatients = patientsWithActivity.sort((a, b) => {
        return b.latestActivity - a.latestActivity;
      });
      
      // Obtener los primeros 9 pacientes más activos recientemente
      const recent = sortedPatients.slice(0, 8);
      setRecentPatients(recent);
      
    } catch (error) {
      console.error('Error obteniendo pacientes recientes:', error);
      setRecentPatients([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className=" min-h-screen rounded-2xl max-w-6xl mx-auto" style={{ marginTop: '75px' }}>
      <div className="mb-5">
        <h1 className="text-center text-4xl font-bold text-gray-800">Consultas recientes</h1>
      </div>

      {recentPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-9 px-1 pt-5">
          {recentPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No hay pacientes registrados</div>
          <Link
            to="/new-patient"
            className="hover:bg-teal-900 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#233F4C' }}
          >
            Crear primer expediente
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;