import React, { useState, useMemo, useEffect } from 'react';
import staticConsultasData from '../data/consultasData.json';

// Formato numérico seguro
function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(Number(n)).toLocaleString('es-PE');
}

// Configuración de los 4 Equipos Técnicos institucionales
const EQUIPOS_CONFIG = {
  OPJ: {
    id: 'OPJ',
    nombre: 'OPJ (No Penales)',
    badge: '73 Órganos',
    icon: '⚖️',
    color: '#38bdf8',
    grad: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(2, 132, 199, 0.08) 100%)',
    border: 'rgba(56, 189, 248, 0.4)',
    desc: 'Órganos Jurisdiccionales No Penales (Civil, Laboral, Familia, Paz Letrado).',
    labelMeta: 'Meta SIE PJ',
    labelAvance: '% de Avance',
    insightPrefix: 'Meta Estándar R.A. 90-2025',
    idealFijo: null
  },
  UETI: {
    id: 'UETI',
    nombre: 'UETI (Penal)',
    badge: '52 Órganos',
    icon: '⚖️',
    color: '#a855f7',
    grad: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(126, 34, 206, 0.08) 100%)',
    border: 'rgba(168, 85, 247, 0.4)',
    desc: 'Unidad de Equipo Técnico Institucional del Código Procesal Penal.',
    labelMeta: 'Meta Preliminar (Reajuste)',
    labelAvance: '% de Avance (%Prod)',
    insightPrefix: 'Meta Estándar R.A. 90-2025',
    idealFijo: 100
  },
  FLAGRANCIA: {
    id: 'FLAGRANCIA',
    nombre: 'Flagrancia',
    badge: '14 Órganos',
    icon: '⚡',
    color: '#f59e0b',
    grad: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.08) 100%)',
    border: 'rgba(245, 158, 11, 0.4)',
    desc: 'Unidades de Flagrancia Delictiva (JIP y JUP Flagrancia).',
    labelMeta: 'Meta Preliminar (Meta)',
    labelAvance: '% de Avance (Avance de meta)',
    insightPrefix: 'Meta Estándar Flagrancia',
    idealFijo: 100
  },
  VIOLENCIA: {
    id: 'VIOLENCIA',
    nombre: 'Violencia',
    badge: '25 Órganos',
    icon: '🛡️',
    color: '#ec4899',
    grad: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(190, 24, 93, 0.08) 100%)',
    border: 'rgba(236, 72, 153, 0.4)',
    desc: 'Módulo de Violencia Familiar contra las Mujeres (PPOR 1002).',
    labelMeta: 'Meta Preliminar',
    labelAvance: '% de Avance',
    insightPrefix: 'Estándar PPOR 1002',
    idealFijo: null
  }
};

export default function ConsultaMovilView({ onBackToDashboard }) {
  // Pantallas: 'bienvenida' | 'equipos' | 'seleccion' | 'kpis'
  const [screen, setScreen] = useState('bienvenida');

  // Equipo Técnico seleccionado: 'OPJ' | 'UETI' | 'FLAGRANCIA' | 'VIOLENCIA'
  const [selectedEquipo, setSelectedEquipo] = useState('OPJ');

  // Datos consolidados (165 dependencias activas)
  const [data, setData] = useState(staticConsultasData);

  // Estados de selección de filtros
  const [selectedDistrito, setSelectedDistrito] = useState('');
  const [selectedSede, setSelectedSede] = useState('');
  const [selectedDepId, setSelectedDepId] = useState(null);
  const [selectedMes, setSelectedMes] = useState(9); // Setiembre por defecto
  const [selectedAnio, setSelectedAnio] = useState(2026);
  const [searchFilter, setSearchFilter] = useState('');

  // Toast de notificación
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Carga reactiva de datos en tiempo real si el backend está activo (localhost / red)
  useEffect(() => {
    try {
      fetch('/api/consulta-movil/datos?fresh=true')
        .then(res => (res.ok ? res.json() : null))
        .then(json => {
          if (json && json.success && json.data) {
            setData(json.data);
          }
        })
        .catch(() => {});
    } catch (_) {}
  }, []);

  // 1. Filtrar las dependencias exclusivas del Equipo Técnico seleccionado
  const dependenciasDelEquipo = useMemo(() => {
    if (!data || !data.dependencias) return [];
    return data.dependencias.filter(d => (d.equipo_tecnico || 'OPJ') === selectedEquipo);
  }, [data, selectedEquipo]);

  // 2. Distritos disponibles para este Equipo Técnico
  const distritosDisponibles = useMemo(() => {
    const set = new Set();
    dependenciasDelEquipo.forEach(d => {
      if (d.distrito) set.add(d.distrito);
    });
    return Array.from(set).sort();
  }, [dependenciasDelEquipo]);

  // Distrito efectivo garantizado
  const distritoEfectivo = useMemo(() => {
    if (distritosDisponibles.includes(selectedDistrito)) return selectedDistrito;
    return distritosDisponibles[0] || '';
  }, [distritosDisponibles, selectedDistrito]);

  // 3. Sedes disponibles para el distrito y equipo actual
  const sedesDisponibles = useMemo(() => {
    const set = new Set();
    dependenciasDelEquipo
      .filter(d => d.distrito === distritoEfectivo)
      .forEach(d => {
        if (d.sede) set.add(d.sede);
      });
    return Array.from(set).sort();
  }, [dependenciasDelEquipo, distritoEfectivo]);

  // Sede efectiva garantizada
  const sedeEfectiva = useMemo(() => {
    if (sedesDisponibles.includes(selectedSede)) return selectedSede;
    return sedesDisponibles[0] || '';
  }, [sedesDisponibles, selectedSede]);

  // 4. Dependencias filtradas por distrito y sede para el equipo
  const dependenciasFiltradas = useMemo(() => {
    let list = dependenciasDelEquipo.filter(d =>
      d.distrito === distritoEfectivo && d.sede === sedeEfectiva
    );
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(d => d.dependencia.toLowerCase().includes(q));
    }
    return list;
  }, [dependenciasDelEquipo, distritoEfectivo, sedeEfectiva, searchFilter]);

  // Dependencia seleccionada
  const dependenciaActual = useMemo(() => {
    if (!dependenciasFiltradas.length) return null;
    if (selectedDepId) {
      const found = dependenciasFiltradas.find(d => d.n_dependencia === selectedDepId);
      if (found) return found;
    }
    return dependenciasFiltradas[0];
  }, [dependenciasFiltradas, selectedDepId]);

  // Manejador al seleccionar un Equipo Técnico desde la pantalla 'equipos'
  const handleSeleccionarEquipo = (eqId) => {
    setSelectedEquipo(eqId);
    setSearchFilter('');
    const depsEq = (data?.dependencias || []).filter(d => (d.equipo_tecnico || 'OPJ') === eqId);
    const primerDist = depsEq[0]?.distrito || '';
    const sedesEq = depsEq.filter(d => d.distrito === primerDist).map(d => d.sede);
    const primeraSede = sedesEq[0] || '';
    const primerDep = depsEq.find(d => d.distrito === primerDist && d.sede === primeraSede);

    setSelectedDistrito(primerDist);
    setSelectedSede(primeraSede);
    setSelectedDepId(primerDep ? primerDep.n_dependencia : null);
    setScreen('seleccion');
  };

  // Manejador de cambio de distrito
  const handleDistritoChange = (nuevoDistrito) => {
    setSelectedDistrito(nuevoDistrito);
    setSearchFilter('');
    const sedesDelDist = dependenciasDelEquipo
      .filter(d => d.distrito === nuevoDistrito)
      .map(d => d.sede);
    const nuevaSede = sedesDelDist[0] || '';
    setSelectedSede(nuevaSede);

    const deps = dependenciasDelEquipo.filter(d =>
      d.distrito === nuevoDistrito && d.sede === nuevaSede
    );
    if (deps.length > 0) {
      setSelectedDepId(deps[0].n_dependencia);
    }
  };

  // Manejador de cambio de sede
  const handleSedeChange = (nuevaSede) => {
    setSelectedSede(nuevaSede);
    setSearchFilter('');
    const deps = dependenciasDelEquipo.filter(d =>
      d.distrito === distritoEfectivo && d.sede === nuevaSede
    );
    if (deps.length > 0) {
      setSelectedDepId(deps[0].n_dependencia);
    }
  };

  // 5. KPIs seguros del mes seleccionado
  const kpisActuales = useMemo(() => {
    if (!dependenciaActual || !dependenciaActual.meses) return null;
    const mesKey = String(selectedMes);
    const kpi = dependenciaActual.meses[mesKey] || dependenciaActual.meses[selectedMes];
    if (kpi) return kpi;
    const primerMes = Object.values(dependenciaActual.meses)[0];
    return primerMes || null;
  }, [dependenciaActual, selectedMes]);

  const equipoConfig = EQUIPOS_CONFIG[selectedEquipo] || EQUIPOS_CONFIG.OPJ;

  // Estilos del Nivel Resolutivo / Cumplimiento
  const nivelConfig = useMemo(() => {
    const niv = String(kpisActuales?.nivel || '').toUpperCase();
    if (niv.includes('MUY BUENO')) {
      return {
        bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.28) 100%)',
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
        bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.28) 100%)',
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
        bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(220, 38, 38, 0.28) 100%)',
        border: '#ef4444',
        text: '#f87171',
        badgeBg: '#dc2626',
        icon: '▼',
        label: 'BAJO',
        descripcion: 'Por debajo del umbral mínimo resolutivo mensual'
      };
    }
    return {
      bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.18) 0%, rgba(100, 116, 139, 0.28) 100%)',
      border: '#64748b',
      text: '#94a3b8',
      badgeBg: '#475569',
      icon: '⚪',
      label: 'SIN META',
      descripcion: 'Pendiente de asignación de meta o sin turno activo'
    };
  }, [kpisActuales]);

  // Cerrar sesión / salir
  const handleCerrarSesion = () => {
    setScreen('bienvenida');
    setSearchFilter('');
    showToast('Sesión finalizada correctamente');
  };

  // Copiar resumen al portapapeles
  const handleCopiarResumen = () => {
    if (!dependenciaActual || !kpisActuales) return;
    const metaLabel = equipoConfig.labelMeta;
    const avanceLabel = equipoConfig.labelAvance;
    const metaVal = (selectedEquipo === 'OPJ' ? (kpisActuales.meta_sie || kpisActuales.meta_preliminar) : kpisActuales.meta_preliminar);
    const idealVal = (equipoConfig.idealFijo !== null ? equipoConfig.idealFijo : kpisActuales.ideal_mes_pct);

    const texto = `*SIMENGJ - REPORTE DE GESTIÓN JUDICIAL*
*Corte Superior de Justicia de Lima Este (CSJLE)*
*Equipo Técnico:* ${equipoConfig.nombre}
------------------------------------------
🏛️ *Dependencia:* ${dependenciaActual.dependencia}
📍 *Distrito:* ${dependenciaActual.distrito}
🏢 *Sede:* ${dependenciaActual.sede}
📅 *Periodo:* ${kpisActuales.nombre_mes} ${selectedAnio}
------------------------------------------
📊 *Total de Producción:* ${fmtNum(kpisActuales.total_produccion)} expedientes
📅 *Producción del Mes:* ${fmtNum(kpisActuales.produccion_mes)} expedientes
🎯 *${metaLabel}:* ${fmtNum(metaVal)}
⚡ *${avanceLabel}:* ${kpisActuales.avance_pct}%
⏱️ *% Ideal del Mes:* ${idealVal}%
🏆 *Nivel Resolutivo:* ${kpisActuales.nivel}
🏛️ *Meta Estándar:* ${fmtNum(kpisActuales.meta_estandar)}
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
        {/* 1. PANTALLA DE BIENVENIDA                                      */}
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
                Sistema de Monitoreo y Evaluación de Niveles de Gestión Judicial. Consulta de producción, avance y metas especializadas por equipo técnico.
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
                  <div style={{ fontSize: '22px', marginBottom: '2px' }}>📊</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>4</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Equipos Técnicos</div>
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
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Distritos</div>
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '2px' }}>📅</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>2026</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Año Judicial</div>
                </div>
              </div>
            </div>

            {/* Botón principal para ir a Equipos Técnicos */}
            <div>
              <button
                onClick={() => setScreen('equipos')}
                style={{
                  width: '100%',
                  padding: '16px',
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
                  gap: '8px',
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
        {/* 2. PANTALLA: EQUIPOS TÉCNICOS (4 KPIS PRINCIPALES)             */}
        {/* ============================================================== */}
        {screen === 'equipos' && (
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

            <div style={{ marginBottom: '18px' }}>
              <div style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.04em',
                marginBottom: '6px'
              }}>
                MÓDULOS DE GESTIÓN
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 6px 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
                Equipos Técnicos
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                Seleccione el equipo técnico institucional para consultar sus indicadores y metas específicas:
              </p>
            </div>

            {/* Listado de las 4 Tarjetas Bento de Equipos Técnicos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
              {Object.values(EQUIPOS_CONFIG).map((eq) => {
                const count = (data?.dependencias || []).filter(d => (d.equipo_tecnico || 'OPJ') === eq.id).length || eq.badge;

                return (
                  <div
                    key={eq.id}
                    onClick={() => handleSeleccionarEquipo(eq.id)}
                    style={{
                      background: eq.grad,
                      border: `1.5px solid ${eq.border}`,
                      borderRadius: '18px',
                      padding: '16px 18px',
                      cursor: 'pointer',
                      backdropFilter: 'blur(12px)',
                      transition: 'transform 120ms ease, box-shadow 120ms ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          fontSize: '24px',
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: 'rgba(15, 23, 42, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${eq.border}`
                        }}>
                          {eq.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '17px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.01em' }}>
                            {eq.nombre}
                          </div>
                          <div style={{ fontSize: '11px', color: eq.color, fontWeight: '700' }}>
                            {count} dependencias activas
                          </div>
                        </div>
                      </div>

                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: eq.color,
                        fontWeight: '900',
                        fontSize: '15px'
                      }}>
                        ➔
                      </div>
                    </div>

                    <div style={{
                      fontSize: '12px',
                      color: '#cbd5e1',
                      lineHeight: '1.45',
                      marginBottom: '10px'
                    }}>
                      {eq.desc}
                    </div>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        🎯 {eq.labelMeta}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        color: eq.color,
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        ⏱️ {eq.idealFijo ? 'Ideal: 100%' : 'Ideal Mensual'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                onClick={() => setScreen('bienvenida')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                ← Volver a inicio
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. PANTALLA DE SELECTORES EN CASCADA                           */}
        {/* ============================================================== */}
        {screen === 'seleccion' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Barra superior con Volver a Equipos y Cerrar Sesión */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => setScreen('equipos')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
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
                <span>Equipos</span>
              </button>

              {/* Badge del equipo actual */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: equipoConfig.grad,
                border: `1px solid ${equipoConfig.border}`,
                color: equipoConfig.color,
                fontSize: '12px',
                fontWeight: '800'
              }}>
                <span>{equipoConfig.icon}</span>
                <span>{equipoConfig.nombre}</span>
              </div>

              {/* Botón Cerrar Sesión */}
              <button
                onClick={handleCerrarSesion}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Salir
              </button>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0', color: '#ffffff' }}>
              Seleccionar Órgano Jurisdiccional
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Filtrando en <strong style={{ color: equipoConfig.color }}>{equipoConfig.nombre}</strong> ({dependenciasDelEquipo.length} dependencias):
            </p>

            {/* 1. Selector de Distrito */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1', marginBottom: '6px' }}>
                📍 1. DISTRITO JUDICIAL
              </label>
              <select
                value={distritoEfectivo}
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
                {distritosDisponibles.map(d => (
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
                {sedesDisponibles.map(s => (
                  <option key={s} value={s} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Selector de Dependencia */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1' }}>
                  ⚖️ 3. ÓRGANO JURISDICCIONAL
                </label>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
                  {dependenciasFiltradas.length} disponibles
                </span>
              </div>

              {/* Filtro de búsqueda rápida */}
              <input
                type="text"
                placeholder="🔍 Filtrar por nombre..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#0b1120',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '12px',
                  marginBottom: '8px',
                  outline: 'none',
                  boxSizing: 'border-box'
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
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {dependenciasFiltradas.map(dep => (
                  <option key={dep.n_dependencia} value={dep.n_dependencia} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {dep.dependencia}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Selector de Mes */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1', marginBottom: '6px' }}>
                📅 4. MES DE EVALUACIÓN ({selectedAnio})
              </label>
              <select
                value={selectedMes}
                onChange={e => setSelectedMes(Number(e.target.value))}
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
                {(data?.meses || []).map(m => (
                  <option key={m.num} value={m.num} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {m.nombre} ({m.abrev}) {selectedAnio}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón de Consulta */}
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <button
                disabled={!dependenciaActual}
                onClick={() => setScreen('kpis')}
                style={{
                  width: '100%',
                  padding: '16px',
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
        {/* 4. PANTALLA DE KPIS Y RESULTADOS (ADAPTADA POR EQUIPO TÉCNICO) */}
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
                      border: '1px solid rgba(239, 68, 68, 0.3)',
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

                {/* Tarjeta de la Dependencia */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '12px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: equipoConfig.color,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      background: equipoConfig.grad,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${equipoConfig.border}`
                    }}>
                      {equipoConfig.icon} {equipoConfig.nombre}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Cód: {dependenciaActual.n_dependencia}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15.5px', fontWeight: '900', color: '#ffffff', margin: '0 0 8px 0', lineHeight: '1.35' }}>
                    {dependenciaActual.dependencia}
                  </h3>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: '#cbd5e1' }}>
                    <span style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '3px 8px', borderRadius: '6px' }}>
                      📍 {dependenciaActual.distrito}
                    </span>
                    <span style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '3px 8px', borderRadius: '6px' }}>
                      🏢 Sede: {dependenciaActual.sede}
                    </span>
                    <span style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '3px 8px', borderRadius: '6px' }}>
                      📅 {kpisActuales.nombre_mes} {selectedAnio}
                    </span>
                  </div>
                </div>

                {/* INSIGHT CARD DESTACADO ARRIBA (Meta Estándar R.A. 90-2025 o Marco Normativo) */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1.5px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🏛️</span>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                        {selectedEquipo === 'OPJ' ? 'Meta Estándar R.A. 90-2025' : `${equipoConfig.insightPrefix}`}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        Meta anual de referencia establecida
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '17px',
                    fontWeight: '900',
                    color: '#ffffff',
                    background: 'rgba(2, 132, 199, 0.25)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.4)'
                  }}>
                    {fmtNum(kpisActuales.meta_estandar || dependenciaActual.meta_estandar)}
                  </div>
                </div>

                {/* BENTO GRID DE LOS 6 INDICADORES CLAVE */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '14px'
                }}>

                  {/* 1. Total de Producción */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '14px 12px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>
                      TOTAL DE PRODUCCIÓN
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
                      {fmtNum(kpisActuales.total_produccion)}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#38bdf8', marginTop: '2px' }}>
                      Resueltos acumulados
                    </div>
                  </div>

                  {/* 2. Producción del Mes */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '14px 12px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>
                      PRODUCCIÓN DEL MES
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
                      {fmtNum(kpisActuales.produccion_mes)}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      Mes de {kpisActuales.nombre_mes}
                    </div>
                  </div>

                  {/* 3. Meta específica según Equipo Técnico (Meta SIE PJ / Reajuste / Meta) */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '14px 12px'
                  }}>
                    <div style={{ fontSize: '11px', color: equipoConfig.color, fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {equipoConfig.labelMeta}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
                      {fmtNum(
                        selectedEquipo === 'OPJ'
                          ? (kpisActuales.meta_sie || kpisActuales.meta_preliminar)
                          : kpisActuales.meta_preliminar
                      )}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.3' }}>
                      {selectedEquipo === 'OPJ' ? 'Meta ajustada en mes de Meta anual asignada SIE' : 'Objetivo reajustado oficial'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#38bdf8', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '3px' }}>
                      Meta Estándar: <strong>{fmtNum(kpisActuales.meta_estandar || dependenciaActual.meta_estandar)}</strong>
                    </div>
                  </div>

                  {/* 4. % de Avance (% de Avance / %Prod / Avance de meta) */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '14px 12px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {equipoConfig.labelAvance}
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '900',
                      color: kpisActuales.avance_pct >= (equipoConfig.idealFijo || kpisActuales.ideal_mes_pct) ? '#34d399' : '#f59e0b'
                    }}>
                      {kpisActuales.avance_pct}%
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {kpisActuales.avance_pct >= (equipoConfig.idealFijo || kpisActuales.ideal_mes_pct) ? '✓ Supera avance ideal' : 'Por debajo del ideal'}
                    </div>
                  </div>

                  {/* 5. Carga Procesal del Mes (NUEVO KPI SOLICITADO) */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '14px',
                    padding: '14px 12px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', marginBottom: '4px' }}>
                      CARGA PROCESAL DEL MES
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
                      {fmtNum(kpisActuales.carga_procesal_mes)}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      Carga en trámite ({kpisActuales.nombre_mes})
                    </div>
                  </div>

                  {/* 6. Ingresos del Mes (NUEVO KPI SOLICITADO) */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '14px',
                    padding: '14px 12px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#c084fc', fontWeight: '800', marginBottom: '4px' }}>
                      INGRESOS DEL MES
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
                      {fmtNum(kpisActuales.ingresos_mes)}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      Nuevos ingresos ({kpisActuales.nombre_mes})
                    </div>
                  </div>

                  {/* 7. % Ideal del Mes (Para OPJ Setiembre es 73%, para UETI y Flagrancia es 100%) */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '14px 12px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>
                      % IDEAL DEL MES
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8' }}>
                      {equipoConfig.idealFijo !== null ? equipoConfig.idealFijo : kpisActuales.ideal_mes_pct}%
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {equipoConfig.idealFijo !== null ? 'Estándar mensual 100%' : `Referencia a ${kpisActuales.nombre_mes}`}
                    </div>
                  </div>

                  {/* 8. Nivel Resolutivo / Cumplimiento */}
                  <div style={{
                    background: nivelConfig.bg,
                    border: `1.5px solid ${nivelConfig.border}`,
                    borderRadius: '14px',
                    padding: '14px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700' }}>
                      NIVEL RESOLUTIVO
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '900',
                      color: nivelConfig.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      margin: '4px 0'
                    }}>
                      <span>{nivelConfig.icon}</span>
                      <span>{nivelConfig.label}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: '1.2' }}>
                      {nivelConfig.descripcion}
                    </div>
                  </div>
                </div>

                {/* SELECTOR INTERACTIVO DE MESES (EN DOS FILAS DE 6 BOTONES) */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1', marginBottom: '8px' }}>
                    📅 CAMBIAR MES ({selectedAnio})
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '6px'
                  }}>
                    {(data?.meses || []).map(m => {
                      const isSel = selectedMes === m.num;
                      return (
                        <button
                          key={m.num}
                          onClick={() => setSelectedMes(m.num)}
                          style={{
                            padding: '8px 2px',
                            borderRadius: '8px',
                            border: isSel ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: isSel ? '#0284c7' : 'rgba(30, 41, 59, 0.6)',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: isSel ? '800' : '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          {m.abrev}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
