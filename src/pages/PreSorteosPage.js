import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import API_URL from '../config';

/*
  PRE-SORTEOS (PRUEBAS)
  ---------------------
  Ya NO dependen del Plan de Premios. Cada sorteo tiene entre 5 y 10
  "Pruebas" numeradas secuencialmente (1..10). Cada prueba captura un único
  resultado, con la misma lógica de balotas que un premio real:
  - 6 balotas -> 7 cifras (4 balotas de 1 dígito + serie de 2 dígitos + 1 balota)
  - 4 balotas -> 4 cifras (4 balotas de 1 dígito)

  ENDPOINTS:
  - POST   /sorteos/{numero_sorteo}/presorteos/                body: { cantidad_balotas }
  - GET    /sorteos/{numero_sorteo}/presorteos/
  - PUT    /sorteos/{numero_sorteo}/presorteos/{numero_prueba} body: { numeros_ganadores }
  - DELETE /sorteos/{numero_sorteo}/presorteos/{numero_prueba}
*/

const MAX_PRUEBAS = 10;

// Determina cuántos dígitos caben en cada balota (igual que en TVPage):
// con 6 balotas, la 5ta (índice 4) es la "serie" de 2 dígitos.
const getMaxLength = (index, numInputs) => {
  if (numInputs === 6 && index === 4) return 2;
  return 1;
};

// Reconstruye el arreglo de valores por balota a partir del string guardado.
const splitNumeroGanador = (numero, numInputs) => {
  const valores = Array(numInputs).fill('');
  if (!numero) return valores;
  let cursor = 0;
  for (let i = 0; i < numInputs; i++) {
    const len = getMaxLength(i, numInputs);
    valores[i] = numero.slice(cursor, cursor + len);
    cursor += len;
  }
  return valores;
};

const PreSorteosPage = () => {
  const [sorteo, setSorteo] = useState({ id: null, numero_sorteo: '---', fecha: '---' });
  const [pruebas, setPruebas] = useState([]);
  const [pruebaActivaNumero, setPruebaActivaNumero] = useState(null);
  const [cantidadNueva, setCantidadNueva] = useState(6); // 6 o 4, para la próxima prueba a crear
  const [inputValues, setInputValues] = useState(Array(6).fill(''));
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const inputRefs = useRef([]);

  // --- CARGA INICIAL: sorteo activo + pruebas existentes ---
  const cargarTodo = useCallback(async () => {
    try {
      const resSorteos = await axios.get(`${API_URL}/sorteos/`);
      if (resSorteos.data.length === 0) return;
      const ultimoSorteo = resSorteos.data[resSorteos.data.length - 1];
      setSorteo(ultimoSorteo);

      const resPruebas = await axios.get(`${API_URL}/sorteos/${ultimoSorteo.numero_sorteo}/presorteos/`);
      setPruebas(resPruebas.data);
      if (resPruebas.data.length > 0) {
        setPruebaActivaNumero(resPruebas.data[resPruebas.data.length - 1].numero_prueba);
      }
    } catch (error) {
      console.error('Error cargando pre-sorteos:', error);
    }
  }, []);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);

  const pruebaSeleccionada = pruebas.find((p) => p.numero_prueba === pruebaActivaNumero);
  const numInputs = pruebaSeleccionada ? (pruebaSeleccionada.cantidad_balotas === 6 ? 6 : 4) : 6;
  const numeroCifras = numInputs === 6 ? 7 : 4;

  // --- Al cambiar de prueba activa, precargamos sus valores ---
  useEffect(() => {
    if (!pruebaSeleccionada) {
      setInputValues(Array(6).fill(''));
      return;
    }
    const inputs = pruebaSeleccionada.cantidad_balotas === 6 ? 6 : 4;
    setInputValues(splitNumeroGanador(pruebaSeleccionada.numeros_ganadores, inputs));
  }, [pruebaActivaNumero, pruebaSeleccionada]);

  const refrescarPruebas = async () => {
    const resPruebas = await axios.get(`${API_URL}/sorteos/${sorteo.numero_sorteo}/presorteos/`);
    setPruebas(resPruebas.data);
    return resPruebas.data;
  };

  // --- CREAR NUEVA PRUEBA ---
  const crearNuevaPrueba = async () => {
    if (!sorteo.numero_sorteo || sorteo.numero_sorteo === '---') return;
    setCreando(true);
    setMensaje(null);
    try {
      const res = await axios.post(`${API_URL}/sorteos/${sorteo.numero_sorteo}/presorteos/`, {
        cantidad_balotas: cantidadNueva,
      });
      setPruebas((prev) => [...prev, res.data]);
      setPruebaActivaNumero(res.data.numero_prueba);
      setMensaje({ tipo: 'success', texto: `Prueba ${res.data.numero_prueba} creada.` });
    } catch (error) {
      console.error('Error creando prueba:', error);
      const detalle = error.response?.data?.detail || 'No se pudo crear la prueba.';
      setMensaje({ tipo: 'error', texto: detalle });
    } finally {
      setCreando(false);
    }
  };

  // --- ELIMINAR PRUEBA ---
  const eliminarPrueba = async (numeroPrueba) => {
    if (!window.confirm(`¿Eliminar la Prueba ${numeroPrueba}?`)) return;
    try {
      await axios.delete(`${API_URL}/sorteos/${sorteo.numero_sorteo}/presorteos/${numeroPrueba}`);
      const nuevasPruebas = pruebas.filter((p) => p.numero_prueba !== numeroPrueba);
      setPruebas(nuevasPruebas);
      if (pruebaActivaNumero === numeroPrueba) {
        setPruebaActivaNumero(nuevasPruebas.length > 0 ? nuevasPruebas[nuevasPruebas.length - 1].numero_prueba : null);
      }
    } catch (error) {
      console.error('Error eliminando prueba:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudo eliminar la prueba.' });
    }
  };

  // --- CAMBIO EN UNA BALOTA ---
  const handleChange = (index, val) => {
    const allowedLength = getMaxLength(index, numInputs);
    if (/^\d*$/.test(val) && val.length <= allowedLength) {
      setInputValues((prev) => {
        const nuevos = [...prev];
        nuevos[index] = val;
        return nuevos;
      });
      setMensaje(null);
      if (val.length === allowedLength && index < numInputs - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (key === 'arrowright' && index < numInputs - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
    if (key === 'backspace' && !inputValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (key === 'enter') {
      e.preventDefault();
      guardarResultado();
    }
  };

  // --- GUARDAR RESULTADO DE LA PRUEBA ACTIVA ---
  const guardarResultado = async () => {
    if (!pruebaSeleccionada) return;
    const numeros = inputValues.slice(0, numInputs).join('');
    if (numeros.length !== numeroCifras) {
      setMensaje({ tipo: 'error', texto: `Faltan cifras. Se esperan ${numeroCifras}.` });
      return;
    }
    try {
      await axios.put(
        `${API_URL}/sorteos/${sorteo.numero_sorteo}/presorteos/${pruebaActivaNumero}`,
        { numeros_ganadores: numeros }
      );
      await refrescarPruebas();
      setMensaje({ tipo: 'success', texto: `Prueba ${pruebaActivaNumero} guardada.` });
    } catch (error) {
      console.error('Error guardando resultado de prueba:', error);
      const detalle = error.response?.data?.detail || 'No se pudo guardar el resultado.';
      setMensaje({ tipo: 'error', texto: detalle });
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Pre-Sorteos (Pruebas)</h1>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <span style={{ color: '#ccc', fontSize: '1.3rem' }}>
          Sorteo <strong style={{ color: 'var(--color-oro)' }}>{sorteo.numero_sorteo}</strong>
        </span>
      </div>

      {/* --- SELECTOR / CREADOR DE PRUEBAS --- */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        {pruebas.map((p) => {
          const activa = p.numero_prueba === pruebaActivaNumero;
          return (
            <div key={p.numero_prueba} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setPruebaActivaNumero(p.numero_prueba)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  border: activa ? '2px solid var(--color-oro)' : '2px solid rgba(255,255,255,0.2)',
                  background: activa ? 'var(--color-oro)' : 'rgba(255,255,255,0.05)',
                  color: activa ? '#0a1a4a' : '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Prueba {p.numero_prueba}
                {p.numeros_ganadores && <span style={{ marginLeft: '6px' }}>✔</span>}
              </button>
              <button
                type="button"
                title="Eliminar prueba"
                onClick={() => eliminarPrueba(p.numero_prueba)}
                style={{ background: 'transparent', border: 'none', color: '#ff8a8a', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                🗑
              </button>
            </div>
          );
        })}
      </div>

      {/* --- CONTROLES PARA CREAR LA SIGUIENTE PRUEBA --- */}
      {pruebas.length < MAX_PRUEBAS && (
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap' }}>
          <span style={{ color: '#ccc' }}>Cifras de la próxima prueba:</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[6, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCantidadNueva(n)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: cantidadNueva === n ? '2px solid var(--color-oro)' : '2px solid rgba(255,255,255,0.2)',
                  background: cantidadNueva === n ? 'rgba(212,175,55,0.15)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                {n === 6 ? '6 balotas (7 cifras)' : '4 balotas (4 cifras)'}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={crearNuevaPrueba}
            disabled={creando}
            style={{ padding: '10px 22px' }}
          >
            + Nueva Prueba
          </button>
        </div>
      )}

      {pruebas.length >= MAX_PRUEBAS && (
        <p style={{ color: '#ffb347', marginBottom: '20px' }}>
          Ya hay {MAX_PRUEBAS} pruebas registradas para este sorteo (máximo permitido).
        </p>
      )}

      {/* --- CAPTURA DE LA PRUEBA ACTIVA --- */}
      {pruebaSeleccionada ? (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-oro)', marginBottom: '20px' }}>
            Prueba {pruebaSeleccionada.numero_prueba} · {numeroCifras} cifras
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '25px' }}>
            {inputValues.slice(0, numInputs).map((val, index) => (
              <React.Fragment key={index}>
                {numInputs === 6 && index === 4 && <div style={{ width: '20px' }} />}
                <input
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className="balota-esferica"
                  style={{
                    width: '80px',
                    height: '80px',
                    fontSize: numInputs === 6 && index === 4 && val.length > 1 ? '1.6rem' : '2.2rem',
                  }}
                  value={val}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </React.Fragment>
            ))}
          </div>

          <button className="btn btn-primary" onClick={guardarResultado} style={{ padding: '12px 30px' }}>
            Guardar Prueba {pruebaSeleccionada.numero_prueba}
          </button>
        </div>
      ) : (
        <p style={{ color: '#ccc' }}>No hay pruebas creadas todavía. Crea la primera con "+ Nueva Prueba".</p>
      )}

      {mensaje && (
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            color: mensaje.tipo === 'success' ? '#7CFC9A' : '#ff8a8a',
            fontWeight: 600,
          }}
        >
          {mensaje.texto}
        </div>
      )}
    </div>
  );
};

export default PreSorteosPage;