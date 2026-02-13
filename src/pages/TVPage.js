import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import logoMoneda from '../assets/logo.png';
import textoLogo from '../assets/letras.png';
import API_URL from '../config';

const TVPage = () => {
  // --- ESTADOS ---
  const [plan, setPlan] = useState([]);
  const [config, setConfig] = useState({ id: null, numero_sorteo: '---', fecha: '---' });
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mantenemos el array de 6 para no romper la estructura, 
  // pero solo usaremos los que el premio indique.
  const [inputValues, setInputValues] = useState(Array(6).fill(""));
  const [isFocusEnabled, setIsFocusEnabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');

  const inputRefs = useRef([]);

  const currentPrize = plan[currentIndex];
  // Determinar cuántas balotas mostrar (4 o 6) basado en el backend
  const numInputs = currentPrize ? parseInt(currentPrize.cantidad_balotas) : 6;

  // --- 1. CARGA DE DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resSorteos = await axios.get(`${API_URL}/sorteos/`);
        if (resSorteos.data.length > 0) {
          const ultimoSorteo = resSorteos.data[resSorteos.data.length - 1];
          setConfig(ultimoSorteo);

          const resPlan = await axios.get(`${API_URL}/planes/${ultimoSorteo.plan_id}`);
          setPlan(resPlan.data.premios);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    fetchData();
  }, []);

  // --- 2. ENVIAR AL BACKEND (Envuelto en useCallback para evitar advertencias) ---
  const saveResult = useCallback(async () => {
    if (!config.id || !currentPrize) return;

    // Solo concatenamos los valores que están visibles en pantalla
    const rawResult = inputValues.slice(0, numInputs).join('');

    const payload = {
      sorteo_id: config.id,
      premio_titulo: currentPrize.titulo,
      numeros_ganadores: rawResult
    };

    try {
      await axios.post(`${API_URL}/resultados/`, payload);
      setSaveStatus('success');
      console.log("Resultado guardado:", rawResult);
    } catch (error) {
      console.error("Error al guardar.", error);
      setSaveStatus('error');
    }
  }, [config.id, currentPrize, inputValues, numInputs]);

  // --- 3. MANEJO DE TECLADO GLOBAL ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const key = e.key.toLowerCase();

      if (key === 'enter' || key === 'q') {
        e.preventDefault();
        setIsFocusEnabled(prev => !prev);
        return;
      }

      if (key === 'z') {
        e.preventDefault();
        saveResult();
        return;
      }

      if (key === 'arrowdown' || key === 's') {
        if (currentIndex < plan.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setInputValues(Array(6).fill(""));
          setSaveStatus('idle');
        }
      }
      if (key === 'arrowup' || key === 'w') {
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setInputValues(Array(6).fill(""));
          setSaveStatus('idle');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentIndex, plan, saveResult]); // Dependencias limpias

  // --- 4. FOCUS AUTOMÁTICO ---
  useEffect(() => {
    if (isFocusEnabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    } else if (!isFocusEnabled && document.activeElement) {
      document.activeElement.blur();
    }
  }, [isFocusEnabled, currentIndex]);

  // --- 5. EFECTO PARA PASAR AL SIGUIENTE PREMIO AUTOMÁTICAMENTE ---
  useEffect(() => {
    if (saveStatus === 'success') {
      const timer = setTimeout(() => {
        if (currentIndex < plan.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setInputValues(Array(6).fill(""));
        }
        setSaveStatus('idle');
        setIsFocusEnabled(false); 
      }, 800); 

      return () => clearTimeout(timer);
    }
  }, [saveStatus, currentIndex, plan.length]);

  // --- 6. LÓGICA DE INPUTS (BALOTAS) ---
  const handleChange = (e, index) => {
    const val = e.target.value;
    const isFifthBall = numInputs === 6 && index === 4;
    const maxLength = isFifthBall ? 2 : 1;

    if (/^\d*$/.test(val) && val.length <= maxLength) {
      const newValues = [...inputValues];
      newValues[index] = val;
      setInputValues(newValues);

      if (val.length === maxLength && index < numInputs - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleInputKeyDown = (e, index) => {
    const key = e.key.toLowerCase();

    if ((key === 'arrowleft' || key === 'a') && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1].focus();
    }

    if ((key === 'arrowright' || key === 'd') && index < numInputs - 1) {
      e.preventDefault();
      inputRefs.current[index + 1].focus();
    }

    if (key === 'backspace' && !inputValues[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // FUNCIÓN AUXILIAR: Formatear fecha sin alterar zona horaria
  const formatearFechaCO = (fechaStr) => {
    if (!fechaStr || fechaStr === '---') return '---';
    // Crear fecha asumiendo que el string ya es la hora local (agregando T00:00)
    // Esto evita la conversión a UTC que resta un día.
    const fecha = new Date(`${fechaStr}T00:00:00`); 
    return fecha.toLocaleDateString('es-CO', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="tv-container">
      <header className="main-header">
        <div className="header-column">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logoMoneda} className="coin-img-large" alt="Logo" />
            <img src={textoLogo} className="text-img-large" alt="Lotería" />
          </div>
        </div>
        <div className="header-column">
          <div className="sorteo-info-header">
            <span className="sorteo-label">SORTEO</span>
            <span className="sorteo-number">{config.numero_sorteo}</span>
            <div className="sorteo-date">
              {formatearFechaCO(config.fecha)}
            </div>
          </div>
        </div>
      </header>

      <main className="content-area">
        <div className="inputs-container">
          {inputValues.slice(0, numInputs).map((val, index) => (
            <React.Fragment key={index}>
              {numInputs === 6 && index === 4 && <div className="spacer-serie" />}
              <input
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                className="balota-esferica"
                style={{
                  fontSize: (numInputs === 6 && index === 4 && val.length > 1) ? '6vh' : '9vh',
                  cursor: isFocusEnabled ? 'text' : 'default'
                }}
                value={val}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleInputKeyDown(e, index)}
                autoComplete="off"
                readOnly={!isFocusEnabled}
              />
            </React.Fragment>
          ))}
        </div>

        <div
          className={`prize-info 
            ${isFocusEnabled ? 'animate-heartbeat' : ''} 
            ${saveStatus === 'success' ? 'animate-rotate' : ''}`
          }
        >
          <div className="prize-title">
            {currentPrize?.titulo}
          </div>
          <div className="prize-value">
            <span className="prize-symbol">$</span>
            {currentPrize?.valor}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TVPage;

