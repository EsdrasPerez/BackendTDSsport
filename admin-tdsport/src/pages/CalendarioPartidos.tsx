import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// MUI Icons
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TodayIcon from '@mui/icons-material/Today';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CloseIcon from '@mui/icons-material/Close';
import BoltIcon from '@mui/icons-material/Bolt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import LockIcon from '@mui/icons-material/Lock';

interface InfoPartido {
    tipo: 'finalizado' | 'en_juego' | 'pendiente' | 'futuro';
    texto: string;
    icono: React.ReactNode;
    badgeClass: string;
    cardClass: string;
    borderLeft: string;
    bgSoft: string;
    labelGoles: string | null;
}

interface Torneo {
    id: string;
    nombre: string;
}

interface Partido {
    id: string;
    fecha_hora: string;
    goles_local: number | null;
    goles_visitante: number | null;
    estado_id: number;
    torneo_id: string;

    torneos?: {
        nombre: string;
    } | null;

    local?: {
        nombre: string;
        escudo_url: string | null;
    } | null;

    visitante?: {
        nombre: string;
        escudo_url: string | null;
    } | null;
}

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function CalendarioPartidos() {
    const navigate = useNavigate();

    const [partidos, setPartidos] = useState<Partido[]>([]);
    const [torneos, setTorneos] = useState<Torneo[]>([]);
    const [loading, setLoading] = useState(true);

    const [fechaActual, setFechaActual] = useState(new Date());

    // Filtros
    const [filtroTorneo, setFiltroTorneo] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [busqueda, setBusqueda] = useState('');

    // Día seleccionado / consultado (null o número de día 1..31)
    const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);

    // Ajuste de tamaño visual de las celdas del calendario
    const [tamanoCelda] = useState<'compacta' | 'estandar' | 'amplia'>('estandar');

    // Partido seleccionado para el modal de detalle
    const [partidoSeleccionado, setPartidoSeleccionado] = useState<Partido | null>(null);

    // CARGA INICIAL Y SUBSCRIPCIÓN EN TIEMPO REAL
    useEffect(() => {
        cargarTorneos();
        cargarPartidos();

        const canal = supabase
            .channel('calendario-partidos')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'partidos',
                },
                () => {
                    cargarPartidos();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(canal);
        };
    }, []);

    // CARGAR TORNEOS
    const cargarTorneos = async () => {
        const { data, error } = await supabase
            .from('torneos')
            .select('id, nombre')
            .order('nombre');

        if (error) {
            console.error('Error cargando torneos:', error);
            return;
        }

        setTorneos(data || []);
    };

    // CARGAR PARTIDOS
    const cargarPartidos = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('partidos')
            .select(`
                id,
                fecha_hora,
                goles_local,
                goles_visitante,
                estado_id,
                torneo_id,
                torneos ( nombre ),
                local:local_id ( nombre, escudo_url ),
                visitante:visitante_id ( nombre, escudo_url )
            `)
            .order('fecha_hora', {
                ascending: true,
            });

        if (error) {
            console.error('Error cargando partidos:', error);
            setLoading(false);
            return;
        }

        setPartidos((data as unknown as Partido[]) || []);
        setLoading(false);
    };

    // NAVEGACIÓN DE FECHAS
    const cambiarMes = (cantidad: number) => {
        setDiaSeleccionado(null);
        setFechaActual(
            new Date(
                fechaActual.getFullYear(),
                fechaActual.getMonth() + cantidad,
                1
            )
        );
    };

    const irHoy = () => {
        const hoy = new Date();
        setFechaActual(hoy);
        setDiaSeleccionado(hoy.getDate());
    };

    const seleccionarMesDirecto = (mesIndex: number) => {
        setDiaSeleccionado(null);
        setFechaActual(new Date(fechaActual.getFullYear(), mesIndex, 1));
    };

    const seleccionarAnioDirecto = (anio: number) => {
        setDiaSeleccionado(null);
        setFechaActual(new Date(anio, fechaActual.getMonth(), 1));
    };

    // CÁLCULOS DEL MES
    const primerDiaMes = new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth(),
        1
    );

    const ultimoDiaMes = new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth() + 1,
        0
    );

    const cantidadDias = ultimoDiaMes.getDate();
    // Día de inicio de semana (Lunes = 0, Domingo = 6)
    const primerDiaSemana = (primerDiaMes.getDay() + 6) % 7;

    // Años disponibles para selector rápido
    const anioActual = fechaActual.getFullYear();
    const aniosDisponibles = useMemo(() => {
        const list = [];
        for (let y = anioActual - 2; y <= anioActual + 4; y++) {
            list.push(y);
        }
        return list;
    }, [anioActual]);

    // DETERMINAR ESTADO VISUAL Y COLORES DEL PARTIDO
    const obtenerInfoPartido = (partido: Partido): InfoPartido => {
        const fecha = new Date(partido.fecha_hora);
        const ahora = new Date();
        const yaPaso = fecha < ahora;

        if (partido.estado_id === 3) {
            return {
                tipo: 'finalizado',
                texto: 'FINALIZADO',
                icono: <CheckCircleIcon style={{ fontSize: '15px' }} />,
                badgeClass: 'bg-success text-white',
                cardClass: 'status-finished',
                borderLeft: '#10b981',
                bgSoft: '#f0fdf4',
                labelGoles: `${partido.goles_local ?? 0} - ${partido.goles_visitante ?? 0}`,
            };
        }

        if (partido.estado_id === 2) {
            return {
                tipo: 'en_juego',
                texto: 'EN VIVO',
                icono: <FiberManualRecordIcon style={{ fontSize: '13px' }} className="text-white" />,
                badgeClass: 'bg-danger text-white',
                cardClass: 'status-live',
                borderLeft: '#ef4444',
                bgSoft: '#fffbeb',
                labelGoles: `${partido.goles_local ?? 0} - ${partido.goles_visitante ?? 0}`,
            };
        }

        // Si la fecha ya pasó pero sigue en estado 1 (Futuro), requiere atención
        if (yaPaso) {
            return {
                tipo: 'pendiente',
                texto: 'POR CARGAR',
                icono: <WarningAmberIcon style={{ fontSize: '15px' }} />,
                badgeClass: 'bg-warning text-dark',
                cardClass: 'status-pending',
                borderLeft: '#f59e0b',
                bgSoft: '#fff7ed',
                labelGoles: null,
            };
        }

        // Futuro / Programado normal
        return {
            tipo: 'futuro',
            texto: 'PROGRAMADO',
            icono: <ScheduleIcon style={{ fontSize: '15px' }} />,
            badgeClass: 'bg-primary text-white',
            cardClass: 'status-future',
            borderLeft: '#1769FF',
            bgSoft: '#ffffff',
            labelGoles: null,
        };
    };

    // HORA DEL PARTIDO
    const obtenerHora = (fecha: string) => {
        return new Date(fecha).toLocaleTimeString('es-GT', {
            timeZone: 'UTC',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // FORMATEAR FECHA COMPLETA
    const formatearFecha = (fecha: string) => {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-GT', {
            timeZone: 'UTC',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // FILTRAR PARTIDOS
    const partidosFiltrados = useMemo(() => {
        const texto = busqueda.toLowerCase().trim();
        const ahora = new Date();

        return partidos.filter((partido) => {
            const local = partido.local?.nombre?.toLowerCase() || '';
            const visitante = partido.visitante?.nombre?.toLowerCase() || '';
            const torneo = partido.torneos?.nombre?.toLowerCase() || '';

            const coincideBusqueda =
                !texto ||
                local.includes(texto) ||
                visitante.includes(texto) ||
                torneo.includes(texto);

            const coincideTorneo =
                !filtroTorneo || partido.torneo_id === filtroTorneo;

            // Filtro por estado
            let coincideEstado = true;
            if (filtroEstado === 'finalizados') {
                coincideEstado = partido.estado_id === 3;
            } else if (filtroEstado === 'en_juego') {
                coincideEstado = partido.estado_id === 2;
            } else if (filtroEstado === 'futuros') {
                coincideEstado = partido.estado_id === 1 && new Date(partido.fecha_hora) >= ahora;
            } else if (filtroEstado === 'pendientes') {
                coincideEstado = partido.estado_id === 1 && new Date(partido.fecha_hora) < ahora;
            }

            return coincideBusqueda && coincideTorneo && coincideEstado;
        });
    }, [partidos, busqueda, filtroTorneo, filtroEstado]);

    // PARTIDOS DEL MES ACTUAL
    const partidosDelMes = useMemo(() => {
        return partidosFiltrados.filter((p) => {
            const fecha = new Date(p.fecha_hora);
            return (
                fecha.getUTCFullYear() === fechaActual.getFullYear() &&
                fecha.getUTCMonth() === fechaActual.getMonth()
            );
        });
    }, [partidosFiltrados, fechaActual]);

    // ESTADÍSTICAS DEL MES
    const estadisticasMes = useMemo(() => {
        const ahora = new Date();
        const finalizados = partidosDelMes.filter((p) => p.estado_id === 3).length;
        const enJuego = partidosDelMes.filter((p) => p.estado_id === 2).length;
        const futuros = partidosDelMes.filter((p) => p.estado_id === 1 && new Date(p.fecha_hora) >= ahora).length;
        const pendientes = partidosDelMes.filter((p) => p.estado_id === 1 && new Date(p.fecha_hora) < ahora).length;

        return {
            total: partidosDelMes.length,
            finalizados,
            enJuego,
            futuros,
            pendientes,
        };
    }, [partidosDelMes]);

    // OBTENER PARTIDOS DE UN DÍA ESPECÍFICO
    const obtenerPartidosDia = (dia: number) => {
        return partidosFiltrados.filter((partido) => {
            const fecha = new Date(partido.fecha_hora);
            return (
                fecha.getUTCFullYear() === fechaActual.getFullYear() &&
                fecha.getUTCMonth() === fechaActual.getMonth() &&
                fecha.getUTCDate() === dia
            );
        });
    };

    // GENERAR CELDAS DEL CALENDARIO
    const diasCalendario = useMemo(() => {
        const celdas = [];
        // Celdas vacías previas
        for (let i = 0; i < primerDiaSemana; i++) {
            celdas.push(null);
        }
        // Días reales del mes
        for (let dia = 1; dia <= cantidadDias; dia++) {
            celdas.push(dia);
        }
        return celdas;
    }, [primerDiaSemana, cantidadDias]);

    // REDIRIGIR A CARGA DE RESULTADOS PARA EL PARTIDO SELECCIONADO
    const irACargaResultados = (partidoId: string) => {
        const partido = partidos.find((p) => p.id === partidoId);
        if (partido?.estado_id === 3) {
            return;
        }
        setPartidoSeleccionado(null);
        navigate(`/carga-resultados?partidoId=${partidoId}`, {
            state: { partidoId },
        });
    };

    // COMPONENTE ESCUDO CON FALLBACK ELEGANTE
    const EscudoEquipo = ({
        url,
        nombre,
        size = 22,
    }: {
        url: string | null | undefined;
        nombre?: string;
        size?: number;
    }) => {
        if (url) {
            return (
                <img
                    src={url}
                    alt={nombre || 'Equipo'}
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        objectFit: 'contain',
                        flexShrink: 0,
                    }}
                />
            );
        }
        return (
            <div
                className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center text-muted fw-bold"
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    flexShrink: 0,
                    border: '1px solid #e2e8f0',
                }}
            >
                <SportsSoccerIcon style={{ fontSize: `${Math.max(14, size * 0.6)}px`, color: '#64748b' }} />
            </div>
        );
    };

    const hoy = new Date();

    return (
        <div className="min-vh-100 bg-light">
            <div className="container-fluid py-4 px-3 px-md-4">
                {/* HERO BANNER & MÉTRICAS DEL MES */}
                <div className="tds-calendar-hero">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <CalendarMonthIcon sx={{ fontSize: 35, color: 'var(--tds-lime)' }} />
                                <h2 className="fw-bold mb-0 text-white">Calendario de Partidos</h2>
                            </div>
                            <p className="text-white-50 mb-0">
                                Monitorea y consulta los encuentros deportivos programados, en juego y finalizados.
                            </p>
                        </div>

                        {/* Chips de métricas del mes en consulta */}
                        <div className="d-flex flex-wrap gap-2">
                            <div className="tds-stat-chip" title="Total de partidos en este mes">
                                <span className="badge bg-light text-dark rounded-pill fw-bold">
                                    {estadisticasMes.total}
                                </span>
                                <span className="small fw-semibold text-white d-inline-flex align-items-center gap-1">
                                    <CalendarMonthIcon style={{ fontSize: '15px' }} />
                                    Total en el mes
                                </span>
                            </div>

                            <div className="tds-stat-chip" title="Partidos finalizados">
                                <span className="badge bg-success rounded-pill fw-bold d-inline-flex align-items-center gap-1">
                                    <CheckCircleIcon style={{ fontSize: '14px' }} /> {estadisticasMes.finalizados}
                                </span>
                                <span className="small fw-semibold text-white">Finalizados</span>
                            </div>

                            <div className="tds-stat-chip" title="Partidos en juego">
                                <span className="badge bg-danger rounded-pill fw-bold d-inline-flex align-items-center gap-1">
                                    <FiberManualRecordIcon style={{ fontSize: '12px' }} /> {estadisticasMes.enJuego}
                                </span>
                                <span className="small fw-semibold text-white">En vivo</span>
                            </div>

                            <div className="tds-stat-chip" title="Partidos programados futuros">
                                <span className="badge bg-primary rounded-pill fw-bold d-inline-flex align-items-center gap-1">
                                    <ScheduleIcon style={{ fontSize: '14px' }} /> {estadisticasMes.futuros}
                                </span>
                                <span className="small fw-semibold text-white">Próximos</span>
                            </div>

                            {estadisticasMes.pendientes > 0 && (
                                <div className="tds-stat-chip" title="Partidos pasados pendientes de cargar marcador">
                                    <span className="badge bg-warning text-dark rounded-pill fw-bold d-inline-flex align-items-center gap-1">
                                        <WarningAmberIcon style={{ fontSize: '14px' }} /> {estadisticasMes.pendientes}
                                    </span>
                                    <span className="small fw-semibold text-white">Por cargar</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* FILTROS, BÚSQUEDA Y CONTROL DE TAMAÑO */}
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-3 p-md-4">
                        <div className="row g-3 align-items-end">
                            {/* Búsqueda */}
                            <div className="col-12 col-md-4 col-xl-3">
                                <label className="form-label small fw-bold text-muted text-uppercase mb-1 d-flex align-items-center gap-1">
                                    <SearchIcon style={{ fontSize: '16px', color: '#000000ff' }} /> Buscar
                                </label>
                                <div className="input-placeholder-container">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Equipo o torneo..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Torneo */}
                            <div className="col-12 col-md-4 col-xl-3">
                                <label className="form-label small fw-bold text-muted text-uppercase mb-1 d-flex align-items-center gap-1">
                                    <EmojiEventsIcon style={{ fontSize: '16px', color: '#000000ff' }} /> Torneo
                                </label>
                                <select
                                    className="form-select"
                                    value={filtroTorneo}
                                    onChange={(e) => setFiltroTorneo(e.target.value)}
                                >
                                    <option value="">Todos los torneos</option>
                                    {torneos.map((torneo) => (
                                        <option key={torneo.id} value={torneo.id}>
                                            {torneo.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro de Estado */}
                            <div className="col-12 col-md-4 col-xl-3">
                                <label className="form-label small fw-bold text-muted text-uppercase mb-1 d-flex align-items-center gap-1">
                                    <FilterAltIcon style={{ fontSize: '16px', color: '#000000ff' }} /> Estado
                                </label>
                                <select
                                    className="form-select"
                                    value={filtroEstado}
                                    onChange={(e) => setFiltroEstado(e.target.value)}
                                >
                                    <option value="todos">Todos los estados</option>
                                    <option value="futuros">Próximos (Futuros)</option>
                                    <option value="en_juego">En Vivo / En Juego</option>
                                    <option value="finalizados">Finalizados</option>
                                    <option value="pendientes">Pasados por cargar marcador</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CALENDARIO PRINCIPAL */}
                <div className="card border-0 shadow-sm overflow-hidden mb-4">
                    {/* Barra de cabecera con navegación de mes */}
                    <div className="card-header bg-white border-0 p-3 p-md-4">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                            {/* Botones de navegación */}
                            <div className="d-flex align-items-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary px-3 py-2 fw-bold d-inline-flex align-items-center gap-1"
                                    onClick={() => cambiarMes(-1)}
                                    title="Mes anterior"
                                >
                                    <ChevronLeftIcon fontSize="small" /> Mes Anterior
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-primary px-3 py-2 fw-bold d-inline-flex align-items-center gap-1"
                                    onClick={irHoy}
                                    title="Ir al mes actual y marcar hoy"
                                >
                                    <TodayIcon fontSize="small" /> Hoy
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary px-3 py-2 fw-bold d-inline-flex align-items-center gap-1"
                                    onClick={() => cambiarMes(1)}
                                    title="Mes siguiente"
                                >
                                    Mes Siguiente <ChevronRightIcon fontSize="small" />
                                </button>
                            </div>

                            {/* Título de Mes & Selectores Directos */}
                            <div className="d-flex align-items-center gap-2">
                                <select
                                    className="form-select form-select-sm fw-bold border-0 bg-light text-capitalize"
                                    style={{ fontSize: '1.25rem', width: 'auto', cursor: 'pointer' }}
                                    value={fechaActual.getMonth()}
                                    onChange={(e) => seleccionarMesDirecto(Number(e.target.value))}
                                >
                                    {MESES.map((m, idx) => (
                                        <option key={m} value={idx}>
                                            {m}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    className="form-select form-select-sm fw-bold border-0 bg-light"
                                    style={{ fontSize: '1.25rem', width: 'auto', cursor: 'pointer' }}
                                    value={fechaActual.getFullYear()}
                                    onChange={(e) => seleccionarAnioDirecto(Number(e.target.value))}
                                >
                                    {aniosDisponibles.map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Contenido del Grid de Calendario */}
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                                <p className="text-muted mt-3 fw-semibold">Cargando partidos del calendario...</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <div style={{ minWidth: '980px' }}>
                                    {/* Cabecera Días de la Semana */}
                                    <div className="row g-0 text-center border-top">
                                        {[
                                            { nombre: 'Lunes', corto: 'Lun', esFin: false },
                                            { nombre: 'Martes', corto: 'Mar', esFin: false },
                                            { nombre: 'Miércoles', corto: 'Mié', esFin: false },
                                            { nombre: 'Jueves', corto: 'Jue', esFin: false },
                                            { nombre: 'Viernes', corto: 'Vie', esFin: false },
                                            { nombre: 'Sábado', corto: 'Sáb', esFin: true },
                                            { nombre: 'Domingo', corto: 'Dom', esFin: true },
                                        ].map((item) => (
                                            <div
                                                key={item.corto}
                                                className={`col tds-cal-weekday ${item.esFin ? 'is-weekend' : ''}`}
                                            >
                                                <span className="d-none d-md-inline">{item.nombre}</span>
                                                <span className="d-md-none">{item.corto}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Grilla de Días del Mes */}
                                    <div className="row g-0">
                                        {diasCalendario.map((dia, index) => {
                                            if (dia === null) {
                                                return (
                                                    <div
                                                        key={`empty-${index}`}
                                                        className={`tds-cal-day-cell is-empty size-${tamanoCelda}`}
                                                    />
                                                );
                                            }

                                            const partidosDia = obtenerPartidosDia(dia);

                                            const esHoy =
                                                dia === hoy.getDate() &&
                                                fechaActual.getMonth() === hoy.getMonth() &&
                                                fechaActual.getFullYear() === hoy.getFullYear();

                                            const esConsultado = diaSeleccionado === dia;

                                            // Comprobar si el día ya pasó
                                            const esPasado =
                                                fechaActual.getFullYear() < hoy.getFullYear() ||
                                                (fechaActual.getFullYear() === hoy.getFullYear() &&
                                                    fechaActual.getMonth() < hoy.getMonth()) ||
                                                (fechaActual.getFullYear() === hoy.getFullYear() &&
                                                    fechaActual.getMonth() === hoy.getMonth() &&
                                                    dia < hoy.getDate());

                                            return (
                                                <div
                                                    key={`dia-${dia}`}
                                                    className={`tds-cal-day-cell size-${tamanoCelda} ${esHoy
                                                        ? 'is-today'
                                                        : esConsultado
                                                            ? 'is-consulted'
                                                            : esPasado
                                                                ? 'is-past'
                                                                : 'is-future'
                                                        }`}
                                                    onClick={() => setDiaSeleccionado(esConsultado ? null : dia)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {/* Cabecera del día */}
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <div className="d-flex align-items-center gap-1">
                                                            <span
                                                                className={`tds-day-num ${esHoy
                                                                    ? 'num-today'
                                                                    : esConsultado
                                                                        ? 'num-consulted'
                                                                        : esPasado
                                                                            ? 'num-past'
                                                                            : ''
                                                                    }`}
                                                            >
                                                                {dia}
                                                            </span>

                                                            {esHoy && (
                                                                <span
                                                                    className="badge text-white"
                                                                    style={{
                                                                        backgroundColor: 'var(--tds-blue)',
                                                                        fontSize: '9px',
                                                                        letterSpacing: '0.5px',
                                                                    }}
                                                                >
                                                                    HOY
                                                                </span>
                                                            )}

                                                            {esConsultado && !esHoy && (
                                                                <span
                                                                    className="badge text-white"
                                                                    style={{
                                                                        backgroundColor: '#8b5cf6',
                                                                        fontSize: '9px',
                                                                        letterSpacing: '0.5px',
                                                                    }}
                                                                >
                                                                    ACTIVO
                                                                </span>
                                                            )}
                                                        </div>

                                                        {partidosDia.length > 0 && (
                                                            <span
                                                                className={`badge rounded-pill ${esHoy || esConsultado
                                                                    ? 'bg-dark text-white'
                                                                    : 'bg-secondary'
                                                                    }`}
                                                                style={{ fontSize: '10px' }}
                                                                title={`${partidosDia.length} partidos programados`}
                                                            >
                                                                {partidosDia.length}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Lista de partidos en este día */}
                                                    <div className="tds-matches-list">
                                                        {partidosDia.map((partido) => {
                                                            const info = obtenerInfoPartido(partido);

                                                            return (
                                                                <div
                                                                    key={partido.id}
                                                                    className={`tds-match-card ${info.cardClass}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPartidoSeleccionado(partido);
                                                                    }}
                                                                    title="Click para ver detalle del partido"
                                                                >
                                                                    {/* Hora y Estado / Marcador */}
                                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                                        <span className="fw-bold text-dark d-inline-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                                                                            <AccessTimeIcon style={{ fontSize: '12px', color: '#64748b' }} />
                                                                            {obtenerHora(partido.fecha_hora)}
                                                                        </span>

                                                                        {info.tipo === 'en_juego' ? (
                                                                            <span className="tds-live-indicator">
                                                                                <span className="tds-live-dot"></span>
                                                                                VIVO
                                                                            </span>
                                                                        ) : info.tipo === 'finalizado' ? (
                                                                            <span
                                                                                className="badge bg-success"
                                                                                style={{ fontSize: '9px', padding: '2px 5px' }}
                                                                            >
                                                                                {info.labelGoles}
                                                                            </span>
                                                                        ) : info.tipo === 'pendiente' ? (
                                                                            <span
                                                                                className="badge bg-warning text-dark d-inline-flex align-items-center gap-1"
                                                                                style={{ fontSize: '9px', padding: '2px 5px' }}
                                                                            >
                                                                                <WarningAmberIcon style={{ fontSize: '11px' }} /> Por cargar
                                                                            </span>
                                                                        ) : null}
                                                                    </div>

                                                                    {/* Equipo Local */}
                                                                    <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                                                        <div className="d-flex align-items-center gap-1 text-truncate" style={{ maxWidth: '85%' }}>
                                                                            <EscudoEquipo
                                                                                url={partido.local?.escudo_url}
                                                                                nombre={partido.local?.nombre}
                                                                                size={16}
                                                                            />
                                                                            <span
                                                                                className="text-truncate fw-semibold"
                                                                                style={{ fontSize: '11px', color: '#1e293b' }}
                                                                                title={partido.local?.nombre}
                                                                            >
                                                                                {partido.local?.nombre || 'Local'}
                                                                            </span>
                                                                        </div>
                                                                        {partido.estado_id !== 1 && (
                                                                            <span className="fw-bold small text-dark">
                                                                                {partido.goles_local ?? 0}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Equipo Visitante */}
                                                                    <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                                                        <div className="d-flex align-items-center gap-1 text-truncate" style={{ maxWidth: '85%' }}>
                                                                            <EscudoEquipo
                                                                                url={partido.visitante?.escudo_url}
                                                                                nombre={partido.visitante?.nombre}
                                                                                size={16}
                                                                            />
                                                                            <span
                                                                                className="text-truncate fw-semibold"
                                                                                style={{ fontSize: '11px', color: '#1e293b' }}
                                                                                title={partido.visitante?.nombre}
                                                                            >
                                                                                {partido.visitante?.nombre || 'Visitante'}
                                                                            </span>
                                                                        </div>
                                                                        {partido.estado_id !== 1 && (
                                                                            <span className="fw-bold small text-dark">
                                                                                {partido.goles_visitante ?? 0}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Torneo etiqueta */}
                                                                    {partido.torneos?.nombre && (
                                                                        <div
                                                                            className="text-muted text-truncate d-flex align-items-center gap-1"
                                                                            style={{ fontSize: '9px', opacity: 0.85 }}
                                                                            title={partido.torneos.nombre}
                                                                        >
                                                                            <EmojiEventsIcon style={{ fontSize: '11px', color: '#f59e0b', flexShrink: 0 }} />
                                                                            {partido.torneos.nombre}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* PANEL INFORMATIVO DEL DÍA CONSULTADO (SI SELECCIONÓ UN DÍA) */}
                {diaSeleccionado && (
                    <div className="card border-0 shadow-sm mb-4" style={{ borderLeft: '5px solid #8b5cf6 !important' }}>
                        <div className="card-body p-4">
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge p-2 text-white" style={{ backgroundColor: '#8b5cf6' }}>
                                        Día {diaSeleccionado}
                                    </span>
                                    <h5 className="fw-bold mb-0">
                                        Partidos del {diaSeleccionado} de {MESES[fechaActual.getMonth()]} de {fechaActual.getFullYear()}
                                    </h5>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                                    onClick={() => setDiaSeleccionado(null)}
                                >
                                    <CloseIcon style={{ fontSize: '16px' }} />
                                    <span>Cerrar vista del día</span>
                                </button>
                            </div>

                            {(() => {
                                const partidosDelDia = obtenerPartidosDia(diaSeleccionado);
                                if (partidosDelDia.length === 0) {
                                    return (
                                        <p className="text-muted mb-0">
                                            No hay partidos programados para este día con los filtros actuales.
                                        </p>
                                    );
                                }
                                return (
                                    <div className="row g-3">
                                        {partidosDelDia.map((partido) => {
                                            const info = obtenerInfoPartido(partido);
                                            return (
                                                <div key={partido.id} className="col-12 col-md-6 col-xl-4">
                                                    <div className="card border p-3 h-100 shadow-sm d-flex flex-column justify-content-between">
                                                        <div>
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <span className="badge bg-light text-dark border">
                                                                    {partido.torneos?.nombre || 'Torneo'}
                                                                </span>
                                                                <span className={`badge ${info.badgeClass}`}>
                                                                    {info.texto}
                                                                </span>
                                                            </div>

                                                            <div className="d-flex justify-content-between align-items-center my-3">
                                                                <div className="text-center" style={{ width: '40%' }}>
                                                                    <div className="d-flex justify-content-center mb-1">
                                                                        <EscudoEquipo
                                                                            url={partido.local?.escudo_url}
                                                                            nombre={partido.local?.nombre}
                                                                            size={36}
                                                                        />
                                                                    </div>
                                                                    <div className="fw-bold small text-truncate">
                                                                        {partido.local?.nombre || 'Local'}
                                                                    </div>
                                                                </div>

                                                                <div className="text-center px-2">
                                                                    {partido.estado_id !== 1 ? (
                                                                        <div className="fs-5 fw-bold text-dark">
                                                                            {partido.goles_local ?? 0} : {partido.goles_visitante ?? 0}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="fw-bold text-primary small">
                                                                            {obtenerHora(partido.fecha_hora)}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="text-center" style={{ width: '40%' }}>
                                                                    <div className="d-flex justify-content-center mb-1">
                                                                        <EscudoEquipo
                                                                            url={partido.visitante?.escudo_url}
                                                                            nombre={partido.visitante?.nombre}
                                                                            size={36}
                                                                        />
                                                                    </div>
                                                                    <div className="fw-bold small text-truncate">
                                                                        {partido.visitante?.nombre || 'Visitante'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="d-flex gap-2 mt-3 pt-2 border-top">
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary btn-sm flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1"
                                                                onClick={() => setPartidoSeleccionado(partido)}
                                                            >
                                                                <VisibilityIcon style={{ fontSize: '16px' }} />
                                                                <span>Ver Detalle</span>
                                                            </button>

                                                            {partido.estado_id === 3 ? (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-light btn-sm flex-grow-1 text-muted border d-flex align-items-center justify-content-center gap-1"
                                                                    disabled
                                                                    title="Partido finalizado - Marcador cerrado"
                                                                    style={{ cursor: 'not-allowed', backgroundColor: '#f8fafc' }}
                                                                >
                                                                    <LockIcon style={{ fontSize: '15px', color: '#94a3b8' }} />
                                                                    <span>Finalizado</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                                                                    onClick={() => irACargaResultados(partido.id)}
                                                                >
                                                                    <BoltIcon style={{ fontSize: '18px' }} />
                                                                    <span>Cargar Resultado</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DETALLE DEL PARTIDO CON BOTÓN DE REDIRECCIÓN A CARGA DE RESULTADOS */}
            {partidoSeleccionado && (
                <div
                    className="modal fade show d-block"
                    tabIndex={-1}
                    style={{
                        backgroundColor: 'rgba(7, 26, 51, 0.65)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 1055,
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                            {/* Modal Header */}
                            <div className="modal-header border-0 bg-white px-4 pt-4 pb-2">
                                <div>
                                    <span className="badge bg-light text-dark border px-3 py-1 mb-1 d-inline-flex align-items-center gap-1">
                                        <EmojiEventsIcon sx={{ fontSize: 16, color: '#f59e0b' }} /> {partidoSeleccionado.torneos?.nombre || 'Torneo'}
                                    </span>
                                    <h4 className="modal-title fw-bold text-dark">Detalle del Encuentro</h4>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setPartidoSeleccionado(null)}
                                    aria-label="Cerrar modal"
                                />
                            </div>

                            {/* Modal Body */}
                            <div className="modal-body px-4 py-3">
                                {/* Scoreboard Destacado */}
                                <div className="tds-modal-scoreboard mb-4">
                                    <div className="row align-items-center text-center g-0">
                                        {/* Local */}
                                        <div className="col-5 d-flex flex-column justify-content-center">
                                            <div className="d-flex justify-content-center mb-2">
                                                <EscudoEquipo
                                                    url={partidoSeleccionado.local?.escudo_url}
                                                    nombre={partidoSeleccionado.local?.nombre}
                                                    size={80}
                                                />
                                            </div>
                                            <h5 className="fw-bold mb-1 text-white">
                                                {partidoSeleccionado.local?.nombre || 'Equipo Local'}
                                            </h5>
                                            <span className="badge bg-white bg-opacity-25 text-white small px-2 py-1">
                                                LOCAL
                                            </span>
                                        </div>

                                        {/* Marcador Central */}
                                        <div className="col-2 d-flex flex-column justify-content-center align-items-center h-100">
                                            {partidoSeleccionado.estado_id !== 1 ? (
                                                <div>
                                                    <div className="tds-modal-score-box mb-2">
                                                        {partidoSeleccionado.goles_local ?? 0} - {partidoSeleccionado.goles_visitante ?? 0}
                                                    </div>
                                                    <span className="small text-white-50 fw-semibold text-uppercase d-inline-flex align-items-center justify-content-center gap-1">
                                                        {partidoSeleccionado.estado_id === 3 ? (
                                                            <>
                                                                <LockIcon sx={{ fontSize: 13, color: '#ffffffb3' }} /> Finalizado
                                                            </>
                                                        ) : (
                                                            'En Vivo'
                                                        )}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="display-6 fw-bold text-white mb-1">VS</div>
                                                    <span className="small text-white-50 fw-semibold">
                                                        {obtenerHora(partidoSeleccionado.fecha_hora)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Visitante */}
                                        <div className="col-5 d-flex flex-column justify-content-center">
                                            <div className="d-flex justify-content-center mb-2">
                                                <EscudoEquipo
                                                    url={partidoSeleccionado.visitante?.escudo_url}
                                                    nombre={partidoSeleccionado.visitante?.nombre}
                                                    size={80}
                                                />
                                            </div>
                                            <h5 className="fw-bold mb-1 text-white">
                                                {partidoSeleccionado.visitante?.nombre || 'Equipo Visitante'}
                                            </h5>
                                            <span className="badge bg-white bg-opacity-25 text-white small px-2 py-1">
                                                VISITANTE
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Mensaje Informativo si el partido está finalizado */}
                                {partidoSeleccionado.estado_id === 3 && (
                                    <div
                                        className="alert d-flex align-items-center gap-3 p-3 mb-3 border-0 shadow-sm"
                                        style={{
                                            backgroundColor: '#fef3c7',
                                            color: '#92400e',
                                            borderRadius: '16px',
                                            borderLeft: '5px solid #f59e0b',
                                        }}
                                    >
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ width: 38, height: 38, backgroundColor: '#fde68a' }}
                                        >
                                            <LockIcon sx={{ fontSize: 20, color: '#b45309' }} />
                                        </div>
                                        <div>
                                            <div className="fw-bold" style={{ fontSize: '0.95rem' }}>
                                                Partido Finalizado — Marcador Definitivo
                                            </div>
                                            <div className="small opacity-85 mt-0.5">
                                                Este encuentro ya concluyó oficialmente. El resultado está cerrado y no se permite colocar ni modificar el marcador.
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Información Adicional */}
                                <div className="card bg-light border-0 p-3 mb-3">
                                    <div className="row g-3 text-center text-md-start">
                                        <div className="col-12 col-md-6">
                                            <div className="text-muted small fw-semibold text-uppercase d-flex align-items-center gap-1 justify-content-center justify-content-md-start">
                                                <EventIcon sx={{ fontSize: 16, color: 'var(--tds-blue)' }} /> Fecha y Hora Programada
                                            </div>
                                            <div className="fw-bold text-dark mt-1">
                                                {formatearFecha(partidoSeleccionado.fecha_hora)}
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <div className="text-muted small fw-semibold text-uppercase d-flex align-items-center gap-1 justify-content-center justify-content-md-start">
                                                <FilterAltIcon sx={{ fontSize: 16, color: '#64748b' }} /> Estado Actual del Partido
                                            </div>
                                            <div className="mt-1">
                                                {(() => {
                                                    const info = obtenerInfoPartido(partidoSeleccionado);
                                                    return (
                                                        <span className={`badge ${info.badgeClass} px-3 py-2 fs-6 d-inline-flex align-items-center gap-1`}>
                                                            {info.icono} {info.texto}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer con BOTÓN DE REDIRECCIÓN A CARGA DE RESULTADOS */}
                            <div className="modal-footer border-0 bg-white px-4 pb-4 pt-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary px-4 py-2 d-inline-flex align-items-center gap-1"
                                    onClick={() => setPartidoSeleccionado(null)}
                                >
                                    <CloseIcon fontSize="small" />
                                    <span>Cerrar</span>
                                </button>

                                {partidoSeleccionado.estado_id === 3 ? (
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="small text-muted d-none d-sm-inline">
                                            Edición no disponible
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-secondary px-3 py-2 d-flex align-items-center gap-2"
                                            disabled
                                            title="El partido ya está finalizado. No es posible colocar un nuevo marcador."
                                            style={{
                                                cursor: 'not-allowed',
                                                opacity: 0.7,
                                                borderRadius: '10px',
                                            }}
                                        >
                                            <LockIcon fontSize="small" />
                                            <span>Carga de Resultados Bloqueada</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn tds-btn-redirect d-flex align-items-center gap-2"
                                        onClick={() => irACargaResultados(partidoSeleccionado.id)}
                                    >
                                        <BoltIcon fontSize="small" />
                                        <span>Ir a Carga de Resultados</span>
                                        <ArrowForwardIcon fontSize="small" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}