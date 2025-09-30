import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      console.log('API POST request to /api/auth/login:', { email, password });
      const data = await apiRequest('POST', '/api/auth/login', { email, password });
      console.log('Login response data:', data);
      setUser(data.user);
      localStorage.setItem('authToken', data.token || 'session-token');
      localStorage.setItem('userId', data.user.id.toString());
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
  };

  const refreshUser = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiRequest('GET', `/api/users/${userId}`);
      console.log('API GET request to /api/users/' + userId + ':', response);
      
      // Check if response is already parsed JSON or needs parsing
      let userData;
      if (response && typeof response === 'object' && response.id) {
        userData = response;
      } else if (response && response.json) {
        userData = await response.json();
      } else {
        throw new Error('Invalid response format');
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};