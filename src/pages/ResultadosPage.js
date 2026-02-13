import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import logoMoneda from '../assets/logo.png'; 
import textoLogo from '../assets/letras.png'; 
import API_URL from '../config';

const ResultadosPage = () => {
  const [dataPorValor, setDataPorValor] = useState({});
  const [sorteoInfo, setSorteoInfo] = useState({ numero: '---', fecha: '' });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Función para formatear fecha CO
  const formatearFechaCO = (fechaStr) => {
    if (!fechaStr || fechaStr === '---') return '';
    const fecha = new Date(`${fechaStr}T00:00:00`);
    return fecha.toLocaleDateString('es-CO', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
  };
  
  const fetchData = useCallback(async () => {
    try {
      const resSorteos = await axios.get(`${API_URL}/sorteos/`);
      if (resSorteos.data.length === 0) return;
      
      const ultimoSorteo = resSorteos.data[resSorteos.data.length - 1];
      setSorteoInfo({ 
        numero: ultimoSorteo.numero_sorteo, 
        fecha: ultimoSorteo.fecha 
      });

      const resPlan = await axios.get(`${API_URL}/planes/${ultimoSorteo.plan_id}`);
      const todosLosPremios = resPlan.data.premios;

      // Usamos el número de sorteo (string) para la consulta pública
      const resResultados = await axios.get(`${API_URL}/sorteos/${ultimoSorteo.numero_sorteo}/publico`);
      const jugados = resResultados.data.resultados || [];

      const grupos = {};

      todosLosPremios.forEach(premio => {
        const resultado = jugados.find(j => j.premio === premio.titulo);
        const item = {
          titulo: premio.titulo,
          valor: premio.valor,
          balotas: premio.cantidad_balotas,
          numero: resultado ? resultado.numero_ganador : null 
        };

        if (!grupos[premio.valor]) {
          grupos[premio.valor] = [];
        }
        grupos[premio.valor].push(item);
      });

      setDataPorValor(grupos);
      setLastUpdate(new Date());

    } catch (error) {
      console.error("Error actualizando tablero:", error);
    }
  }, []);

  useEffect(() => {
    fetchData(); 
    const intervalo = setInterval(fetchData, 30000); 
    return () => clearInterval(intervalo);
  }, [fetchData]);

  const renderNumero = (numero, cantidadBalotas) => {
    if (!numero) return <span className="num-placeholder">{"-".repeat(cantidadBalotas)}</span>;

    let principal = numero;
    let serie = "";

    if (numero.length > 4) {
      const corte = numero.length - 3;
      principal = numero.substring(0, corte);
      serie = numero.substring(corte);
    }

    return (
      <span className="num-ganador">
        {principal}<span className="num-serie">{serie}</span>
      </span>
    );
  };

  const gruposOrdenados = Object.keys(dataPorValor).sort((a, b) => {
      return b.length - a.length; 
  });

  return (
    <div className="resultados-container">
        <div className="res-safe-area">
      <header className="res-header">
        <div className="res-logo-area">
            <img src={logoMoneda} alt="Logo" className="res-logo-img" />
            <img src={textoLogo} alt="Texto" className="res-logo-text" />
        </div>
        <div className="res-title-area">
            <h1>TABLERO DE RESULTADOS</h1>
            <h2>SORTEO {sorteoInfo.numero} • {formatearFechaCO(sorteoInfo.fecha)}</h2>
        </div>
      </header>

      <main className="res-grid">
        {gruposOrdenados.map((valorPremio) => {
            const listaPremios = dataPorValor[valorPremio];
            // Detectar premio mayor
            const esMayor = listaPremios.some(p => p.titulo.toLowerCase().includes("mayor"));
            
            return (
                <div key={valorPremio} className={`res-card ${esMayor ? 'card-mayor' : ''}`}>
                    <div className="res-card-header">
                        {esMayor ? "PREMIO MAYOR" : valorPremio}
                    </div>
                    <div className="res-card-body">
                        {esMayor && <div className="mayor-amount">{valorPremio}</div>}
                        
                        <table className="res-table">
                            <tbody>
                                {listaPremios.map((p, idx) => (
                                    <tr key={idx}>
                                        <td className="col-premio">{p.titulo}</td>
                                        <td className="col-numero">
                                            {renderNumero(p.numero, p.balotas)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        })}
      </main>

      <footer className="res-footer">
        Actualizado: {lastUpdate.toLocaleTimeString()} — Próxima actualización en 30s
      </footer>
      </div>
    </div>
  );
};

export default ResultadosPage;