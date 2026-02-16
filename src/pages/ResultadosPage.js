import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import logoMoneda from '../assets/logo.png';
import textoLogo from '../assets/letras.png';
import API_URL from '../config';

const UPDATE_INTERVAL_MS = 10000;
const AUTO_SLIDE_DELAY_MS = 15000; 

const SLIDES_CONFIG = [
  { id: 0, header: "$ 40 MILLONES", rango: [41, 50], type: 'lista' },
  { id: 1, header: "$ 50 MILLONES", rango: [31, 40], type: 'lista' },
  { id: 2, header: "$ 60 MILLONES", rango: [21, 30], type: 'lista' },
  { id: 3, header: "$ 80 MILLONES", rango: [11, 20], type: 'lista' },
  { id: 4, header: "$ 100 MILLONES", rango: [6, 10], type: 'lista' },
  { id: 5, header: "$ 200 MILLONES", rango: [3, 5], type: 'lista' },
  { id: 6, header: "$ 300 MILLONES", rango: [1, 2], type: 'lista' },
  { id: 7, header: "$ 2.600 MILLONES", type: 'mayor' },
  { id: 8, header: "$ 1 MILLÓN 500 MIL", type: 'gana_siempre' }
];

const ResultadosPage = () => {
  const [todosPremios, setTodosPremios] = useState([]);
  const [sorteoInfo, setSorteoInfo] = useState({ numero: '---', fecha: '' });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(UPDATE_INTERVAL_MS / 1000);
  const [slideTimeRemaining, setSlideTimeRemaining] = useState(null);
  
  // Ref para el intervalo del slide para tener control total sobre él
  const slideIntervalRef = useRef(null);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    try {
      const resSorteos = await axios.get(`${API_URL}/sorteos/`);
      if (resSorteos.data.length === 0) return;
      const ultimoSorteo = resSorteos.data[resSorteos.data.length - 1];
      setSorteoInfo({ numero: ultimoSorteo.numero_sorteo, fecha: ultimoSorteo.fecha });

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
    } catch (error) { console.error("Error:", error); }
  }, []);

  // Timer de refresco de API (Independiente)
  useEffect(() => {
    fetchData();
    const dInt = setInterval(fetchData, UPDATE_INTERVAL_MS);
    const tInt = setInterval(() => {
      setTimeRemaining(p => (p > 1 ? p - 1 : UPDATE_INTERVAL_MS / 1000));
    }, 1000);
    return () => { clearInterval(dInt); clearInterval(tInt); };
  }, [fetchData]);

  // --- LÓGICA DE CONTENIDO ---
  const content = useMemo(() => {
    const config = SLIDES_CONFIG[currentSlide];
    if (config.type === 'mayor') return { type: 'mayor', data: todosPremios.find(p => p.titulo.toLowerCase().includes('mayor')) };
    if (config.type === 'gana_siempre') return { type: 'gana_siempre', data: todosPremios.find(p => p.titulo.toLowerCase().includes('gana')) };
    
    const [min, max] = config.rango;
    const filtrados = todosPremios.filter(p => {
      const match = p.titulo.match(/(\d+)/);
      const num = match ? parseInt(match[0], 10) : 0;
      return !p.titulo.toLowerCase().includes('mayor') && !p.titulo.toLowerCase().includes('gana') && num >= min && num <= max;
    }).sort((a, b) => {
        const nA = a.titulo.match(/(\d+)/);
        const nB = b.titulo.match(/(\d+)/);
        return (nB ? parseInt(nB[0]) : 0) - (nA ? parseInt(nA[0]) : 0);
    });
    return { type: 'lista', header: config.header, data: filtrados };
  }, [currentSlide, todosPremios]);

  // --- VALIDACIÓN DE COMPLETITUD ---
  const isComplete = useMemo(() => {
    if (!content.data) return false;
    if (content.type === 'lista') {
      return content.data.length > 0 && content.data.every(p => p.numero && String(p.numero).trim() !== "");
    }
    return content.data.numero && String(content.data.numero).trim() !== "";
  }, [content]);

  // --- CONTROL DEL SLIDER (PRO) ---
  const handleNext = useCallback(() => {
    setCurrentSlide(prev => (prev < SLIDES_CONFIG.length - 1 ? prev + 1 : 0));
    setSlideTimeRemaining(null); // Reset visual inmediato
  }, []);

  useEffect(() => {
    // 1. Limpiar cualquier intervalo previo si cambia el estado o el slide
    if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
    
    // 2. Si no está completo, nos aseguramos de que el timer visual sea null y salimos
    if (!isComplete) {
      setSlideTimeRemaining(null);
      return;
    }

    // 3. Iniciamos el contador de cambio de slide
    let countdown = AUTO_SLIDE_DELAY_MS / 1000;
    setSlideTimeRemaining(countdown);

    slideIntervalRef.current = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(slideIntervalRef.current);
        handleNext();
      } else {
        setSlideTimeRemaining(countdown);
      }
    }, 1000);

    return () => { if (slideIntervalRef.current) clearInterval(slideIntervalRef.current); };
  }, [isComplete, currentSlide, handleNext]); // Solo reacciona a cambios reales de estado o de slide manual


  // --- HELPERS DE RENDER ---
  const renderNumero = (numero, cantidadBalotas, isHuge = false) => {
    if (!numero) return <span className="num-placeholder">{"-".repeat(cantidadBalotas || 4)}</span>;
    const n = String(numero);
    const principal = n.length > 4 ? n.substring(0, n.length - 3) : n;
    const serie = n.length > 4 ? n.substring(n.length - 3) : "";
    return (
      <div className={`numero-container ${isHuge ? 'huge-layout' : 'list-layout'}`}>
        <span className="num-principal">{principal}</span>
        {serie && <span className="num-serie">{serie}</span>}
      </div>
    );
  };

  return (
    <div className="layout-split">
      <aside className="sidebar-brand">
        <div className="brand-header">
          <img src={logoMoneda} className="logo-3d-small" alt="Logo" />
          <img src={textoLogo} className="logo-text-small" alt="Lotería" />
        </div>
        <div className="draw-info">
          <div className="draw-label">SORTEO</div>
          <div className="draw-number">{sorteoInfo.numero}</div>
          <div className="draw-date">{sorteoInfo.fecha}</div>
        </div>
      </aside>

      <main className="main-content">
        <div className="slider-area">
          {content.type === 'mayor' && content.data && (
            <div className="card-huge mayor-theme">
              <div className="card-header-huge">$ 2.600 MILLONES</div>
              <div className="card-body-huge">
                <div className="value-huge">{content.data.titulo}</div>
                <div className="number-wrapper-huge">{renderNumero(content.data.numero, content.data.balotas, true)}</div>
              </div>
            </div>
          )}
          {content.type === 'gana_siempre' && content.data && (
            <div className="card-list">
              <div className="card-header-list">$ 1 MILLON 500 MIL</div>
              <div className="card-body-list single-item-centered">
                <table className="table-prizes">
                  <tbody>
                    <tr>
                      <td className="td-label" style={{fontSize: '5vh', color: '#ddd'}}>{content.data.titulo}</td>
                      <td className="td-number">{renderNumero(content.data.numero, content.data.balotas, false)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {content.type === 'lista' && (
            <div className="card-list">
              <div className="card-header-list">{content.header}</div>
              <div className="card-body-list">
                <table className="table-prizes">
                  <tbody>
                    {content.data.map((p, idx) => (
                      <tr key={idx}>
                        <td className="td-label">{p.titulo}</td>
                        <td className="td-number">{renderNumero(p.numero, p.balotas, false)}</td>
                      </tr>
                    ))}
                    {content.data.length === 0 && <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px' }}>Por jugar...</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <footer className="footer-controls">
          <div className="footer-info left">
            <small>Actualización en: {timeRemaining}s</small><br/>
            <span>V: {lastUpdate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>
          </div>
          <div className="footer-nav">
            <button className="nav-btn" onClick={() => { if(slideIntervalRef.current) clearInterval(slideIntervalRef.current); setCurrentSlide(p => (p > 0 ? p - 1 : SLIDES_CONFIG.length - 1)); }}>◀</button>
            <div className="nav-dots">
              {SLIDES_CONFIG.map(s => <span key={s.id} className={`dot ${s.id === currentSlide ? 'active' : ''}`} />)}
            </div>
            <button className="nav-btn" onClick={() => { if(slideIntervalRef.current) clearInterval(slideIntervalRef.current); handleNext(); }}>▶</button>
          </div>
          <div className="footer-info right">
            {slideTimeRemaining !== null ? `Próximo slide: ${slideTimeRemaining}s` : 'Esperando resultados...'}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default ResultadosPage;