// src/context/AuthContext.js
//
// Contexto global de autenticación. Envuelve <App /> con <AuthProvider>
// (ya hecho en App.js). Expone: usuario, cargando, login(), logout(), y
// tieneRol() para usar en componentes y rutas.
//
// La sesión se guarda como un JWT en localStorage (clave TOKEN_KEY,
// definida en axiosGlobalConfig.js) y se reenvía en cada petición vía
// header Authorization — NO se usa cookie (ver axiosGlobalConfig.js para
// el porqué).

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { TOKEN_KEY } from '../api/axiosGlobalConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarUsuarioActual = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUsuario(null);
      setCargando(false);
      return;
    }
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`);
      setUsuario(data);
    } catch {
      // Token vencido/ inválido: lo limpiamos para no seguir intentando
      localStorage.removeItem(TOKEN_KEY);
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
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setUsuario(data);
    return data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
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