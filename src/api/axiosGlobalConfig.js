// src/api/axiosGlobalConfig.js
//
// Adjunta automáticamente el header "Authorization: Bearer <token>" a
// TODAS las llamadas de axios de la app (sin importar en qué archivo
// estén — ManagePlan.js, TVPage.js, etc. — porque este interceptor se
// registra sobre la instancia global de axios). Se importa UNA sola vez
// en index.js, antes de <App />.
//
// Por qué header y no cookie: el frontend (Vercel) y el backend (Render)
// son dominios raíz distintos. Sin un dominio propio que los una, los
// navegadores modernos bloquean por defecto las cookies "de terceros"
// entre sitios así — incluso con SameSite=None; Secure bien configurado.
// Un header explícito no tiene ese problema.

import axios from 'axios';

export const TOKEN_KEY = 'mzl_token';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Nota: NO agregamos aquí un interceptor de RESPUESTA que redirija a
// /login en cualquier 401, a propósito. TVPage.js ("/") es la pantalla
// pública de TV y también captura resultados en vivo — si esa llamada
// devuelve 401 (operador sin sesión), no queremos redirigir la
// transmisión en vivo a una pantalla de login. Cada página ya maneja sus
// propios errores de red en su catch(). La protección real de acceso a
// /admin/* vive en <RutaProtegida />.