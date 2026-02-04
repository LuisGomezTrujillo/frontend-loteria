import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateSorteo = () => {
  const navigate = useNavigate();
  const [planes, setPlanes] = useState([]);
  const [formData, setFormData] = useState({
    numero_sorteo: '',
    fecha: '',
    plan_id: ''
  });

  useEffect(() => {
    // Cargar planes disponibles
    axios.get('http://localhost:8000/planes/')
      .then(res => setPlanes(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:8000/sorteos/', formData);
      alert('Sorteo creado correctamente');
      navigate('/admin/resultados');
    } catch (error) {
      alert('Error creando sorteo: ' + error.response?.data?.detail || error.message);
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Programar Nuevo Sorteo</h1>

      <div className="form-group">
        <label>Número de Sorteo</label>
        <input 
          type="number" 
          className="form-input"
          onChange={e => setFormData({...formData, numero_sorteo: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Fecha del Juego</label>
        <input 
          type="date" 
          className="form-input"
          onChange={e => setFormData({...formData, fecha: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Seleccionar Plan de Premios</label>
        <select 
          className="form-select"
          onChange={e => setFormData({...formData, plan_id: e.target.value})}
        >
          <option value="">-- Seleccione un Plan --</option>
          {planes.map(plan => (
            <option key={plan.id} value={plan.id}>
              {plan.nombre} (ID: {plan.id})
            </option>
          ))}
        </select>
      </div>

      <button className="btn btn-primary" onClick={handleSubmit}>Crear Sorteo</button>
    </div>
  );
};

export default CreateSorteo;