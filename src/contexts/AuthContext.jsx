/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useQueryClient } from '@tanstack/react-query';

import apiClient, {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../services/apiClient';

const USER_STORAGE_KEY = 'kadcoda_auth_user';

const readStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStoredUser = (user) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
};

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(() => Boolean(getAccessToken()));

  const updateUserState = useCallback((nextUser) => {
    setUser(nextUser);
    writeStoredUser(nextUser);
  }, []);

  const login = useCallback(
    (authPayload) => {
      const token = authPayload?.access_token || authPayload?.token;
      const nextUser = authPayload?.user || null;

      if (token) {
        setAccessToken(token);
      }
      if (nextUser) {
        updateUserState(nextUser);
      }
    },
    [updateUserState],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Proceed with client state cleanup even if network call fails
    } finally {
      clearAccessToken();
      updateUserState(null);
      queryClient.clear();
    }
  }, [queryClient, updateUserState]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    let isMounted = true;

    const verifyCurrentSession = async () => {
      try {
        const response = await apiClient.get('/user/profile');
        if (isMounted && response.data?.user) {
          updateUserState(response.data.user);
        }
      } catch {
        if (isMounted) {
          clearAccessToken();
          updateUserState(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifyCurrentSession();

    return () => {
      isMounted = false;
    };
  }, [updateUserState]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAccessToken();
      updateUserState(null);
      queryClient.clear();
    };

    window.addEventListener('kadcoda:auth-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('kadcoda:auth-expired', handleSessionExpired);
    };
  }, [queryClient, updateUserState]);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      isAuthenticated: Boolean(user && getAccessToken()),
      isLoading,
      login,
      logout,
      updateUser: updateUserState,
    }),
    [user, isLoading, login, logout, updateUserState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext, AuthProvider, useAuth };
export default AuthContext;
