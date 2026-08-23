// src/context/AuthContext.js
//
// Contexto global de autenticación. Envuelve <App /> con <AuthProvider>
// (ya hecho en el App.js que te entrego). Expone: usuario, cargando,
// login(), logout(), y tieneRol() para usar en componentes y rutas.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarUsuarioActual = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`);
      setUsuario(data);
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarioActual();
  }, [cargarUsuarioActual]);

  const login = async (username, password) => {
    // Puede lanzar error (401): captúralo en el componente de login
    // para mostrar "usuario o contraseña incorrectos".
    const { data } = await axios.post(`${API_URL}/auth/login`, { username, password });
    setUsuario(data);
    return data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } finally {
      setUsuario(null);
    }
  };

  const tieneRol = (...roles) => !!usuario && roles.includes(usuario.rol);

  const value = {
    usuario,
    cargando,
    estaAutenticado: !!usuario,
    login,
    logout,
    tieneRol,
    recargarUsuario: cargarUsuarioActual,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }
  return ctx;
}