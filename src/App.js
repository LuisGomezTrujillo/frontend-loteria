import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import TVPage from './pages/TVPage';
import ManagePlan from './pages/ManagePlan';
import ManageSorteo from './pages/ManageSorteo'; // Cambio aquí
import ManageResultados from './pages/ManageResultados';

// Componente de menú para navegación administrativa
const NavMenu = () => (
  <nav style={{position: 'fixed', top: 0, left: 0, zIndex: 9999, opacity: 0.1}}>
    <Link to="/" style={{color:'white', margin:5}}>PANTALLA TV</Link> | 
    <Link to="/admin/plan" style={{color:'white', margin:5}}>GESTIONAR PLANES</Link> |
    <Link to="/admin/sorteo" style={{color:'white', margin:5}}>GESTIONAR SORTEOS</Link> |
    <Link to="/admin/resultados" style={{color:'white', margin:5}}>REGISTRAR RESULTADOS</Link>
  </nav>
);

function App() {
  return (
    <Router>
      {/* Menú de acceso rápido (Casi invisible para Smart TV) */}
      <div onMouseEnter={e => e.currentTarget.style.opacity=1} 
           onMouseLeave={e => e.currentTarget.style.opacity=0.1}
           style={{position:'absolute', zIndex:1000}}>
        <NavMenu />
      </div>

      <Routes>
        {/* Vista principal para la transmisión en vivo */}
        <Route path="/" element={<TVPage />} />
        
        {/* Rutas de Administración */}
        <Route path="/admin/plan" element={<ManagePlan />} />
        
        {/* Ahora apunta a la gestión CRUD completa de sorteos */}
        <Route path="/admin/sorteo" element={<ManageSorteo />} /> 
        
        <Route path="/admin/resultados" element={<ManageResultados />} />
      </Routes>
    </Router>
  );
}

export default App;