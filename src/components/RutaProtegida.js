// src/components/RutaProtegida.js
//
// Uso en App.js (react-router-dom v6):
//
//   <Route element={<RutaProtegida />}>
//     <Route path="/admin/gestion-pruebas" element={<ManagePruebas />} />
//   </Route>
//
//   <Route element={<RutaProtegida rolesPermitidos={["admin", "operador"]} />}>
//     <Route path="/admin/plan" element={<ManagePlan />} />
//   </Route>
//
// Rutas públicas ("/", "/tablero") NO se envuelven con esto.

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaProtegida({ rolesPermitidos }) {
  const { estaAutenticado, cargando, usuario } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#c9a227' }}>
        Verificando sesión...
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#c9a227' }}>
        No tienes permisos para ver esta página.
      </div>
    );
  }

  return <Outlet />;
}