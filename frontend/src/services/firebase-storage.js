import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import { auth } from './firebase';
import { signInAnonymously } from 'firebase/auth';

// Función para intentar autenticación anónima múltiples veces
const ensureAuthentication = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      if (!auth.currentUser) {
        console.log(`Intento ${i + 1}: Iniciando sesión anónima...`);
        await signInAnonymously(auth);
        console.log('Autenticado como:', auth.currentUser.uid);
      }
      return auth.currentUser;
    } catch (error) {
      console.error(`Error en autenticación intento ${i + 1}:`, error);
      if (i === retries - 1) {
        throw new Error('No se pudo autenticar después de varios intentos');
      }
      // Esperar un poco antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Función para validar archivos
const validateFile = (file) => {
  const validImageTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
    'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff',
    'image/heic', 'image/heif', 'image/avif'
  ];

  const isValidType = file.type && validImageTypes.includes(file.type.toLowerCase());
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'heic', 'heif', 'avif'];
  const isValidExtension = fileExtension && validExtensions.includes(fileExtension);

  if (!isValidType && !isValidExtension) {
    throw new Error(`Archivo no válido: ${file.name}. Solo se permiten imágenes.`);
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`Archivo muy grande: ${Math.round(file.size / 1024 / 1024)}MB. Máximo 10MB permitido.`);
  }

  return { isValid: true, fileExtension };
};

// Función principal para subir imágenes
export const uploadImage = async (file, folder = 'images', customName = null) => {
  try {
    console.log('=== INICIANDO SUBIDA DE IMAGEN ===');
    console.log('Archivo:', file.name, 'Tamaño:', Math.round(file.size / 1024), 'KB');
    console.log('Carpeta destino:', folder);
    
    // 1. Asegurar autenticación
    await ensureAuthentication();
    
    // 2. Validar archivo
    const { fileExtension } = validateFile(file);
    
    // 3. Crear nombre único
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileName = customName || `${timestamp}_${randomId}`;
    const fullFileName = `${fileName}.${fileExtension}`;
    const filePath = `${folder}/${fullFileName}`;
    
    console.log('Ruta del archivo:', filePath);
    
    // 4. Crear referencia y metadata
    const storageRef = ref(storage, filePath);
    
    let contentType = file.type;
    if (!contentType || contentType === '') {
      const extensionToMime = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'webp': 'image/webp', 'bmp': 'image/bmp',
        'svg': 'image/svg+xml', 'tiff': 'image/tiff', 'heic': 'image/heic'
      };
      contentType = extensionToMime[fileExtension] || 'image/jpeg';
    }

    const metadata = {
      contentType: contentType,
      cacheControl: 'public,max-age=3600',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        uploadedBy: auth.currentUser?.uid || 'anonymous',
        fileSize: file.size.toString()
      }
    };

    console.log('Metadata:', metadata);
    console.log('Iniciando subida a Firebase Storage...');
    
    // 5. Subir archivo con timeout y reintentos
    const uploadWithRetry = async (retries = 2) => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`Intento de subida ${i + 1}/${retries}`);
          
          const uploadTask = uploadBytes(storageRef, file, metadata);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: La subida tardó más de 90 segundos')), 90000)
          );

          const uploadResult = await Promise.race([uploadTask, timeoutPromise]);
          console.log('Archivo subido exitosamente');
          return uploadResult;
          
        } catch (error) {
          console.error(`Error en intento ${i + 1}:`, error);
          if (i === retries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    };

    const uploadResult = await uploadWithRetry();
    
    // 6. Obtener URL de descarga
    console.log('Obteniendo URL de descarga...');
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('URL obtenida:', downloadURL);
    
    console.log('=== SUBIDA COMPLETADA EXITOSAMENTE ===');
    return downloadURL;

  } catch (error) {
    console.error('=== ERROR EN SUBIDA DE IMAGEN ===');
    console.error('Error completo:', error);
    console.error('Stack:', error.stack);
    
    // Mejorar mensajes de error específicos
    let errorMessage = 'Error desconocido al subir imagen';
    
    if (error.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          errorMessage = 'Sin permisos para subir archivos. Verifica tu autenticación.';
          break;
        case 'storage/canceled':
          errorMessage = 'Subida cancelada por el usuario.';
          break;
        case 'storage/unknown':
          errorMessage = 'Error interno del servidor de almacenamiento.';
          break;
        case 'storage/object-not-found':
          errorMessage = 'Archivo no encontrado en el servidor.';
          break;
        case 'storage/bucket-not-found':
          errorMessage = 'Bucket de almacenamiento no encontrado.';
          break;
        case 'storage/project-not-found':
          errorMessage = 'Proyecto de Firebase no encontrado.';
          break;
        case 'storage/quota-exceeded':
          errorMessage = 'Cuota de almacenamiento excedida.';
          break;
        case 'storage/unauthenticated':
          errorMessage = 'Usuario no autenticado. Intenta recargar la página.';
          break;
        case 'storage/retry-limit-exceeded':
          errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
          break;
        default:
          errorMessage = `Error de Firebase Storage: ${error.code}`;
      }
    } else if (error.message) {
      if (error.message.includes('CORS')) {
        errorMessage = 'Error de CORS. Contacta al administrador del sistema.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
      } else if (error.message.includes('Timeout')) {
        errorMessage = 'La subida tardó demasiado. Intenta con una imagen más pequeña.';
      } else if (error.message.includes('no funciona') || error.message.includes('no válido')) {
        errorMessage = error.message;
      } else {
        errorMessage = `Error: ${error.message}`;
      }
    }

    console.error('Mensaje final de error:', errorMessage);
    throw new Error(errorMessage);
  }
};