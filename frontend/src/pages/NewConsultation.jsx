import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Camera, X, ArrowLeft } from 'lucide-react';
import { patientsAPI, consultationsAPI } from '../services/api-fixed';

const NewConsultation = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  // Estados principales
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
  // Estado del formulario con datos del paciente y consulta
  const [formData, setFormData] = useState({
    date: '',
    disease: '',
    diagnosis: '',
    firstName: '',
    lastName: '',
    age: ''
  });

  // Referencias para manejo de archivos y cámara
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

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
   * Convierte una URL de datos a archivo File
   */
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
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
   * Inicia la cámara para tomar fotos
   */
  const startCamera = async () => {
    try {
      // Verificar soporte del navegador
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no soporta el acceso a la cámara');
        return;
      }

      setShowCamera(true);
      setCameraReady(false);
      
      // Configuración de la cámara
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Configurar video con delay para asegurar que esté listo
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };
          videoRef.current.oncanplay = () => {
            setCameraReady(true);
          };
        }
      }, 100);
      
    } catch (error) {
      setShowCamera(false);
      setCameraReady(false);
      
      // Mensajes de error específicos según el tipo
      let errorMessage = 'No se pudo acceder a la cámara. ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Debes permitir el acceso a la cámara en tu navegador.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Tu navegador no soporta esta funcionalidad.';
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
    }
  };

  /**
   * Toma una foto usando la cámara
   */
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      alert('Error: No se pudo acceder al video o canvas');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Verificar que el video esté listo
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('La cámara aún no esta lista, intentalo de nuevo.');
      return;
    }
    
    // Capturar imagen del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Crear archivo y agregar a la lista de fotos
    const fileName = `camera_photo_${Date.now()}.jpg`;
    const file = dataURLtoFile(imageDataUrl, fileName);
    
    const newPhoto = {
      id: Date.now() + Math.random(),
      url: imageDataUrl,
      file: file,
      type: 'camera'
    };
    
    setPhotos(prev => [...prev, newPhoto]);
    stopCamera();
  };

  /**
   * Detiene la cámara y libera recursos
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
    setCameraReady(false);
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
    
    // Detener cámara si está activa
    if (showCamera) {
      stopCamera();
    }
    
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
                onClick={startCamera}
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

      {/* Modal de cámara */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tomar foto</h3>
              <button
                onClick={stopCamera}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onCanPlay={() => {
                    setCameraReady(true);
                  }}
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-800 bg-opacity-75">
                    <div className="text-center">
                      <Camera size={48} className="mx-auto mb-2" />
                      <p>Activando cámara...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={takePhoto}
                  disabled={!cameraReady}
                  className="flex-1 bg-slate-600 text-white py-4 px-4 rounded-2xl hover:bg-slate-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tomar foto
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-gray-300 text-gray-700 py-4 px-4 rounded-2xl hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Estado: {cameraReady ? 'cámara lista' : 'Cargando cámara...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas oculto para captura de fotos */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default NewConsultation;