import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import TVPage from './pages/TVPage';
import ManagePlan from './pages/ManagePlan';
import CreateSorteo from './pages/CreateSorteo';
import ManageResultados from './pages/ManageResultados';

// Componente simple de menú para desarrollo/navegación
const NavMenu = () => (
  <nav style={{position: 'fixed', top: 0, left: 0, zIndex: 9999, opacity: 0.1}}>
    <Link to="/" style={{color:'white', margin:5}}>TV</Link> | 
    <Link to="/admin/plan" style={{color:'white', margin:5}}>Plan</Link> |
    <Link to="/admin/sorteo" style={{color:'white', margin:5}}>Sorteo</Link> |
    <Link to="/admin/resultados" style={{color:'white', margin:5}}>Resultados</Link>
  </nav>
);

function App() {
  return (
    <Router>
      {/* El menú es invisible (opacity 0.1) para no molestar en TV, 
          pero accesible si pasas el mouse por la esquina superior izquierda */}
      <div onMouseEnter={e => e.currentTarget.style.opacity=1} 
           onMouseLeave={e => e.currentTarget.style.opacity=0.1}
           style={{position:'absolute', zIndex:1000}}>
        <NavMenu />
      </div>

      <Routes>
        {/* Ruta TV (Pública) */}
        <Route path="/" element={<TVPage />} />
        
        {/* Rutas Administrativas */}
        <Route path="/admin/plan" element={<ManagePlan />} />
        <Route path="/admin/sorteo" element={<CreateSorteo />} />
        <Route path="/admin/resultados" element={<ManageResultados />} />
      </Routes>
    </Router>
  );
}

export default App;