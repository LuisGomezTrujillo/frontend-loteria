import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreatePlan = () => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [premios, setPremios] = useState([]);
  
  // Estado inicial
  const [newPremio, setNewPremio] = useState({ titulo: '', valor: '', cantidad_balotas: 4 });

  const addPremio = () => {
    if (!newPremio.titulo || !newPremio.valor) return alert("Complete los datos del premio");
    setPremios([...premios, { ...newPremio }]);
    setNewPremio({ titulo: '', valor: '', cantidad_balotas: 6 }); 
  };

  const removePremio = (index) => {
    setPremios(premios.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!nombre || premios.length === 0) return alert("Debe asignar un nombre y al menos un premio");

    // Preparamos el payload
    const payload = { 
      nombre: nombre, 
      premios: premios.map(p => ({
        titulo: p.titulo,
        valor: p.valor, // <--- CAMBIO: Se envía tal cual (String), sin parseFloat
        cantidad_balotas: parseInt(p.cantidad_balotas) // Esto sí debe ser número entero
      })) 
    };

    try {
      await axios.post('http://localhost:8000/planes/', payload);
      alert('Plan creado exitosamente');
      navigate('/admin/sorteo'); 
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
         alert(`Error: ${JSON.stringify(error.response.data)}`);
      } else {
         alert('Error al crear el plan');
      }
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Crear Nuevo Plan de Premios</h1>
      
      <div className="form-group">
        <label>Nombre del Plan</label>
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
        
        {/* CAMBIO: Input de texto para permitir '$', puntos, letras, etc. */}
        <input 
          placeholder="Valor (Ej: $ 2.600 Millones)" 
          type="text" 
          className="form-input"
          value={newPremio.valor}
          onChange={e => setNewPremio({...newPremio, valor: e.target.value})}
        />
        
        <select 
          className="form-select"
          value={newPremio.cantidad_balotas}
          onChange={e => setNewPremio({...newPremio, cantidad_balotas: parseInt(e.target.value)})}
        >
          <option value="6">6 Cifras</option>
          <option value="4">4 Cifras</option>
        </select>
        <button className="btn btn-secondary" onClick={addPremio}>+</button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Valor (Texto)</th>
            <th>Balotas</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {premios.map((p, i) => (
            <tr key={i}>
              <td>{p.titulo}</td>
              {/* Mostramos el valor tal cual se escribió */}
              <td>{p.valor}</td> 
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