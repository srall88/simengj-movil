import React, { useState, useMemo, useEffect } from 'react';
import staticConsultasData from '../data/consultasData.json';

// Formato numérico seguro
function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(Number(n)).toLocaleString('es-PE');
}

// Configuración de los 5 Equipos Técnicos institucionales (incluyendo EJECUCIÓN)
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
  },
  EJECUCION: {
    id: 'EJECUCION',
    nombre: 'Juzgados de Ejecución',
    badge: '1 Órgano',
    icon: '📋',
    color: '#10b981',
    grad: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.08) 100%)',
    border: 'rgba(16, 185, 129, 0.45)',
    desc: 'Juzgados especializados en Ejecución y Descarga Procesal de Sentencias Laborales.',
    labelMeta: 'Meta de Ejecución',
    labelAvance: 'Avance de Meta',
    insightPrefix: 'Meta Estándar de Ejecución (150/mes)',
    idealFijo: 100
  }
};

// Configuración de los 12 meses institucionales con control de bloqueo para el 4to trimestre
const MESES_CALENDARIO = [
  { num: 1, nombre: 'Enero', abrev: 'Ene', locked: false },
  { num: 2, nombre: 'Febrero', abrev: 'Feb', locked: false },
  { num: 3, nombre: 'Marzo', abrev: 'Mar', locked: false },
  { num: 4, nombre: 'Abril', abrev: 'Abr', locked: false },
  { num: 5, nombre: 'Mayo', abrev: 'May', locked: false },
  { num: 6, nombre: 'Junio', abrev: 'Jun', locked: false },
  { num: 7, nombre: 'Julio', abrev: 'Jul', locked: false },
  { num: 8, nombre: 'Agosto', abrev: 'Ago', locked: false },
  { num: 9, nombre: 'Setiembre', abrev: 'Set', locked: false },
  { num: 10, nombre: 'Octubre', abrev: 'Oct', locked: true },
  { num: 11, nombre: 'Noviembre', abrev: 'Nov', locked: true },
  { num: 12, nombre: 'Diciembre', abrev: 'Dic', locked: true }
];

export default function ConsultaMovilView({ onBackToDashboard }) {
  // Pantallas: 'bienvenida' | 'equipos' | 'seleccion' | 'kpis'
  const [screen, setScreen] = useState('bienvenida');

  // Equipo Técnico seleccionado: 'OPJ' | 'UETI' | 'FLAGRANCIA' | 'VIOLENCIA' | 'EJECUCION'
  const [selectedEquipo, setSelectedEquipo] = useState('OPJ');

  // Datos consolidados (166 dependencias activas incluyendo 4639 en EJECUCIÓN)
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

  // 2. Distritos disponibles con conteo de dependencias para los chips horizontales
  const distritosDisponibles = useMemo(() => {
    const map = new Map();
    dependenciasDelEquipo.forEach(d => {
      const dist = (d.distrito || 'Sin Distrito').trim();
      map.set(dist, (map.get(dist) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([distrito, count]) => ({ distrito, count }))
      .sort((a, b) => a.distrito.localeCompare(b.distrito));
  }, [dependenciasDelEquipo]);

  // Distrito efectivo garantizado
  const distritoEfectivo = useMemo(() => {
    const nombres = distritosDisponibles.map(d => d.distrito);
    if (nombres.includes(selectedDistrito)) return selectedDistrito;
    return nombres[0] || '';
  }, [distritosDisponibles, selectedDistrito]);

  // 3. Sedes disponibles para el distrito y equipo actual con conteo
  const sedesDisponibles = useMemo(() => {
    const map = new Map();
    dependenciasDelEquipo
      .filter(d => (d.distrito || 'Sin Distrito').trim() === distritoEfectivo)
      .forEach(d => {
        const s = (d.sede || 'Sede Principal').trim();
        map.set(s, (map.get(s) || 0) + 1);
      });
    return Array.from(map.entries())
      .map(([sede, count]) => ({ sede, count }))
      .sort((a, b) => a.sede.localeCompare(b.sede));
  }, [dependenciasDelEquipo, distritoEfectivo]);

  // Sede efectiva garantizada
  const sedeEfectiva = useMemo(() => {
    const nombres = sedesDisponibles.map(s => s.sede);
    if (nombres.includes(selectedSede)) return selectedSede;
    return nombres[0] || '';
  }, [sedesDisponibles, selectedSede]);

  // 4. Dependencias filtradas por distrito, sede y búsqueda
  const dependenciasFiltradas = useMemo(() => {
    let list = dependenciasDelEquipo.filter(d =>
      (d.distrito || 'Sin Distrito').trim() === distritoEfectivo &&
      (d.sede || 'Sede Principal').trim() === sedeEfectiva
    );
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(d =>
        d.dependencia.toLowerCase().includes(q) ||
        String(d.n_dependencia).includes(q) ||
        (d.especialidad && d.especialidad.toLowerCase().includes(q))
      );
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

  // Manejador de cambio de mes con validación de bloqueo institucional
  const handleMesChange = (mObj) => {
    if (mObj.locked) {
      showToast(`🔒 ${mObj.nombre}: Pendiente de consolidación oficial`);
      return;
    }
    setSelectedMes(mObj.num);
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
    if (niv.includes('SOBRESALIENTE') || niv.includes('MUY BUENO')) {
      return {
        bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.28) 100%)',
        border: '#10b981',
        text: '#34d399',
        badgeBg: '#059669',
        icon: '▲',
        label: niv.includes('SOBRESALIENTE') ? 'SOBRESALIENTE' : 'MUY BUENO',
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
${selectedEquipo === 'EJECUCION' ? `📋 *Carga Pendiente en Ejecución:* ${fmtNum(kpisActuales.carga_procesal_mes)}` : `📁 *Carga Procesal del Mes:* ${fmtNum(kpisActuales.carga_procesal_mes)}`}
📥 *Ingresos del Mes:* ${fmtNum(kpisActuales.ingresos_mes)}
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
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
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
        paddingBottom: 'calc(env(safe-area-inset-bottom, 24px) + 24px)',
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
                  <div style={{ fontSize: '17px', fontWeight: '900', color: '#ffffff' }}>166</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Dependencias Activas</div>
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(168, 85, 247, 0.15)',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '2px' }}>📊</div>
                  <div style={{ fontSize: '17px', fontWeight: '900', color: '#ffffff' }}>5 Módulos</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Equipos Técnicos</div>
                </div>
              </div>
            </div>

            {/* Botón de Entrada */}
            <div style={{ width: '100%' }}>
              <button
                onClick={() => setScreen('equipos')}
                className="touch-press"
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
                  outline: 'none'
                }}
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
        {/* 2. PANTALLA: EQUIPOS TÉCNICOS (5 MÓDULOS DE GESTIÓN)            */}
        {/* ============================================================== */}
        {screen === 'equipos' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Barra superior con Cerrar Sesión */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚖️</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>
                  SIMENGJ • CSJLE
                </span>
              </div>

              <button
                onClick={handleCerrarSesion}
                className="touch-press"
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

            <div style={{ marginBottom: '16px' }}>
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
                MÓDULOS DE GESTIÓN (5)
              </div>
              <h2 style={{ fontSize: '23px', fontWeight: '900', margin: '0 0 6px 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
                Equipos Técnicos
              </h2>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, lineHeight: '1.45' }}>
                Seleccione el equipo institucional para consultar indicadores oficiales y metas:
              </p>
            </div>

            {/* Listado de las 5 Tarjetas Bento de Equipos Técnicos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', flex: 1, paddingBottom: '16px' }}>
              {Object.values(EQUIPOS_CONFIG).map((eq) => {
                const count = (data?.dependencias || []).filter(d => (d.equipo_tecnico || 'OPJ') === eq.id).length || eq.badge;

                return (
                  <div
                    key={eq.id}
                    onClick={() => handleSeleccionarEquipo(eq.id)}
                    className="touch-press glass-surface"
                    style={{
                      background: eq.grad,
                      border: `1.5px solid ${eq.border}`,
                      borderRadius: '16px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          fontSize: '22px',
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: 'rgba(15, 23, 42, 0.65)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${eq.border}`
                        }}>
                          {eq.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.01em' }}>
                            {eq.nombre}
                          </div>
                          <div style={{ fontSize: '11px', color: eq.color, fontWeight: '700' }}>
                            {count} dependencias activas
                          </div>
                        </div>
                      </div>

                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: eq.color,
                        fontWeight: '900',
                        fontSize: '14px'
                      }}>
                        ➔
                      </div>
                    </div>

                    <div style={{
                      fontSize: '12px',
                      color: '#cbd5e1',
                      lineHeight: '1.4',
                      marginBottom: '8px'
                    }}>
                      {eq.desc}
                    </div>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        🎯 {eq.labelMeta}
                      </span>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(15, 23, 42, 0.75)',
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

            <div style={{ marginTop: 'auto', textAlign: 'center' }}>
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
        {/* 3. PANTALLA DE FILTROS REDISEÑADA ESTILO APPLE / CUPERTINO     */}
        {/* ============================================================== */}
        {screen === 'seleccion' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Barra superior de navegación */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '14px'
            }}>
              <button
                onClick={() => setScreen('equipos')}
                className="touch-press"
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

              {/* Pill institucional del equipo técnico activo */}
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
                className="touch-press"
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

            {/* Subtítulo de contexto con conteo dinámico */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  Filtros de Búsqueda
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: equipoConfig.color,
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${equipoConfig.border}`
                }}>
                  {dependenciasDelEquipo.length} Órganos
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                Seleccione distrito, sede y el juzgado a evaluar:
              </p>
            </div>

            {/* SECCIÓN 1: DISTRITO JUDICIAL (CARRUSEL HORIZONTAL TIPO CHIP APPLE) */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1', letterSpacing: '0.04em' }}>
                  📍 1. DISTRITO JUDICIAL
                </label>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
                  {distritoEfectivo}
                </span>
              </div>

              <div
                className="no-scrollbar"
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  padding: '2px 1px 6px 1px'
                }}
              >
                {distritosDisponibles.map(({ distrito, count }) => {
                  const isSel = distrito === distritoEfectivo;
                  return (
                    <button
                      key={distrito}
                      onClick={() => handleDistritoChange(distrito)}
                      className="touch-press"
                      style={{
                        flex: '0 0 auto',
                        padding: '9px 14px',
                        borderRadius: '12px',
                        border: isSel ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isSel
                          ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.95) 0%, rgba(37, 99, 235, 0.9) 100%)'
                          : 'rgba(30, 41, 59, 0.65)',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: isSel ? '800' : '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isSel
                          ? '0 4px 14px rgba(2, 132, 199, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)'
                          : 'none',
                        outline: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>{distrito}</span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '1px 5px',
                        borderRadius: '9999px',
                        background: isSel ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                        color: isSel ? '#ffffff' : '#94a3b8'
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 2: SEDE JUDICIAL (SEGMENTO DINÁMICO DE SEDES) */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1', letterSpacing: '0.04em' }}>
                  🏢 2. SEDE JUDICIAL
                </label>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {sedesDisponibles.length} {sedesDisponibles.length === 1 ? 'sede disponible' : 'sedes disponibles'}
                </span>
              </div>

              <div
                className="no-scrollbar"
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  padding: '2px 1px 4px 1px'
                }}
              >
                {sedesDisponibles.map(({ sede, count }) => {
                  const isSel = sede === sedeEfectiva;
                  return (
                    <button
                      key={sede}
                      onClick={() => handleSedeChange(sede)}
                      className="touch-press"
                      style={{
                        flex: '0 0 auto',
                        padding: '8px 13px',
                        borderRadius: '10px',
                        border: isSel ? '1.5px solid #0284c7' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isSel
                          ? 'rgba(2, 132, 199, 0.35)'
                          : 'rgba(15, 23, 42, 0.7)',
                        color: isSel ? '#38bdf8' : '#cbd5e1',
                        fontSize: '12px',
                        fontWeight: isSel ? '800' : '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isSel ? '0 2px 10px rgba(2, 132, 199, 0.25)' : 'none',
                        outline: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>{isSel ? '✓' : '•'}</span>
                      <span>{sede}</span>
                      <span style={{
                        fontSize: '9.5px',
                        color: isSel ? '#38bdf8' : '#64748b',
                        fontWeight: '700'
                      }}>
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 3: ÓRGANO JURISDICCIONAL (BUSCADOR INTELIGENTE + LISTA DE TARJETAS TÁCTILES) */}
            <div style={{ marginBottom: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1', letterSpacing: '0.04em' }}>
                  ⚖️ 3. ÓRGANO JURISDICCIONAL
                </label>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
                  {dependenciasFiltradas.length} encontrados
                </span>
              </div>

              {/* Cápsula de búsqueda moderna tipo iOS */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  fontSize: '13px',
                  color: '#94a3b8',
                  pointerEvents: 'none'
                }}>
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o especialidad..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 36px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Lista táctil de Órganos (Cards completas con nombre legible y selección directa) */}
              <div
                className="no-scrollbar"
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingRight: '2px',
                  paddingBottom: '2px'
                }}
              >
                {dependenciasFiltradas.length === 0 ? (
                  <div style={{
                    padding: '24px 12px',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    fontSize: '12px'
                  }}>
                    No se encontraron órganos con ese filtro.
                  </div>
                ) : (
                  dependenciasFiltradas.map(dep => {
                    const isSel = dependenciaActual?.n_dependencia === dep.n_dependencia;
                    return (
                      <div
                        key={dep.n_dependencia}
                        onClick={() => setSelectedDepId(dep.n_dependencia)}
                        className="touch-press"
                        style={{
                          background: isSel
                            ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.28) 0%, rgba(15, 23, 42, 0.85) 100%)'
                            : 'rgba(15, 23, 42, 0.7)',
                          border: isSel
                            ? `1.5px solid ${equipoConfig.border || '#38bdf8'}`
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '11px 13px',
                          cursor: 'pointer',
                          boxShadow: isSel
                            ? '0 4px 14px rgba(2, 132, 199, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                            : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '800',
                              color: isSel ? '#38bdf8' : '#94a3b8',
                              background: 'rgba(15, 23, 42, 0.8)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                              #{dep.n_dependencia}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              color: '#cbd5e1',
                              textTransform: 'uppercase'
                            }}>
                              {dep.especialidad || dep.categoria || 'Judicial'}
                            </span>
                          </div>

                          {isSel && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '800',
                              color: '#34d399',
                              background: 'rgba(16, 185, 129, 0.15)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              ✓ Seleccionado
                            </span>
                          )}
                        </div>

                        <div style={{
                          fontSize: '13px',
                          fontWeight: '800',
                          color: '#ffffff',
                          lineHeight: '1.35',
                          marginBottom: '4px'
                        }}>
                          {dep.dependencia}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '10.5px',
                          color: '#94a3b8'
                        }}>
                          <span>🏢 Sede: {dep.sede}</span>
                          <span>•</span>
                          <span>Meta Anual: {fmtNum(dep.meta_estandar)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SECCIÓN 4: MES DE EVALUACIÓN (CALENDARIO DE CINTA HORIZONTAL CON BLOQUEO 🔒) */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1', letterSpacing: '0.04em' }}>
                  📅 4. MES DE EVALUACIÓN ({selectedAnio})
                </label>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
                  {MESES_CALENDARIO.find(m => m.num === selectedMes)?.nombre || 'Setiembre'}
                </span>
              </div>

              <div
                className="no-scrollbar"
                style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  padding: '2px 1px 4px 1px'
                }}
              >
                {MESES_CALENDARIO.map(m => {
                  const isSel = selectedMes === m.num;
                  return (
                    <button
                      key={m.num}
                      onClick={() => handleMesChange(m)}
                      className="touch-press"
                      style={{
                        flex: '0 0 auto',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: isSel
                          ? '1.5px solid #38bdf8'
                          : m.locked
                            ? '1px dashed rgba(255, 255, 255, 0.08)'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isSel
                          ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)'
                          : m.locked
                            ? 'rgba(15, 23, 42, 0.4)'
                            : 'rgba(30, 41, 59, 0.65)',
                        color: isSel ? '#ffffff' : m.locked ? '#64748b' : '#cbd5e1',
                        fontSize: '11.5px',
                        fontWeight: isSel ? '800' : '600',
                        cursor: m.locked ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: isSel
                          ? '0 4px 12px rgba(2, 132, 199, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                          : 'none',
                        outline: 'none',
                        opacity: m.locked ? 0.6 : 1
                      }}
                    >
                      <span>{m.abrev}</span>
                      {m.locked && <span style={{ fontSize: '10px' }}>🔒</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BOTÓN CTA FLOTANTE INFERIOR CON ESTILO LIQUID APPLE */}
            <div style={{
              marginTop: 'auto',
              paddingTop: '6px',
              position: 'sticky',
              bottom: 0,
              zIndex: 30,
              background: 'linear-gradient(to top, #090d16 80%, rgba(9, 13, 22, 0) 100%)',
              paddingBottom: '2px'
            }}>
              <button
                disabled={!dependenciaActual}
                onClick={() => setScreen('kpis')}
                className="touch-press"
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
                  boxShadow: dependenciaActual
                    ? '0 10px 25px -5px rgba(2, 132, 199, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.35)'
                    : 'none',
                  outline: 'none'
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
                  className="touch-press"
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
                {/* Barra de navegación superior */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '12px'
                }}>
                  <button
                    onClick={() => setScreen('seleccion')}
                    className="touch-press"
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={handleCopiarResumen}
                      className="touch-press"
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
                      className="touch-press"
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
                </div>

                {/* SELECTOR RÁPIDO DE MESES DIRECTO EN LA PANTALLA DE KPIS (TIPO SEGMENTED RIBBON) */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '8px 10px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.04em' }}>
                      CAMBIO RÁPIDO DE MES ({selectedAnio})
                    </span>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800' }}>
                      {kpisActuales.nombre_mes}
                    </span>
                  </div>
                  <div
                    className="no-scrollbar"
                    style={{
                      display: 'flex',
                      gap: '5px',
                      overflowX: 'auto',
                      WebkitOverflowScrolling: 'touch',
                      padding: '1px 0'
                    }}
                  >
                    {MESES_CALENDARIO.map(m => {
                      const isSel = selectedMes === m.num;
                      return (
                        <button
                          key={m.num}
                          onClick={() => handleMesChange(m)}
                          className="touch-press"
                          style={{
                            flex: '0 0 auto',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: isSel ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: isSel ? '#0284c7' : m.locked ? 'rgba(15, 23, 42, 0.4)' : 'rgba(30, 41, 59, 0.7)',
                            color: isSel ? '#ffffff' : m.locked ? '#64748b' : '#cbd5e1',
                            fontSize: '11px',
                            fontWeight: isSel ? '800' : '600',
                            cursor: m.locked ? 'not-allowed' : 'pointer',
                            opacity: m.locked ? 0.6 : 1
                          }}
                        >
                          {m.abrev} {m.locked ? '🔒' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tarjeta Principal de la Dependencia */}
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

                {/* INSIGHT CARD DESTACADO (Meta Estándar o Marco Normativo) */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1.5px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginBottom: '12px',
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
                        {selectedEquipo === 'EJECUCION' ? 'Meta mensual de resoluciones en ejecución' : 'Meta anual de referencia establecida'}
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

                {/* BENTO GRID DE LOS INDICADORES CLAVE */}
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

                  {/* 3. Meta específica según Equipo Técnico */}
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
                      {selectedEquipo === 'EJECUCION' ? 'Meta mensual estándar de 150' : selectedEquipo === 'OPJ' ? 'Meta ajustada SIE PJ' : 'Objetivo oficial'}
                    </div>
                  </div>

                  {/* 4. % de Avance */}
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

                  {/* 5. Carga Procesal / Carga Pendiente en Ejecución */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '14px',
                    padding: '14px 12px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', marginBottom: '4px' }}>
                      {selectedEquipo === 'EJECUCION' ? 'CARGA PENDIENTE EN EJECUCIÓN' : 'CARGA PROCESAL DEL MES'}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
                      {fmtNum(kpisActuales.carga_procesal_mes)}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {selectedEquipo === 'EJECUCION' ? `Expedientes pendientes (${kpisActuales.nombre_mes})` : `Carga en trámite (${kpisActuales.nombre_mes})`}
                    </div>
                  </div>

                  {/* 6. Ingresos del Mes */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
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

                  {/* 7. % Ideal del Mes */}
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
                      fontSize: '17px',
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
