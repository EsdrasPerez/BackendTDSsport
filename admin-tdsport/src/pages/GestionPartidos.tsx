import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

// MUI Icons
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import StadiumIcon from '@mui/icons-material/Stadium';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineRounded';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineRounded';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlagIcon from '@mui/icons-material/Flag';
import TagIcon from '@mui/icons-material/Tag';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SaveIcon from '@mui/icons-material/Save';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SportsScoreIcon from '@mui/icons-material/SportsScore';

interface Torneo {
    id: string;
    nombre: string;
}

interface Equipo {
    id: string;
    nombre: string;
    escudo_url: string | null;
}

interface Partido {
    id: string;
    fecha_hora: string;
    goles_local: number | null;
    goles_visitante: number | null;
    estado_id: number;
    torneo_id: string;
    local_id: string;
    visitante_id: string;
    jornada: number | null;
    estadio: string | null;
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

export default function GestionPartidos() {
    // ESTADOS
    const [torneos, setTorneos] = useState<Torneo[]>([]);
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [partidos, setPartidos] = useState<Partido[]>([]);

    const [torneoId, setTorneoId] = useState('');
    const [localId, setLocalId] = useState('');
    const [visitanteId, setVisitanteId] = useState('');
    const [fechaHora, setFechaHora] = useState('');
    const [estadoId, setEstadoId] = useState<number>(1);
    const [golesLocal, setGolesLocal] = useState<number | ''>('');
    const [golesVisitante, setGolesVisitante] = useState<number | ''>('');
    const [jornada, setJornada] = useState<number | ''>('');
    const [estadio, setEstadio] = useState('');

    const [busqueda, setBusqueda] = useState('');
    const [filtroTorneo, setFiltroTorneo] = useState('');
    const [filtroJornada, setFiltroJornada] = useState<string>('');

    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [eliminando, setEliminando] = useState(false);

    const [partidoEliminar, setPartidoEliminar] = useState<Partido | null>(null);
    const [partidoAEditar, setPartidoAEditar] = useState<Partido | null>(null);
    const [mostrarModal, setMostrarModal] = useState(false);

    // CARGA INICIAL
    useEffect(() => {
        cargarTorneos();
        cargarPartidos();

        const canal = supabase
            .channel('gestion-partidos')
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
            alert('No fue posible cargar los torneos.');
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
        local_id,
        visitante_id,
        jornada,
        estadio,
        torneos (
          nombre
        ),
        local:local_id (
          nombre,
          escudo_url
        ),
        visitante:visitante_id (
          nombre,
          escudo_url
        )
      `)
            .order('fecha_hora', {
                ascending: true,
            });

        if (error) {
            console.error('Error cargando partidos:', error);
            alert('No fue posible cargar los partidos.');
            setLoading(false);
            return;
        }

        setPartidos((data as unknown as Partido[]) || []);
        setLoading(false);
    };

    // CARGAR EQUIPOS DEL TORNEO
    const cargarEquiposDelTorneo = async (idTorneo: string) => {
        setEquipos([]);

        if (!idTorneo) {
            return;
        }

        const { data, error } = await supabase
            .from('torneo_equipos')
            .select(`
        equipo_id,
        equipos (
          id,
          nombre,
          escudo_url
        )
      `)
            .eq('torneo_id', idTorneo);

        if (error) {
            console.error('Error cargando equipos:', error);
            alert('No fue posible cargar los equipos del torneo.');
            return;
        }

        const equiposTorneo: Equipo[] = [];

        data?.forEach((registro: any) => {
            if (registro.equipos) {
                equiposTorneo.push({
                    id: registro.equipos.id,
                    nombre: registro.equipos.nombre,
                    escudo_url: registro.equipos.escudo_url,
                });
            }
        });

        equiposTorneo.sort((a, b) => a.nombre.localeCompare(b.nombre));

        setEquipos(equiposTorneo);
    };

    // CAMBIO DE TORNEO
    const manejarCambioTorneo = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setTorneoId(id);
        setLocalId('');
        setVisitanteId('');
        await cargarEquiposDelTorneo(id);
    };

    const abrirModalNuevo = () => {
        setPartidoAEditar(null);
        setTorneoId('');
        setLocalId('');
        setVisitanteId('');
        setFechaHora('');
        setEstadoId(1);
        setGolesLocal('');
        setGolesVisitante('');
        setJornada('');
        setEstadio('');
        setEquipos([]);
        setMostrarModal(true);
    };

    const abrirModalEditar = async (partido: Partido) => {
        setPartidoAEditar(partido);
        setTorneoId(partido.torneo_id);
        setLocalId(partido.local_id);
        setVisitanteId(partido.visitante_id);
        setFechaHora(formatearFechaInput(partido.fecha_hora));
        setEstadoId(partido.estado_id);
        setGolesLocal(partido.goles_local !== null ? partido.goles_local : '');
        setGolesVisitante(partido.goles_visitante !== null ? partido.goles_visitante : '');
        setJornada(partido.jornada !== null ? partido.jornada : '');
        setEstadio(partido.estadio || '');
        await cargarEquiposDelTorneo(partido.torneo_id);
        setMostrarModal(true);
    };


    // GUARDAR PARTIDO
    const guardarPartido = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!torneoId) {
            alert('Seleccione un torneo.');
            return;
        }
        if (!localId) {
            alert('Seleccione el equipo local.');
            return;
        }
        if (!visitanteId) {
            alert('Seleccione el equipo visitante.');
            return;
        }
        if (localId === visitanteId) {
            alert('Un equipo no puede jugar contra sí mismo.');
            return;
        }
        if (!fechaHora) {
            alert('Seleccione la fecha y hora del partido.');
            return;
        }

        setGuardando(true);

        const datos = {
            torneo_id: torneoId,
            local_id: localId,
            visitante_id: visitanteId,
            fecha_hora: fechaHora,
            estado_id: estadoId,
            goles_local: golesLocal === '' ? null : Number(golesLocal),
            goles_visitante: golesVisitante === '' ? null : Number(golesVisitante),
            jornada: jornada === '' ? null : Number(jornada),
            estadio: estadio || null,
        };

        try {
            if (partidoAEditar) {
                // Actualizar
                const { error } = await supabase
                    .from('partidos')
                    .update(datos)
                    .eq('id', partidoAEditar.id);

                if (error) throw error;
                alert('Partido actualizado correctamente.');
            } else {
                // Insertar
                const { error } = await supabase
                    .from('partidos')
                    .insert([datos]);

                if (error) throw error;
                alert('Partido programado correctamente.');
            }

            setMostrarModal(false);
            await cargarPartidos();
        } catch (error: any) {
            console.error(error);
            alert('No fue posible guardar el partido: ' + (error?.message || 'Error desconocido'));
        } finally {
            setGuardando(false);
        }
    };

    // ELIMINAR PARTIDO
    const eliminarPartido = async () => {
        if (!partidoEliminar) return;

        setEliminando(true);

        try {
            const { error } = await supabase
                .from('partidos')
                .delete()
                .eq('id', partidoEliminar.id);

            if (error) throw error;

            alert('Partido eliminado correctamente.');
            setPartidoEliminar(null);
            await cargarPartidos();
        } catch (error: any) {
            console.error(error);
            alert('No fue posible eliminar el partido: ' + (error?.message || 'Error desconocido'));
        } finally {
            setEliminando(false);
        }
    };

    // FILTRAR PARTIDOS
    const partidosFiltrados = useMemo(() => {
        const texto = busqueda.toLowerCase().trim();

        return partidos.filter((partido) => {
            const torneoNombre = partido.torneos?.nombre?.toLowerCase() || '';
            const localNombre = partido.local?.nombre?.toLowerCase() || '';
            const visitanteNombre = partido.visitante?.nombre?.toLowerCase() || '';

            const coincideBusqueda =
                !texto ||
                torneoNombre.includes(texto) ||
                localNombre.includes(texto) ||
                visitanteNombre.includes(texto);

            const coincideTorneo = !filtroTorneo || partido.torneo_id === filtroTorneo;
            const coincideJornada = !filtroJornada || partido.jornada?.toString() === filtroJornada;

            return coincideBusqueda && coincideTorneo && coincideJornada;
        });
    }, [partidos, busqueda, filtroTorneo, filtroJornada]);

    // EQUIPOS Y TORNEO SELECCIONADOS (PARA PREVIEW EN MODAL)
    const equipoLocalSeleccionado = useMemo(() => {
        return equipos.find((e) => e.id === localId);
    }, [equipos, localId]);

    const equipoVisitanteSeleccionado = useMemo(() => {
        return equipos.find((e) => e.id === visitanteId);
    }, [equipos, visitanteId]);

    const torneoSeleccionado = useMemo(() => {
        return torneos.find((t) => t.id === torneoId);
    }, [torneos, torneoId]);

    // ESTADO DEL PARTIDO
    const obtenerEstado = (estadoId: number) => {
        switch (estadoId) {
            case 1:
                return {
                    texto: 'FUTURO',
                    clase: 'bg-primary',
                    icono: <ScheduleIcon sx={{ fontSize: 13 }} />,
                };
            case 2:
                return {
                    texto: 'EN JUEGO',
                    clase: 'bg-warning text-dark',
                    icono: <FiberManualRecordIcon sx={{ fontSize: 11, animation: 'tdsPulseDot 1.6s infinite' }} />,
                };
            case 3:
                return {
                    texto: 'FINALIZADO',
                    clase: 'bg-success',
                    icono: <CheckCircleIcon sx={{ fontSize: 13 }} />,
                };
            default:
                return {
                    texto: 'DESCONOCIDO',
                    clase: 'bg-secondary',
                    icono: null,
                };
        }
    };

    // FORMATEAR FECHA
    const formatearFecha = (fecha: string) => {
        const date = new Date(fecha);
        const opcionesFecha: Intl.DateTimeFormatOptions = { timeZone: 'UTC', dateStyle: 'medium' };
        const opcionesHora: Intl.DateTimeFormatOptions = { timeZone: 'UTC', timeStyle: 'short' };
        return `${date.toLocaleDateString('es-GT', opcionesFecha)}, ${date.toLocaleTimeString('es-GT', opcionesHora)}`;
    };

    const formatearFechaInput = (fecha: string) => {
        const date = new Date(fecha);
        const pad = (n: number) => n.toString().padStart(2, '0');

        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
    };

    // RENDER
    return (
        <div className="min-vh-100 bg-light">
            <div className="container-fluid py-4 px-3 px-md-4">
                {/* HERO HEADER */}
                <div className="tds-calendar-hero mb-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                style={{
                                    width: 52,
                                    height: 52,
                                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                }}
                            >
                                <StadiumIcon sx={{ fontSize: 30, color: 'var(--tds-lime)' }} />
                            </div>
                            <div>
                                <h2 className="fw-bold mb-1 text-white">Gestión de Partidos</h2>
                                <p className="text-white-50 mb-0">
                                    Programa, edita y administra los partidos de los torneos.
                                </p>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary d-inline-flex align-items-center gap-2 px-3.5 py-2 shadow-sm"
                            onClick={abrirModalNuevo}
                            style={{ borderRadius: '10px', fontWeight: 600 }}
                        >
                            <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                            <span>Programar partido</span>
                        </button>
                    </div>
                </div>

                <div className="row g-4">
                    {/* ===================================== */}
                    {/* LISTADO */}
                    {/* ===================================== */}
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '18px', overflow: 'hidden' }}>
                            <div className="card-header bg-white border-0 p-4">
                                <div className="row g-3 align-items-center">
                                    <div className="col-12 col-md-3">
                                        <h5 className="fw-bold mb-0 text-dark">Partidos programados</h5>
                                        <small className="text-muted">{partidosFiltrados.length} partido(s) registrados</small>
                                    </div>
                                    <div className="col-12 col-md-3">
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted">
                                                <SearchIcon sx={{ fontSize: 18 }} />
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control border-start-0 ps-1"
                                                placeholder="Buscar equipo o torneo..."
                                                value={busqueda}
                                                onChange={(e) => setBusqueda(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-3">
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted">
                                                <EmojiEventsIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                                            </span>
                                            <select
                                                className="form-select border-start-0 ps-1"
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
                                    </div>
                                    <div className="col-12 col-md-3">
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted">
                                                <FilterListIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                            </span>
                                            <select
                                                className="form-select border-start-0 ps-1"
                                                value={filtroJornada}
                                                onChange={(e) => setFiltroJornada(e.target.value)}
                                            >
                                                <option value="">Todas las jornadas</option>
                                                {[...Array(38)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>
                                                        Jornada {i + 1}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status"></div>
                                        <p className="text-muted mt-3 mb-0">Cargando partidos...</p>
                                    </div>
                                ) : partidosFiltrados.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div
                                            className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-2"
                                            style={{ width: 64, height: 64 }}
                                        >
                                            <SportsSoccerIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
                                        </div>
                                        <h5 className="text-muted mt-2 mb-0">No hay partidos</h5>
                                        <p className="text-muted small">Todavía no existen partidos programados con estos filtros.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="px-4">Fecha</th>
                                                    <th>Torneo</th>
                                                    <th className="text-center">Jornada</th>
                                                    <th className="text-center">Estadio</th>
                                                    <th className="text-center">Partido</th>
                                                    <th className="text-center">Resultado</th>
                                                    <th>Estado</th>
                                                    <th className="text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {partidosFiltrados.map((partido) => {
                                                    const estado = obtenerEstado(partido.estado_id);
                                                    return (
                                                        <tr key={partido.id}>
                                                            <td className="px-4">
                                                                <div className="fw-semibold">
                                                                    {formatearFecha(partido.fecha_hora)}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="fw-semibold">
                                                                    {partido.torneos?.nombre || 'Sin torneo'}
                                                                </span>
                                                            </td>
                                                            <td className="text-center align-middle">
                                                                <span className="badge bg-secondary">
                                                                    {partido.jornada ? `Jornada ${partido.jornada}` : '-'}
                                                                </span>
                                                            </td>
                                                            <td className="text-center align-middle">
                                                                <span className="fw-semibold text-muted">
                                                                    {partido.estadio || '-'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center justify-content-center gap-3">
                                                                    <div className="text-center" style={{ width: '80px' }}>
                                                                        {partido.local?.escudo_url ? (
                                                                            <img
                                                                                src={partido.local.escudo_url}
                                                                                alt={partido.local.nombre}
                                                                                style={{
                                                                                    width: '45px',
                                                                                    height: '45px',
                                                                                    objectFit: 'contain',
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <div
                                                                                className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto"
                                                                                style={{ width: '45px', height: '45px' }}
                                                                            >
                                                                                <SportsSoccerIcon sx={{ fontSize: 24, color: '#94a3b8' }} />
                                                                            </div>
                                                                        )}
                                                                        <div className="small fw-semibold mt-1 text-truncate">
                                                                            {partido.local?.nombre}
                                                                        </div>
                                                                    </div>
                                                                    <div className="fw-bold text-muted">VS</div>
                                                                    <div className="text-center" style={{ width: '80px' }}>
                                                                        {partido.visitante?.escudo_url ? (
                                                                            <img
                                                                                src={partido.visitante.escudo_url}
                                                                                alt={partido.visitante.nombre}
                                                                                style={{
                                                                                    width: '45px',
                                                                                    height: '45px',
                                                                                    objectFit: 'contain',
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <div
                                                                                className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto"
                                                                                style={{ width: '45px', height: '45px' }}
                                                                            >
                                                                                <SportsSoccerIcon sx={{ fontSize: 24, color: '#94a3b8' }} />
                                                                            </div>
                                                                        )}
                                                                        <div className="small fw-semibold mt-1 text-truncate">
                                                                            {partido.visitante?.nombre}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                <div className="fw-bold fs-5">
                                                                    {partido.goles_local !== null ? partido.goles_local : '-'} : {partido.goles_visitante !== null ? partido.goles_visitante : '-'}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${estado.clase} px-2.5 py-1.5 d-inline-flex align-items-center gap-1`}>
                                                                    {estado.icono}
                                                                    <span>{estado.texto}</span>
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                <div className="d-flex justify-content-center align-items-center gap-1.5">
                                                                    <button
                                                                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 px-2.5 py-1.5 shadow-sm"
                                                                        onClick={() => abrirModalEditar(partido)}
                                                                        title="Editar partido"
                                                                        style={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem' }}
                                                                    >
                                                                        <EditIcon sx={{ fontSize: 15 }} />
                                                                        <span>Editar</span>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 px-2.5 py-1.5 shadow-sm"
                                                                        onClick={() => setPartidoEliminar(partido)}
                                                                        title="Eliminar partido"
                                                                        style={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem' }}
                                                                    >
                                                                        <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                                                                        <span>Eliminar</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===================================== */}
            {/* MODAL CREAR / EDITAR */}
            {/* ===================================== */}
            {mostrarModal && (
                <div
                    className="modal-consultation-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !guardando) {
                            setMostrarModal(false);
                        }
                    }}>

                    <div className="modal-consultation-card">
                        <div className="modal-decor-blob"></div>

                        {/* Botón de cerrar */}
                        <button
                            type="button"
                            className="modal-consultation-close"
                            onClick={() => setMostrarModal(false)}
                            disabled={guardando}
                            aria-label="Cerrar modal"
                        >
                            <CloseIcon sx={{ fontSize: 20 }} />
                        </button>

                        {/* Cabecera del Modal */}
                        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                            <div className="d-flex align-items-center gap-2.5">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                        width: 44,
                                        height: 44,
                                        backgroundColor: partidoAEditar ? 'rgba(23, 105, 255, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: partidoAEditar ? 'var(--tds-blue)' : '#10b981',
                                    }}
                                >
                                    {partidoAEditar ? <EditIcon sx={{ fontSize: 24 }} /> : <AddCircleOutlineIcon sx={{ fontSize: 24 }} />}
                                </div>
                                <div>
                                    <h3 className="modal-consultation-title mb-0" style={{ fontSize: '1.4rem' }}>
                                        {partidoAEditar ? 'Editar Partido' : 'Programar Partido'}
                                    </h3>
                                    <span className="text-muted small">
                                        {partidoAEditar ? 'Modifica los datos del encuentro programado' : 'Ingresa la información para programar un nuevo encuentro'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* PREVISUALIZACIÓN DEL ENFRENTAMIENTO */}
                        <div className="tds-modal-matchup-preview">
                            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                                <span
                                    className="badge bg-white px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-sm"
                                    style={{ color: '#000000', fontWeight: 700, fontSize: '0.8rem' }}
                                >
                                    <EmojiEventsIcon sx={{ fontSize: 14, color: '#d97706' }} />
                                    <span style={{ color: '#000000', fontWeight: 700 }}>
                                        {torneoSeleccionado?.nombre || 'Torneo no seleccionado'}
                                    </span>
                                </span>
                                {jornada ? (
                                    <span
                                        className="badge bg-white px-2.5 py-1 shadow-sm"
                                        style={{ color: '#000000', fontWeight: 700, fontSize: '0.8rem' }}
                                    >
                                        Jornada {jornada}
                                    </span>
                                ) : null}
                            </div>

                            <div className="row align-items-center text-center g-2 py-1">
                                {/* Local */}
                                <div className="col-5">
                                    <div className="d-flex justify-content-center mb-1">
                                        {equipoLocalSeleccionado?.escudo_url ? (
                                            <img
                                                src={equipoLocalSeleccionado.escudo_url}
                                                alt={equipoLocalSeleccionado.nombre}
                                                style={{ width: 48, height: 48, objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle bg-white d-flex align-items-center justify-content-center mx-auto shadow-sm"
                                                style={{ width: 48, height: 48 }}
                                            >
                                                <SportsSoccerIcon sx={{ fontSize: 26, color: '#000000' }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="fw-bold text-white small text-truncate">
                                        {equipoLocalSeleccionado?.nombre || 'Equipo Local'}
                                    </div>
                                    <span
                                        className="badge bg-white mt-1 shadow-sm"
                                        style={{ fontSize: '0.65rem', color: '#000000', fontWeight: 800 }}
                                    >
                                        LOCAL
                                    </span>
                                </div>

                                {/* Marcador / VS */}
                                <div className="col-2">
                                    {golesLocal !== '' && golesVisitante !== '' ? (
                                        <div
                                            className="fw-bold fs-4 bg-white px-2 py-1 rounded shadow-sm"
                                            style={{ color: '#000000', letterSpacing: '2px', fontWeight: 800 }}
                                        >
                                            {golesLocal} - {golesVisitante}
                                        </div>
                                    ) : (
                                        <div className="display-6 fw-bold text-white mb-0" style={{ fontSize: '1.4rem' }}>
                                            VS
                                        </div>
                                    )}
                                </div>

                                {/* Visitante */}
                                <div className="col-5">
                                    <div className="d-flex justify-content-center mb-1">
                                        {equipoVisitanteSeleccionado?.escudo_url ? (
                                            <img
                                                src={equipoVisitanteSeleccionado.escudo_url}
                                                alt={equipoVisitanteSeleccionado.nombre}
                                                style={{ width: 48, height: 48, objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle bg-white d-flex align-items-center justify-content-center mx-auto shadow-sm"
                                                style={{ width: 48, height: 48 }}
                                            >
                                                <SportsSoccerIcon sx={{ fontSize: 26, color: '#000000' }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="fw-bold text-white small text-truncate">
                                        {equipoVisitanteSeleccionado?.nombre || 'Equipo Visitante'}
                                    </div>
                                    <span
                                        className="badge bg-white mt-1 shadow-sm"
                                        style={{ fontSize: '0.65rem', color: '#000000', fontWeight: 800 }}
                                    >
                                        VISITANTE
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={guardarPartido} style={{ position: 'relative', zIndex: 1 }}>
                            <div className="row g-3">
                                {/* Columna Izquierda: Información del Encuentro */}
                                <div className="col-12 col-md-6">
                                    <div className="modal-consultation-field">
                                        <label className="modal-consultation-label">
                                            <EmojiEventsIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                                            <span>Torneo</span>
                                        </label>
                                        <select
                                            className="modal-consultation-select"
                                            value={torneoId}
                                            onChange={manejarCambioTorneo}
                                            required
                                        >
                                            <option value="">Seleccione el torneo</option>
                                            {torneos.map((torneo) => (
                                                <option key={torneo.id} value={torneo.id}>
                                                    {torneo.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="modal-consultation-field">
                                        <label className="modal-consultation-label">
                                            <TagIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                                            <span>Jornada</span>
                                        </label>
                                        <select
                                            className="modal-consultation-select"
                                            value={jornada}
                                            onChange={(e) => setJornada(e.target.value === '' ? '' : Number(e.target.value))}
                                            required
                                        >
                                            <option value="">Seleccione la jornada</option>
                                            {[...Array(38)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    Jornada {i + 1}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="modal-consultation-field">
                                        <label className="modal-consultation-label">
                                            <StadiumIcon sx={{ fontSize: 16, color: '#10b981' }} />
                                            <span>Estadio</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="modal-consultation-input"
                                            placeholder="Nombre del estadio sede..."
                                            value={estadio}
                                            onChange={(e) => setEstadio(e.target.value)}
                                        />
                                    </div>

                                    <div className="modal-consultation-field">
                                        <label className="modal-consultation-label">
                                            <CalendarTodayIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                                            <span>Fecha y Hora</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            className="modal-consultation-input"
                                            value={fechaHora}
                                            onChange={(e) => setFechaHora(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="modal-consultation-field">
                                        <label className="modal-consultation-label">
                                            <FlagIcon sx={{ fontSize: 16, color: '#ec4899' }} />
                                            <span>Estado del Partido</span>
                                        </label>
                                        <select
                                            className="modal-consultation-select"
                                            value={estadoId}
                                            onChange={(e) => setEstadoId(Number(e.target.value))}
                                            required
                                        >
                                            <option value={1}>FUTURO</option>
                                            <option value={2}>EN JUEGO</option>
                                            <option value={3}>FINALIZADO</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Columna Derecha: Equipos y Marcadores */}
                                <div className="col-12 col-md-6">
                                    <div className="modal-consultation-field">
                                        <label className="modal-consultation-label">
                                            <SportsSoccerIcon sx={{ fontSize: 16, color: 'var(--tds-blue)' }} />
                                            <span>Equipo Local</span>
                                        </label>
                                        <select
                                            className="modal-consultation-select"
                                            value={localId}
                                            onChange={(e) => setLocalId(e.target.value)}
                                            disabled={!torneoId || equipos.length === 0}
                                            required
                                        >
                                            <option value="">
                                                {!torneoId
                                                    ? 'Seleccione primero un torneo'
                                                    : equipos.length === 0
                                                        ? 'No hay equipos asociados'
                                                        : 'Seleccione equipo local'}
                                            </option>
                                            {equipos.map((equipo) => (
                                                <option key={equipo.id} value={equipo.id}>
                                                    {equipo.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="modal-consultation-field">
                                        <label className="modal-consultation-label">
                                            <SportsScoreIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                            <span>Goles Local</span>
                                        </label>
                                        <input
                                            type="number"
                                            className="modal-consultation-input"
                                            placeholder="0"
                                            value={golesLocal}
                                            onChange={(e) => setGolesLocal(e.target.value === '' ? '' : Number(e.target.value))}
                                            min="0"
                                        />
                                    </div>

                                    <div className="modal-consultation-field">
                                        <label className="modal-consultation-label">
                                            <SportsSoccerIcon sx={{ fontSize: 16, color: 'var(--tds-blue)' }} />
                                            <span>Equipo Visitante</span>
                                        </label>
                                        <select
                                            className="modal-consultation-select"
                                            value={visitanteId}
                                            onChange={(e) => setVisitanteId(e.target.value)}
                                            disabled={!torneoId || equipos.length === 0}
                                            required
                                        >
                                            <option value="">
                                                {!torneoId
                                                    ? 'Seleccione primero un torneo'
                                                    : equipos.length === 0
                                                        ? 'No hay equipos asociados'
                                                        : 'Seleccione equipo visitante'}
                                            </option>
                                            {equipos.map((equipo) => (
                                                <option key={equipo.id} value={equipo.id}>
                                                    {equipo.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="modal-consultation-field">
                                        <label className="modal-consultation-label">
                                            <SportsScoreIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                            <span>Goles Visitante</span>
                                        </label>
                                        <input
                                            type="number"
                                            className="modal-consultation-input"
                                            placeholder="0"
                                            value={golesVisitante}
                                            onChange={(e) => setGolesVisitante(e.target.value === '' ? '' : Number(e.target.value))}
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Botones del Formulario */}
                            <div className="d-flex justify-content-end align-items-center gap-2 mt-4 pt-3 border-top">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary px-4 py-2 d-inline-flex align-items-center gap-1.5"
                                    onClick={() => setMostrarModal(false)}
                                    disabled={guardando}
                                    style={{ borderRadius: '10px', fontWeight: 600 }}
                                >
                                    <CloseIcon sx={{ fontSize: 18 }} />
                                    <span>Cancelar</span>
                                </button>

                                <button
                                    type="submit"
                                    className="modal-consultation-submit d-inline-flex align-items-center gap-2"
                                    disabled={guardando}
                                >
                                    {guardando ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <SaveIcon sx={{ fontSize: 19 }} />
                                            <span>{partidoAEditar ? 'Actualizar Partido' : 'Guardar Partido'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===================================== */}
            {/* MODAL ELIMINAR */}
            {/* ===================================== */}
            {partidoEliminar && (
                <div
                    className="modal fade show d-block"
                    tabIndex={-1}
                    style={{
                        backgroundColor: 'rgba(7, 26, 51, 0.65)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 1055,
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header border-0 bg-white px-4 pt-4 pb-2 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: 40, height: 40, backgroundColor: '#fee2e2' }}
                                    >
                                        <WarningAmberIcon sx={{ fontSize: 24, color: '#ef4444' }} />
                                    </div>
                                    <h5 className="modal-title fw-bold text-dark mb-0">Eliminar Partido</h5>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setPartidoEliminar(null)}
                                    disabled={eliminando}
                                    aria-label="Cerrar modal"
                                />
                            </div>
                            <div className="modal-body px-4 py-3">
                                <p className="text-muted mb-3">
                                    ¿Está seguro de que desea eliminar este encuentro programado?
                                </p>
                                <div
                                    className="p-3 rounded-3 text-center mb-2"
                                    style={{
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                    }}
                                >
                                    <div className="fw-bold text-dark fs-6 mb-1">
                                        {partidoEliminar.local?.nombre || 'Equipo Local'} VS {partidoEliminar.visitante?.nombre || 'Equipo Visitante'}
                                    </div>
                                    <div className="text-muted small d-flex align-items-center justify-content-center gap-1">
                                        <CalendarTodayIcon sx={{ fontSize: 14 }} />
                                        <span>{formatearFecha(partidoEliminar.fecha_hora)}</span>
                                    </div>
                                </div>
                                <p className="text-danger small mb-0 mt-2">
                                    Esta acción es permanente y no se puede deshacer.
                                </p>
                            </div>
                            <div className="modal-footer border-0 bg-white px-4 pb-4 pt-2 d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary px-3.5 py-2 d-inline-flex align-items-center gap-1"
                                    onClick={() => setPartidoEliminar(null)}
                                    disabled={eliminando}
                                    style={{ borderRadius: '10px', fontWeight: 600 }}
                                >
                                    <CloseIcon sx={{ fontSize: 18 }} />
                                    <span>Cancelar</span>
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger px-3.5 py-2 d-inline-flex align-items-center gap-1 shadow-sm"
                                    onClick={eliminarPartido}
                                    disabled={eliminando}
                                    style={{ borderRadius: '10px', fontWeight: 600 }}
                                >
                                    {eliminando ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1"></span>
                                            <span>Eliminando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <DeleteForeverIcon sx={{ fontSize: 18 }} />
                                            <span>Sí, eliminar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}