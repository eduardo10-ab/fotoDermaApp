import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Camera, X, ArrowLeft } from 'lucide-react';
import { patientsAPI, consultationsAPI } from '../services/api-fixed';
import CameraComponent from '../components/CameraComponent';

const NewConsultation = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  // Estados principales
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  
  // Estado del formulario con datos del paciente y consulta
  const [formData, setFormData] = useState({
    date: '',
    disease: '',
    diagnosis: '',
    firstName: '',
    lastName: '',
    age: ''
  });

  // Referencias para manejo de archivos
  const fileInputRef = useRef(null);

  /**
   * Efecto para cargar datos del paciente al montar el componente
   */
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await patientsAPI.getById(patientId);
        const patientData = response.data.data || response.data;
        setPatient(patientData);
        
        // Pre-llenar formulario con datos del paciente
        setFormData(prev => ({
          ...prev,
          firstName: patientData.firstName || '',
          lastName: patientData.lastName || '',
          age: patientData.age || ''
        }));
      } catch (error) {
        // Datos por defecto si falla la carga del paciente
        const defaultPatient = {
          id: patientId,
          firstName: 'Nombres',
          lastName: 'Apellidos',
          age: 40,
          disease: 'Diagnostico'
        };
        setPatient(defaultPatient);
        setFormData(prev => ({
          ...prev,
          firstName: defaultPatient.firstName,
          lastName: defaultPatient.lastName,
          age: defaultPatient.age
        }));
      }
    };
    fetchPatient();
  }, [patientId]);

  /**
   * Maneja cambios en los inputs del formulario
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Maneja la subida de archivos desde el dispositivo
   */
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newPhoto = {
            id: Date.now() + Math.random(),
            url: event.target.result,
            file: file,
            type: 'upload'
          };
          setPhotos(prev => [...prev, newPhoto]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Limpiar input para permitir seleccionar el mismo archivo nuevamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Maneja la captura de fotos desde el CameraComponent
   * Recibe el objeto foto del componente de cámara
   */
  const handleCameraCapture = (photoObject) => {
    setPhotos(prev => [...prev, photoObject]);
    setShowCamera(false);
  };

  /**
   * Abre el componente de cámara
   */
  const openCamera = () => {
    setShowCamera(true);
  };

  /**
   * Cierra el componente de cámara
   */
  const closeCamera = () => {
    setShowCamera(false);
  };

  /**
   * Elimina una foto de la lista
   */
  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  /**
   * Maneja el envío del formulario para crear la consulta
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Actualizar datos del paciente si han cambiado
      if (patient && (
        formData.firstName !== patient.firstName ||
        formData.lastName !== patient.lastName ||
        formData.age !== patient.age
      )) {
        await patientsAPI.update(patientId, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          age: parseInt(formData.age)
        });
      }

      // Función para formatear fecha para el backend
      const formatDateForBackend = (dateString) => {
        if (!dateString) return null;
        
        // Si ya viene en formato completo ISO, devolverlo
        if (dateString.includes('T') && dateString.includes('Z')) {
          return dateString;
        }
        
        // Si viene solo la fecha (YYYY-MM-DD), agregarle tiempo del mediodía
        return dateString + 'T12:00:00.000Z';
      };

      // Preparar datos de la consulta
      const consultationData = {
        patientId,
        date: formatDateForBackend(formData.date),
        disease: formData.disease,
        diagnosis: formData.diagnosis
      };

      // Crear la consulta
      const consultationResponse = await consultationsAPI.create(consultationData);
      const consultationId = consultationResponse.data.id || consultationResponse.data.data.id;

      // Subir fotos si existen
      if (photos.length > 0 && consultationId) {
        const formDataPhotos = new FormData();
        photos.forEach((photo) => {
          if (photo.file) {
            formDataPhotos.append('photos', photo.file);
          }
        });

        try {
          await consultationsAPI.uploadPhotos(consultationId, formDataPhotos);
        } catch (photoError) {
          alert('La consulta se creó correctamente, pero hubo un error al subir algunas fotos.');
        }
      }

      // Redirigir al expediente del paciente
      navigate(`/patients/${patientId}`);
      
    } catch (error) {
      // Manejo de errores con mensajes específicos
      let errorMessage = 'Error al crear la consulta';
      if (error.response) {
        errorMessage += `: ${error.response.data?.message || error.response.statusText}`;
      } else if (error.request) {
        errorMessage += ': No se pudo conectar con el servidor';
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancela la operación y regresa al expediente
   */
  const handleCancel = () => {
    // Limpiar formulario
    setFormData({
      date: '',
      disease: '',
      diagnosis: '',
      firstName: patient?.firstName || '',
      lastName: patient?.lastName || '',
      age: patient?.age || ''
    });
    
    setPhotos([]);
    setShowCamera(false);
    
    // Limpiar input de archivos
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    navigate(`/patients/${patientId}`);
  };

  // Mostrar loading mientras se carga el paciente
  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8" style={{ marginTop: '50px' }}>
      {/* Botón de retroceso */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="flex items-center space-x-2 py-1 text-teal-900 hover:text-teal-600 font-bold rounded-lg transition-colors text-lg"
        >
          <ArrowLeft size={20} />
          <span>Volver al expediente</span>
        </button>
      </div>

      {/* Sección de información del paciente */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Información del paciente</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Nombres</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-200 text-gray-700 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Apellidos</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Edad</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              min="1"
              max="120"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Formulario de nueva consulta */}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Nueva Consulta</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campos básicos de la consulta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-600 font-medium mb-2">
                Fecha de consulta
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-600 font-medium mb-2">
                Enfermedad
              </label>
              <input
                type="text"
                name="disease"
                value={formData.disease}
                onChange={handleInputChange}
                placeholder="Nombre de la enfermedad"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Campo de diagnóstico */}
          <div>
            <label className="block text-gray-600 font-medium mb-2">
              Diagnóstico
            </label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              placeholder="Descripción del diagnóstico..."
              required
              rows="4"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Sección de fotos */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Agregar fotos de la consulta
            </h3>
            
            {/* Input de archivos oculto */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            
            {/* Botones para agregar fotos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={openCamera}
                className="flex items-center justify-center space-x-2 px-6 py-5 bg-slate-600 text-white rounded-2xl hover:bg-slate-700 transition-colors"
              >
                <Camera size={20} />
                <span>Tomar foto</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 px-6 py-5 border-2 border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <Upload size={20} />
                <span>Subir foto</span>
              </button>
            </div>

            {/* Vista previa de fotos */}
            {photos.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Fotos agregadas ({photos.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt="Foto de la consulta"
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {photo.type === 'camera' ? 'cámara' : 'Subida'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="border-2 w-full bg-gray-100 text-[#233F4C] px-12 py-5 rounded-2xl font-medium hover:bg-gray-200 transition-colors order-2 sm:order-1 space-x-2"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-slate-700 w-full hover:bg-slate-800 text-white px-6 py-5 rounded-2xl font-medium transition-colors disabled:opacity-50 order-1 sm:order-2 space-x-2"
              >
                {loading ? 'Guardando...' : 'Guardar consulta'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Componente de cámara */}
      {showCamera && (
        <CameraComponent
          onCapture={handleCameraCapture}
          onClose={closeCamera}
        />
      )}
    </div>
  );
};

export default NewConsultation;