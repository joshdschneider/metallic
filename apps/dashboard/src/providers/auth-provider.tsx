import { UserObject } from '@metallichq/types';
import { AxiosError } from 'axios';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { SERVER_URL } from '../utils/constants';
import { captureException } from '../utils/error';

interface AuthContextType {
  user: UserObject | null;
  setUser: (user: UserObject | null) => void;
  loading: boolean;
  getOauthUrl: (provider: string) => Promise<string>;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<UserObject>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserObject | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get<UserObject>('/web/auth/me');
      setUser(data);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        setUser(null);
      } else {
        captureException(err);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const getOauthUrl = async (provider: string): Promise<string> => {
    const { data } = await api.get<{ oauth_url: string }>(`/web/auth/oauth-url?provider=${provider}`);
    return data.oauth_url;
  };

  const sendCode = async (email: string): Promise<void> => {
    await api.post('/web/auth/send-code', { email });
  };

  const verifyCode = async (email: string, code: string): Promise<UserObject> => {
    const { data } = await api.post<UserObject>('/web/auth/verify-code', { email, code });
    await checkAuth();
    return data;
  };

  const logout = async (): Promise<void> => {
    window.location.replace(`${SERVER_URL}/web/auth/logout`);
  };

  const refreshUser = useCallback(async (): Promise<void> => {
    await checkAuth();
  }, [checkAuth]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      getOauthUrl,
      sendCode,
      verifyCode,
      logout,
      refreshUser,
      isAuthenticated: !!user
    }),
    [user, loading, refreshUser]
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
