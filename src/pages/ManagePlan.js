import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ManagePlan = () => {
  const navigate = useNavigate();
  
  // Estados del Plan
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [premios, setPremios] = useState([]);

  // Estado del Formulario
  const [currentPremio, setCurrentPremio] = useState({ 
    id_temporal: null, 
    titulo: '', 
    valor: '', 
    cantidad_balotas: 4 
  });
  const [isEditing, setIsEditing] = useState(false);

  // --- FUNCIÓN: IMPORTAR DESDE CSV ---
  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/);
      const nuevosPremios = [];

      // Empezamos en 0 (o 1 si el CSV tiene encabezados)
      lines.forEach((line, index) => {
        if (!line.trim()) return;
        
        // Soporta comas o punto y coma
        const columns = line.includes(';') ? line.split(';') : line.split(',');
        
        if (columns.length >= 2) {
          nuevosPremios.push({
            id_temporal: Date.now() + index,
            titulo: columns[0].trim(),
            valor: columns[1].trim(),
            cantidad_balotas: columns[2] ? parseInt(columns[2].trim()) : 4
          });
        }
      });

      if (nuevosPremios.length > 0) {
        setPremios([...premios, ...nuevosPremios]);
        alert(`Se han importado ${nuevosPremios.length} premios correctamente.`);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset del input
  };

  // --- FUNCIONES CRUD ---
  const handleAddOrUpdatePremio = () => {
    if (!currentPremio.titulo || !currentPremio.valor) return alert("Complete título y valor");

    if (isEditing) {
      setPremios(premios.map(p => p.id_temporal === currentPremio.id_temporal ? currentPremio : p));
      setIsEditing(false);
    } else {
      setPremios([...premios, { ...currentPremio, id_temporal: Date.now() }]);
    }
    setCurrentPremio({ id_temporal: null, titulo: '', valor: '', cantidad_balotas: 4 });
  };

  const prepareEdit = (premio) => {
    setCurrentPremio(premio);
    setIsEditing(true);
    window.scrollTo(0, 0);
  };

  const removePremio = (id_temp) => {
    if (window.confirm("¿Eliminar este premio?")) {
      setPremios(premios.filter(p => p.id_temporal !== id_temp));
    }
  };

  const handleSavePlan = async () => {
    if (!nombre || premios.length === 0) return alert("Nombre y al menos un premio requeridos");

    const payload = {
      nombre,
      descripcion,
      premios: premios.map(({ titulo, valor, cantidad_balotas }) => ({
        titulo, valor, cantidad_balotas: parseInt(cantidad_balotas)
      }))
    };

    try {
      await axios.post('http://localhost:8000/planes/', payload);
      alert('¡Plan guardado con éxito!');
      navigate('/admin/sorteo'); 
    } catch (error) {
      console.error(error);
      alert('Error al guardar. Revise la consola.');
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Gestionar Plan de Premios</h1>
      
      {/* DATOS GENERALES */}
      <div className="form-group" style={{ display: 'flex', gap: '15px' }}>
        <div style={{ flex: 1 }}>
          <label>Nombre del Plan</label>
          <input className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label>Descripción</label>
          <input className="form-input" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
        </div>
      </div>

      <hr style={{ opacity: 0.1, margin: '20px 0' }} />

      {/* CONTROLES DE CARGA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
        <h3 style={{ color: 'var(--color-oro)', margin: 0 }}>
          {isEditing ? "📝 Editando Premio" : "✨ Agregar Premio"}
        </h3>
        
        {/* BOTÓN DE IMPORTACIÓN */}
        <div style={{ textAlign: 'right' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
            📥 Importar desde CSV
            <input type="file" accept=".csv" onChange={handleCSVImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
      
      <div className="premios-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '10px' }}>
        <input 
          placeholder="Título" className="form-input" value={currentPremio.titulo}
          onChange={e => setCurrentPremio({...currentPremio, titulo: e.target.value})}
        />
        <input 
          placeholder="Valor (Texto)" className="form-input" value={currentPremio.valor}
          onChange={e => setCurrentPremio({...currentPremio, valor: e.target.value})}
        />
        <select 
          className="form-select" value={currentPremio.cantidad_balotas}
          onChange={e => setCurrentPremio({...currentPremio, cantidad_balotas: e.target.value})}
        >
          <option value="4">4 Cifras</option>
          <option value="6">6 Cifras (4+2)</option>
          <option value="3">3 Cifras</option>
          <option value="2">2 Cifras</option>
        </select>
        <button className="btn btn-primary" onClick={handleAddOrUpdatePremio}>
          {isEditing ? "OK" : "+"}
        </button>
      </div>

      {/* TABLA CON SCROLL PARA LOS 53 PREMIOS */}
      <div style={{ marginTop: '25px' }}>
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto', 
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '5px'
        }}>
          <table className="admin-table">
            <thead style={{ position: 'sticky', top: 0, background: '#1b3b80', zIndex: 5 }}>
              <tr>
                <th>#</th>
                <th>Título</th>
                <th>Texto a Visualizar</th>
                <th>Balotas</th>
                <th style={{ textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {premios.map((p, i) => (
                <tr key={p.id_temporal}>
                  <td>{i + 1}</td>
                  <td>{p.titulo}</td>
                  <td>{p.valor}</td>
                  <td>{p.cantidad_balotas}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => prepareEdit(p)} style={{ background: 'none', border: 'none', color: '#ffc107', cursor: 'pointer', fontSize: '1.2rem' }}>✏️</button>
                    <button onClick={() => removePremio(p.id_temporal)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '10px' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={handleSavePlan} style={{ width: '100%', padding: '15px' }}>
          GUARDAR PLAN COMPLETO ({premios.length} PREMIOS)
        </button>
      </div>
    </div>
  );
};

export default ManagePlan;