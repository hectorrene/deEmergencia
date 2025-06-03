import React, { createContext, ReactNode, useCallback, useContext, useEffect, useReducer } from 'react';
import { AuthResponse, authService, ChangePasswordData, LoginData, RegisterData, UpdateProfileData, User } from '../services/AuthService';

// Tipos para el estado de autenticación
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

// Tipos para las acciones del reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token?: string } }
  | { type: 'AUTH_FAILURE'; payload: { error: string } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: { user: User } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'AUTH_COMPLETE_WITHOUT_USER' }; // Corregido: sin punto y coma extra

// Tipos para el contexto
interface AuthContextType {
  // Estado
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  
  // Métodos
  login: (credentials: LoginData) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateProfile: (profileData: UpdateProfileData) => Promise<AuthResponse>;
  changePassword: (passwordData: ChangePasswordData) => Promise<AuthResponse>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  getCurrentUser: () => User | null;
}

// Estado inicial
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
};

// Variable global para almacenar el usuario actual
let globalCurrentUser: User | null = null;

// Constantes para el almacenamiento del token
const TOKEN_STORAGE_KEY = 'auth_token';

// Funciones helper para manejo del token con manejo de errores mejorado
const saveToken = (token: string): boolean => {
  try {
    // Verificar si localStorage está disponible
    if (typeof Storage === 'undefined' || !window.localStorage) {
      console.warn('⚠️ AuthContext: localStorage not available, token not saved');
      return false;
    }
    
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    console.log('💾 AuthContext: Token saved successfully');
    return true;
  } catch (error) {
    console.error('❌ AuthContext: Error saving token:', error);
    return false;
  }
};

const getToken = (): string | null => {
  try {
    // Verificar si localStorage está disponible
    if (typeof Storage === 'undefined' || !window.localStorage) {
      console.warn('⚠️ AuthContext: localStorage not available, returning null token');
      return null;
    }
    
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    console.log('🔍 AuthContext: Retrieved token:', token ? 'Token exists' : 'No token');
    return token;
  } catch (error) {
    console.error('❌ AuthContext: Error retrieving token:', error);
    return null;
  }
};

const removeToken = (): boolean => {
  try {
    // Verificar si localStorage está disponible
    if (typeof Storage === 'undefined' || !window.localStorage) {
      console.warn('⚠️ AuthContext: localStorage not available, token not removed');
      return false;
    }
    
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    console.log('🗑️ AuthContext: Token removed successfully');
    return true;
  } catch (error) {
    console.error('❌ AuthContext: Error removing token:', error);
    return false;
  }
};

// Reducer para manejar el estado de autenticación
function authReducer(state: AuthState, action: AuthAction): AuthState {
  console.log('🔄 AuthContext: Reducer action:', action.type);

  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      // Actualizar referencia global
      globalCurrentUser = action.payload.user;
      
      // Guardar token si se proporciona
      if (action.payload.token) {
        saveToken(action.payload.token);
      }
      
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        error: null,
      };

    case 'AUTH_FAILURE':
      // Limpiar referencias globales y token
      globalCurrentUser = null;
      removeToken();
      
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: action.payload.error,
      };

    case 'AUTH_LOGOUT':
      // Limpiar referencias globales y token
      globalCurrentUser = null;
      removeToken();
      
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      };

    case 'AUTH_COMPLETE_WITHOUT_USER':
      globalCurrentUser = null;
      
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      };

    case 'UPDATE_USER':
      // Actualizar referencia global
      globalCurrentUser = action.payload.user;
      
      return {
        ...state,
        user: action.payload.user,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      console.warn('⚠️ AuthContext: Unknown action type:', action);
      return state;
  }
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Memoizar la función de verificación para evitar recreaciones innecesarias
  const checkExistingAuth = useCallback(async () => {
    try {
      console.log('🔍 AuthContext: Starting checkExistingAuth');
      dispatch({ type: 'AUTH_START' });

      // Verificar si hay token disponible
      const hasToken = await authService.hasToken();
      console.log('🔍 AuthContext: AuthService has token result:', hasToken);

      if (!hasToken) {
        console.log('ℹ️ AuthContext: No token available, completing without authentication');
        dispatch({ type: 'AUTH_COMPLETE_WITHOUT_USER' });
        return;
      }

      // Validar token existente
      console.log('🔍 AuthContext: Token exists, validating...');
      const response = await authService.validateToken();
      console.log('🔍 AuthContext: Token validation response:', response);

      if (response.success && response.user) {
        console.log('✅ AuthContext: Token validation successful');
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.user } });
      } else {
        console.log('❌ AuthContext: Token validation failed');
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: response.message || 'Token inválido o expirado' } 
        });
      }
    } catch (error) {
      console.error('❌ AuthContext: Error in checkExistingAuth:', error);
      dispatch({ 
        type: 'AUTH_FAILURE', 
        payload: { error: 'Error al verificar autenticación' } 
      });
    }
  }, []); // Sin dependencias porque no usa variables externas

  // Verificar token existente solo una vez al montar
  useEffect(() => {
    console.log('🔄 AuthContext: useEffect triggered - checking existing auth');
    checkExistingAuth();
  }, [checkExistingAuth]); // Dependencia de la función memoizada

  // Función de login
  const login = useCallback(async (credentials: LoginData): Promise<AuthResponse> => {
    try {
      console.log('🔑 AuthContext: Starting login for:', credentials.email);
      dispatch({ type: 'AUTH_START' });

      const response = await authService.login(credentials);
      console.log('🔑 AuthContext: Login response success:', response.success);

      if (response.success && response.user) {
        console.log('✅ AuthContext: Login successful');
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { 
            user: response.user,
            token: response.token 
          }
        });
      } else {
        console.log('❌ AuthContext: Login failed');
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: response.message || 'Error en el login' } 
        });
      }

      return response;
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      const errorMessage = 'Error durante el login';
      dispatch({ type: 'AUTH_FAILURE', payload: { error: errorMessage } });
      return { success: false, message: errorMessage };
    }
  }, []);

  // Función de registro
  const register = useCallback(async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      console.log('📝 AuthContext: Starting registration for:', userData.email);
      dispatch({ type: 'AUTH_START' });

      const response = await authService.register(userData);
      console.log('📝 AuthContext: Registration response success:', response.success);

      if (response.success && response.user) {
        console.log('✅ AuthContext: Registration successful');
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { 
            user: response.user,
            token: response.token 
          }
        });
      } else {
        console.log('❌ AuthContext: Registration failed');
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: response.message || 'Error en el registro' } 
        });
      }

      return response;
    } catch (error) {
      console.error('❌ AuthContext: Registration error:', error);
      const errorMessage = 'Error durante el registro';
      dispatch({ type: 'AUTH_FAILURE', payload: { error: errorMessage } });
      return { success: false, message: errorMessage };
    }
  }, []);

  // Función de logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log('🚪 AuthContext: Starting logout');
      await authService.logout();
      console.log('✅ AuthContext: Logout successful');
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('❌ AuthContext: Error during logout:', error);
      // Forzar logout local aunque falle el servidor
      console.log('🚪 AuthContext: Forcing local logout');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Actualizar perfil
  const updateProfile = useCallback(async (profileData: UpdateProfileData): Promise<AuthResponse> => {
    try {
      console.log('📝 AuthContext: Updating profile');
      const response = await authService.updateProfile(profileData);
      console.log('📝 AuthContext: Update profile response success:', response.success);

      if (response.success && response.user) {
        console.log('✅ AuthContext: Profile update successful');
        dispatch({ type: 'UPDATE_USER', payload: { user: response.user } });
      }

      return response;
    } catch (error) {
      console.error('❌ AuthContext: Update profile error:', error);
      const errorMessage = 'Error al actualizar perfil';
      return { success: false, message: errorMessage };
    }
  }, []);

  // Cambiar contraseña
  const changePassword = useCallback(async (passwordData: ChangePasswordData): Promise<AuthResponse> => {
    try {
      console.log('🔒 AuthContext: Changing password');
      const response = await authService.changePassword(passwordData);
      console.log('🔒 AuthContext: Change password response success:', response.success);
      return response;
    } catch (error) {
      console.error('❌ AuthContext: Change password error:', error);
      const errorMessage = 'Error al cambiar contraseña';
      return { success: false, message: errorMessage };
    }
  }, []);

  // Refrescar información del usuario
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 AuthContext: Refreshing user data');
      const response = await authService.getProfile();
      console.log('🔄 AuthContext: Refresh user response success:', response.success);
      
      if (response.success && response.user) {
        console.log('✅ AuthContext: User refresh successful');
        dispatch({ type: 'UPDATE_USER', payload: { user: response.user } });
      }
    } catch (error) {
      console.error('❌ AuthContext: Error refreshing user:', error);
    }
  }, []);

  // Obtener usuario actual
  const getCurrentUser = useCallback((): User | null => {
    return state.user;
  }, [state.user]);

  // Limpiar errores
  const clearError = useCallback(() => {
    console.log('🧹 AuthContext: Clearing error');
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Valor del contexto memoizado
  const contextValue: AuthContextType = React.useMemo(() => ({
    // Estado
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user: state.user,
    error: state.error,
    
    // Métodos
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    refreshUser,
    getCurrentUser,
  }), [
    state.isAuthenticated,
    state.isLoading,
    state.user,
    state.error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    refreshUser,
    getCurrentUser
  ]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

// Función helper para obtener el usuario actual desde fuera del contexto de React
export const getCurrentUserGlobal = (): User | null => {
  return globalCurrentUser;
};

// Función helper para obtener el token desde fuera del contexto de React
export const getTokenGlobal = (): string | null => {
  return getToken();
};

export default AuthContext;