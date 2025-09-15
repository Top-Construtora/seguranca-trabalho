import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'avaliador';
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('@SST:token');
      const savedUser = localStorage.getItem('@SST:user');

      if (token) {
        api.defaults.headers.authorization = `Bearer ${token}`;

        // Se temos um usuário salvo, use-o imediatamente como fallback
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (error) {
            console.error('Erro ao parsear usuário salvo:', error);
          }
        }

        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
          // Atualizar localStorage com dados mais recentes
          localStorage.setItem('@SST:user', JSON.stringify(response.data));
        } catch {
          // Se falhar ao buscar dados atualizados, manter usuário do localStorage se existir
          if (!savedUser) {
            localStorage.removeItem('@SST:token');
            localStorage.removeItem('@SST:user');
            setUser(null);
          }
        }
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;

      localStorage.setItem('@SST:token', access_token);
      localStorage.setItem('@SST:user', JSON.stringify(user));

      api.defaults.headers.authorization = `Bearer ${access_token}`;

      setUser(user);
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Erro ao fazer login',
        description: 'Verifique suas credenciais e tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = () => {
    localStorage.removeItem('@SST:token');
    localStorage.removeItem('@SST:user');

    delete api.defaults.headers.authorization;

    setUser(null);
    navigate('/login');
  };

  const refreshUser = () => {
    const savedUser = localStorage.getItem('@SST:user');
    if (savedUser && !user) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Erro ao recuperar usuário do localStorage:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}