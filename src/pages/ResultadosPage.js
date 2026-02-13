import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import logoMoneda from '../assets/logo.png'; 
import textoLogo from '../assets/letras.png'; 
import API_URL from '../config';

const ResultadosPage = () => {
  const [todosPremios, setTodosPremios] = useState([]);
  const [sorteoInfo, setSorteoInfo] = useState({ numero: '---', fecha: '' });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Estado del Slider
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Estado del Timer
  const [timeRemaining, setTimeRemaining] = useState(15);

  // CONFIGURACIÓN DE SLIDES
  const SLIDES_CONFIG = [
    { id: 0, header: "40 MILLONES", rango: [41, 50], type: 'lista' },
    { id: 1, header: "50 MILLONES", rango: [31, 40], type: 'lista' },
    { id: 2, header: "60 MILLONES", rango: [21, 30], type: 'lista' },
    { id: 3, header: "80 MILLONES", rango: [11, 20], type: 'lista' },
    { id: 4, header: "100 MILLONES", rango: [6, 10], type: 'lista' },
    { id: 5, header: "200 MILLONES", rango: [3, 5], type: 'lista' },
    { id: 6, header: "300 MILLONES", rango: [1, 2], type: 'lista' },
    { id: 7, header: "PREMIO MAYOR", type: 'mayor' },
    { id: 8, header: "GANA SIEMPRE", type: 'gana_siempre' }
  ];

  const UPDATE_INTERVAL_MS = 15000;

  // --- FETCH DATA ---
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
      const resResultados = await axios.get(`${API_URL}/sorteos/${ultimoSorteo.numero_sorteo}/publico`);
      const resultadosJugados = resResultados.data.resultados || [];

      const merged = resPlan.data.premios.map(premio => {
        const resultado = resultadosJugados.find(r => r.premio === premio.titulo);
        return {
          titulo: premio.titulo,
          valor: premio.valor,
          balotas: premio.cantidad_balotas,
          numero: resultado ? resultado.numero_ganador : null 
        };
      });

      setTodosPremios(merged);
      setLastUpdate(new Date());
      setTimeRemaining(UPDATE_INTERVAL_MS / 1000);

    } catch (error) {
      console.error("Error actualizando datos:", error);
    }
  }, []);

  useEffect(() => {
    fetchData(); 
    const dataInterval = setInterval(fetchData, UPDATE_INTERVAL_MS);
    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => (prev > 0 ? prev - 1 : 15));
    }, 1000);
    return () => { clearInterval(dataInterval); clearInterval(timerInterval); };
  }, [fetchData]);

  // --- LOGICA DE FILTRADO ---
  const getNumeroPremio = (titulo) => {
    const match = titulo.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const getSlideContent = () => {
    const config = SLIDES_CONFIG[currentSlide];

    if (config.type === 'mayor') {
      const mayor = todosPremios.find(p => p.titulo.toLowerCase().includes('mayor'));
      return { type: 'mayor', data: mayor };
    }

    if (config.type === 'gana_siempre') {
      const gana = todosPremios.find(p => p.titulo.toLowerCase().includes('gana')); 
      return { type: 'gana_siempre', data: gana };
    }

    const [min, max] = config.rango;
    const filtrados = todosPremios.filter(p => {
      const num = getNumeroPremio(p.titulo);
      const esEspecial = p.titulo.toLowerCase().includes('mayor') || p.titulo.toLowerCase().includes('gana');
      return !esEspecial && num >= min && num <= max;
    });

    filtrados.sort((a, b) => getNumeroPremio(b.titulo) - getNumeroPremio(a.titulo));
    return { type: 'lista', header: config.header, data: filtrados };
  };

  // --- RENDERIZADO DE NUMEROS ---
  const renderNumero = (numero, cantidadBalotas, isHuge = false) => {
    if (!numero) return <span className="num-placeholder">{"-".repeat(cantidadBalotas || 4)}</span>;
    
    let principal = numero;
    let serie = "";

    if (numero.length > 4) {
      const corte = numero.length - 3; 
      principal = numero.substring(0, corte);
      serie = numero.substring(corte);
    } 

    return (
      <div className={`numero-container ${isHuge ? 'huge-layout' : 'list-layout'}`}>
        <span className="num-principal">{principal}</span>
        {serie && <span className="num-serie">{serie}</span>}
      </div>
    );
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr || fechaStr === '---') return '';
    const f = new Date(`${fechaStr}T00:00:00`);
    return f.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // --- HANDLERS ---
  const handleNext = () => setCurrentSlide(prev => (prev < SLIDES_CONFIG.length - 1 ? prev + 1 : 0));
  const handlePrev = () => setCurrentSlide(prev => (prev > 0 ? prev - 1 : SLIDES_CONFIG.length - 1));

  const content = getSlideContent();

  return (
    <div className="layout-split">
      {/* SIDEBAR */}
      <aside className="sidebar-brand">
        <div className="brand-header">
          <img src={logoMoneda} className="logo-3d-small" alt="Logo" />
          <img src={textoLogo} className="logo-text-small" alt="Lotería" />
        </div>
        
        <div className="draw-info">
          <div className="draw-label">SORTEO</div>
          <div className="draw-number">{sorteoInfo.numero}</div>
          <div className="draw-date">{formatearFecha(sorteoInfo.fecha)}</div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-content">
        
        <div className="slider-area">
          
          {/* MAYOR */}
          {content.type === 'mayor' && (
            <div className="card-huge mayor-theme">
              <div className="card-header-huge">¡PREMIO MAYOR!</div>
              <div className="card-body-huge">
                <div className="value-huge">{content.data?.valor}</div>
                <div className="number-wrapper-huge">
                    {renderNumero(content.data?.numero, content.data?.balotas, true)}
                </div>
              </div>
            </div>
          )}

          {/* GANA SIEMPRE */}
          {content.type === 'gana_siempre' && (
            <div className="card-huge gana-theme">
              <div className="card-header-huge">{content.data?.titulo || "GANA SIEMPRE"}</div>
              <div className="card-body-huge">
                <div className="value-huge">{content.data?.valor}</div>
                <div className="number-wrapper-huge">
                    {renderNumero(content.data?.numero, content.data?.balotas, true)}
                </div>
              </div>
            </div>
          )}

          {/* LISTAS (SECOS) */}
          {content.type === 'lista' && (
            <div className="card-list">
              <div className="card-header-list">{content.header}</div>
              <div className="card-body-list">
                <table className="table-prizes">
                  <tbody>
                    {content.data.map((p, idx) => (
                      <tr key={idx}>
                        <td className="td-label">{p.titulo}</td>
                        <td className="td-number">
                            {renderNumero(p.numero, p.balotas, false)}
                        </td>
                      </tr>
                    ))}
                    {content.data.length === 0 && (
                        <tr><td colSpan="2" style={{textAlign:'center', padding:'20px'}}>Por jugar...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="footer-controls">
            <div className="footer-info left">
                Act: {lastUpdate.toLocaleTimeString()}
            </div>

            <div className="footer-nav">
                <button className="nav-btn" onClick={handlePrev}>◀</button>
                <div className="nav-dots">
                    {SLIDES_CONFIG.map((s) => (
                        <span 
                            key={s.id} 
                            className={`dot ${s.id === currentSlide ? 'active' : ''}`}
                        />
                    ))}
                </div>
                <button className="nav-btn" onClick={handleNext}>▶</button>
            </div>

            <div className="footer-info right">
                Siguiente en: {timeRemaining}s
            </div>
        </footer>

      </main>
    </div>
  );
};

export default ResultadosPage;