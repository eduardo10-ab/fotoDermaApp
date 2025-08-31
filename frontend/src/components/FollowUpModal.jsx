import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, Upload } from 'lucide-react';
import { consultationsAPI } from '../services/api';

const FollowUpModal = ({ isOpen, onClose, originalConsultation, onSave, setSelectedConsultation, setShowFollowUpModal, setFollowUpConsultation }) => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);

  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    diagnosis: ''
  });

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no soporta el acceso a la cámara');
        return;
      }

      setShowCamera(true);
      setCameraReady(false);
      
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
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

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      alert('Error: No se pudo acceder al video o canvas');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('La cámara aún no está lista. Inténtalo de nuevo.');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
    setCameraReady(false);
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };



const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Prevenir múltiples envíos
  if (loading) {
    return;
  }
  
  setLoading(true);

  try {
    // Preparar datos del seguimiento sin formateo adicional de fecha
    const followUpData = {
      patientId: originalConsultation.patientId,
      date: formData.date, // Enviar la fecha tal como está del input date
      diagnosis: formData.diagnosis,
      originalConsultationId: originalConsultation.id
    };

    console.log('Enviando fecha de seguimiento al backend:', formData.date);

    // USAR LA FUNCIÓN ESPECÍFICA DE SEGUIMIENTO
    const response = await consultationsAPI.createFollowUp(followUpData);
    
    // Usar el ID de la consulta actualizada
    const consultationId = response.data.data.id || response.data.id;

    // Si hay fotos, subirlas a la consulta actualizada
    if (photos.length > 0 && consultationId) {
      const formDataPhotos = new FormData();
      
      // Agregar todas las fotos al FormData
      photos.forEach((photo, index) => {
        if (photo.file) {
          formDataPhotos.append('photos', photo.file);
        }
      });

      try {
        await consultationsAPI.uploadPhoto(consultationId, formDataPhotos);
        console.log('Fotos del seguimiento subidas correctamente');
      } catch (photoError) {
        console.error('Error subiendo fotos del seguimiento:', photoError);
        alert('El seguimiento se creó correctamente, pero hubo un error al subir algunas fotos.');
      }
    }

    // Llamar al callback de guardado del componente padre
    if (onSave) {
      await onSave(response.data.data || response.data);
    }
    
    // LIMPIAR ESTADOS Y NAVEGAR AL HISTORIAL PRINCIPAL
    // Limpiar estados del modal para asegurar que se muestre la vista principal
    if (setSelectedConsultation) {
      setSelectedConsultation(null);
    }
    if (setShowFollowUpModal) {
      setShowFollowUpModal(false);
    }
    if (setFollowUpConsultation) {
      setFollowUpConsultation(null);
    }
    
    // Limpiar el estado local del modal
    setFormData({
      date: '',
      diagnosis: ''
    });
    setPhotos([]);
    if (showCamera) {
      stopCamera();
    }
    
    // Cerrar modal
    if (onClose) {
      onClose();
    }
    
    // Navegar al historial principal del paciente
    navigate(`/patients/${originalConsultation.patientId}`);
    
  } catch (error) {
    console.error('Error saving follow-up:', error);
    
    let errorMessage = 'Error al guardar el seguimiento';
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
  const handleCancel = () => {
    setFormData({
      date: '', 
      diagnosis: ''
    });
    setPhotos([]);
    if (showCamera) {
      stopCamera();
    }
    // El botón cancelar solo cierra el modal sin navegación
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal principal */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 ${showCamera ? 'z-40' : 'z-50'}`}>
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Dar Seguimiento</h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Enfermedad: {originalConsultation.disease || 'No especificada'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-gray-600 font-medium mb-2">
                  Fecha de la consulta
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  placeholder="dd/mm/aaaa"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-500 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>

            <div>
              <label className="block text-gray-600 font-medium mb-2">
                Diagnóstico
              </label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                placeholder="Descripción del diagnóstico de seguimiento..."
                required
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Agregar fotos de la consulta
              </h3>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                          alt="Foto de seguimiento"
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
                          {photo.type === 'camera' ? 'Cámara' : 'Subida'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-300">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-5 border-2 border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-5 bg-slate-700 text-white rounded-2xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar seguimiento'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de cámara - con z-index más alto */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
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
                  className="flex-1 bg-slate-600 text-white py-4 px-4 rounded-2xl hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
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
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};

export default FollowUpModal;