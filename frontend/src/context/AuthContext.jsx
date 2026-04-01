import { createContext, useState, useContext, useEffect } from 'react';
import { login as loginAPI, register as registerAPI, getMe } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserState(parsedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // Listen for storage events (when other tabs change localStorage)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            const newUser = JSON.parse(e.newValue);
            setUserState(newUser);
          } catch (e) {
            setUserState(null);
          }
        } else {
          setUserState(null);
        }
      }
      if (e.key === 'token' && !e.newValue) {
        setUserState(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadUser = async () => {
    try {
      const { data } = await getMe();
      setUserState(data);
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Load user error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUserState(null);
      return null;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const { data } = await loginAPI({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setUserState(data);
      return { success: true, user: data };
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      setError(null);
      const { data } = await registerAPI({ name, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setUserState(data);
      return { success: true, user: data };
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserState(null);
  };

  const setUser = (updatedUser) => {
    setUserState(updatedUser);
    const currentToken = localStorage.getItem('token');
    localStorage.setItem('user', JSON.stringify({ ...updatedUser, token: currentToken }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout,
      setUser,
      loadUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};