import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import logoMoneda from '../assets/logo.png';
import textoLogo from '../assets/letras.png';

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

  // --- 1. CARGA DE DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resSorteos = await axios.get('http://localhost:8000/sorteos/');
        if (resSorteos.data.length > 0) {
          const ultimoSorteo = resSorteos.data[resSorteos.data.length - 1];
          setConfig(ultimoSorteo);

          const resPlan = await axios.get(`http://localhost:8000/planes/${ultimoSorteo.plan_id}`);
          setPlan(resPlan.data.premios);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    fetchData();
  }, []);

  const currentPrize = plan[currentIndex];
  // Determinar cuántas balotas mostrar (4 o 6) basado en el backend
  const numInputs = currentPrize ? parseInt(currentPrize.cantidad_balotas) : 6;

  // --- 2. ENVIAR AL BACKEND ---
  const saveResult = async () => {
    if (!config.id || !currentPrize) return;

    // Solo concatenamos los valores que están visibles en pantalla
    const rawResult = inputValues.slice(0, numInputs).join('');

    const payload = {
      sorteo_id: config.id,
      premio_titulo: currentPrize.titulo,
      numeros_ganadores: rawResult
    };

    try {
      await axios.post('http://localhost:8000/resultados/', payload);
      setSaveStatus('success'); 
      console.log("Resultado guardado:", rawResult);
    } catch (error) {
      console.error("Error al guardar.", error);
      setSaveStatus('error');
    }
  };

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
  }, [currentIndex, plan, inputValues, config, numInputs]); 

  // --- 4. FOCUS AUTOMÁTICO ---
  useEffect(() => {
    if (isFocusEnabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    } else if (!isFocusEnabled && document.activeElement) {
      document.activeElement.blur();
    }
  }, [isFocusEnabled, currentIndex]);

  // --- 5. LÓGICA DE INPUTS (BALOTAS) ---
  const handleChange = (e, index) => {
    const val = e.target.value;
    // La lógica de la serie (2 dígitos) solo aplica si el premio es de 6 balotas e index 4
    const isFifthBall = numInputs === 6 && index === 4; 
    const maxLength = isFifthBall ? 2 : 1;

    if (/^\d*$/.test(val) && val.length <= maxLength) {
      const newValues = [...inputValues];
      newValues[index] = val;
      setInputValues(newValues);
      
      // Auto-focus al siguiente solo si existe dentro del rango actual
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
    
    // Navegación derecha limitada por numInputs
    if ((key === 'arrowright' || key === 'd') && index < numInputs - 1) {
      e.preventDefault();
      inputRefs.current[index + 1].focus();
    }

    if (key === 'backspace' && !inputValues[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // --- RENDERIZADO ---
  if (!config.id) return <div className="tv-container"><h1>Cargando Sorteo...</h1></div>;

  const valueStyle = saveStatus === 'success'
    ? { color: '#28a745', textShadow: '0 0 30px #4eff70', transition: 'all 0.5s ease-in-out' }
    : {};

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
            <div className="sorteo-date" style={{ textTransform: 'capitalize' }}>
              {new Date(config.fecha).toLocaleDateString('es-CO', { dateStyle: 'long' })}
            </div>
          </div>
        </div>
      </header>

      <main className="content-area">
        
        <div className="inputs-container">
          {/* Solo mapeamos hasta numInputs (4 o 6) */}
          {inputValues.slice(0, numInputs).map((val, index) => (
            <React.Fragment key={index}>
              {/* Separador de serie solo si es el premio de 6 balotas */}
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

        <div className={`prize-info ${isFocusEnabled ? 'animate-heartbeat' : ''}`} >
          <div className="prize-title">
            {currentPrize?.titulo}
          </div>
          
          <div className="prize-value" style={valueStyle}>
            <span className="prize-symbol">$</span>
            {currentPrize?.valor}
          </div>
        </div>

      </main>
    </div>
  );
};

export default TVPage;
