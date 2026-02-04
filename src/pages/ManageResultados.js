import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageResultados = () => {
  const [sorteos, setSorteos] = useState([]);
  const [selectedSorteoId, setSelectedSorteoId] = useState('');
  
  // Datos del sorteo seleccionado
  const [dashboardData, setDashboardData] = useState(null); 
  const [loading, setLoading] = useState(false);

  // Control de inputs
  const [currentInput, setCurrentInput] = useState({}); // { premioId: "1234" }

  useEffect(() => {
    axios.get('http://localhost:8000/sorteos/')
      .then(res => setSorteos(res.data))
      .catch(err => console.error(err));
  }, []);

  const loadSorteoData = async (sorteoId) => {
    if(!sorteoId) return;
    setLoading(true);
    try {
      // 1. Obtener info básica del sorteo para saber el plan
      const sorteoRes = await axios.get(`http://localhost:8000/sorteos/${sorteoId}`);
      const sorteo = sorteoRes.data;

      // 2. Obtener el plan completo (con estructura de premios)
      const planRes = await axios.get(`http://localhost:8000/planes/${sorteo.plan_id}`);
      const plan = planRes.data;

      // 3. Obtener resultados YA registrados (públicos o internos)
      // Usamos el endpoint público para facilitar ver qué ya se jugó
      const resultadosRes = await axios.get(`http://localhost:8000/sorteos/${sorteo.numero_sorteo}/publico`);
      const registrados = resultadosRes.data.resultados || [];

      // Mapear para saber qué premio ya tiene resultado
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

  const handleInputChange = (premioId, value) => {
    setCurrentInput({ ...currentInput, [premioId]: value });
  };

  const guardarResultado = async (premio) => {
    const numero = currentInput[premio.id];
    if (!numero) return alert("Ingrese un número");
    
    // Validación básica de longitud
    if (numero.length !== premio.cantidad_balotas) {
      return alert(`El premio requiere exactamente ${premio.cantidad_balotas} cifras`);
    }

    try {
      await axios.post(`http://localhost:8000/sorteos/${selectedSorteoId}/resultados/`, {
        premio_id: premio.id,
        numeros_ganadores: numero
      });
      // Recargar tabla
      loadSorteoData(selectedSorteoId);
      // Limpiar input
      setCurrentInput({ ...currentInput, [premio.id]: '' });
    } catch (error) {
      alert("Error: " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Registro de Resultados</h1>

      <div className="form-group" style={{maxWidth: '400px'}}>
        <label>Seleccionar Sorteo Activo:</label>
        <select className="form-select" value={selectedSorteoId} onChange={handleSorteoChange}>
          <option value="">-- Seleccione --</option>
          {sorteos.map(s => (
            <option key={s.id} value={s.id}>
              No. {s.numero_sorteo} - {s.fecha}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Cargando plan de premios...</p>}

      {dashboardData && (
        <>
          <h3>Plan: {dashboardData.sorteo.plan_id} (Sorteo {dashboardData.sorteo.numero_sorteo})</h3>
          
          <table className="admin-table">
            <thead>
              <tr>
                <th>Premio</th>
                <th>Valor</th>
                <th>Estado</th>
                <th>Resultado / Entrada</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.premios.map((premio) => (
                <tr key={premio.id} style={{ opacity: premio.yaJugado ? 0.6 : 1 }}>
                  <td>{premio.titulo}</td>
                  <td>${premio.valor.toLocaleString()}</td>
                  <td>
                    {premio.yaJugado ? (
                      <span className="status-badge status-done">JUGADO</span>
                    ) : (
                      <span className="status-badge status-pending">PENDIENTE</span>
                    )}
                  </td>
                  <td>
                    {premio.yaJugado ? (
                      <strong style={{fontSize: '1.5rem', color: 'var(--color-oro)'}}>
                        {premio.numeroGanador}
                      </strong>
                    ) : (
                      <input 
                        type="text"
                        className="form-input"
                        style={{width: '150px', textAlign: 'center', letterSpacing: '5px'}}
                        maxLength={premio.cantidad_balotas}
                        placeholder={"0".repeat(premio.cantidad_balotas)}
                        value={currentInput[premio.id] || ''}
                        onChange={(e) => handleInputChange(premio.id, e.target.value)}
                      />
                    )}
                  </td>
                  <td>
                    {!premio.yaJugado && (
                      <button 
                        className="btn btn-primary" 
                        style={{padding: '5px 15px', fontSize: '0.9rem'}}
                        onClick={() => guardarResultado(premio)}
                      >
                        Guardar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ManageResultados;