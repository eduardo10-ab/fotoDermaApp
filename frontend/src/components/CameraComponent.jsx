import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';

/**
 * Componente de cámara que permite capturar fotos desde el dispositivo
 * Soporta cambio entre cámara frontal y trasera en dispositivos móviles
 * Responsivo: usa 80% del viewport en desktop/tablet, modal completo en móvil
 */
const CameraComponent = ({ onCapture, onClose }) => {
  const [facingMode, setFacingMode] = useState('environment'); // 'user' = frontal, 'environment' = trasera
  const [cameraReady, setCameraReady] = useState(false);
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Inicializar o cambiar la cámara
  const startCamera = async (newFacingMode = facingMode) => {
    try {
      // Detener stream anterior si existe para evitar conflictos
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      setCameraReady(false);
      
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: newFacingMode
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.oncanplay = () => {
          setCameraReady(true);
          setSwitchingCamera(false);
        };
      }
      
    } catch (error) {
      setCameraReady(false);
      setSwitchingCamera(false);
      
      // Mostrar mensajes de error específicos según el tipo
      let errorMessage = 'No se pudo acceder a la cámara. ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Debes permitir el acceso a la cámara.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No se encontró cámara en el dispositivo.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'La cámara solicitada no está disponible.';
      }
      alert(errorMessage);
    }
  };

  // Alternar entre cámara frontal y trasera
  const switchCamera = async () => {
    setSwitchingCamera(true);
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    await startCamera(newFacingMode);
  };

  // Capturar foto desde el video stream
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      alert('La cámara no está lista');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dibujar frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir canvas a imagen base64
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Convertir dataURL a archivo File para compatibilidad
    const dataURLtoFile = (dataUrl, filename) => {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    };

    const filename = `camera-${Date.now()}.jpg`;
    const file = dataURLtoFile(imageDataUrl, filename);
    
    // Crear objeto con información de la foto capturada
    const photoObject = {
      id: Date.now() + Math.random(),
      url: imageDataUrl,
      file: file,
      type: 'camera',
      facingMode: facingMode
    };
    
    onCapture(photoObject);
    stopCamera();
  };

  // Detener cámara y cerrar componente
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  // Inicializar cámara al montar el componente
  useEffect(() => {
    startCamera();
    
    // Cleanup: detener cámara al desmontar
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4">
      {/* Contenedor responsivo */}
      <div className="bg-white rounded-lg w-full h-full sm:w-[80vw] sm:h-auto sm:max-w-4xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-semibold">
            Cámara {facingMode === 'user' ? 'Frontal' : 'Trasera'}
          </h3>
          <button
            onClick={stopCamera}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Contenido principal - ocupa el espacio restante */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 sm:min-h-0">
          {/* Contenedor del video stream - se expande para ocupar el espacio disponible */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden h-[70vh] sm:h-96" style={{ aspectRatio: 'auto' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Overlay de carga mientras se inicializa la cámara */}
            {(!cameraReady || switchingCamera) && (
              <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-800 bg-opacity-75">
                <div className="text-center">
                  <Camera size={48} className="mx-auto mb-2" />
                  <p className="text-sm sm:text-base">
                    {switchingCamera ? 'Cambiando cámara...' : 'Activando cámara...'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Botón para alternar cámara */}
            {cameraReady && !switchingCamera && (
              <button
                onClick={switchCamera}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 sm:p-3 rounded-full hover:bg-opacity-70 transition-opacity"
                title="Cambiar cámara"
              >
                <RotateCcw size={20} />
              </button>
            )}
          </div>
          
          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-shrink-0">
            <button
              onClick={takePhoto}
              disabled={!cameraReady || switchingCamera}
              className="flex-1 bg-slate-600 text-white py-3 sm:py-5 px-4 rounded-2xl hover:bg-slate-800  transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tomar foto
            </button>


            <button
              onClick={stopCamera}
              className="flex-1 border-slate-400 text-slate-600 py-3 sm:py-3 px-4 rounded-2xl hover:bg-gray-400 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
          
          {/* Información del estado de la cámara */}
          <div className="text-xs sm:text-sm text-gray-500 text-center flex-shrink-0">
            Cámara: {facingMode === 'user' ? 'Frontal' : 'Trasera'} | 
            Estado: {cameraReady ? 'Lista' : 'Cargando...'}
          </div>
        </div>
      </div>
      
      {/* Canvas oculto para procesar la captura */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraComponent;