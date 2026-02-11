import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const ManageResultados = () => {
  const [sorteos, setSorteos] = useState([]);
  const [selectedSorteoId, setSelectedSorteoId] = useState('');
  
  // Datos del sorteo seleccionado
  const [dashboardData, setDashboardData] = useState(null); 
  const [loading, setLoading] = useState(false);

  // Control de inputs (Nuevo ingreso)
  const [currentInput, setCurrentInput] = useState({}); 

  // Control de Edición
  const [editingPremioId, setEditingPremioId] = useState(null); // ID del premio que se está editando
  const [editValue, setEditValue] = useState(''); // Valor temporal durante la edición


  useEffect(() => {
    fetchSorteos();
  }, []);

  const fetchSorteos = () => {
    axios.get(`${API_URL}/sorteos/`)
      .then(res => setSorteos(res.data))
      .catch(err => console.error(err));
  };

  const loadSorteoData = async (sorteoId) => {
    if(!sorteoId) return;
    setLoading(true);
    setEditingPremioId(null); // Resetear edición si cambiamos de sorteo
    try {
      const sorteoRes = await axios.get(`${API_URL}/sorteos/${sorteoId}`);
      const sorteo = sorteoRes.data;

      const planRes = await axios.get(`${API_URL}/planes/${sorteo.plan_id}`);
      const plan = planRes.data;

      const resultadosRes = await axios.get(`${API_URL}/sorteos/${sorteo.numero_sorteo}/publico`);
      const registrados = resultadosRes.data.resultados || [];

      const premiosStatus = plan.premios.map(premio => {
        const resultadoExistente = registrados.find(r => r.premio === premio.titulo);
        return {
          ...premio,
          yaJugado: !!resultadoExistente,
          numeroGanador: resultadoExistente ? resultadoExistente.numero_ganador : null
        };
      });

      setDashboardData({ sorteo, premios: premiosStatus });

    } catch (error) {
      console.error(error);
      alert("Error cargando datos del sorteo");
    } finally {
      setLoading(false);
    }
  };

  const handleSorteoChange = (e) => {
    const id = e.target.value;
    setSelectedSorteoId(id);
    loadSorteoData(id);
  };

  // --- CREAR ---
  const handleInputChange = (premioId, value) => {
    setCurrentInput({ ...currentInput, [premioId]: value });
  };

  const guardarResultado = async (premio) => {
    const numero = currentInput[premio.id];
    if (!numero) return alert("Ingrese un número");
    
    if (numero.length < premio.cantidad_balotas) {
      return alert(`El premio requiere al menos ${premio.cantidad_balotas} cifras`);
    }

    try {
      // Nota: Ajustamos el endpoint para que coincida con main.py existente o el wrapper
      // Si tu backend usa /resultados/ directo, ajusta aquí.
      // Aquí asumimos que usas el endpoint original de POST, pero enviando los datos correctos.
      await axios.post(`${API_URL}/resultados/`, {
        sorteo_id: selectedSorteoId,
        premio_titulo: premio.titulo, // El backend original pedía titulo
        numeros_ganadores: numero
      });
      
      loadSorteoData(selectedSorteoId);
      setCurrentInput({ ...currentInput, [premio.id]: '' });
    } catch (error) {
      alert("Error: " + (error.response?.data?.detail || error.message));
    }
  };

  // --- BORRAR ---
  const borrarResultado = async (premio) => {
    if(!window.confirm(`¿Estás seguro de borrar el resultado de ${premio.titulo}?`)) return;

    try {
      await axios.delete(`${API_URL}/resultados/${selectedSorteoId}/${premio.id}`);
      loadSorteoData(selectedSorteoId);
    } catch (error) {
      alert("Error borrando: " + (error.response?.data?.detail || error.message));
    }
  };

  // --- EDITAR ---
  const iniciarEdicion = (premio) => {
    setEditingPremioId(premio.id);
    setEditValue(premio.numeroGanador);
  };

  const cancelarEdicion = () => {
    setEditingPremioId(null);
    setEditValue('');
  };

  const guardarEdicion = async (premio) => {
    if (editValue.length < premio.cantidad_balotas) {
        return alert(`El premio requiere al menos ${premio.cantidad_balotas} cifras`);
    }

    try {
        await axios.put(`${API_URL}/resultados/${selectedSorteoId}/${premio.id}?numeros_nuevos=${editValue}`);
        setEditingPremioId(null);
        loadSorteoData(selectedSorteoId);
    } catch (error) {
        alert("Error editando: " + (error.response?.data?.detail || error.message));
    }
  };

  // --- UTILIDAD DE FORMATO VISUAL ---
  const renderNumeroFormateado = (numero, totalBalotas) => {
    if (!numero) return "";
    
    // Si tiene más de 4 cifras, asumimos que las ultimas 3 son serie (o lógica 4 cifras + serie)
    // Ejemplo: 1234567 -> 1234 (Numero) 567 (Serie)
    // Ajusta esta lógica según tu regla de negocio exacta.
    
    let principal = numero;
    let serie = "";

    // Si es un premio mayor (generalmente más de 4 cifras incluyendo serie)
    if (numero.length > 4) {
        const corte = numero.length - 3; // Dejar 3 para la serie
        principal = numero.substring(0, corte);
        serie = numero.substring(corte);
    }

    return (
        <div className="result-display-container">
            <span className="result-main">{principal}</span>
            {serie && (
                <>
                    <span className="result-separator">-</span>
                    <span className="result-serie">{serie}</span>
                </>
            )}
        </div>
    );
  };

  return (
    <div className="admin-container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1 className="admin-title">Gestión de Resultados</h1>
        <button className="btn btn-secondary" onClick={fetchSorteos}>↻ Refrescar</button>
      </div>

      <div className="form-group" style={{maxWidth: '500px'}}>
        <label>Seleccionar Sorteo Activo:</label>
        <select className="form-select" value={selectedSorteoId} onChange={handleSorteoChange}>
          <option value="">-- Seleccione Sorteo --</option>
          {sorteos.map(s => (
            <option key={s.id} value={s.id}>
              No. {s.numero_sorteo} ({s.fecha})
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Cargando datos...</p>}

      {dashboardData && (
        <>
          <h3>Plan: {dashboardData.sorteo.plan_id}</h3>
          
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{width: '40%'}}>Premio</th>
                <th style={{width: '20%'}}>Estado</th>
                <th style={{width: '20%'}}>Número  -  Serie</th>
                <th style={{width: '20%'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.premios.map((premio) => {
                const isEditing = editingPremioId === premio.id;
                
                return (
                <tr key={premio.id} className={premio.yaJugado ? "row-done" : "row-pending"}>
                  <td className="td-title">{premio.titulo}</td>
                  
                  <td>
                    {premio.yaJugado ? (
                      <span className="status-badge status-done">REGISTRADO</span>
                    ) : (
                      <span className="status-badge status-pending">PENDIENTE</span>
                    )}
                  </td>
                  
                  {/* COLUMNA DE RESULTADO / INPUT */}
                  <td>
                    {isEditing ? (
                        // MODO EDICIÓN
                        <input 
                            type="text"
                            className="form-input input-editing"
                            autoFocus
                            maxLength={premio.cantidad_balotas+1}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                        />
                    ) : premio.yaJugado ? (
                        // MODO VISUALIZACIÓN
                        renderNumeroFormateado(premio.numeroGanador, premio.cantidad_balotas)
                    ) : (
                        // MODO NUEVO INGRESO
                        <input 
                            type="text"
                            className="form-input"
                            style={{textAlign: 'center', letterSpacing: '5px'}}
                            maxLength={premio.cantidad_balotas+1}
                            placeholder={"???????"}
                            value={currentInput[premio.id] || ''}
                            onChange={(e) => handleInputChange(premio.id, e.target.value)}
                        />
                    )}
                  </td>

                  {/* COLUMNA DE ACCIONES */}
                  <td>
                    {isEditing ? (
                        <div className="action-buttons">
                            <button className="btn btn-success btn-sm" onClick={() => guardarEdicion(premio)}>💾</button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelarEdicion}>✖</button>
                        </div>
                    ) : premio.yaJugado ? (
                        <div className="action-buttons">
                            <button className="btn btn-primary btn-sm" onClick={() => iniciarEdicion(premio)}>✏️ Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => borrarResultado(premio)}>🗑️ Borrar</button>
                        </div>
                    ) : (
                        <button 
                            className="btn btn-primary" 
                            onClick={() => guardarResultado(premio)}
                        >
                            Guardar
                        </button>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ManageResultados;
