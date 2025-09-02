import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { testBackendConnection } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [token, setToken] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);

  // Probar conexión con el backend al inicializar
  useEffect(() => {
    const checkBackendConnection = async () => {
      const result = await testBackendConnection();
      setBackendStatus(result);
      
      if (!result.success) {
        console.warn('⚠️ Backend no disponible:', result.error);
      }
    };

    checkBackendConnection();
  }, []);

  // Cargar cuentas guardadas del localStorage
  useEffect(() => {
    const loadSavedAccounts = () => {
      try {
        const accounts = localStorage.getItem('fotoderma_saved_accounts');
        if (accounts) {
          const parsedAccounts = JSON.parse(accounts);
          setSavedAccounts(Array.isArray(parsedAccounts) ? parsedAccounts : []);
        }
      } catch (error) {
        console.error('Error loading saved accounts:', error);
        setSavedAccounts([]);
      }
    };

    loadSavedAccounts();
  }, []);

  // Función para obtener y guardar el token de Firebase
  const updateFirebaseToken = async (firebaseUser) => {
    if (firebaseUser) {
      try {
        console.log('🔑 Obteniendo token de Firebase...');
        const idToken = await firebaseUser.getIdToken();
        console.log('✅ Token obtenido exitosamente');
        
        // Guardar token en estado y localStorage
        setToken(idToken);
        localStorage.setItem('firebaseToken', idToken);
        
        return idToken;
      } catch (error) {
        console.error('❌ Error obteniendo token:', error);
        return null;
      }
    } else {
      // Limpiar token si no hay usuario
      setToken(null);
      localStorage.removeItem('firebaseToken');
      return null;
    }
  };

  // Guardar cuenta en localStorage
  const saveAccountToStorage = (user) => {
    try {
      const accountData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: new Date().toISOString()
      };

      const currentAccounts = JSON.parse(localStorage.getItem('fotoderma_saved_accounts') || '[]');
      
      // Verificar si la cuenta ya existe
      const existingIndex = currentAccounts.findIndex(acc => acc.uid === user.uid);
      
      if (existingIndex >= 0) {
        // Actualizar cuenta existente
        currentAccounts[existingIndex] = { ...currentAccounts[existingIndex], ...accountData };
      } else {
        // Agregar nueva cuenta
        currentAccounts.push(accountData);
      }

      // Limitar a máximo 5 cuentas
      const limitedAccounts = currentAccounts.slice(0, 5);
      
      localStorage.setItem('fotoderma_saved_accounts', JSON.stringify(limitedAccounts));
      setSavedAccounts(limitedAccounts);
      
      console.log('Cuenta guardada exitosamente');
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      saveAccountToStorage(result.user);
      
      // Obtener token después del login exitoso
      await updateFirebaseToken(result.user);
      
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      saveAccountToStorage(result.user);
      
      // Obtener token después del login exitoso
      await updateFirebaseToken(result.user);
      
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Cambiar a otra cuenta guardada
  const switchAccount = async (accountData) => {
    try {
      // Si es la misma cuenta actual, no hacer nada
      if (user && user.uid === accountData.uid) {
        return { success: true, message: 'Ya estás usando esta cuenta' };
      }

      console.log('Cambiando a cuenta:', accountData.email);

      // Cerrar sesión actual
      await signOut(auth);

      // Simular un delay para mejor UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirigir al login con parámetros para autologin
      const loginUrl = `/login?switch_account=${encodeURIComponent(accountData.email)}&uid=${accountData.uid}`;
      window.location.href = loginUrl;
      
      return { success: true };
    } catch (error) {
      console.error('Error switching account:', error);
      return { success: false, error: error.message };
    }
  };

  // Remover cuenta de la lista guardada
  const removeAccount = (uid) => {
    try {
      const updatedAccounts = savedAccounts.filter(acc => acc.uid !== uid);
      localStorage.setItem('fotoderma_saved_accounts', JSON.stringify(updatedAccounts));
      setSavedAccounts(updatedAccounts);
      return { success: true };
    } catch (error) {
      console.error('Error removing account:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      // Limpiar token antes de cerrar sesión
      setToken(null);
      localStorage.removeItem('firebaseToken');
      
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Filtrar cuentas guardadas para excluir la cuenta actual
  const getFilteredSavedAccounts = () => {
    if (!user) return savedAccounts;
    return savedAccounts.filter(account => account.uid !== user.uid);
  };

  // Función para refrescar el token (útil si expira)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refreshToken = async () => {
      if (auth.currentUser) {
        return await updateFirebaseToken(auth.currentUser);
      }
      return null;
    };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      if (firebaseUser) {
        // Actualizar información de la cuenta cuando el usuario cambia
        saveAccountToStorage(firebaseUser);
        
        // Obtener y guardar el token
        await updateFirebaseToken(firebaseUser);
      } else {
        // Limpiar token si no hay usuario
        await updateFirebaseToken(null);
      }
      
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Configurar refresh automático del token cada 50 minutos (antes de que expire)
  useEffect(() => {
    let tokenRefreshInterval;

    if (user) {
      tokenRefreshInterval = setInterval(async () => {
        console.log('🔄 Refreshing Firebase token...');
        await refreshToken();
      }, 50 * 60 * 1000); // 50 minutos
    }

    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [user, refreshToken]);

  const value = {
    user,
    token,
    loading,
    savedAccounts: getFilteredSavedAccounts(),
    backendStatus,
    login,
    loginWithGoogle,
    logout,
    switchAccount,
    removeAccount,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};