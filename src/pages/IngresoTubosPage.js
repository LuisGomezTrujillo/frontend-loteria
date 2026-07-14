import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import API_URL from '../config';

/*
  REGLAS DEL SORTEO (26 tubos en total, 6 urnas):
  - Urnas 1 a 4: un tubo cualquiera entre 1 y 17 (cada tubo trae balotas 0-9).
    Los 4 tubos elegidos deben ser distintos entre sí.
  - Urna 5: uno de 3 conjuntos fijos de 3 tubos: [18-19-20] [21-22-23] [24-25-26]
    (cada conjunto trae balotas 00-39). Se captura escribiendo cualquiera de los
    3 números del conjunto deseado y el formulario deriva el conjunto completo.
  - Urna 6: un tubo entre 1 y 17 que NO haya sido usado en las urnas 1 a 4.

  ENDPOINT: POST/PUT `${API_URL}/sorteos/{numero_sorteo}/tubos/`
  (se identifica el sorteo por su código numero_sorteo, no por el id interno).

  DISEÑO DE CAJAS: todas las cajas (urnas 1-6) miden lo mismo: 3 renglones
  de igual altura. Las urnas 1,2,3,4 y 6 solo usan el renglón inferior
  (los 2 de arriba quedan vacíos, solo para igualar el tamaño). La urna 5
  usa los 3 renglones para mostrar, uno por renglón, cada número del
  conjunto seleccionado (ej. 18 / 19 / 20), con el mismo tamaño de letra
  que las demás cajas.
*/

const CONJUNTOS_URNA5 = [
  { tubos: [18, 19, 20], label: '18-19-20' },
  { tubos: [21, 22, 23], label: '21-22-23' },
  { tubos: [24, 25, 26], label: '24-25-26' },
];

const CAMPOS = ['urna1', 'urna2', 'urna3', 'urna4', 'urna5', 'urna6'];

// Alto de cada renglón (los 3 renglones de todas las cajas miden lo mismo).
const ALTURA_RENGLON = 48; // px
const TAMANO_FUENTE = '1.8rem';

const getConjuntoUrna5 = (valor) => {
  const num = parseInt(valor, 10);
  if (isNaN(num)) return null;
  return CONJUNTOS_URNA5.find((c) => c.tubos.includes(num)) || null;
};

// Convierte un label guardado ("18-19-20") de vuelta en un número
// representativo para precargar el input de la urna 5.
const labelUrna5ANumero = (label) => {
  if (!label) return '';
  const primero = label.split('-')[0];
  return primero || '';
};

const IngresoTubosPage = () => {
  const [config, setConfig] = useState({ id: null, numero_sorteo: '---', fecha: '---' });
  const [valores, setValores] = useState({
    urna1: '', urna2: '', urna3: '', urna4: '', urna5: '', urna6: '',
  });
  const [errores, setErrores] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | success | error
  const [tieneConfigPrevia, setTieneConfigPrevia] = useState(false);
  const [campoFocado, setCampoFocado] = useState(null);

  const inputRefs = useRef({});

  // --- CARGA DEL SORTEO ACTIVO ---
  useEffect(() => {
    const fetchSorteo = async () => {
      try {
        const resSorteos = await axios.get(`${API_URL}/sorteos/`);
        if (resSorteos.data.length > 0) {
          setConfig(resSorteos.data[resSorteos.data.length - 1]);
        }
      } catch (error) {
        console.error('Error cargando el sorteo:', error);
      }
    };
    fetchSorteo();
  }, []);

  // --- PRECARGA DE TUBOS YA GUARDADOS PARA ESTE SORTEO (si existen) ---
  useEffect(() => {
    if (!config.numero_sorteo || config.numero_sorteo === '---') return;

    const fetchTubos = async () => {
      try {
        const res = await axios.get(`${API_URL}/sorteos/${config.numero_sorteo}/tubos/`);
        const t = res.data;
        setValores({
          urna1: t.tubo_urna1 ?? '',
          urna2: t.tubo_urna2 ?? '',
          urna3: t.tubo_urna3 ?? '',
          urna4: t.tubo_urna4 ?? '',
          urna5: labelUrna5ANumero(t.tubos_urna5),
          urna6: t.tubo_urna6 ?? '',
        });
        setTieneConfigPrevia(true);
      } catch (error) {
        // 404 es esperado si el sorteo aún no tiene tubos configurados
        if (error.response?.status !== 404) {
          console.error('Error cargando los tubos del sorteo:', error);
        }
        setTieneConfigPrevia(false);
      }
    };
    fetchTubos();
  }, [config.numero_sorteo]);

  // --- VALIDACIÓN ---
  const validar = useCallback((vals) => {
    const errs = {};
    const clavesSimples = ['urna1', 'urna2', 'urna3', 'urna4', 'urna6'];

    clavesSimples.forEach((k) => {
      const raw = vals[k];
      if (raw === '') { errs[k] = 'Requerido'; return; }
      const num = parseInt(raw, 10);
      if (isNaN(num) || num < 1 || num > 17) {
        errs[k] = 'Tubo 1-17';
      }
    });

    const conteo = {};
    clavesSimples.forEach((k) => {
      const num = parseInt(vals[k], 10);
      if (!isNaN(num)) conteo[num] = [...(conteo[num] || []), k];
    });
    Object.values(conteo).forEach((claves) => {
      if (claves.length > 1) {
        claves.forEach((k) => { errs[k] = 'Tubo repetido'; });
      }
    });

    if (vals.urna5 === '') {
      errs.urna5 = 'Requerido';
    } else if (!getConjuntoUrna5(vals.urna5)) {
      errs.urna5 = 'Tubo 18-26';
    }

    return errs;
  }, []);

  useEffect(() => {
    setErrores(validar(valores));
  }, [valores, validar]);

  // --- MANEJO DE CAMBIOS ---
  const handleChange = (campo, val) => {
    if (/^\d{0,2}$/.test(val)) {
      setValores((prev) => ({ ...prev, [campo]: val }));
      setSaveStatus('idle');
    }
  };

  // --- NAVEGACIÓN POR TECLADO ---
  const handleKeyDown = (e, index) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowright' || key === 'enter' || key === 'tab') {
      if (key !== 'tab') e.preventDefault();
      const next = CAMPOS[index + 1];
      if (next) inputRefs.current[next]?.focus();
      else handleSubmit();
    }
    if (key === 'arrowleft') {
      const prev = CAMPOS[index - 1];
      if (prev) inputRefs.current[prev]?.focus();
    }
    if (key === 'backspace' && !valores[CAMPOS[index]] && index > 0) {
      inputRefs.current[CAMPOS[index - 1]]?.focus();
    }
  };

  // --- GUARDAR ---
  const handleSubmit = async () => {
    const errs = validar(valores);
    setErrores(errs);
    if (Object.keys(errs).length > 0 || !config.numero_sorteo || config.numero_sorteo === '---') {
      setSaveStatus('error');
      return;
    }

    const conjuntoUrna5 = getConjuntoUrna5(valores.urna5);

    // Payload plano, con los nombres exactos que espera el backend.
    const payload = {
      tubo_urna1: valores.urna1,
      tubo_urna2: valores.urna2,
      tubo_urna3: valores.urna3,
      tubo_urna4: valores.urna4,
      tubos_urna5: conjuntoUrna5.label,
      tubo_urna6: valores.urna6,
    };

    const url = `${API_URL}/sorteos/${config.numero_sorteo}/tubos/`;

    try {
      if (tieneConfigPrevia) {
        await axios.put(url, payload);
      } else {
        await axios.post(url, payload);
      }
      setTieneConfigPrevia(true);
      setSaveStatus('success');
    } catch (error) {
      console.error('Error guardando los tubos:', error);
      setSaveStatus('error');
    }
  };

  const formatearFechaCO = (fechaStr) => {
    if (!fechaStr || fechaStr === '---') return '---';
    const fecha = new Date(`${fechaStr}T00:00:00`);
    return fecha.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // --- Estilos de la "caja" de cada urna (3 renglones iguales para todas) ---
  const estiloCaja = (tieneError, focado) => ({
    position: 'relative',
    height: ALTURA_RENGLON * 3,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    border: `2px solid ${tieneError ? '#ff4d4f' : focado ? 'var(--color-oro)' : 'rgba(255,255,255,0.18)'}`,
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    boxShadow: focado ? '0 0 8px rgba(212,175,55,0.5)' : 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    overflow: 'hidden',
  });

  const estiloRenglon = {
    height: ALTURA_RENGLON,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: TAMANO_FUENTE,
    fontWeight: 700,
    color: '#fff',
    lineHeight: `${ALTURA_RENGLON}px`,
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Tubos por Urna</h1>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <span style={{ color: '#ccc', fontSize: '1.3rem' }}>
          Sorteo <strong style={{ color: 'var(--color-oro)' }}>{config.numero_sorteo}</strong>
          {' · '}
          {formatearFechaCO(config.fecha)}
        </span>
      </div>

      <div className="tubos-grid">
        {CAMPOS.map((campo, index) => {
          const esUrna5 = campo === 'urna5';
          const conjunto = esUrna5 ? getConjuntoUrna5(valores.urna5) : null;
          const tieneError = !!errores[campo] && valores[campo] !== '';
          const focado = campoFocado === campo;

          return (
            <div key={campo} className="tubo-columna">
              <div className="tubo-label">URNA {index + 1}</div>

              <div className="tubo-caja" style={estiloCaja(tieneError, focado)}>
                {esUrna5 ? (
                  // Los 3 renglones muestran, cada uno, un número del conjunto
                  [0, 1, 2].map((i) => (
                    <div key={i} style={estiloRenglon}>
                      {conjunto ? conjunto.tubos[i] : '\u00A0'}
                    </div>
                  ))
                ) : (
                  <>
                    {/* Renglones vacíos, solo para igualar el alto con las demás cajas */}
                    <div style={estiloRenglon}>{'\u00A0'}</div>
                    <div style={estiloRenglon}>{'\u00A0'}</div>
                    <div style={estiloRenglon}>{valores[campo] || '\u00A0'}</div>
                  </>
                )}

                {/* Input real: invisible, cubre toda la caja para capturar
                    clic/foco/tecleo; lo que se ve son los renglones de arriba. */}
                <input
                  ref={(el) => { inputRefs.current[campo] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={valores[campo]}
                  onChange={(e) => handleChange(campo, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={() => setCampoFocado(campo)}
                  onBlur={() => setCampoFocado((c) => (c === campo ? null : c))}
                  className="tubo-input"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    border: 0,
                    padding: 0,
                    margin: 0,
                    cursor: 'text',
                  }}
                />
              </div>

              <div className="tubo-error-text">
                {valores[campo] !== '' && errores[campo] ? errores[campo] : '\u00A0'}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={handleSubmit}>
          {tieneConfigPrevia ? 'Actualizar Tubos del Sorteo' : 'Guardar Tubos del Sorteo'}
        </button>
        <div className={`tubo-estado ${saveStatus}`}>
          {saveStatus === 'success' && 'Guardado correctamente.'}
          {saveStatus === 'error' && 'Revisa los campos marcados en rojo.'}
          {saveStatus === 'idle' && 'Enter o → avanza al siguiente campo. Enter en el último campo guarda.'}
        </div>
      </div>
    </div>
  );
};

export default IngresoTubosPage;