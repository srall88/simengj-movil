import React, { useState, useMemo, useEffect } from 'react';
import staticConsultasData from '../data/consultasData.json';

// Formateador numérico institucional seguro
function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(Number(n)).toLocaleString('es-PE');
}

// Configuración de los 5 Equipos Técnicos institucionales en Modo Claro
const EQUIPOS_CONFIG = {
  OPJ: {
    id: 'OPJ',
    nombre: 'OPJ (No Penales)',
    badge: '73 Órganos',
    icon: '⚖️',
    color: '#0284c7',
    glow: 'rgba(2, 132, 199, 0.2)',
    grad: 'linear-gradient(145deg, #f0f9ff 0%, #ffffff 100%)',
    border: '#bae6fd',
    accentBg: '#e0f2fe',
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
    color: '#7e22ce',
    glow: 'rgba(126, 34, 206, 0.2)',
    grad: 'linear-gradient(145deg, #faf5ff 0%, #ffffff 100%)',
    border: '#e9d5ff',
    accentBg: '#f3e8ff',
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
    color: '#b45309',
    glow: 'rgba(180, 83, 9, 0.2)',
    grad: 'linear-gradient(145deg, #fffbeb 0%, #ffffff 100%)',
    border: '#fde68a',
    accentBg: '#fef3c7',
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
    color: '#be185d',
    glow: 'rgba(190, 24, 93, 0.2)',
    grad: 'linear-gradient(145deg, #fdf2f8 0%, #ffffff 100%)',
    border: '#fbcfe8',
    accentBg: '#fce7f3',
    desc: 'Módulo de Violencia Familiar contra las Mujeres (PPOR 1002).',
    labelMeta: 'Meta Preliminar',
    labelAvance: '% de Avance',
    insightPrefix: 'Estándar PPOR 1002',
    idealFijo: null
  },
  EJECUCION: {
    id: 'EJECUCION',
    nombre: 'Juzgados de Ejecución',
    badge: 'En construcción',
    icon: '📋',
    color: '#a16207',
    glow: 'rgba(161, 98, 7, 0.2)',
    grad: 'linear-gradient(145deg, #fefce8 0%, #ffffff 100%)',
    border: '#fde047',
    accentBg: '#fef9c3',
    desc: 'Módulo de Ejecución y Descarga Procesal. Analizando datos e indicadores para su integración.',
    labelMeta: 'En construcción',
    labelAvance: 'Analizando datos',
    insightPrefix: 'En construcción • Analizando datos',
    idealFijo: null,
    enConstruccion: true
  }
};

// Catálogo base de meses institucionales
const BASE_MESES_CALENDARIO = [
  { num: 1, nombre: 'Enero', abrev: 'Ene' },
  { num: 2, nombre: 'Febrero', abrev: 'Feb' },
  { num: 3, nombre: 'Marzo', abrev: 'Mar' },
  { num: 4, nombre: 'Abril', abrev: 'Abr' },
  { num: 5, nombre: 'Mayo', abrev: 'May' },
  { num: 6, nombre: 'Junio', abrev: 'Jun' },
  { num: 7, nombre: 'Julio', abrev: 'Jul' },
  { num: 8, nombre: 'Agosto', abrev: 'Ago' },
  { num: 9, nombre: 'Setiembre', abrev: 'Set' },
  { num: 10, nombre: 'Octubre', abrev: 'Oct' },
  { num: 11, nombre: 'Noviembre', abrev: 'Nov' },
  { num: 12, nombre: 'Diciembre', abrev: 'Dic' }
];

export default function ConsultaMovilView({ onBackToDashboard }) {
  // Flujo de pantallas: 'bienvenida' | 'animacion_intro' | 'equipos' | 'seleccion' | 'kpis'
  const [screen, setScreen] = useState('bienvenida');

  // Equipo Técnico seleccionado
  const [selectedEquipo, setSelectedEquipo] = useState('OPJ');

  // Subventanas / Modales interactivos: 'distrito' | 'sede' | 'organo' | 'mes' | 'produccion' | 'ingresos' | 'construccion' | null
  const [activeModal, setActiveModal] = useState(null);

  // Datos consolidados (166 dependencias activas incluyendo 4639 en EJECUCIÓN)
  const [data, setData] = useState(staticConsultasData);

  // Filtros de navegación
  const [selectedDistrito, setSelectedDistrito] = useState('');
  const [selectedSede, setSelectedSede] = useState('');
  const [selectedDepId, setSelectedDepId] = useState(null);
  const [selectedMes, setSelectedMes] = useState(Number(staticConsultasData?.max_mes_subido || 10));
  const [selectedAnio, setSelectedAnio] = useState(2026);
  const [searchFilter, setSearchFilter] = useState('');

  // Toast flotante con animación fluida
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2600);
  };

  // Carga reactiva de datos en tiempo real si el backend está activo
  useEffect(() => {
    try {
      fetch('/api/consulta-movil/datos?fresh=true')
        .then(res => (res.ok ? res.json() : null))
        .then(json => {
          if (json && json.success && json.data) {
            setData(json.data);
            if (json.data.max_mes_subido) {
              setSelectedMes(Number(json.data.max_mes_subido));
            }
          }
        })
        .catch(() => {});
    } catch (_) {}
  }, []);

  // Transición animada interactiva con el GIF Oficial del Logo PJ
  const handleIngresarSistema = () => {
    setScreen('animacion_intro');
    // Duración de la animación: avanza automáticamente a los 4.5s o al tocar el botón
    setTimeout(() => {
      setScreen(prev => (prev === 'animacion_intro' ? 'equipos' : prev));
    }, 4500);
  };

  // 1. Filtrar las dependencias exclusivas del Equipo Técnico seleccionado
  const dependenciasDelEquipo = useMemo(() => {
    if (!data || !data.dependencias) return [];
    return data.dependencias.filter(d => (d.equipo_tecnico || 'OPJ') === selectedEquipo);
  }, [data, selectedEquipo]);

  // 2. Distritos disponibles con conteo para los chips de selección
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

  // 4. Dependencias filtradas por distrito, sede y búsqueda reactiva
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

  // Dependencia seleccionada activa
  const dependenciaActual = useMemo(() => {
    if (!dependenciasFiltradas.length) return null;
    if (selectedDepId) {
      const found = dependenciasFiltradas.find(d => d.n_dependencia === selectedDepId);
      if (found) return found;
    }
    return dependenciasFiltradas[0];
  }, [dependenciasFiltradas, selectedDepId]);

  // Manejador al seleccionar un Equipo Técnico
  const handleSeleccionarEquipo = (eqId) => {
    if (EQUIPOS_CONFIG[eqId]?.enConstruccion) {
      setActiveModal('construccion');
      return;
    }
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
    setActiveModal(null);
  };

  // Manejadores interactivos paso a paso para los filtros en subventanas
  const handleSeleccionarDistrito = (distrito) => {
    setSelectedDistrito(distrito);
    setSearchFilter('');
    const sedesDelDist = dependenciasDelEquipo
      .filter(d => d.distrito === distrito)
      .map(d => d.sede);
    const nuevaSede = sedesDelDist[0] || '';
    setSelectedSede(nuevaSede);

    const deps = dependenciasDelEquipo.filter(d =>
      d.distrito === distrito && d.sede === nuevaSede
    );
    if (deps.length > 0) {
      setSelectedDepId(deps[0].n_dependencia);
    }

    // Paso 1 completado -> Abre automáticamente la subventana del Paso 2 (Sede)
    setActiveModal('sede');
  };

  const handleSeleccionarSede = (sede) => {
    setSelectedSede(sede);
    setSearchFilter('');
    const deps = dependenciasDelEquipo.filter(d =>
      d.distrito === distritoEfectivo && d.sede === sede
    );
    if (deps.length > 0) {
      setSelectedDepId(deps[0].n_dependencia);
    }

    // Paso 2 completado -> Abre automáticamente la subventana del Paso 3 (Órgano)
    setActiveModal('organo');
  };

  const handleSeleccionarOrgano = (depId) => {
    setSelectedDepId(depId);
    // Paso 3 completado -> Abre automáticamente la subventana del Paso 4 (Mes de evaluación)
    setActiveModal('mes');
  };

  const handleSeleccionarMesEnModal = (mObj) => {
    if (mObj.locked) {
      showToast(`🔒 ${mObj.nombre}: Pendiente de ingesta oficial`);
      return;
    }
    setSelectedMes(mObj.num);
    setActiveModal(null);
    showToast(`✓ Filtros completos: ${mObj.nombre} seleccionado`);
  };

  // Detección dinámica del año y del mes máximo activo
  const anioActivo = Number(data?.anio || selectedAnio || 2026);
  const maxMesActivo = Number(data?.max_mes_subido || 10);

  const mesesCalendario = useMemo(() => {
    const mesInicio = anioActivo === 2026 ? 9 : 1;
    return BASE_MESES_CALENDARIO
      .filter(m => m.num >= mesInicio)
      .map(m => ({
        ...m,
        locked: m.num > maxMesActivo
      }));
  }, [anioActivo, maxMesActivo]);

  useEffect(() => {
    if (anioActivo === 2026 && selectedMes < 9) {
      setSelectedMes(maxMesActivo >= 9 ? maxMesActivo : 9);
    }
  }, [anioActivo, selectedMes, maxMesActivo]);

  const handleMesChangeDirecto = (mObj) => {
    if (mObj.locked) {
      showToast(`🔒 ${mObj.nombre}: Pendiente de ingesta oficial`);
      return;
    }
    setSelectedMes(mObj.num);
  };

  // 5. KPIs del mes seleccionado
  const kpisActuales = useMemo(() => {
    if (!dependenciaActual || !dependenciaActual.meses) return null;
    const mesKey = String(selectedMes);
    const kpi = dependenciaActual.meses[mesKey] || dependenciaActual.meses[selectedMes];
    if (kpi) return kpi;
    const mesDefecto = anioActivo === 2026 ? String(maxMesActivo || 10) : '1';
    return dependenciaActual.meses[mesDefecto] || Object.values(dependenciaActual.meses)[0] || null;
  }, [dependenciaActual, selectedMes, anioActivo]);

  // Historial mes a mes desde Enero (1) hasta el mes seleccionado para las subventanas
  const desgloseHistoricoMeses = useMemo(() => {
    if (!dependenciaActual || !dependenciaActual.meses) return [];
    const list = [];
    for (let m = 1; m <= selectedMes; m++) {
      const dataMes = dependenciaActual.meses[String(m)] || dependenciaActual.meses[m] || null;
      const metaMesInfo = BASE_MESES_CALENDARIO.find(b => b.num === m) || { nombre: `Mes ${m}`, abrev: `M${m}` };
      list.push({
        num: m,
        nombre: metaMesInfo.nombre,
        abrev: metaMesInfo.abrev,
        produccion_mes: dataMes ? Number(dataMes.produccion_mes || 0) : 0,
        total_produccion: dataMes ? Number(dataMes.total_produccion || 0) : 0,
        ingresos_mes: dataMes ? Number(dataMes.ingresos_mes || 0) : 0,
        total_ingresos: dataMes ? Number(dataMes.total_ingresos !== undefined ? dataMes.total_ingresos : dataMes.ingresos_mes || 0) : 0,
        esMesSeleccionado: m === selectedMes
      });
    }
    return list;
  }, [dependenciaActual, selectedMes]);

  const equipoConfig = EQUIPOS_CONFIG[selectedEquipo] || EQUIPOS_CONFIG.OPJ;

  // Estilos del Nivel Resolutivo en Modo Claro con Alto Contraste
  const nivelConfig = useMemo(() => {
    const niv = String(kpisActuales?.nivel || '').toUpperCase();
    if (niv.includes('SOBRESALIENTE') || niv.includes('MUY BUENO')) {
      return {
        bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        border: '#10b981',
        text: '#047857',
        badgeBg: '#10b981',
        icon: '▲',
        label: niv.includes('SOBRESALIENTE') ? 'SOBRESALIENTE' : 'MUY BUENO',
        descripcion: 'Supera el estándar y el avance ideal proyectado'
      };
    }
    if (niv.includes('BUENO')) {
      return {
        bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: '#f59e0b',
        text: '#b45309',
        badgeBg: '#f59e0b',
        icon: '▶',
        label: 'BUENO',
        descripcion: 'Cumple el rango aceptable de metas judiciales'
      };
    }
    if (niv.includes('BAJO')) {
      return {
        bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        border: '#ef4444',
        text: '#b91c1c',
        badgeBg: '#ef4444',
        icon: '▼',
        label: 'BAJO',
        descripcion: 'Por debajo del umbral mínimo resolutivo mensual'
      };
    }
    return {
      bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      border: '#cbd5e1',
      text: '#475569',
      badgeBg: '#94a3b8',
      icon: '⚪',
      label: 'SIN META',
      descripcion: 'Pendiente de asignación de meta o sin turno activo'
    };
  }, [kpisActuales]);

  // Cerrar sesión
  const handleCerrarSesion = () => {
    setScreen('bienvenida');
    setSearchFilter('');
    setActiveModal(null);
    showToast('Sesión finalizada correctamente');
  };

  // Copiar resumen de gestión
  const handleCopiarResumen = () => {
    if (!dependenciaActual || !kpisActuales) return;
    const metaLabel = equipoConfig.labelMeta;
    const avanceLabel = equipoConfig.labelAvance;
    const metaVal = (selectedEquipo === 'OPJ' ? (kpisActuales.meta_sie || kpisActuales.meta_preliminar) : kpisActuales.meta_preliminar);
    const metaValStr = (!metaVal || metaVal === 0) ? '— (Pendiente)' : fmtNum(metaVal);
    const avanceValStr = (kpisActuales.avance_pct === null || kpisActuales.avance_pct === undefined || (selectedEquipo === 'OPJ' && !kpisActuales.meta_sie)) ? '— (Pendiente)' : `${kpisActuales.avance_pct}%`;
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
📊 *Total de Producción:* ${fmtNum(kpisActuales.total_produccion)} expedientes (Mes de ${kpisActuales.nombre_mes}: ${fmtNum(kpisActuales.produccion_mes)})
🎯 *${metaLabel}:* ${metaValStr}
⚡ *${avanceLabel}:* ${avanceValStr}
⏱️ *% Ideal del Mes:* ${idealVal}%
🏆 *Nivel Resolutivo:* ${kpisActuales.nivel}
${selectedEquipo === 'EJECUCION' ? `📋 *Carga Pendiente en Ejecución:* ${fmtNum(kpisActuales.carga_procesal_mes)}` : `📁 *Carga Procesal del Mes:* ${fmtNum(kpisActuales.carga_procesal_mes)}`}
📥 *Total de Ingresos:* ${fmtNum(kpisActuales.total_ingresos !== undefined ? kpisActuales.total_ingresos : kpisActuales.ingresos_mes)} expedientes (hasta ${kpisActuales.nombre_mes})
📥 *Ingresos del Mes:* ${fmtNum(kpisActuales.ingresos_mes)} expedientes
🏛️ *Meta Estándar:* ${fmtNum(kpisActuales.meta_estandar)}
------------------------------------------
_Fuente: SIMENGJ / UPD - Estadística CSJLE_`;

    navigator.clipboard.writeText(texto).then(() => {
      showToast('✓ Reporte copiado al portapapeles');
    }).catch(() => {
      showToast('✓ Texto copiado');
    });
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse 90% 60% at 50% -10%, #e0f2fe 0%, #f8fafc 55%, #f1f5f9 100%)',
      color: '#0f172a',
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

      {/* Contenedor centralizado mobile-first en tono claro */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-right))',
        paddingTop: 'max(14px, env(safe-area-inset-top))',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)',
        position: 'relative'
      }}>

        {/* Toast flotante */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: '#0f172a',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'fadeIn 180ms ease'
          }}>
            {toastMessage}
          </div>
        )}

        {/* ============================================================== */}
        {/* 1. PANTALLA: BIENVENIDA / ACCESO AL SISTEMA                    */}
        {/* ============================================================== */}
        {screen === 'bienvenida' && (
          <div className="animate-fade-in" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 8px 12px 8px'
          }}>
            {/* Cabecera institucional con Logo Oficial y Sello PJ */}
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{
                  padding: '6px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
                  boxShadow: '0 12px 32px rgba(139, 28, 29, 0.16), 0 2px 8px rgba(0, 0, 0, 0.04)',
                  border: '1.5px solid rgba(139, 28, 29, 0.25)'
                }}>
                  <img
                    src="/Logo.jpg"
                    alt="Logo Poder Judicial - CSJLE"
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '20px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                </div>
              </div>

              {/* Badge Institucional */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                marginBottom: '14px'
              }}>
                <span style={{ fontSize: '13px' }}>⚖️</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#8B1C1D', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Poder Judicial del Perú
                </span>
              </div>

              <h1 style={{
                fontSize: '36px',
                fontWeight: '900',
                margin: '0 0 6px 0',
                letterSpacing: '-0.03em'
              }}>
                <span style={{ color: '#8B1C1D' }}>SIMEN</span><span style={{ color: '#58595B' }}>GJ</span>
              </h1>

              <div style={{
                fontSize: '13px',
                fontWeight: '800',
                color: '#8B1C1D',
                marginBottom: '12px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                Corte Superior de Justicia de Lima Este
              </div>

              <p style={{
                fontSize: '13.5px',
                color: '#64748b',
                lineHeight: '1.6',
                margin: '0 auto',
                maxWidth: '360px'
              }}>
                Sistema de Monitoreo y Evaluación de Niveles de Gestión Judicial. Consulta ágil de metas, producción y carga por equipo técnico.
              </p>
            </div>

            {/* Bento Grid de métricas clave en tono claro */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: '18px',
              margin: '22px 0',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '2px' }}>🏛️</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>166</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Dependencias Activas</div>
                </div>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '2px' }}>📊</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>5 Módulos</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Equipos Técnicos</div>
                </div>
              </div>

              {/* Indicador de último mes oficial activo */}
              <div style={{
                marginTop: '12px',
                padding: '9px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                  Datos oficiales actualizados:
                </span>
                <span style={{ fontSize: '12px', color: '#8B1C1D', fontWeight: '800' }}>
                  Octubre 2026 ✓
                </span>
              </div>
            </div>

            {/* Botón de Entrada con disparador de la animación */}
            <div style={{ width: '100%' }}>
              <button
                onClick={handleIngresarSistema}
                className="touch-press"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '18px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #8B1C1D 0%, #6e1516 100%)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '800',
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 10px 24px -4px rgba(139, 28, 29, 0.45)',
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
        {/* INTERACCIÓN: TRANSICIÓN OFICIAL CON GIF LOGO PJ (3D PUZZLE)    */}
        {/* ============================================================== */}
        {screen === 'animacion_intro' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 12px',
            textAlign: 'center',
            position: 'relative',
            width: '100%',
            minHeight: '80vh'
          }}>
            {/* Contenedor del GIF Animado con Borde Institucional y Sombra */}
            <div style={{
              width: '100%',
              maxWidth: '480px',
              borderRadius: '24px',
              overflow: 'hidden',
              background: '#0a0a0c',
              border: '2px solid rgba(139, 28, 29, 0.45)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(139, 28, 29, 0.25)',
              position: 'relative',
              aspectRatio: '16 / 9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src="/Logo PJ GIF.gif"
                alt="Logo PJ Animado - Poder Judicial"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>

            <div className="animate-slide-up" style={{ marginTop: '20px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '9999px',
                background: '#fef2f2',
                color: '#8B1C1D',
                border: '1px solid #fecaca',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.04em',
                marginBottom: '8px'
              }}>
                ⚖️ PODER JUDICIAL • CORTE DE LIMA ESTE
              </div>

              <h2 style={{
                fontSize: '22px',
                fontWeight: '900',
                color: '#0f172a',
                margin: '0 0 4px 0',
                letterSpacing: '-0.02em'
              }}>
                <span style={{ color: '#8B1C1D' }}>SIMEN</span><span style={{ color: '#58595B' }}>GJ</span> • CSJLE
              </h2>

              <p style={{
                fontSize: '12.5px',
                color: '#64748b',
                margin: 0
              }}>
                Sincronizando los 5 Equipos Técnicos Jurisdiccionales
              </p>
            </div>

            {/* Botón para omitir intro y continuar directamente */}
            <button
              onClick={() => setScreen('equipos')}
              className="touch-press"
              style={{
                marginTop: '24px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '8px 18px',
                borderRadius: '9999px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}
            >
              Saltar intro ➔
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. PANTALLA: EQUIPOS TÉCNICOS (5 MÓDULOS DE GESTIÓN)            */}
        {/* ============================================================== */}
        {screen === 'equipos' && (
          <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Barra superior con Cerrar Sesión */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '14px',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  border: '1.5px solid #8B1C1D',
                  boxShadow: '0 2px 6px rgba(139, 28, 29, 0.1)'
                }}>
                  <img
                    src="/Logo.jpg"
                    alt="Logo SIMENGJ"
                    style={{
                      width: '24px',
                      height: '24px',
                      objectFit: 'contain'
                    }}
                  />
                  <img
                    src="/pj.png"
                    alt="Logo CSJLE"
                    style={{
                      width: '28px',
                      height: '22px',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', lineHeight: 1.1 }}>
                    <span style={{ color: '#8B1C1D' }}>SIMEN</span><span style={{ color: '#58595B' }}>GJ</span>
                  </span>
                  <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#8B1C1D', letterSpacing: '0.04em' }}>
                    CSJLE • PODER JUDICIAL
                  </span>
                </div>
              </div>

              <button
                onClick={handleCerrarSesion}
                className="touch-press"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
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
                <span>Salir</span>
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '8px',
                background: '#e0f2fe',
                color: '#0369a1',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.04em',
                marginBottom: '6px'
              }}>
                MÓDULOS DE GESTIÓN (5)
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 6px 0', color: '#0f172a', letterSpacing: '-0.02em' }}>
                Equipos Técnicos
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.45' }}>
                Seleccione el equipo institucional para consultar indicadores oficiales y metas:
              </p>
            </div>

            {/* Listado de las 5 Tarjetas Bento de Equipos Técnicos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, paddingBottom: '16px' }}>
              {Object.values(EQUIPOS_CONFIG).map((eq) => {
                const count = (data?.dependencias || []).filter(d => (d.equipo_tecnico || 'OPJ') === eq.id).length || eq.badge;

                return (
                  <div
                    key={eq.id}
                    onClick={() => handleSeleccionarEquipo(eq.id)}
                    className="touch-press"
                    style={{
                      background: eq.enConstruccion
                        ? 'linear-gradient(145deg, #fefce8 0%, #ffffff 100%)'
                        : eq.grad,
                      border: eq.enConstruccion
                        ? '1.5px dashed #facc15'
                        : `1.5px solid ${eq.border}`,
                      borderRadius: '18px',
                      padding: '16px',
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          fontSize: '22px',
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: eq.accentBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${eq.border}`,
                          boxShadow: `0 2px 8px ${eq.glow}`
                        }}>
                          {eq.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '16.5px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.01em' }}>
                            {eq.nombre}
                          </div>
                          {eq.enConstruccion ? (
                            <div style={{ fontSize: '11.5px', color: '#a16207', fontWeight: '800' }}>
                              🚧 En construcción • Analizando datos
                            </div>
                          ) : (
                            <div style={{ fontSize: '11.5px', color: eq.color, fontWeight: '700' }}>
                              {count} dependencias activas
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{
                        width: eq.enConstruccion ? 'auto' : '32px',
                        height: '32px',
                        borderRadius: eq.enConstruccion ? '8px' : '50%',
                        padding: eq.enConstruccion ? '0 10px' : '0',
                        background: eq.enConstruccion ? '#fef9c3' : '#f1f5f9',
                        border: eq.enConstruccion ? '1px solid #fde047' : '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: eq.enConstruccion ? '#854d0e' : eq.color,
                        fontWeight: '800',
                        fontSize: eq.enConstruccion ? '11px' : '14px'
                      }}>
                        {eq.enConstruccion ? 'Ver estado' : '➔'}
                      </div>
                    </div>

                    <div style={{
                      fontSize: '12.5px',
                      color: '#475569',
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
                      borderTop: '1px solid rgba(0, 0, 0, 0.06)'
                    }}>
                      {eq.enConstruccion ? (
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#fef08a',
                          color: '#854d0e',
                          border: '1px solid #facc15'
                        }}>
                          🚧 En construcción • Analizando datos
                        </span>
                      ) : (
                        <>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#f8fafc',
                            color: '#334155',
                            border: '1px solid #e2e8f0'
                          }}>
                            🎯 {eq.labelMeta}
                          </span>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: eq.accentBg,
                            color: eq.color,
                            border: `1px solid ${eq.border}`
                          }}>
                            ⏱️ {eq.idealFijo ? 'Ideal: 100%' : 'Ideal Mensual'}
                          </span>
                        </>
                      )}
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
        {/* 3. PANTALLA: FILTROS INTERACTIVOS EN SUBVENTANAS / PASOS       */}
        {/* ============================================================== */}
        {screen === 'seleccion' && (
          <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Barra superior de navegación */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '12px',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '14px'
            }}>
              <button
                onClick={() => setScreen('equipos')}
                className="touch-press"
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
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
                padding: '5px 12px',
                borderRadius: '9999px',
                background: equipoConfig.accentBg,
                border: `1px solid ${equipoConfig.border}`,
                color: equipoConfig.color,
                fontSize: '12px',
                fontWeight: '800'
              }}>
                <span>{equipoConfig.icon}</span>
                <span>{equipoConfig.nombre}</span>
              </div>

              {/* Botón Salir */}
              <button
                onClick={handleCerrarSesion}
                className="touch-press"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
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

            {/* Cabecera de la sección de filtros */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Filtros Guiados
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: equipoConfig.color,
                  background: equipoConfig.accentBg,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${equipoConfig.border}`
                }}>
                  {dependenciasDelEquipo.length} Órganos disponibles
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                Toque cada paso para abrir su selector interactivo en subventana:
              </p>
            </div>

            {/* LISTA DE LOS 4 PASOS MINIMIZADOS E INTERACTIVOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>

              {/* PASO 1: DISTRITO JUDICIAL */}
              <div
                onClick={() => setActiveModal('distrito')}
                className="touch-press"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #0284c7',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(2, 132, 199, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '800'
                  }}>
                    📍
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800', letterSpacing: '0.04em' }}>
                      PASO 1: DISTRITO JUDICIAL
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '1px' }}>
                      {distritoEfectivo || 'Seleccione un distrito'}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>✓</span>
                  <span>Cambiar</span>
                </div>
              </div>

              {/* PASO 2: SEDE JUDICIAL */}
              <div
                onClick={() => setActiveModal('sede')}
                className="touch-press"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #38bdf8',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(56, 189, 248, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#f0f9ff',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '800'
                  }}>
                    🏢
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '800', letterSpacing: '0.04em' }}>
                      PASO 2: SEDE JUDICIAL
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '1px' }}>
                      {sedeEfectiva || 'Seleccione una sede'}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>✓</span>
                  <span>Cambiar</span>
                </div>
              </div>

              {/* PASO 3: ÓRGANO JURISDICCIONAL */}
              <div
                onClick={() => setActiveModal('organo')}
                className="touch-press"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #6366f1',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(99, 102, 241, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '75%' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#eef2ff',
                    color: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '800',
                    flexShrink: 0
                  }}>
                    ⚖️
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '11px', color: '#4f46e5', fontWeight: '800', letterSpacing: '0.04em' }}>
                      PASO 3: ÓRGANO JURISDICCIONAL
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      color: '#0f172a',
                      marginTop: '1px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {dependenciaActual ? dependenciaActual.dependencia : 'Seleccione el juzgado'}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}>
                  <span>✓</span>
                  <span>Cambiar</span>
                </div>
              </div>

              {/* PASO 4: MES DE EVALUACIÓN */}
              <div
                onClick={() => setActiveModal('mes')}
                className="touch-press"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #8b5cf6',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(139, 92, 246, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#f5f3ff',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '800'
                  }}>
                    📅
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '800', letterSpacing: '0.04em' }}>
                      PASO 4: MES DE EVALUACIÓN ({selectedAnio})
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '1px' }}>
                      {mesesCalendario.find(m => m.num === selectedMes)?.nombre || 'Octubre'}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>✓</span>
                  <span>Cambiar</span>
                </div>
              </div>

            </div>

            {/* BOTÓN CTA FLOTANTE INFERIOR DENTRO DE LA ZONA DEL PULGAR */}
            <div style={{
              marginTop: 'auto',
              paddingTop: '6px',
              position: 'sticky',
              bottom: 0,
              zIndex: 30,
              background: 'linear-gradient(to top, #f8fafc 85%, rgba(248, 250, 252, 0) 100%)',
              paddingBottom: '2px'
            }}>
              <button
                disabled={!dependenciaActual}
                onClick={() => setScreen('kpis')}
                className="touch-press"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '18px',
                  border: 'none',
                  background: dependenciaActual
                    ? 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)'
                    : '#cbd5e1',
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
                    ? '0 10px 24px -4px rgba(2, 132, 199, 0.45)'
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
        {/* 4. PANTALLA DE KPIS Y RESULTADOS CON COLOR VIBRANTE             */}
        {/* ============================================================== */}
        {screen === 'kpis' && (
          <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* Alerta si faltan datos */}
            {(!dependenciaActual || !kpisActuales) ? (
              <div style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '24px',
                textAlign: 'center',
                margin: 'auto 0',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
                <h3 style={{ fontSize: '16px', color: '#0f172a', marginBottom: '8px' }}>
                  No se encontraron indicadores
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
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
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: '12px'
                }}>
                  <button
                    onClick={() => setScreen('seleccion')}
                    className="touch-press"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
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
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        color: '#0369a1',
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
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
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

                {/* SELECTOR RÁPIDO DE MESES DIRECTO EN LA PANTALLA DE KPIS */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  marginBottom: '12px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.04em' }}>
                      CAMBIO RÁPIDO DE MES ({selectedAnio})
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: '800' }}>
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
                    {mesesCalendario.map(m => {
                      const isSel = selectedMes === m.num;
                      return (
                        <button
                          key={m.num}
                          onClick={() => handleMesChangeDirecto(m)}
                          className="touch-press"
                          style={{
                            flex: '0 0 auto',
                            padding: '6px 11px',
                            borderRadius: '9px',
                            border: isSel ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                            background: isSel ? '#0284c7' : m.locked ? '#f1f5f9' : '#ffffff',
                            color: isSel ? '#ffffff' : m.locked ? '#94a3b8' : '#334155',
                            fontSize: '11px',
                            fontWeight: isSel ? '800' : '600',
                            cursor: m.locked ? 'not-allowed' : 'pointer',
                            opacity: m.locked ? 0.65 : 1,
                            boxShadow: isSel ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
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
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '16px',
                  marginBottom: '12px',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: equipoConfig.color,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      background: equipoConfig.accentBg,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${equipoConfig.border}`
                    }}>
                      {equipoConfig.icon} {equipoConfig.nombre}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Cód: {dependenciaActual.n_dependencia}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15.5px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0', lineHeight: '1.35' }}>
                    {dependenciaActual.dependencia}
                  </h3>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: '#475569' }}>
                    <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      📍 {dependenciaActual.distrito}
                    </span>
                    <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      🏢 Sede: {dependenciaActual.sede}
                    </span>
                    <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      📅 {kpisActuales.nombre_mes} {selectedAnio}
                    </span>
                  </div>
                </div>

                {/* INSIGHT CARD DESTACADO */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '1.5px solid #bae6fd',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 10px rgba(2, 132, 199, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🏛️</span>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                        {selectedEquipo === 'OPJ' ? 'Meta Estándar R.A. 90-2025' : `${equipoConfig.insightPrefix}`}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {selectedEquipo === 'EJECUCION' ? 'Meta mensual de resoluciones en ejecución' : 'Meta anual de referencia establecida'}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '17px',
                    fontWeight: '900',
                    color: '#0369a1',
                    background: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #bae6fd',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    {fmtNum(kpisActuales.meta_estandar || dependenciaActual.meta_estandar)}
                  </div>
                </div>

                {/* BENTO GRID DE LOS INDICADORES CON MÁS COLOR VIBRANTE */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px'
                }}>

                  {/* 1. Total de Producción (INTERACTIVO -> Abre Subventana) */}
                  <div
                    onClick={() => setActiveModal('produccion')}
                    className="touch-press"
                    style={{
                      background: 'linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%)',
                      border: '2px solid #0284c7',
                      borderRadius: '18px',
                      padding: '14px 12px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(2, 132, 199, 0.18)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: '800' }}>
                        TOTAL PRODUCCIÓN
                      </span>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: '800',
                        color: '#0284c7',
                        background: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd'
                      }}>
                        📊 Ver detalle ➔
                      </span>
                    </div>

                    <div style={{ fontSize: '27px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
                      {fmtNum(kpisActuales.total_produccion)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '3px', fontWeight: '700' }}>
                      Mes de {kpisActuales.nombre_mes}: <strong style={{ color: '#0f172a' }}>{fmtNum(kpisActuales.produccion_mes)}</strong>
                    </div>
                  </div>

                  {/* 2. Meta específica según Equipo Técnico */}
                  <div style={{
                    background: 'linear-gradient(145deg, #eff6ff 0%, #ffffff 100%)',
                    border: '1.5px solid #93c5fd',
                    borderRadius: '18px',
                    padding: '14px 12px',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08)'
                  }}>
                    <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {equipoConfig.labelMeta}
                    </div>
                    <div style={{ fontSize: '27px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
                      {(() => {
                        const val = selectedEquipo === 'OPJ' ? (kpisActuales.meta_sie || kpisActuales.meta_preliminar) : kpisActuales.meta_preliminar;
                        if (!val || val === 0) return '—';
                        return fmtNum(val);
                      })()}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', lineHeight: '1.3' }}>
                      {(() => {
                        const val = selectedEquipo === 'OPJ' ? (kpisActuales.meta_sie || kpisActuales.meta_preliminar) : kpisActuales.meta_preliminar;
                        if (!val || val === 0) return 'Pendiente de registrar Meta SIE';
                        return selectedEquipo === 'EJECUCION' ? 'Meta mensual estándar de 150' : selectedEquipo === 'OPJ' ? 'Meta ajustada SIE PJ' : 'Objetivo oficial';
                      })()}
                    </div>
                  </div>

                  {/* 3. % de Avance con Color Vibrante */}
                  <div style={{
                    background: (kpisActuales.avance_pct >= (equipoConfig.idealFijo || kpisActuales.ideal_mes_pct))
                      ? 'linear-gradient(145deg, #ecfdf5 0%, #d1fae5 100%)'
                      : 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)',
                    border: (kpisActuales.avance_pct >= (equipoConfig.idealFijo || kpisActuales.ideal_mes_pct))
                      ? '1.5px solid #10b981'
                      : '1.5px solid #f59e0b',
                    borderRadius: '18px',
                    padding: '14px 12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: (kpisActuales.avance_pct >= (equipoConfig.idealFijo || kpisActuales.ideal_mes_pct)) ? '#047857' : '#b45309',
                      fontWeight: '800',
                      marginBottom: '4px',
                      textTransform: 'uppercase'
                    }}>
                      {equipoConfig.labelAvance}
                    </div>
                    <div style={{
                      fontSize: '27px',
                      fontWeight: '900',
                      letterSpacing: '-0.02em',
                      color: (kpisActuales.avance_pct === null || kpisActuales.avance_pct === undefined || (selectedEquipo === 'OPJ' && !kpisActuales.meta_sie)) ? '#94a3b8' : (kpisActuales.avance_pct >= (equipoConfig.idealFijo || kpisActuales.ideal_mes_pct) ? '#047857' : '#b45309')
                    }}>
                      {(kpisActuales.avance_pct === null || kpisActuales.avance_pct === undefined || (selectedEquipo === 'OPJ' && !kpisActuales.meta_sie)) ? '—' : `${kpisActuales.avance_pct}%`}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px' }}>
                      {(kpisActuales.avance_pct === null || kpisActuales.avance_pct === undefined || (selectedEquipo === 'OPJ' && !kpisActuales.meta_sie))
                        ? 'Pendiente de Meta SIE'
                        : (kpisActuales.avance_pct >= (equipoConfig.idealFijo || kpisActuales.ideal_mes_pct) ? '✓ Supera avance ideal' : 'Por debajo del ideal')}
                    </div>
                  </div>

                  {/* 4. Carga Procesal / Carga Pendiente en Ejecución */}
                  <div style={{
                    background: 'linear-gradient(145deg, #fff7ed 0%, #ffedd5 100%)',
                    border: '1.5px solid #fb923c',
                    borderRadius: '18px',
                    padding: '14px 12px',
                    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.08)'
                  }}>
                    <div style={{ fontSize: '11px', color: '#c2410c', fontWeight: '800', marginBottom: '4px' }}>
                      {selectedEquipo === 'EJECUCION' ? 'CARGA EN EJECUCIÓN' : 'CARGA PROCESAL DEL MES'}
                    </div>
                    <div style={{ fontSize: '27px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
                      {fmtNum(kpisActuales.carga_procesal_mes)}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px' }}>
                      {selectedEquipo === 'EJECUCION' ? `Pendientes (${kpisActuales.nombre_mes})` : `En trámite (${kpisActuales.nombre_mes})`}
                    </div>
                  </div>

                  {/* 5. Total de Ingresos (INTERACTIVO -> Abre Subventana) */}
                  <div
                    onClick={() => setActiveModal('ingresos')}
                    className="touch-press"
                    style={{
                      background: 'linear-gradient(145deg, #faf5ff 0%, #f3e8ff 100%)',
                      border: '2px solid #9333ea',
                      borderRadius: '18px',
                      padding: '14px 12px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(147, 51, 234, 0.16)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: '800' }}>
                        TOTAL INGRESOS
                      </span>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: '800',
                        color: '#7e22ce',
                        background: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        border: '1px solid #d8b4fe'
                      }}>
                        📥 Ver detalle ➔
                      </span>
                    </div>

                    <div style={{ fontSize: '27px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
                      {fmtNum(kpisActuales.total_ingresos !== undefined ? kpisActuales.total_ingresos : kpisActuales.ingresos_mes)}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#7e22ce', marginTop: '2px', lineHeight: '1.3' }}>
                      Hasta {kpisActuales.nombre_mes} ({fmtNum(kpisActuales.ingresos_mes)} en el mes)
                    </div>
                  </div>

                  {/* 6. % Ideal del Mes */}
                  <div style={{
                    background: 'linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)',
                    border: '1.5px solid #2dd4bf',
                    borderRadius: '18px',
                    padding: '14px 12px',
                    boxShadow: '0 2px 8px rgba(45, 212, 191, 0.08)'
                  }}>
                    <div style={{ fontSize: '11px', color: '#0f766e', fontWeight: '800', marginBottom: '4px' }}>
                      % IDEAL DEL MES
                    </div>
                    <div style={{ fontSize: '27px', fontWeight: '900', color: '#0f766e', letterSpacing: '-0.02em' }}>
                      {equipoConfig.idealFijo !== null ? equipoConfig.idealFijo : kpisActuales.ideal_mes_pct}%
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px' }}>
                      {equipoConfig.idealFijo !== null ? 'Estándar mensual 100%' : `Referencia a ${kpisActuales.nombre_mes}`}
                    </div>
                  </div>

                  {/* 7. Nivel Resolutivo / Cumplimiento */}
                  <div style={{
                    gridColumn: '1 / -1',
                    background: nivelConfig.bg,
                    border: `1.5px solid ${nivelConfig.border}`,
                    borderRadius: '18px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#475569', fontWeight: '700' }}>
                        NIVEL RESOLUTIVO
                      </div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '900',
                        color: nivelConfig.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        margin: '3px 0'
                      }}>
                        <span>{nivelConfig.icon}</span>
                        <span>{nivelConfig.label}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.2' }}>
                        {nivelConfig.descripcion}
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 14px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: `1px solid ${nivelConfig.border}`,
                      color: nivelConfig.text,
                      fontWeight: '900',
                      fontSize: '13px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      Oficial
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBVENTANA 1: SELECCIÓN DE DISTRITO JUDICIAL                   */}
        {/* ============================================================== */}
        {activeModal === 'distrito' && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}>
            <div className="animate-sheet-up" style={{
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px calc(env(safe-area-inset-bottom, 20px) + 20px) 20px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800' }}>PASO 1 DE 4</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '2px 0 0 0', color: '#0f172a' }}>
                    Seleccione Distrito Judicial
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="no-scrollbar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {distritosDisponibles.map(({ distrito, count }) => {
                  const isSel = distrito === distritoEfectivo;
                  return (
                    <div
                      key={distrito}
                      onClick={() => handleSeleccionarDistrito(distrito)}
                      className="touch-press"
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        border: isSel ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isSel ? '#f0f9ff' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>📍</span>
                        <span style={{ fontSize: '14.5px', fontWeight: isSel ? '800' : '600', color: '#0f172a' }}>
                          {distrito}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: isSel ? '#0284c7' : '#f1f5f9',
                        color: isSel ? '#ffffff' : '#64748b'
                      }}>
                        {count} órganos
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBVENTANA 2: SELECCIÓN DE SEDE JUDICIAL                       */}
        {/* ============================================================== */}
        {activeModal === 'sede' && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}>
            <div className="animate-sheet-up" style={{
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px calc(env(safe-area-inset-bottom, 20px) + 20px) 20px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800' }}>PASO 2 DE 4 • {distritoEfectivo}</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '2px 0 0 0', color: '#0f172a' }}>
                    Seleccione Sede Judicial
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="no-scrollbar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sedesDisponibles.map(({ sede, count }) => {
                  const isSel = sede === sedeEfectiva;
                  return (
                    <div
                      key={sede}
                      onClick={() => handleSeleccionarSede(sede)}
                      className="touch-press"
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        border: isSel ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isSel ? '#f0f9ff' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>🏢</span>
                        <span style={{ fontSize: '14.5px', fontWeight: isSel ? '800' : '600', color: '#0f172a' }}>
                          {sede}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: isSel ? '#0284c7' : '#f1f5f9',
                        color: isSel ? '#ffffff' : '#64748b'
                      }}>
                        {count} {count === 1 ? 'juzgado' : 'juzgados'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBVENTANA 3: SELECCIÓN DE ÓRGANO JURISDICCIONAL               */}
        {/* ============================================================== */}
        {activeModal === 'organo' && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}>
            <div className="animate-sheet-up" style={{
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px calc(env(safe-area-inset-bottom, 20px) + 20px) 20px',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800' }}>PASO 3 DE 4 • {sedeEfectiva}</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '2px 0 0 0', color: '#0f172a' }}>
                    Seleccione Órgano Judicial
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Buscador inteligente */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <span style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar órgano por nombre o código..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 36px 11px 36px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div className="no-scrollbar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dependenciasFiltradas.map(dep => {
                  const isSel = dependenciaActual?.n_dependencia === dep.n_dependencia;
                  return (
                    <div
                      key={dep.n_dependencia}
                      onClick={() => handleSeleccionarOrgano(dep.n_dependencia)}
                      className="touch-press"
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: isSel ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isSel ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          color: isSel ? '#0284c7' : '#64748b',
                          background: '#f1f5f9',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          #{dep.n_dependencia} • {dep.especialidad || 'Judicial'}
                        </span>
                        {isSel && (
                          <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#059669' }}>
                            ✓ Seleccionado
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                        {dep.dependencia}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Meta Anual: {fmtNum(dep.meta_estandar)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBVENTANA 4: SELECCIÓN DE MES DE EVALUACIÓN                   */}
        {/* ============================================================== */}
        {activeModal === 'mes' && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}>
            <div className="animate-sheet-up" style={{
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px calc(env(safe-area-inset-bottom, 20px) + 20px) 20px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800' }}>PASO 4 DE 4 • AÑO {selectedAnio}</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '2px 0 0 0', color: '#0f172a' }}>
                    Seleccione Mes de Evaluación
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {mesesCalendario.map(m => {
                  const isSel = selectedMes === m.num;
                  return (
                    <button
                      key={m.num}
                      onClick={() => handleSeleccionarMesEnModal(m)}
                      className="touch-press"
                      style={{
                        padding: '16px 14px',
                        borderRadius: '16px',
                        border: isSel ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: isSel ? '#f0f9ff' : m.locked ? '#f8fafc' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: m.locked ? 'not-allowed' : 'pointer',
                        opacity: m.locked ? 0.6 : 1,
                        outline: 'none'
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: isSel ? '#0284c7' : '#0f172a' }}>
                          {m.nombre}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {m.locked ? 'No cargado' : 'Disponible'}
                        </div>
                      </div>
                      <span style={{ fontSize: '16px' }}>
                        {m.locked ? '🔒' : isSel ? '✓' : '➔'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBVENTANA 5: DESGLOSE MENSUAL DE PRODUCCIÓN (TOTAL PRODUCCIÓN) */}
        {/* ============================================================== */}
        {activeModal === 'produccion' && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}>
            <div className="animate-sheet-up" style={{
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              padding: '22px 20px calc(env(safe-area-inset-bottom, 20px) + 20px) 20px',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800' }}>
                    📊 DESGLOSE MES A MES (ENERO A {kpisActuales?.nombre_mes?.toUpperCase()})
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '2px 0 0 0', color: '#0f172a' }}>
                    Producción Mensual
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#0369a1',
                marginBottom: '12px',
                lineHeight: '1.4'
              }}>
                🏛️ <strong>{dependenciaActual?.dependencia}</strong>
              </div>

              {/* Lista de meses con su producción */}
              <div className="no-scrollbar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {desgloseHistoricoMeses.map(m => (
                  <div
                    key={m.num}
                    style={{
                      background: m.esMesSeleccionado ? '#e0f2fe' : '#f8fafc',
                      border: m.esMesSeleccionado ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: m.esMesSeleccionado ? '#0284c7' : '#e2e8f0',
                        color: m.esMesSeleccionado ? '#ffffff' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}>
                        {m.abrev}
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                          {m.nombre} {m.esMesSeleccionado && <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: '800' }}>• Evaluado</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Acumulado: <strong>{fmtNum(m.total_produccion)}</strong> exp.
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>
                        {fmtNum(m.produccion_mes)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: '700' }}>
                        resueltos
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón Salir / Volver a los KPIs */}
              <button
                onClick={() => setActiveModal(null)}
                className="touch-press"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>← Volver a los Indicadores</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBVENTANA 6: DESGLOSE MENSUAL DE INGRESOS (TOTAL INGRESOS)    */}
        {/* ============================================================== */}
        {activeModal === 'ingresos' && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}>
            <div className="animate-sheet-up" style={{
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              padding: '22px 20px calc(env(safe-area-inset-bottom, 20px) + 20px) 20px',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#9333ea', fontWeight: '800' }}>
                    📥 DESGLOSE MES A MES (ENERO A {kpisActuales?.nombre_mes?.toUpperCase()})
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '2px 0 0 0', color: '#0f172a' }}>
                    Ingresos Mensuales
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                background: '#faf5ff',
                border: '1px solid #e9d5ff',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#7e22ce',
                marginBottom: '12px',
                lineHeight: '1.4'
              }}>
                🏛️ <strong>{dependenciaActual?.dependencia}</strong>
              </div>

              {/* Lista de meses con sus ingresos */}
              <div className="no-scrollbar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {desgloseHistoricoMeses.map(m => (
                  <div
                    key={m.num}
                    style={{
                      background: m.esMesSeleccionado ? '#f3e8ff' : '#f8fafc',
                      border: m.esMesSeleccionado ? '2px solid #9333ea' : '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: m.esMesSeleccionado ? '#9333ea' : '#e2e8f0',
                        color: m.esMesSeleccionado ? '#ffffff' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}>
                        {m.abrev}
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                          {m.nombre} {m.esMesSeleccionado && <span style={{ fontSize: '10px', color: '#9333ea', fontWeight: '800' }}>• Evaluado</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Acumulado: <strong>{fmtNum(m.total_ingresos)}</strong> exp.
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>
                        {fmtNum(m.ingresos_mes)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#9333ea', fontWeight: '700' }}>
                        ingresos
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón Salir / Volver a los KPIs */}
              <button
                onClick={() => setActiveModal(null)}
                className="touch-press"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(147, 51, 234, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>← Volver a los Indicadores</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal de Aviso: Módulo en Construcción */}
        {activeModal === 'construccion' && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}>
            <div className="animate-slide-up" style={{
              background: '#ffffff',
              border: '1.5px solid #fde047',
              borderRadius: '24px',
              padding: '26px',
              maxWidth: '360px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)'
            }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>🚧</div>
              <h3 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>
                Juzgados de Ejecución
              </h3>
              <div style={{
                display: 'inline-block',
                background: '#fef9c3',
                color: '#854d0e',
                border: '1px solid #fde047',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: '800',
                marginBottom: '14px'
              }}>
                En construcción • Analizando datos
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: '1.55', margin: '0 0 22px 0' }}>
                Actualmente se están analizando las nuevas directrices e indicadores oficiales que se mostrarán para los Juzgados de Ejecución.
              </p>
              <button
                onClick={() => setActiveModal(null)}
                className="touch-press"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                }}
              >
                Comprendido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
