import React, { useState, useRef } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { uploadImage } from '../services/firebase-storage';
import CameraComponent from './CameraComponent';

/**
 * Componente para subir y gestionar fotos de pacientes
 * Permite tanto subir archivos como capturar con cámara
 * Integra con Firebase Storage para almacenamiento persistente
 */
const PhotoUploader = ({ onPhotosChange, initialPhotos = [] }) => {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);

  // Manejar selección de archivos desde el input
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    processFiles(files);
  };

  // Procesar y subir archivos seleccionados
  const processFiles = async (files) => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadProgress('Validando archivos...');
    
    const newPhotos = [];
    const validFiles = [];

    // Validar que los archivos sean imágenes
    for (const file of files) {
      const isImage = file.type.startsWith('image/') || 
        /\.(jpg|jpeg|png|gif|webp|bmp|heic|heif|avif)$/i.test(file.name);
      
      if (isImage) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      alert('No se encontraron imágenes válidas');
      setUploading(false);
      setUploadProgress('');
      return;
    }

    try {
      // Subir cada archivo a Firebase Storage
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress(`Subiendo imagen ${i + 1} de ${validFiles.length}...`);
        
        try {
          const downloadURL = await uploadImage(file, 'patients');
          
          // Crear objeto de foto con metadata
          const photoObject = {
            id: `photo_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            url: downloadURL,
            filename: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            preview: URL.createObjectURL(file) // Preview local para carga rápida
          };
          
          newPhotos.push(photoObject);
          
        } catch (error) {
          alert(`Error subiendo ${file.name}: ${error.message}`);
        }
      }

      // Actualizar estado con las nuevas fotos
      if (newPhotos.length > 0) {
        const updatedPhotos = [...photos, ...newPhotos];
        setPhotos(updatedPhotos);
        onPhotosChange(updatedPhotos);
        setUploadProgress(`Se subieron ${newPhotos.length} fotos exitosamente`);
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setUploadProgress(''), 3000);
      }
      
    } catch (error) {
      alert('Error al procesar las imágenes: ' + error.message);
      setUploadProgress('Error al subir imágenes');
    } finally {
      setUploading(false);
      // Limpiar input file
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manejar captura desde cámara
  const handleCameraCapture = async (photoObject) => {
    setUploading(true);
    setUploadProgress('Subiendo foto de la cámara...');
    
    try {
      // Subir foto capturada a Firebase Storage
      const downloadURL = await uploadImage(photoObject.file, 'patients');
      
      const finalPhotoObject = {
        ...photoObject,
        url: downloadURL,
        filename: photoObject.file.name,
        size: photoObject.file.size,
        type: photoObject.file.type,
        uploadedAt: new Date().toISOString(),
      };
      
      const updatedPhotos = [...photos, finalPhotoObject];
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);
      setUploadProgress('Foto subida exitosamente');
      
      setTimeout(() => setUploadProgress(''), 3000);
      
    } catch (error) {
      alert('Error subiendo foto de cámara: ' + error.message);
      setUploadProgress('Error al subir foto');
    } finally {
      setUploading(false);
    }
  };

  // Eliminar foto de la lista
  const removePhoto = (photoId) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  // Abrir selector de archivos
  const openFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Mostrar componente de cámara
  const openCamera = () => {
    setShowCamera(true);
  };

  // Cerrar componente de cámara
  const closeCamera = () => {
    setShowCamera(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Agregar fotos del paciente</h2>
      
      {/* Botones de carga */}
      <div className="flex space-x-4 mb-6">
        <button
          type="button"
          onClick={openFileSelect}
          disabled={uploading}
          className="flex-1 border-2 border-sky-400 text-sky-600 px-6 py-4 rounded-lg font-medium hover:bg-sky-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={20} />
          <span>{uploading ? 'Subiendo...' : 'Subir foto'}</span>
        </button>
        
        <button
          type="button"
          onClick={openCamera}
          disabled={uploading}
          className="flex-1 bg-sky-500 hover:bg-sky-600 text-white px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera size={20} />
          <span>{uploading ? 'Subiendo...' : 'Tomar foto'}</span>
        </button>
      </div>

      {/* Input oculto para selección de archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Indicador de progreso de subida */}
      {uploading && (
        <div className="mb-6">
          <div className="bg-sky-200 rounded-full h-2 mb-2">
            <div className="bg-sky-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
          <p className="text-sm text-gray-600">{uploadProgress}</p>
        </div>
      )}

      {/* Mensaje de éxito */}
      {!uploading && uploadProgress && (
        <div className="mb-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {uploadProgress}
        </div>
      )}

      {/* Grid de previsualización de fotos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {photos.map((photo) => (
            <div key={photo.id} className="relative">
              <img
                src={photo.preview || photo.url}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  // Fallback a URL de Firebase si preview falla
                  e.target.src = photo.url;
                }}
              />
              {/* Botón para eliminar foto */}
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                disabled={uploading}
              >
                <X size={16} />
              </button>
              {/* Información del archivo */}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {photo.filename}
              </div>
              {/* Indicador de tipo de cámara si aplica */}
              {photo.facingMode && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {photo.facingMode === 'user' ? 'Frontal' : 'Trasera'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contador de fotos cargadas */}
      {photos.length > 0 && !uploading && (
        <p className="text-sm text-gray-600">
          Se han cargado {photos.length} foto{photos.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Componente de cámara modal */}
      {showCamera && (
        <CameraComponent
          onCapture={handleCameraCapture}
          onClose={closeCamera}
        />
      )}
    </div>
  );
};

export default PhotoUploader;