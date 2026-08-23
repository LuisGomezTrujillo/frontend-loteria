// src/api/axiosGlobalConfig.js
//
// Tu proyecto usa `import axios from 'axios'` directo en cada página
// (ManagePlan.js, TVPage.js, etc.), no una instancia compartida. Para no
// tener que tocar el import de cada archivo, configuramos axios.defaults
// UNA sola vez, aquí, y este archivo se importa una sola vez en index.js
// antes de <App />. A partir de eso, TODAS las llamadas de axios en toda
// la app (sin importar en qué archivo estén) envían/reciben la cookie.
//
// withCredentials: true es obligatorio para que el navegador envíe y
// acepte la cookie httpOnly de sesión (mzl_access_token) en peticiones
// cross-site (frontend en Vercel, backend en Render).

import axios from 'axios';

axios.defaults.withCredentials = true;

// Nota: NO agregamos aquí un interceptor global que redirija a /login en
// cualquier 401, a propósito. TVPage.js ("/") es la pantalla pública de
// TV y también captura resultados en vivo con axios.post — si esa llamada
// devuelve 401 (porque el operador no inició sesión en ese navegador), no
// queremos redirigir la transmisión en vivo a una pantalla de login. Cada
// página ya maneja sus propios errores de red en su catch(). La
// protección real de acceso a /admin/* vive en <RutaProtegida />.