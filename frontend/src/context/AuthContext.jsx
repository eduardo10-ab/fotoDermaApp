import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Actualizar información de la cuenta cuando el usuario cambia
        saveAccountToStorage(user);
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    savedAccounts: getFilteredSavedAccounts(),
    login,
    loginWithGoogle,
    logout,
    switchAccount,
    removeAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};