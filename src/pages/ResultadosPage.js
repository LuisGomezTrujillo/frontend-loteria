import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import logoMoneda from '../assets/logo.png'; // Asegúrate de tener la ruta correcta
import textoLogo from '../assets/letras.png'; // Asegúrate de tener la ruta correcta
import API_URL from '../config';

const ResultadosPage = () => {
  const [dataPorValor, setDataPorValor] = useState({}); // Objeto agrupado: { "50.000.000": [premio1, premio2] }
  const [sorteoInfo, setSorteoInfo] = useState({ numero: '---', fecha: '' });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  
  // --- FUNCIÓN DE CARGA DE DATOS ---
  const fetchData = useCallback(async () => {
    try {
      // 1. Obtener Sorteos para buscar el último activo
      const resSorteos = await axios.get(`${API_URL}/sorteos/`);
      if (resSorteos.data.length === 0) return;
      
      const ultimoSorteo = resSorteos.data[resSorteos.data.length - 1];
      setSorteoInfo({ 
        numero: ultimoSorteo.numero_sorteo, 
        fecha: ultimoSorteo.fecha 
      });

      // 2. Obtener el Plan (Estructura completa de premios vacíos)
      const resPlan = await axios.get(`${API_URL}/planes/${ultimoSorteo.plan_id}`);
      const todosLosPremios = resPlan.data.premios;

      // 3. Obtener Resultados ya jugados
      const resResultados = await axios.get(`${API_URL}/sorteos/${ultimoSorteo.numero_sorteo}/publico`);
      const jugados = resResultados.data.resultados || [];

      // 4. Fusionar y Agrupar
      const grupos = {};

      todosLosPremios.forEach(premio => {
        // Buscamos si ya tiene resultado
        const resultado = jugados.find(j => j.premio === premio.titulo);
        
        const item = {
          titulo: premio.titulo,
          valor: premio.valor,
          balotas: premio.cantidad_balotas,
          numero: resultado ? resultado.numero_ganador : null // Si no hay, es null
        };

        // Agrupamos por VALOR (Ej: "50.000.000")
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

  // --- EFECTO: CARGA INICIAL Y TIMER DE 30s ---
  useEffect(() => {
    fetchData(); // Carga inmediata
    const intervalo = setInterval(fetchData, 30000); // 30 segundos
    return () => clearInterval(intervalo);
  }, [fetchData]);


  // --- FORMATO VISUAL DEL NÚMERO (Separar Serie) ---
  const renderNumero = (numero, cantidadBalotas) => {
    if (!numero) return <span className="num-placeholder">{"-".repeat(cantidadBalotas)}</span>;

    // Lógica visual: Si es largo (>4), separamos las ultimas 3 cifras (serie)
    // Ajusta esta lógica si tu serie es de 2 cifras.
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

  // Ordenar las claves (valores de premios) para que el Mayor salga al final o al principio
  // Esto es opcional, depende de cómo quieras el orden. Aquí intentamos mantener el orden de inserción o alfabético inverso
  const gruposOrdenados = Object.keys(dataPorValor).sort((a, b) => {
      // Intento básico de ordenamiento por longitud de cadena (asumiendo formato moneda "$100...")
      return a.length - b.length; 
  });

  return (
    <div className="resultados-container">
        <div className="res-safe-area"> {/* Nuevo contenedor de seguridad */}
      {/* HEADER */}
      <header className="res-header">
        <div className="res-logo-area">
            <img src={logoMoneda} alt="Logo" className="res-logo-img" />
            <img src={textoLogo} alt="Texto" className="res-logo-text" />
        </div>
        <div className="res-title-area">
            <h1>TABLERO DE RESULTADOS</h1>
            <h2>SORTEO {sorteoInfo.numero} • {sorteoInfo.fecha}</h2>
        </div>
      </header>

      {/* GRILLA DE PREMIOS */}
      <main className="res-grid">
        {gruposOrdenados.map((valorPremio) => {
            const listaPremios = dataPorValor[valorPremio];
            const esMayor = valorPremio.toLowerCase().includes("mayor") || valorPremio.includes("2.600") || listaPremios[0].titulo.toLowerCase().includes("mayor");
            
            return (
                <div key={valorPremio} className={`res-card ${esMayor ? 'card-mayor' : ''}`}>
                    <div className="res-card-header">
                        {esMayor ? " PREMIO MAYOR " : valorPremio}
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