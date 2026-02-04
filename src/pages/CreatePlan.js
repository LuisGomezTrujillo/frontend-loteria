import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreatePlan = () => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [premios, setPremios] = useState([]);
  
  // Estado temporal para el nuevo premio a agregar
  const [newPremio, setNewPremio] = useState({ titulo: '', valor: '', cantidad_balotas: 4 });

  const addPremio = () => {
    if (!newPremio.titulo || !newPremio.valor) return alert("Complete los datos del premio");
    setPremios([...premios, { ...newPremio }]);
    setNewPremio({ titulo: '', valor: '', cantidad_balotas: 4 }); // Reset
  };

  const removePremio = (index) => {
    setPremios(premios.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!nombre || premios.length === 0) return alert("Debe asignar un nombre y al menos un premio");

    try {
      const payload = { nombre, premios };
      await axios.post('http://localhost:8000/planes/', payload);
      alert('Plan creado exitosamente');
      navigate('/admin/sorteo'); // Ir a crear sorteo
    } catch (error) {
      console.error(error);
      alert('Error al crear el plan');
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Crear Nuevo Plan de Premios</h1>
      
      <div className="form-group">
        <label>Nombre del Plan (Ej: Plan 2026)</label>
        <input 
          className="form-input" 
          value={nombre} 
          onChange={e => setNombre(e.target.value)} 
        />
      </div>

      <h3>Lista de Premios</h3>
      <div className="premios-grid">
        <input 
          placeholder="Título (Ej: Mayor)" 
          className="form-input"
          value={newPremio.titulo}
          onChange={e => setNewPremio({...newPremio, titulo: e.target.value})}
        />
        <input 
          placeholder="Valor" 
          type="number"
          className="form-input"
          value={newPremio.valor}
          onChange={e => setNewPremio({...newPremio, valor: parseFloat(e.target.value)})}
        />
        <select 
          className="form-select"
          value={newPremio.cantidad_balotas}
          onChange={e => setNewPremio({...newPremio, cantidad_balotas: parseInt(e.target.value)})}
        >
          <option value="4">4 Cifras</option>
          <option value="3">3 Cifras</option>
          <option value="2">2 Cifras</option>
        </select>
        <button className="btn btn-secondary" onClick={addPremio}>+</button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Valor</th>
            <th>Balotas</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {premios.map((p, i) => (
            <tr key={i}>
              <td>{p.titulo}</td>
              <td>${p.valor.toLocaleString()}</td>
              <td>{p.cantidad_balotas}</td>
              <td><button onClick={() => removePremio(i)} style={{color:'red'}}>X</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{marginTop: '30px'}}>
        <button className="btn btn-primary" onClick={handleSubmit}>Guardar Plan Completo</button>
      </div>
    </div>
  );
};

export default CreatePlan;