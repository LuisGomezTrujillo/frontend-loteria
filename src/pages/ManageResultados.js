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
  const [editingPremioId, setEditingPremioId] = useState(null);
  const [editValue, setEditValue] = useState(''); 

  useEffect(() => {
    fetchSorteos();
  }, []);

  const fetchSorteos = () => {
    axios.get(`${API_URL}/sorteos/`)
      .then(res => setSorteos(res.data))
      .catch(err => console.error(err));
  };

  // Función para formatear la fecha correctamente en Colombia
  const formatearFechaCO = (fechaStr) => {
    if (!fechaStr) return '';
    // Agregamos hora para evitar conversión a UTC que resta un día
    const fecha = new Date(`${fechaStr}T00:00:00`);
    return fecha.toLocaleDateString('es-CO');
  };

  const loadSorteoData = async (sorteoId) => {
    if(!sorteoId) return;
    setLoading(true);
    setEditingPremioId(null); 
    try {
      // 1. Obtener info básica del Sorteo
      const sorteoRes = await axios.get(`${API_URL}/sorteos/${sorteoId}`);
      const sorteo = sorteoRes.data;

      // 2. Obtener el Plan de Premios
      const planRes = await axios.get(`${API_URL}/planes/${sorteo.plan_id}`);
      const plan = planRes.data;

      // 3. Obtener resultados PÚBLICOS (que ya tienen los ganadores)
      // Nota: numero_sorteo ahora es string, funciona igual en la URL
      const resultadosRes = await axios.get(`${API_URL}/sorteos/${sorteo.numero_sorteo}/publico`);
      const registrados = resultadosRes.data.resultados || [];

      // 4. Mapear estado
      const premiosStatus = plan.premios.map(premio => {
        // Buscamos si ya existe resultado para este premio (por ID o Titulo)
        const resultadoExistente = registrados.find(r => r.premio_id === premio.id || r.premio === premio.titulo);
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
      await axios.post(`${API_URL}/resultados/`, {
        sorteo_id: selectedSorteoId,
        premio_titulo: premio.titulo, 
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
      // Usamos endpoint: DELETE /resultados/{sorteo_id}/{premio_id}
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
        // Usamos endpoint: PUT /resultados/{sorteo_id}/{premio_id}?numeros_nuevos=...
        await axios.put(`${API_URL}/resultados/${selectedSorteoId}/${premio.id}?numeros_nuevos=${editValue}`);
        setEditingPremioId(null);
        loadSorteoData(selectedSorteoId);
    } catch (error) {
        alert("Error editando: " + (error.response?.data?.detail || error.message));
    }
  };

  // --- UTILIDAD DE FORMATO VISUAL ---
  const renderNumeroFormateado = (numero) => {
    if (!numero) return "";
    let principal = numero;
    let serie = "";

    if (numero.length > 4) {
        const corte = numero.length - 3; 
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
              No. {s.numero_sorteo} ({formatearFechaCO(s.fecha)})
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
                  
                  <td>
                    {isEditing ? (
                        <input 
                            type="text"
                            className="form-input input-editing"
                            autoFocus
                            maxLength={premio.cantidad_balotas}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                        />
                    ) : premio.yaJugado ? (
                        renderNumeroFormateado(premio.numeroGanador)
                    ) : (
                        <input 
                            type="text"
                            className="form-input"
                            style={{textAlign: 'center', letterSpacing: '5px'}}
                            maxLength={premio.cantidad_balotas}
                            placeholder={"?".repeat(premio.cantidad_balotas)}
                            value={currentInput[premio.id] || ''}
                            onChange={(e) => handleInputChange(premio.id, e.target.value)}
                        />
                    )}
                  </td>

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