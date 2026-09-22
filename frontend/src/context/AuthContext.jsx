import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('artisan_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('artisan_token') || null;
  });

  const [isOnboarded, setIsOnboarded] = useState(() => {
    return localStorage.getItem('artisan_onboarded') === 'true';
  });

  const isAuthenticated = !!token && !!user;

  const persistAuth = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('artisan_user', JSON.stringify(userData));
    localStorage.setItem('artisan_token', accessToken);
  };

  const register = useCallback(async ({ username, password, full_name, age, gender, craft_type, state, annual_income }) => {
    const res = await axios.post(`${API_URL}/auth/register`, {
      username,
      password,
      full_name,
      age: parseInt(age),
      gender,
      craft_type,
      state,
      annual_income: parseFloat(annual_income) || 0,
    });

    const { access_token, user_id, full_name: name } = res.data;
    const userData = {
      id: user_id,
      full_name: name,
      username,
      craft_type,
      state,
      gender,
      age: parseInt(age),
      annual_income: parseFloat(annual_income) || 0,
    };
    persistAuth(userData, access_token);
    return userData;
  }, []);

  const login = useCallback(async ({ username, password }) => {
    const res = await axios.post(`${API_URL}/auth/login`, { username, password });
    const { access_token, user_id, full_name } = res.data;
    const userData = { id: user_id, full_name, username };
    persistAuth(userData, access_token);
    return userData;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsOnboarded(false);
    localStorage.removeItem('artisan_user');
    localStorage.removeItem('artisan_token');
    localStorage.removeItem('artisan_onboarded');
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsOnboarded(true);
    localStorage.setItem('artisan_onboarded', 'true');
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isOnboarded,
      register,
      login,
      logout,
      completeOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
