import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Importación de Iconos
import { FaTv, FaClipboardList, FaTicketAlt, FaTrophy, FaVial } from 'react-icons/fa';
import { MdEditDocument } from 'react-icons/md';

import TVPage from './pages/TVPage';
import ManagePlan from './pages/ManagePlan';
import ManageSorteo from './pages/ManageSorteo'; 
import ManageResultados from './pages/ManageResultados';
import ResultadosPage from './pages/ResultadosPage';
import IngresoTubosPage from './pages/IngresoTubosPage';

// Componente de menú con iconos
const NavMenu = () => (
  <nav style={{
    position: 'fixed', 
    top: 0, 
    left: 0, 
    zIndex: 9999, 
    padding: '10px',
    display: 'flex',
    gap: '20px',
    backgroundColor: 'rgba(0,0,0,0.1)', // Un fondo muy sutil para ver los iconos al pasar el mouse
    borderRadius: '0 0 10px 0'
  }}>
    <Link to="/" title="PANTALLA TV" style={{color:'white'}}>
      <FaTv size={24} />
    </Link>
    
    <Link to="/admin/plan" title="GESTIONAR PLANES" style={{color:'white'}}>
      <FaClipboardList size={24} />
    </Link>
    
    <Link to="/admin/sorteo" title="GESTIONAR SORTEOS" style={{color:'white'}}>
      <FaTicketAlt size={24} />
    </Link>
    
    <Link to="/admin/resultados" title="REGISTRAR RESULTADOS" style={{color:'white'}}>
      <MdEditDocument size={24} />
    </Link>

    <Link to="/admin/tubos" title="TUBOS POR URNA" style={{color:'white'}}>
      <FaVial size={24} />
    </Link>

    <Link to="/tablero" title="TABLERO DE RESULTADOS" style={{color:'white'}}>
      <FaTrophy size={24} />
    </Link>
  </nav>
);

function App() {
  return (
    <Router>
      {/* Contenedor con control de opacidad original */}
      <div 
        onMouseEnter={e => e.currentTarget.style.opacity = 0.5} 
        onMouseLeave={e => e.currentTarget.style.opacity = 0.01}
        style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          zIndex: 10000, 
          opacity: 0.01, 
          transition: 'opacity 0.3s ease' // Suaviza la aparición
        }}
      >
        <NavMenu />
      </div>

      <Routes>
        <Route path="/" element={<TVPage />} />
        <Route path="/admin/plan" element={<ManagePlan />} />
        <Route path="/admin/sorteo" element={<ManageSorteo />} /> 
        <Route path="/admin/resultados" element={<ManageResultados />} />
        <Route path="/admin/tubos" element={<IngresoTubosPage />} />
        <Route path="/tablero" element={<ResultadosPage />} />
      </Routes>
    </Router>
  );
}

export default App;

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// import './App.css';

// // Importación de Iconos
// import { FaTv, FaClipboardList, FaTicketAlt, FaTrophy } from 'react-icons/fa';
// import { MdEditDocument } from 'react-icons/md';

// import TVPage from './pages/TVPage';
// import ManagePlan from './pages/ManagePlan';
// import ManageSorteo from './pages/ManageSorteo'; 
// import ManageResultados from './pages/ManageResultados';
// import ResultadosPage from './pages/ResultadosPage';
// import IngresoTubosPage from './pages/IngresaoTubosPage';  // Asegúrate de que la ruta sea correcta

// // Componente de menú con iconos
// const NavMenu = () => (
//   <nav style={{
//     position: 'fixed', 
//     top: 0, 
//     left: 0, 
//     zIndex: 9999, 
//     padding: '10px',
//     display: 'flex',
//     gap: '20px',
//     backgroundColor: 'rgba(0,0,0,0.1)', // Un fondo muy sutil para ver los iconos al pasar el mouse
//     borderRadius: '0 0 10px 0'
//   }}>
//     <Link to="/" title="PANTALLA TV" style={{color:'white'}}>
//       <FaTv size={24} />
//     </Link>
    
//     <Link to="/" title="PANTALLA TV" style={{color:'white'}}>
//       <FaTv size={24} />
//     </Link>
    
//     <Link to="/admin/plan" title="GESTIONAR PLANES" style={{color:'white'}}>
//       <FaClipboardList size={24} />
//     </Link>
    
//     <Link to="/admin/sorteo" title="GESTIONAR SORTEOS" style={{color:'white'}}>
//       <FaTicketAlt size={24} />
//     </Link>
    
//     <Link to="/admin/resultados" title="REGISTRAR RESULTADOS" style={{color:'white'}}>
//       <MdEditDocument size={24} />
//     </Link>

//     <Link to="/tablero" title="TABLERO DE RESULTADOS" style={{color:'white'}}>
//       <FaTrophy size={24} />
//     </Link>
//   </nav>
// );

// function App() {
//   return (
//     <Router>
//       {/* Contenedor con control de opacidad original */}
//       <div 
//         onMouseEnter={e => e.currentTarget.style.opacity = 0.5} 
//         onMouseLeave={e => e.currentTarget.style.opacity = 0.01}
//         style={{
//           position: 'fixed', 
//           top: 0, 
//           left: 0, 
//           zIndex: 10000, 
//           opacity: 0.01, 
//           transition: 'opacity 0.3s ease' // Suaviza la aparición
//         }}
//       >
//         <NavMenu />
//       </div>

//       <Routes>
//         <Route path="/" element={<TVPage />} />
//         <Route path="/admin/plan" element={<ManagePlan />} />
//         <Route path="/admin/sorteo" element={<ManageSorteo />} /> 
//         <Route path="/admin/resultados" element={<ManageResultados />} />
//         <Route path="/tablero" element={<ResultadosPage />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;
