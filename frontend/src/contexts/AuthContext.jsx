import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI as api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await api.validateToken();
        if (data.success) {
          setUser(data.data.user);
        } else {
          localStorage.removeItem('authToken');
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem('authToken');
    if (token) checkAuth();
    else setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await api.login(credentials);
    if (data.success && data.data?.access_token) {
      localStorage.setItem('authToken', data.data.access_token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      setUser(data.data.user);
      navigate('/try-it');
    }
    return data;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    if (data.success && data.data?.access_token) {
      localStorage.setItem('authToken', data.data.access_token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      setUser(data.data.user);
      navigate('/try-it');
    }
    return data;
  };

  const adminLogin = async (credentials) => {
    const data = await api.adminLogin(credentials);
    if (data.success && data.data?.access_token) {
      localStorage.setItem('authToken', data.data.access_token);
      localStorage.setItem('adminUser', JSON.stringify(data.data.admin));
      setUser(data.data.admin);
      navigate('/admin/dashboard');
    }
    return data;
  };

  const adminRegister = async (adminData) => {
    const data = await api.adminRegister(adminData);
    if (data.success) {
      // Logic from AdminSignup.jsx - usually doesn't auto-login unless token is returned
      if (data.data?.access_token) {
        localStorage.setItem('authToken', data.data.access_token);
        localStorage.setItem('adminUser', JSON.stringify(data.data.admin));
        setUser(data.data.admin);
        navigate('/admin/dashboard');
      }
    }
    return data;
  };

  const logout = async () => {
    // Clear HttpOnly cookie via backend
    try {
      await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error('Logout endpoint error:', e);
    }

    // Clear localStorage fallback
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, adminLogin, adminRegister, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;