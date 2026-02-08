import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import logoMoneda from '../assets/logo.png';
import textoLogo from '../assets/letras.png';

const TVPage = () => {
  // --- ESTADOS ---
  const [plan, setPlan] = useState([]);
  const [config, setConfig] = useState({ id: null, numero_sorteo: '---', fecha: '---' });
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 6 Inputs visuales: 
  // Indices 0-3 -> Número (4 dígitos)
  // Index 4 -> Serie Parte 1 (2 dígitos)
  // Index 5 -> Serie Parte 2 (1 dígito)
  // Total caracteres concatenados = 7
  const [inputValues, setInputValues] = useState(Array(6).fill("")); 
  const [isFocusEnabled, setIsFocusEnabled] = useState(false); // Modo Edición
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'success', 'error'
  
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
  // CORRECCIÓN: Usar 'cantidad_balotas' en lugar de 'inputs' que no existía en el esquema
  const numInputs = currentPrize ? parseInt(currentPrize.cantidad_balotas) : 6;


  // --- 2. ENVIAR AL BACKEND ---
  const saveResult = async () => {
    if (!config.id || !currentPrize) return;

    // Concatenar: Une los 6 inputs.
    const rawResult = inputValues.join('');

    // Validación local básica
    if (rawResult.length < 4) {
      console.warn(`Longitud actual: ${rawResult.length}. Parece incompleto.`);
    }

    const payload = {
      sorteo_id: config.id,
      premio_titulo: currentPrize.titulo,
      numeros_ganadores: rawResult
    };

    try {
      await axios.post('http://localhost:8000/resultados/', payload);
      setSaveStatus('success'); 
      console.log("Resultado guardado correctamente:", rawResult);
    } catch (error) {
      console.error("Error al guardar.", error);
      if (error.response) {
          console.error("Respuesta del servidor:", error.response.data);
      }
      setSaveStatus('error');
    }
  };

  // --- 3. MANEJO DE TECLADO GLOBAL ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // ENTER / Q: Toggle Modo Edición
      if (key === 'enter' || key === 'q') {
        e.preventDefault();
        setIsFocusEnabled(prev => !prev);
        return;
      }

      // Z: Guardar Resultado
      if (key === 'z') {
        e.preventDefault();
        saveResult();
        return;
      }

      // FLECHAS ARRIBA/ABAJO o W/S: Cambiar Premio
      if (key === 'arrowdown' || key === 's') {
        if (currentIndex < plan.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setInputValues(Array(6).fill("")); // Reset inputs
          setSaveStatus('idle');
        }
      }
      if (key === 'arrowup' || key === 'w') {
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setInputValues(Array(6).fill("")); // Reset inputs
          setSaveStatus('idle');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentIndex, plan, inputValues, config]); 

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
    // La QUINTA esfera es el índice 4. Esta debe tener 2 dígitos.
    const isFifthBall = index === 4; 
    const maxLength = isFifthBall ? 2 : 1;

    if (/^\d*$/.test(val) && val.length <= maxLength) {
      const newValues = [...inputValues];
      newValues[index] = val;
      setInputValues(newValues);
      
      // Auto-focus al siguiente si se llena y no es el último input
      if (val.length === maxLength && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleInputKeyDown = (e, index) => {
    const key = e.key.toLowerCase();
    
    // Navegación Izquierda: Flecha Izquierda o 'A'
    if ((key === 'arrowleft' || key === 'a') && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1].focus();
    }
    
    // Navegación Derecha: Flecha Derecha o 'D'
    if ((key === 'arrowright' || key === 'd') && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1].focus();
    }

    // Borrar y regresar (Backspace)
    if (key === 'backspace' && !inputValues[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // --- RENDERIZADO ---
  if (!config.id) return <div className="tv-container"><h1>Cargando Sorteo...</h1></div>;

  // Estilo dinámico SOLO para el VALOR del premio
  const valueStyle = saveStatus === 'success'
    ? { 
        color: '#28a745', // Verde éxito
        textShadow: '0 0 30px #4eff70', // Brillo verde neón
        transition: 'all 0.5s ease-in-out' 
      }
    : {};

  return (
    <div className="tv-container">
      
      {/* HEADER */}
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="content-area">
        
        {/* INPUTS TIPO BALOTAS */}
        <div className="inputs-container">
          {inputValues.map((val, index) => (
            <React.Fragment key={index}>
              {/* Separador visual ANTES de la serie (Antes del índice 4) */}
              {index === 4 && <div className="spacer-serie" />}
              
              <input
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                className="balota-esferica" 
                style={{ 
                   // Si es la QUINTA balota (index 4) y tiene 2 dígitos, reducimos fuente
                   fontSize: (index === 4 && val.length > 1) ? '6vh' : '9vh',
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

        {/* INFO PREMIO */}
        <div className= {`prize-info ${isFocusEnabled ? 'animate-heartbeat' : ''}`} >
          <div className="prize-title">
            {currentPrize?.titulo}
          </div>
          
          {/* Solo cambiamos el color del valor */}
          <div className="prize-value" style={valueStyle}>
            <span className="prize-symbol" >
                $
            </span>
            {currentPrize?.valor}
          </div>
        </div>

      </main>
    </div>
  );
};

export default TVPage;
