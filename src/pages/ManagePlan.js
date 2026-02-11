import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';


const ManagePlan = () => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [premios, setPremios] = useState([]);
  const [currentPremio, setCurrentPremio] = useState({ id_temporal: null, titulo: '', valor: '', cantidad_balotas: 4 });
  const [isEditing, setIsEditing] = useState(false);

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/);
      const nuevosPremios = lines.filter(l => l.trim()).map((line, index) => {
        const columns = line.includes(';') ? line.split(';') : line.split(',');
        return {
          id_temporal: Date.now() + index,
          titulo: columns[0]?.trim(),
          valor: columns[1]?.trim(),
          cantidad_balotas: columns[2] ? parseInt(columns[2].trim()) : 4
        };
      });
      setPremios([...premios, ...nuevosPremios]);
      alert(`Importados ${nuevosPremios.length} premios.`);
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleAddOrUpdatePremio = () => {
    if (!currentPremio.titulo || !currentPremio.valor) return alert("Complete los campos");
    if (isEditing) {
      setPremios(premios.map(p => p.id_temporal === currentPremio.id_temporal ? currentPremio : p));
      setIsEditing(false);
    } else {
      setPremios([...premios, { ...currentPremio, id_temporal: Date.now() }]);
    }
    setCurrentPremio({ id_temporal: null, titulo: '', valor: '', cantidad_balotas: 4 });
  };

  const handleSavePlan = async () => {
    if (!nombre || premios.length === 0) return alert("Nombre y premios requeridos");
    const payload = { nombre, descripcion, premios: premios.map(({ titulo, valor, cantidad_balotas }) => ({ titulo, valor, cantidad_balotas })) };
    try {
      await axios.post(`${API_URL}/planes/`, payload);
      alert('Plan guardado!');
      navigate('/admin/sorteo');
    } catch (error) {
      alert('Error al guardar');
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Gestionar Plan de Premios</h1>
      
      <div className="form-group" style={{ display: 'flex', gap: '15px' }}>
        <div style={{ flex: 1 }}><label>Nombre</label><input className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} /></div>
        <div style={{ flex: 1 }}><label>Descripción</label><input className="form-input" value={descripcion} onChange={e => setDescripcion(e.target.value)} /></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
        <h3 style={{ color: 'var(--color-oro)', margin: 0 }}>{isEditing ? "📝 Editando" : "✨ Agregar Premio"}</h3>
        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          📥 Importar CSV <input type="file" accept=".csv" onChange={handleCSVImport} style={{ display: 'none' }} />
        </label>
      </div>
      
      <div className="premios-grid">
        <input placeholder="Título" className="form-input" value={currentPremio.titulo} onChange={e => setCurrentPremio({...currentPremio, titulo: e.target.value})} />
        <input placeholder="Valor" className="form-input" value={currentPremio.valor} onChange={e => setCurrentPremio({...currentPremio, valor: e.target.value})} />
        <select className="form-select" value={currentPremio.cantidad_balotas} onChange={e => setCurrentPremio({...currentPremio, cantidad_balotas: parseInt(e.target.value)})}>
          <option value="4">4 Cifras</option>
          <option value="6">6 Cifras (4+2)</option>
        </select>
        <button className="btn btn-primary" onClick={handleAddOrUpdatePremio}>{isEditing ? "OK" : "+"}</button>
      </div>

      <table className="admin-table">
        <thead>
          <tr><th>#</th><th>Título</th><th>Valor</th><th>Cifras</th><th>Acción</th></tr>
        </thead>
        <tbody>
          {premios.map((p, i) => (
            <tr key={p.id_temporal}>
              <td>{i + 1}</td><td>{p.titulo}</td><td>{p.valor}</td><td>{p.cantidad_balotas}</td>
              <td>
                <button onClick={() => { setCurrentPremio(p); setIsEditing(true); window.scrollTo(0,0); }} style={{ background: 'none', color: '#ffc107', border: 'none', cursor: 'pointer' }}>✏️</button>
                <button onClick={() => setPremios(premios.filter(x => x.id_temporal !== p.id_temporal))} style={{ background: 'none', color: '#ff4d4d', border: 'none', cursor: 'pointer', marginLeft: '10px' }}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FOOTER FIJO */}
      <div className="fixed-footer">
        <button className="btn btn-primary" onClick={handleSavePlan} style={{ width: '100%', maxWidth: '800px', height: '60px', fontSize: '1.4rem' }}>
          GUARDAR PLAN COMPLETO ({premios.length} PREMIOS)
        </button>
      </div>
    </div>
  );
};

export default ManagePlan;