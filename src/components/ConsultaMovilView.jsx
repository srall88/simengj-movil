import React, { useState, useMemo, useEffect } from 'react';
import staticConsultasData from '../data/consultasData.json';

// Formato numérico con comas de miles
function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(Number(n)).toLocaleString('en-US');
}

export default function ConsultaMovilView({ onBackToDashboard }) {
  // Estado de navegación: 'bienvenida' | 'seleccion' | 'kpis'
  const [screen, setScreen] = useState('bienvenida');

  // Datos globales
  const [data, setData] = useState(staticConsultasData);
  const [loading, setLoading] = useState(false);

  // Estados de selección
  const [selectedDistrito, setSelectedDistrito] = useState('Ate');
  const [selectedSede, setSelectedSede] = useState('');
  const [selectedDepId, setSelectedDepId] = useState(null);
  const [selectedMes, setSelectedMes] = useState(9); // Default Setiembre
  const [selectedAnio, setSelectedAnio] = useState(2026);
  const [searchFilter, setSearchFilter] = useState('');

  // Notificación de copiado
  const [copied, setCopied] = useState(false);

  // Intentar sincronizar datos frescos desde API local si está disponible
  useEffect(() => {
    fetch('/api/consulta-movil/datos?anio=2026')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setData(json.data);
        }
      })
      .catch(() => {
        // En Vercel o sin backend usa staticConsultasData perfectamente
      });
  }, []);

  // Sedes disponibles según distrito seleccionado
  const sedesDisponibles = useMemo(() => {
    if (!data || !data.sedes_por_distrito) return [];
    if (!selectedDistrito) return [];
    return data.sedes_por_distrito[selectedDistrito] || [];
  }, [data, selectedDistrito]);

  // Si cambia el distrito, auto-seleccionar la primera sede o 'TODAS'
  useEffect(() => {
    if (sedesDisponibles.length > 0) {
      if (!selectedSede || !sedesDisponibles.includes(selectedSede)) {
        setSelectedSede(sedesDisponibles[0]);
      }
    } else {
      setSelectedSede('');
    }
  }, [sedesDisponibles, selectedSede]);

  // Dependencias filtradas por Distrito y Sede (y búsqueda opcional)
  const dependenciasDisponibles = useMemo(() => {
    if (!data || !data.dependencias) return [];
    let list = data.dependencias;

    if (selectedDistrito) {
      list = list.filter(d => d.distrito === selectedDistrito);
    }
    if (selectedSede) {
      list = list.filter(d => d.sede === selectedSede);
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
  }, [data, selectedDistrito, selectedSede, searchFilter]);

  // Auto-seleccionar primera dependencia si no hay seleccionada
  useEffect(() => {
    if (dependenciasDisponibles.length > 0) {
      const existe = dependenciasDisponibles.some(d => d.n_dependencia === selectedDepId);
      if (!existe) {
        setSelectedDepId(dependenciasDisponibles[0].n_dependencia);
      }
    } else {
      setSelectedDepId(null);
    }
  }, [dependenciasDisponibles, selectedDepId]);

  // Dependencia actualmente seleccionada
  const dependenciaActual = useMemo(() => {
    if (!data || !data.dependencias || !selectedDepId) return null;
    return data.dependencias.find(d => d.n_dependencia === selectedDepId) || null;
  }, [data, selectedDepId]);

  // KPIs del mes seleccionado para la dependencia
  const kpisActuales = useMemo(() => {
    if (!dependenciaActual || !dependenciaActual.meses) return null;
    return dependenciaActual.meses[selectedMes] || null;
  }, [dependenciaActual, selectedMes]);

  // Estilos del Nivel de Cumplimiento / Resolutivo
  const nivelConfig = useMemo(() => {
    const niv = String(kpisActuales?.nivel || '').toUpperCase();
    if (niv.includes('MUY BUENO')) {
      return {
        bg: '#ecfdf5',
        border: '#10b981',
        text: '#065f46',
        badgeBg: '#10b981',
        icon: '▲',
        label: 'MUY BUENO',
        descripcion: 'Supera el estándar y el avance ideal proyectado'
      };
    }
    if (niv.includes('BUENO')) {
      return {
        bg: '#fffbeb',
        border: '#f59e0b',
        text: '#92400e',
        badgeBg: '#f59e0b',
        icon: '▶',
        label: 'BUENO',
        descripcion: 'Cumple el rango aceptable de metas judiciales'
      };
    }
    if (niv.includes('BAJO')) {
      return {
        bg: '#fef2f2',
        border: '#ef4444',
        text: '#991b1b',
        badgeBg: '#ef4444',
        icon: '▼',
        label: 'BAJO',
        descripcion: 'Por debajo del umbral mínimo resolutivo mensual'
      };
    }
    return {
      bg: '#f8fafc',
      border: '#94a3b8',
      text: '#475569',
      badgeBg: '#94a3b8',
      icon: '⚪',
      label: 'SIN META',
      descripcion: 'Pendiente de asignación de meta o sin turno activo'
    };
  }, [kpisActuales]);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#090d16',
      color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      boxShadow: '0 0 40px rgba(0,0,0,0.6)',
      position: 'relative',
      overflowX: 'hidden'
    }}>

      {/* ============================================================== */}
      {/* 1. PANTALLA DE BIENVENIDA / INGRESO                            */}
      {/* ============================================================== */}
      {screen === 'bienvenida' && (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '32px 24px',
          background: 'radial-gradient(circle at 50% 20%, #1e293b 0%, #090d16 80%)'
        }}>
          {/* Cabecera institucional */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '13px' }}>⚖️</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Poder Judicial del Perú
              </span>
            </div>

            <h1 style={{
              fontSize: '32px',
              fontWeight: '900',
              margin: '0 0 8px 0',
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              SIMENGJ
            </h1>

            <p style={{
              fontSize: '13.5px',
              fontWeight: '600',
              color: '#38bdf8',
              margin: '0 0 16px 0',
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}>
              Corte Superior de Justicia de Lima Este
            </p>

            <p style={{
              fontSize: '13px',
              color: '#94a3b8',
              lineHeight: '1.6',
              maxWidth: '340px',
              margin: '0 auto'
            }}>
              Sistema de Monitoreo y Evaluación de Niveles de Gestión Judicial. Consulta de producción, metas y cumplimiento al instante.
            </p>
          </div>

          {/* Tarjeta de características rápidas */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            margin: '24px 0'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>🏛️</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                  {data?.dependencias?.length || 165}
                </div>
                <div style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: '600' }}>Dependencias Activas</div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>📍</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>7</div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Distritos Judiciales</div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>🏢</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>30</div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Sedes de Justicia</div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>⚡</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>2026</div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Datos Oficiales</div>
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
          <div>
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

            {/* Enlace para descargar APK móvil Android */}
            <a
              href="/descargar-apk"
              download="SIMENGJ_CSJLE_v1.0.apk"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                marginTop: '12px',
                padding: '13px 18px',
                borderRadius: '14px',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#38bdf8',
                fontSize: '12.5px',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textAlign: 'center'
              }}
            >
              <span>📲</span>
              <span>Descargar APK Android Oficial (.apk)</span>
            </a>

            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                style={{
                  width: '100%',
                  marginTop: '10px',
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
                Volver a la versión de escritorio
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. PANTALLA DE SELECTORES (DISTRITO, SEDE, DEP, FECHA)         */}
      {/* ============================================================== */}
      {screen === 'seleccion' && (
        <div style={{ padding: '20px 18px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Barra superior */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button
              onClick={() => setScreen('bienvenida')}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>←</span>
              <span>Inicio</span>
            </button>

            <span style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8' }}>
              SIMENGJ MÓVIL
            </span>

            <span style={{
              fontSize: '11px',
              padding: '3px 8px',
              background: '#0284c7',
              borderRadius: '9999px',
              color: '#ffffff',
              fontWeight: '700'
            }}>
              Año {selectedAnio}
            </span>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Seleccionar Parámetros
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 20px 0' }}>
            Elija el Distrito, Sede, Dependencia y la fecha a consultar:
          </p>

          {/* 1. Selector de Distrito */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#cbd5e1', marginBottom: '6px' }}>
              📍 1. DISTRITO JUDICIAL
            </label>
            <select
              value={selectedDistrito}
              onChange={e => setSelectedDistrito(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#131c2e',
                border: '1.5px solid #1e3a8a',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '14px',
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
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#cbd5e1', marginBottom: '6px' }}>
              🏢 2. SEDE JUDICIAL
            </label>
            <select
              value={selectedSede}
              onChange={e => setSelectedSede(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#131c2e',
                border: '1.5px solid #1e3a8a',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {sedesDisponibles.map(s => (
                <option key={s} value={s} style={{ background: '#0f172a', color: '#ffffff' }}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Selector de Dependencia */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#cbd5e1' }}>
                🏛️ 3. DEPENDENCIA ({dependenciasDisponibles.length})
              </label>
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '11px', cursor: 'pointer' }}
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>

            {/* Buscador de dependencia */}
            <input
              type="text"
              placeholder="🔍 Filtrar nombre (ej: 1° Civil, Familia...)"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                background: '#091122',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                marginBottom: '8px',
                outline: 'none'
              }}
            />

            <select
              value={selectedDepId || ''}
              onChange={e => setSelectedDepId(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#131c2e',
                border: '1.5px solid #0284c7',
                borderRadius: '12px',
                color: '#38bdf8',
                fontSize: '13.5px',
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

          {/* 4. Selector de Fecha de Consulta */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#cbd5e1', marginBottom: '8px' }}>
              📅 4. FECHA DE CONSULTA (MES)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px'
            }}>
              {(data?.meses || []).map(m => {
                const isSelected = selectedMes === m.num;
                const isReported = m.num <= 9; // Enero a Setiembre con datos
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
                      transition: 'all 100ms'
                    }}
                  >
                    <div>{m.abrev}</div>
                    {isSelected && <div style={{ fontSize: '9px', marginTop: '2px', opacity: 0.9 }}>Activo</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón de consultar */}
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button
              disabled={!dependenciaActual}
              onClick={() => setScreen('kpis')}
              style={{
                width: '100%',
                padding: '18px 24px',
                borderRadius: '16px',
                border: 'none',
                background: dependenciaActual ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : '#334155',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '800',
                cursor: dependenciaActual ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: dependenciaActual ? '0 10px 25px -5px rgba(2, 132, 199, 0.5)' : 'none'
              }}
            >
              <span>CONSULTAR INDICADORES</span>
              <span>📊</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. PANTALLA DE KPIS Y RESULTADOS                               */}
      {/* ============================================================== */}
      {screen === 'kpis' && dependenciaActual && kpisActuales && (
        <div style={{ padding: '16px', minHeight: '100vh', paddingBottom: '80px' }}>
          {/* Barra de navegación superior */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <button
              onClick={() => setScreen('seleccion')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>←</span>
              <span>Filtros</span>
            </button>

            <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '600' }}>
              CSJLE • ESTADÍSTICA
            </span>

            <button
              onClick={handleCopiarResumen}
              style={{
                background: copied ? '#10b981' : 'rgba(56, 189, 248, 0.15)',
                border: copied ? '1px solid #10b981' : '1px solid rgba(56, 189, 248, 0.3)',
                color: copied ? '#ffffff' : '#38bdf8',
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
              <span>{copied ? '✓ Copiado' : '📋 Copiar'}</span>
            </button>
          </div>

          {/* Tarjeta de Identificación de la Dependencia */}
          <div style={{
            background: 'linear-gradient(145deg, #131c2e 0%, #0d1525 100%)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '10.5px',
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
                fontSize: '10.5px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {dependenciaActual.sede}
              </span>

              <span style={{
                background: 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8',
                fontSize: '10.5px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {dependenciaActual.categoria}
              </span>
            </div>

            <h2 style={{
              fontSize: '16.5px',
              fontWeight: '800',
              margin: '0 0 8px 0',
              color: '#ffffff',
              lineHeight: '1.35'
            }}>
              {dependenciaActual.dependencia}
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8' }}>
              <span>Cód: #{dependenciaActual.n_dependencia} • {dependenciaActual.tipo_organo}</span>
              <span style={{ color: '#38bdf8', fontWeight: '700' }}>
                Mes: {kpisActuales.nombre_mes} {selectedAnio}
              </span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* KPI 1: NIVEL RESOLUTIVO O CUMPLIMIENTO (BANNER DESTACADO)      */}
          {/* ============================================================== */}
          <div style={{
            background: nivelConfig.bg,
            border: `2px solid ${nivelConfig.border}`,
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
          }}>
            <div>
              <div style={{
                fontSize: '10.5px',
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
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: nivelConfig.badgeBg,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
            }}>
              {nivelConfig.icon}
            </div>
          </div>

          {/* ============================================================== */}
          {/* GRILLA DE KPIS OBLIGATORIOS (2 COLUMNAS)                        */}
          {/* ============================================================== */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>

            {/* KPI 2: TOTAL DE PRODUCCIÓN */}
            <div style={{
              background: '#131c2e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                📈 Total Producción
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#38bdf8', letterSpacing: '-0.02em' }}>
                {fmtNum(kpisActuales.total_produccion)}
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                Acumulado a {kpisActuales.abrev_mes}
              </div>
            </div>

            {/* KPI 3: PRODUCCIÓN DEL MES */}
            <div style={{
              background: '#131c2e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                📅 Producción del Mes
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#10b981', letterSpacing: '-0.02em' }}>
                {fmtNum(kpisActuales.produccion_mes)}
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                Resueltos en {kpisActuales.nombre_mes}
              </div>
            </div>

            {/* KPI 4: META PRELIMINAR */}
            <div style={{
              background: '#131c2e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                🎯 Meta Preliminar
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#fbbf24', letterSpacing: '-0.02em' }}>
                {fmtNum(kpisActuales.meta_preliminar)}
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                {kpisActuales.marco}
              </div>
            </div>

            {/* KPI 5: % IDEAL DEL MES */}
            <div style={{
              background: '#131c2e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                ⏱️ % Ideal del Mes
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#cbd5e1', letterSpacing: '-0.02em' }}>
                {kpisActuales.ideal_mes_pct}%
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                Meta esperada a la fecha
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
            marginBottom: '16px'
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

            {/* Barra de progreso */}
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
                transition: 'width 600ms ease'
              }} />

              {/* Indicador de % Ideal en la barra */}
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
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#ffffff' }}>
                📊 PRODUCCIÓN MENSUAL {selectedAnio}
              </span>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>
                Toca un mes para cambiar
              </span>
            </div>

            {/* Mini selector interactivo de meses */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '6px'
            }}>
              {(dependenciaActual.historial_mensual || []).slice(0, 12).map(h => {
                const isSelected = h.mes === selectedMes;
                const esMayor = h.produccion > 0;
                return (
                  <button
                    key={h.mes}
                    onClick={() => setSelectedMes(h.mes)}
                    style={{
                      background: isSelected ? '#0284c7' : isMayor ? '#1e293b' : 'rgba(15,23,42,0.5)',
                      border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      padding: '8px 2px',
                      color: isSelected ? '#ffffff' : esMayor ? '#f8fafc' : '#64748b',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontSize: '10.5px', fontWeight: '700' }}>{h.abrev}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: '800', color: isSelected ? '#ffffff' : '#38bdf8' }}>
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
          <div style={{ display: 'flex', gap: '10px' }}>
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
                background: copied ? '#10b981' : '#0284c7',
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
              <span>{copied ? '✓ Copiado' : '📤 Compartir'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
