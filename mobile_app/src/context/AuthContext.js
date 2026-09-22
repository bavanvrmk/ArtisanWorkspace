import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [fullName, setFullName] = useState(null);

  const login = async (username, password) => {
    try {
      const res = await apiClient.post('/auth/login', { username, password });
      const { access_token, user_id, full_name } = res.data;
      
      setUserToken(access_token);
      setUserId(user_id);
      setFullName(full_name);
      
      await AsyncStorage.setItem('userToken', access_token);
      await AsyncStorage.setItem('userId', String(user_id));
      await AsyncStorage.setItem('fullName', full_name);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const res = await apiClient.post('/auth/register', userData);
      const { access_token, user_id, full_name } = res.data;
      
      setUserToken(access_token);
      setUserId(user_id);
      setFullName(full_name);
      
      await AsyncStorage.setItem('userToken', access_token);
      await AsyncStorage.setItem('userId', String(user_id));
      await AsyncStorage.setItem('fullName', full_name);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    setUserId(null);
    setFullName(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('fullName');
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const id = await AsyncStorage.getItem('userId');
      const name = await AsyncStorage.getItem('fullName');
      if (token) {
        setUserToken(token);
        setUserId(id);
        setFullName(name);
      }
    } catch (e) {
      console.log(`isLogged in error ${e}`);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, register, isLoading, userToken, userId, fullName }}>
      {children}
    </AuthContext.Provider>
  );
};
