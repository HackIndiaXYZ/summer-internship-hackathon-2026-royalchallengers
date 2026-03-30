import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('medo_veda_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
      }
    }
    setLoading(false);
  }, []);


  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { user: userData, token } = response.data;
      
      const sessionUser = {
        ...userData,
        token
      };

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(sessionUser);
      localStorage.setItem('medo_veda_user', JSON.stringify(sessionUser));
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
      const { user: userData, token } = response.data;
      const sessionUser = {
        ...userData,
        name: name || userData.name || 'User',
        token
      };

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(sessionUser);
      localStorage.setItem('medo_veda_user', JSON.stringify(sessionUser));
      return true;
    } catch (err) {
      console.error('Registration failed:', err);
      return false;
    }
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('medo_veda_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medo_veda_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
