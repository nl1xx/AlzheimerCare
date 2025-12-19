import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = async (phone, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { phone, password });
      setUser(res.data.user);
      setToken(res.data.token);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (phone, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { phone, password });
      // Auto login after register
      setToken(res.data.token);
      // We need to fetch user details or just set basic info
      setUser({ phone, id: res.data.userId });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
