import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Camera, X, CheckCircle, XCircle } from 'lucide-react';
import { patientsAPI } from '../services/api-fixed';
import { uploadImage } from '../services/firebase-storage';
import { auth } from '../services/firebase';
import { signInAnonymously } from 'firebase/auth';
import CameraComponent from '../components/CameraComponent';

console.log('Métodos disponibles:', Object.keys(patientsAPI));

const NewPatient = () => {
  const navigate = useNavigate();
  
  // Estados principales del formulario
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    disease: '',
    consultationDate: ''
  });
  const [diagnosis, setDiagnosis] = useState('');
  const [photos, setPhotos] = useState([]);
  
  // Estados para la cámara
  const [showCamera, setShowCamera] = useState(false);
  
  // Estados para la notificación
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'success', // 'success' | 'error'
    message: ''
  });
  
  // Referencias para elementos DOM
  const fileInputRef = useRef(null);

  // Componente de notificación integrado
  const NotificationModal = ({ isVisible, type, message, onClose, duration = 5000 }) => {
    useEffect(() => {
      if (isVisible && duration > 0) {
        const timer = setTimeout(() => {
          onClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const isSuccess = type === 'success';
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full transform transition-all duration-300 ease-in-out scale-100">
          {/* Botón cerrar */}
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Contenido de la notificación */}
          <div className="text-center">
            {/* Icono */}
            <div className="flex justify-center mb-4">
              {isSuccess ? (
                <CheckCircle 
                  size={48} 
                  className="text-slate-600" 
                />
              ) : (
                <XCircle 
                  size={48} 
                  className="text-red-500" 
                />
              )}
            </div>
            
            {/* Mensaje */}
            <p className="text-lg font-medium text-gray-800 mb-6">
              {message}
            </p>
            
            {/* Botón de acción */}
            <button
              onClick={onClose}
              className={`w-full px-6 py-3 rounded-xl font-medium transition-colors ${
                isSuccess
                  ? 'bg-slate-600 text-white hover:bg-slate-500'
                  : 'bg-red-900 text-white hover:bg-red-700'
              }`}
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Muestra una notificación
   */
  const showNotification = (type, message) => {
    setNotification({
      isVisible: true,
      type,
      message
    });
  };

  /**
   * Cierra la notificación
   */
  const closeNotification = () => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  /**
   * Asegura que el usuario esté autenticado antes de realizar operaciones
   * Si no hay usuario autenticado, realiza login anónimo
   */
  const ensureAuth = async () => {
    try {
      if (!auth.currentUser) {
        const result = await signInAnonymously(auth);
        // Espera un segundo para asegurar que la autenticación se complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        return result.user;
      }
      return auth.currentUser;
    } catch (error) {
      throw new Error('No se pudo autenticar: ' + error.message);
    }
  };

  /**
   * Maneja los cambios en los campos del formulario
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Cancela la creación del paciente y reinicia el formulario
   * Limpia todos los estados
   */
  const handleCancel = () => {
    // Resetea el formulario a su estado inicial
    setFormData({
      firstName: '',
      lastName: '',
      age: '',
      disease: '',
      consultationDate: ''
    });
    
    setDiagnosis('');
    setPhotos([]);
    setShowCamera(false);
    
    // Limpia el input de archivos
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    navigate('/new-patient');
  };

  /**
   * Maneja la subida de archivos desde el sistema de archivos
   * Procesa múltiples archivos de imagen seleccionados
   */
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // Solo procesa archivos de imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newPhoto = {
            id: Date.now() + Math.random(), // ID único para cada foto
            url: event.target.result, // URL para mostrar la imagen
            file: file, // Archivo original para subir
            type: 'upload' // Tipo para identificar origen
          };
          setPhotos(prev => [...prev, newPhoto]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Limpia el input para permitir seleccionar los mismos archivos nuevamente
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
   * Sube las fotos al almacenamiento de Firebase
   * Maneja errores de conexión y permisos
   */
  const uploadPhotosToStorage = async (photos) => {
    try {
      await ensureAuth();
      
      const uploadedPhotos = [];
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        try {
          if (!photo.file) {
            continue;
          }
          
          // Configura timeout para evitar esperas indefinidas
          const uploadPromise = uploadImage(photo.file, 'patients');
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout después de 120 segundos')), 120000)
          );
          
          const imageUrl = await Promise.race([uploadPromise, timeoutPromise]);
          
          uploadedPhotos.push({
            id: photo.id,
            url: imageUrl,
            type: photo.type,
            uploadedAt: new Date().toISOString()
          });
          
        } catch (error) {
          // Manejo de errores específicos de Firebase
          if (error.message.includes('CORS')) {
            showNotification('error', 'Error de CORS. Verifica la configuración de Firebase Storage.');
            break;
          } else if (error.message.includes('unauthorized') || error.code === 'storage/unauthorized') {
            showNotification('error', 'Error de permisos. Verifica las reglas de Firebase Storage.');
            break;
          }
          
          // Continúa con las demás fotos si una falla
          continue;
        }
      }
      
      return uploadedPhotos;
      
    } catch (error) {
      throw error;
    }
  };

  /**
   * Envía el formulario y crea el nuevo paciente
   * Maneja la subida de fotos y la creación del registro
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await ensureAuth();

      let uploadedPhotos = [];
      
      // Sube las fotos si existen
      if (photos.length > 0) {
        try {
          uploadedPhotos = await uploadPhotosToStorage(photos);
        } catch (uploadError) {
          uploadedPhotos = [];
          showNotification('error', 'No se pudieron subir las fotos, pero se creará el paciente sin imágenes.');
        }
      }

      /**
       * Formatea la fecha para el backend
       * Convierte fecha simple a formato ISO completo
       */
      const formatDateForBackend = (dateString) => {
        if (!dateString) return null;
        
        // Si ya viene en formato completo ISO, devolverlo
        if (dateString.includes('T') && dateString.includes('Z')) {
          return dateString;
        }
        
        // Si viene solo la fecha (YYYY-MM-DD), agregarle tiempo del mediodía
        return dateString + 'T12:00:00.000Z';
      };

      // Prepara los datos del paciente para enviar al backend
      const patientData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        age: parseInt(formData.age),
        photos: uploadedPhotos,
        photo: uploadedPhotos.length > 0 ? uploadedPhotos[0].url : null, // Primera foto como principal
        disease: formData.disease.trim(),
        consultationDate: formatDateForBackend(formData.consultationDate),
        diagnosis: diagnosis.trim()
      };
      
      const response = await patientsAPI.create(patientData);
      
      if (response.data) {
        showNotification('success', 'Expediente creado exitosamente');
        
        // Opcional: navegar después de cerrar la notificación
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error('No se recibió respuesta del servidor');
      }
    } catch (error) {
      // Manejo detallado de errores
      showNotification('error', 'No se pudo crear el expediente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen rounded-2xl max-w-5xl mx-auto" style={{ marginTop: '60px' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-center text-3xl font-bold text-gray-800 mb-8">Datos del paciente</h1>

        <form onSubmit={handleSubmit} className="rounded-xl shadow-sm p-6 space-y-6 border-none">
          {/* Campo Nombres */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Nombres del paciente *
            </label>
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Nombres"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
           />
          </div>

          {/* Campos Apellidos y Edad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Apellidos del paciente *
              </label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Apellidos"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Edad *
              </label>
              <input
                type="number"
                name="age"
                required
                min="1"
                max="120"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="Digite la edad"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>

          {/* Campos Enfermedad y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Enfermedad
              </label>
              <input
                type="text"
                name="disease"
                value={formData.disease}
                onChange={handleInputChange}
                placeholder="Ingrese el nombre de la enfermedad"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Fecha de consulta
              </label>
              <input
                type="date"
                name="consultationDate"
                value={formData.consultationDate}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]} // No permite fechas futuras
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-600"
              />
            </div>
          </div>

          {/* Campo Diagnóstico */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Diagnóstico
            </label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Ingrese el diagnóstico del paciente"
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none"
            />
          </div>

          {/* Sección de fotos */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-700 mt-9 mb-4">
              Agregar fotos del paciente
            </h3>
            
            {/* Input oculto para seleccionar archivos */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            
            {/* Botones para agregar fotos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-9">
              <button
                type="button"
                onClick={openCamera}
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-6 py-5 text-white rounded-2xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#233F4C' }}
              >
                <Camera size={20} />
                <span>Tomar foto</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center text-[#233F4C] justify-center space-x-2 px-6 py-5 border-2 [border-color:#233F4C] rounded-2xl hover:bg-teal-50 transition-colors disabled:opacity-50"
              >
                <Upload size={20} />
                <span>Subir foto</span>
              </button>
            </div>

            {/* Mostrar fotos agregadas */}
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
                        alt="Foto del paciente"
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      {/* Botón para eliminar foto */}
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        disabled={loading}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                      >
                        <X size={14} />
                      </button>
                      {/* Etiqueta del tipo de foto */}
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {photo.type === 'camera' ? 'Cámara' : 'Subida'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-6 border-t border-gray-200 mt-9"> 
            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="w-full sl:w-auto border-2 bg-gray-100 text-[#233F4C] px-8 py-5 rounded-2xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 order-2 sm:order-1"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full sl:w-auto hover:bg-slate-700 text-white font-semibold px-8 py-5 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                style={{ backgroundColor: '#233F4C' }}
              >
                {loading ? 'Guardando...' : 'Crear expediente'}
              </button>
            </div>
          </div>
            
          {/* Indicador de carga */}
          {loading && (
            <div className="text-center text-sm text-gray-600">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-900 mr-2"></div>
                Procesando datos y subiendo imágenes...
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Componente de cámara */}
      {showCamera && (
        <CameraComponent
          onCapture={handleCameraCapture}
          onClose={closeCamera}
        />
      )}

      {/* Componente de notificación integrado */}
      <NotificationModal
        isVisible={notification.isVisible}
        type={notification.type}
        message={notification.message}
        onClose={closeNotification}
      />
    </div>
  );
};

export default NewPatient;