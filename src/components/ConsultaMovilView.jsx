import React, { useState, useMemo, useEffect } from 'react';
import staticConsultasData from '../data/consultasData.json';

// Formateador numérico
function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(Number(n)).toLocaleString('en-US');
}

export default function ConsultaMovilView({ onBackToDashboard }) {
  // Estados de navegación: 'bienvenida' | 'seleccion' | 'kpis'
  const [screen, setScreen] = useState('bienvenida');

  // Datos consolidados (165 dependencias activas, 7 distritos, 30 sedes)
  const [data, setData] = useState(staticConsultasData);

  // Estados de selección de filtros
  const [selectedDistrito, setSelectedDistrito] = useState('Ate');
  const [selectedSede, setSelectedSede] = useState('La merced');
  const [selectedDepId, setSelectedDepId] = useState(7028);
  const [selectedMes, setSelectedMes] = useState(9); // Setiembre por defecto
  const [selectedAnio, setSelectedAnio] = useState(2026);
  const [searchFilter, setSearchFilter] = useState('');

  // Toast de notificación
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // 1. Sedes disponibles en el distrito actual
  const sedesDelDistrito = useMemo(() => {
    if (!data || !data.sedes_por_distrito) return [];
    return data.sedes_por_distrito[selectedDistrito] || [];
  }, [data, selectedDistrito]);

  // Sede efectiva garantizada (sin desfase de estado)
  const sedeEfectiva = useMemo(() => {
    if (sedesDelDistrito.includes(selectedSede)) return selectedSede;
    return sedesDelDistrito[0] || '';
  }, [sedesDelDistrito, selectedSede]);

  // 2. Dependencias disponibles filtradas
  const dependenciasDisponibles = useMemo(() => {
    if (!data || !data.dependencias) return [];
    let list = data.dependencias.filter(d => d.distrito === selectedDistrito);
    if (sedeEfectiva) {
      list = list.filter(d => d.sede === sedeEfectiva);
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(d =>
        d.dependencia.toLowerCase().includes(q) ||
        String(d.n_dependencia).includes(q) ||
        (d.especialidad && d.especialidad.toLowerCase().includes(q))
      );
    }
    return list;
  }, [data, selectedDistrito, sedeEfectiva, searchFilter]);

  // 3. Dependencia actualmente seleccionada (Garantía de nunca ser null si hay datos)
  const dependenciaActual = useMemo(() => {
    if (!data || !data.dependencias || data.dependencias.length === 0) return null;
    const match = dependenciasDisponibles.find(d => String(d.n_dependencia) === String(selectedDepId));
    if (match) return match;
    if (dependenciasDisponibles.length > 0) return dependenciasDisponibles[0];
    return data.dependencias.find(d => d.distrito === selectedDistrito) || data.dependencias[0];
  }, [data, dependenciasDisponibles, selectedDepId, selectedDistrito]);

  // Manejo de cambio de Distrito con sincronización inmediata
  const handleDistritoChange = (nuevoDistrito) => {
    setSelectedDistrito(nuevoDistrito);
    const nuevasSedes = data?.sedes_por_distrito?.[nuevoDistrito] || [];
    const primeraSede = nuevasSedes[0] || '';
    setSelectedSede(primeraSede);
    setSearchFilter('');

    const deps = (data?.dependencias || []).filter(d =>
      d.distrito === nuevoDistrito && (!primeraSede || d.sede === primeraSede)
    );
    if (deps.length > 0) {
      setSelectedDepId(deps[0].n_dependencia);
    }
  };

  // Manejo de cambio de Sede con sincronización inmediata
  const handleSedeChange = (nuevaSede) => {
    setSelectedSede(nuevaSede);
    setSearchFilter('');
    const deps = (data?.dependencias || []).filter(d =>
      d.distrito === selectedDistrito && d.sede === nuevaSede
    );
    if (deps.length > 0) {
      setSelectedDepId(deps[0].n_dependencia);
    }
  };

  // 4. KPIs seguros del mes seleccionado
  const kpisActuales = useMemo(() => {
    if (!dependenciaActual || !dependenciaActual.meses) return null;
    const mesKey = String(selectedMes);
    const kpi = dependenciaActual.meses[mesKey] || dependenciaActual.meses[selectedMes];
    if (kpi) return kpi;
    const primerMes = Object.values(dependenciaActual.meses)[0];
    return primerMes || null;
  }, [dependenciaActual, selectedMes]);

  // Estilos del Nivel de Cumplimiento / Resolutivo
  const nivelConfig = useMemo(() => {
    const niv = String(kpisActuales?.nivel || '').toUpperCase();
    if (niv.includes('MUY BUENO')) {
      return {
        bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)',
        border: '#10b981',
        text: '#34d399',
        badgeBg: '#059669',
        icon: '▲',
        label: 'MUY BUENO',
        descripcion: 'Supera el estándar y el avance ideal proyectado'
      };
    }
    if (niv.includes('BUENO')) {
      return {
        bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%)',
        border: '#f59e0b',
        text: '#fbbf24',
        badgeBg: '#d97706',
        icon: '▶',
        label: 'BUENO',
        descripcion: 'Cumple el rango aceptable de metas judiciales'
      };
    }
    if (niv.includes('BAJO')) {
      return {
        bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.25) 100%)',
        border: '#ef4444',
        text: '#f87171',
        badgeBg: '#dc2626',
        icon: '▼',
        label: 'BAJO',
        descripcion: 'Por debajo del umbral mínimo resolutivo mensual'
      };
    }
    return {
      bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(100, 116, 139, 0.25) 100%)',
      border: '#64748b',
      text: '#94a3b8',
      badgeBg: '#475569',
      icon: '⚪',
      label: 'SIN META',
      descripcion: 'Pendiente de asignación de meta o sin turno activo'
    };
  }, [kpisActuales]);

  // Función para cerrar sesión / salir
  const handleCerrarSesion = () => {
    setScreen('bienvenida');
    setSearchFilter('');
    showToast('Sesión finalizada correctamente');
  };

  // Copiar resumen al portapapeles
  const handleCopiarResumen = () => {
    if (!dependenciaActual || !kpisActuales) return;
    const texto = `*SIMENGJ - REPORTE DE GESTIÓN JUDICIAL*
*Corte Superior de Justicia de Lima Este (CSJLE)*
------------------------------------------
🏛️ *Dependencia:* ${dependenciaActual.dependencia}
📍 *Distrito:* ${dependenciaActual.distrito}
🏢 *Sede:* ${dependenciaActual.sede}
📅 *Periodo:* ${kpisActuales.nombre_mes} ${selectedAnio}
------------------------------------------
📊 *Total de Producción:* ${fmtNum(kpisActuales.total_produccion)} expedientes
📅 *Producción del Mes:* ${fmtNum(kpisActuales.produccion_mes)} expedientes
🎯 *Meta Preliminar:* ${fmtNum(kpisActuales.meta_preliminar)}
⚡ *% de Avance:* ${kpisActuales.avance_pct}%
⏱️ *% Ideal del Mes:* ${kpisActuales.ideal_mes_pct}%
🏆 *Nivel Resolutivo:* ${kpisActuales.nivel}
------------------------------------------
_Fuente: SIMENGJ / UPD - Estadística CSJLE_`;

    navigator.clipboard.writeText(texto).then(() => {
      showToast('✓ Reporte copiado al portapapeles');
    }).catch(() => {
      showToast('✓ Texto listo');
    });
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      background: 'radial-gradient(circle at 50% 0%, #172554 0%, #090d16 65%, #030712 100%)',
      color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>

      {/* Contenedor centralizado responsive y adaptado a celulares */}
      <div style={{
        width: '100%',
        maxWidth: '540px',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-right))',
        paddingTop: 'max(14px, env(safe-area-inset-top))',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 24px) + 28px)',
        position: 'relative'
      }}>

        {/* Toast flotante */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #38bdf8',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 200ms ease'
          }}>
            {toastMessage}
          </div>
        )}

        {/* ============================================================== */}
        {/* 1. PANTALLA DE BIENVENIDA / INGRESO                            */}
        {/* ============================================================== */}
        {screen === 'bienvenida' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 8px 12px 8px'
          }}>
            {/* Cabecera institucional */}
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                marginBottom: '18px'
              }}>
                <span style={{ fontSize: '13px' }}>⚖️</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Poder Judicial del Perú
                </span>
              </div>

              <h1 style={{
                fontSize: '34px',
                fontWeight: '900',
                margin: '0 0 6px 0',
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                SIMENGJ
              </h1>

              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#38bdf8',
                marginBottom: '14px',
                letterSpacing: '0.03em',
                textTransform: 'uppercase'
              }}>
                Corte Superior de Justicia de Lima Este
              </div>

              <p style={{
                fontSize: '13px',
                color: '#94a3b8',
                lineHeight: '1.6',
                margin: '0 auto',
                maxWidth: '360px'
              }}>
                Sistema de Monitoreo y Evaluación de Niveles de Gestión Judicial. Consulta de producción, avance y metas jurisdiccionales.
              </p>
            </div>

            {/* Bento Grid de características institucionales */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '18px',
              backdropFilter: 'blur(16px)',
              margin: '20px 0'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '2px' }}>🏛️</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>165</div>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>Dependencias Activas</div>
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '2px' }}>📍</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>7</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Distritos Judiciales</div>
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '2px' }}>🏢</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>30</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Sedes de Justicia</div>
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '2px' }}>⚡</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#10b981' }}>2026</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Metas Oficiales</div>
                </div>
              </div>

              <div style={{
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '11px',
                color: '#64748b',
                textAlign: 'center'
              }}>
                Unidad de Planeamiento y Desarrollo (UPD) • Estadística CSJLE
              </div>
            </div>

            {/* Botón principal de ingreso */}
            <div style={{ marginBottom: '12px' }}>
              <button
                onClick={() => setScreen('seleccion')}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '800',
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.5)',
                  transition: 'transform 100ms ease, box-shadow 100ms ease'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span>INGRESAR AL SISTEMA</span>
                <span style={{ fontSize: '18px' }}>➔</span>
              </button>

              {onBackToDashboard && (
                <button
                  onClick={onBackToDashboard}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  Volver a versión escritorio
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. PANTALLA DE SELECTORES EN CASCADA                           */}
        {/* ============================================================== */}
        {screen === 'seleccion' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Barra superior con Cerrar Sesión */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚖️</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>
                  SIMENGJ • CSJLE
                </span>
              </div>

              {/* Botón Cerrar Sesión */}
              <button
                onClick={handleCerrarSesion}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0', color: '#ffffff' }}>
              Seleccionar Órgano Jurisdiccional
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Filtre por distrito, sede y dependencia para consultar los indicadores:
            </p>

            {/* 1. Selector de Distrito */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1', marginBottom: '6px' }}>
                📍 1. DISTRITO JUDICIAL
              </label>
              <select
                value={selectedDistrito}
                onChange={e => handleDistritoChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  background: '#131c2e',
                  border: '1.5px solid #1e3a8a',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {(data?.distritos || []).map(d => (
                  <option key={d} value={d} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Selector de Sede */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1', marginBottom: '6px' }}>
                🏢 2. SEDE JUDICIAL
              </label>
              <select
                value={sedeEfectiva}
                onChange={e => handleSedeChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  background: '#131c2e',
                  border: '1.5px solid #1e3a8a',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {sedesDelDistrito.map(s => (
                  <option key={s} value={s} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Selector de Dependencia */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1' }}>
                  🏛️ 3. ÓRGANO JURISDICCIONAL ({dependenciasDisponibles.length} activos)
                </label>
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Buscador de dependencia rápido */}
              <input
                type="text"
                placeholder="🔍 Filtrar nombre (ej: 1° Civil, Familia, MBJ...)"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  background: '#091122',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  marginBottom: '8px',
                  outline: 'none'
                }}
              />

              <select
                value={dependenciaActual?.n_dependencia || ''}
                onChange={e => setSelectedDepId(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  background: '#131c2e',
                  border: '1.5px solid #0284c7',
                  borderRadius: '12px',
                  color: '#38bdf8',
                  fontSize: '13px',
                  fontWeight: '700',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {dependenciasDisponibles.map(dep => (
                  <option key={dep.n_dependencia} value={dep.n_dependencia} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {dep.dependencia}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Selector de Mes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1', marginBottom: '8px' }}>
                📅 4. MES DE CONSULTA ({selectedAnio})
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px'
              }}>
                {(data?.meses || []).map(m => {
                  const isSelected = selectedMes === m.num;
                  const isReported = m.num <= 9;
                  return (
                    <button
                      key={m.num}
                      onClick={() => setSelectedMes(m.num)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                        background: isSelected ? '#0284c7' : isReported ? '#1e293b' : 'rgba(15,23,42,0.4)',
                        color: isSelected ? '#ffffff' : isReported ? '#e2e8f0' : '#64748b',
                        fontSize: '12px',
                        fontWeight: isSelected ? '800' : '600',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 120ms ease'
                      }}
                    >
                      <div>{m.abrev}</div>
                      {isSelected && <div style={{ fontSize: '9px', marginTop: '2px', opacity: 0.9 }}>Activo</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resumen del órgano seleccionado */}
            {dependenciaActual && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Seleccionado para consulta:
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>
                  {dependenciaActual.dependencia}
                </div>
                <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
                  Sede: {dependenciaActual.sede} • Distrito: {dependenciaActual.distrito}
                </div>
              </div>
            )}

            {/* Botón principal para ver indicadores */}
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <button
                disabled={!dependenciaActual}
                onClick={() => setScreen('kpis')}
                style={{
                  width: '100%',
                  padding: '17px 20px',
                  borderRadius: '16px',
                  border: 'none',
                  background: dependenciaActual
                    ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)'
                    : '#334155',
                  color: '#ffffff',
                  fontSize: '15.5px',
                  fontWeight: '800',
                  letterSpacing: '0.02em',
                  cursor: dependenciaActual ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: dependenciaActual ? '0 10px 25px -5px rgba(2, 132, 199, 0.5)' : 'none'
                }}
              >
                <span>CONSULTAR INDICADORES</span>
                <span style={{ fontSize: '18px' }}>📊</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. PANTALLA DE KPIS Y RESULTADOS (BLINDADA CONTRA PANTALLA NEGRA) */}
        {/* ============================================================== */}
        {screen === 'kpis' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* Si no hay datos, mostrar alerta elegante con botón volver */}
            {(!dependenciaActual || !kpisActuales) ? (
              <div style={{
                background: '#1e293b',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                margin: 'auto 0'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
                <h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '8px' }}>
                  No se encontraron indicadores
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
                  No se pudieron cargar los datos del mes seleccionado para este órgano judicial.
                </p>
                <button
                  onClick={() => setScreen('seleccion')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: '#0284c7',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Volver a Filtros
                </button>
              </div>
            ) : (
              <div>
                {/* Barra de navegación superior con Cerrar Sesión */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '14px'
                }}>
                  <button
                    onClick={() => setScreen('seleccion')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>←</span>
                    <span>Filtros</span>
                  </button>

                  <button
                    onClick={handleCopiarResumen}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: '10px',
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>📋</span>
                    <span>Copiar</span>
                  </button>

                  <button
                    onClick={handleCerrarSesion}
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      borderRadius: '10px',
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🚪</span>
                    <span>Salir</span>
                  </button>
                </div>

                {/* Tarjeta de identificación del órgano jurisdiccional */}
                <div style={{
                  background: 'linear-gradient(145deg, #131c2e 0%, #0d1525 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  marginBottom: '14px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase'
                    }}>
                      {dependenciaActual.distrito}
                    </span>

                    <span style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#cbd5e1',
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {dependenciaActual.sede}
                    </span>

                    <span style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      color: '#38bdf8',
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {dependenciaActual.categoria}
                    </span>
                  </div>

                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    margin: '0 0 6px 0',
                    color: '#ffffff',
                    lineHeight: '1.35'
                  }}>
                    {dependenciaActual.dependencia}
                  </h2>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8' }}>
                    <span>Cód: #{dependenciaActual.n_dependencia} • {dependenciaActual.tipo_organo}</span>
                    <span style={{ color: '#38bdf8', fontWeight: '700' }}>
                      {kpisActuales.nombre_mes} {selectedAnio}
                    </span>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* KPI 1: NIVEL RESOLUTIVO O CUMPLIMIENTO                         */}
                {/* ============================================================== */}
                <div style={{
                  background: nivelConfig.bg,
                  border: `2px solid ${nivelConfig.border}`,
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                }}>
                  <div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      color: nivelConfig.text,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}>
                      NIVEL RESOLUTIVO / CUMPLIMIENTO
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '900',
                      color: nivelConfig.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{nivelConfig.icon}</span>
                      <span>{nivelConfig.label}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: nivelConfig.text, opacity: 0.9, marginTop: '2px' }}>
                      {nivelConfig.descripcion}
                    </div>
                  </div>

                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: nivelConfig.badgeBg,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                  }}>
                    {nivelConfig.icon}
                  </div>
                </div>

                {/* ============================================================== */}
                {/* GRILLA DE KPIS OBLIGATORIOS (2 COLUMNAS)                        */}
                {/* ============================================================== */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>

                  {/* KPI 2: TOTAL DE PRODUCCIÓN */}
                  <div style={{
                    background: '#131c2e',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                      📈 Total Producción
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8', letterSpacing: '-0.02em' }}>
                      {fmtNum(kpisActuales.total_produccion)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      Acumulado a {kpisActuales.abrev_mes}
                    </div>
                  </div>

                  {/* KPI 3: PRODUCCIÓN DEL MES */}
                  <div style={{
                    background: '#131c2e',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                      📅 Producción Mes
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', letterSpacing: '-0.02em' }}>
                      {fmtNum(kpisActuales.produccion_mes)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      Resueltos en {kpisActuales.abrev_mes}
                    </div>
                  </div>

                  {/* KPI 4: META PRELIMINAR */}
                  <div style={{
                    background: '#131c2e',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                      🎯 Meta Preliminar
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#fbbf24', letterSpacing: '-0.02em' }}>
                      {fmtNum(kpisActuales.meta_preliminar)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      {kpisActuales.marco}
                    </div>
                  </div>

                  {/* KPI 5: % IDEAL DEL MES */}
                  <div style={{
                    background: '#131c2e',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                      ⏱️ % Ideal Mes
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#cbd5e1', letterSpacing: '-0.02em' }}>
                      {kpisActuales.ideal_mes_pct}%
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      Esperado al mes
                    </div>
                  </div>

                </div>

                {/* ============================================================== */}
                {/* KPI 6: % DE AVANCE CON BARRA PROGRESIVA                        */}
                {/* ============================================================== */}
                <div style={{
                  background: '#131c2e',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff' }}>
                        ⚡ % DE AVANCE ALCANZADO
                      </span>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Producción acumulada vs Meta
                      </div>
                    </div>

                    <span style={{
                      fontSize: '28px',
                      fontWeight: '900',
                      color: kpisActuales.avance_pct >= kpisActuales.ideal_mes_pct ? '#10b981' : '#f59e0b'
                    }}>
                      {kpisActuales.avance_pct}%
                    </span>
                  </div>

                  {/* Barra de progreso visual con marcador de % ideal */}
                  <div style={{
                    height: '14px',
                    background: '#090d16',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, kpisActuales.avance_pct)}%`,
                      background: kpisActuales.avance_pct >= kpisActuales.ideal_mes_pct
                        ? 'linear-gradient(90deg, #059669 0%, #10b981 100%)'
                        : 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)',
                      borderRadius: '9999px',
                      transition: 'width 500ms ease'
                    }} />

                    {/* Marcador del Ideal */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${Math.min(99, kpisActuales.ideal_mes_pct)}%`,
                      width: '2px',
                      background: '#ffffff',
                      boxShadow: '0 0 6px #ffffff'
                    }} title={`Ideal: ${kpisActuales.ideal_mes_pct}%`} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748b', marginTop: '6px' }}>
                    <span>0%</span>
                    <span style={{ color: '#ffffff', fontWeight: '700' }}>
                      Ideal: {kpisActuales.ideal_mes_pct}%
                    </span>
                    <span>100%</span>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* EVOLUCIÓN HISTÓRICA MES A MES                                  */}
                {/* ============================================================== */}
                <div style={{
                  background: '#131c2e',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '14px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff' }}>
                      📊 PRODUCCIÓN MENSUAL {selectedAnio}
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: '600' }}>
                      Toca un mes para cambiar
                    </span>
                  </div>

                  {/* Selector interactivo de meses */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '5px'
                  }}>
                    {(dependenciaActual.historial_mensual || []).slice(0, 12).map(h => {
                      const isSelected = h.mes === selectedMes;
                      const esMayor = h.produccion > 0;
                      return (
                        <button
                          key={h.mes}
                          onClick={() => setSelectedMes(h.mes)}
                          style={{
                            background: isSelected ? '#0284c7' : esMayor ? '#1e293b' : 'rgba(15,23,42,0.5)',
                            border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '8px',
                            padding: '6px 2px',
                            color: isSelected ? '#ffffff' : esMayor ? '#f8fafc' : '#64748b',
                            cursor: 'pointer',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            transition: 'all 100ms'
                          }}
                        >
                          <span style={{ fontSize: '10px', fontWeight: '700' }}>{h.abrev}</span>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: isSelected ? '#ffffff' : '#38bdf8' }}>
                            {fmtNum(h.produccion)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ============================================================== */}
                {/* BOTONES DE ACCIÓN RÁPIDA                                      */}
                {/* ============================================================== */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    onClick={() => setScreen('seleccion')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🔍</span>
                    <span>Otra Dependencia</span>
                  </button>

                  <button
                    onClick={handleCopiarResumen}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#0284c7',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>📤</span>
                    <span>Compartir</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
