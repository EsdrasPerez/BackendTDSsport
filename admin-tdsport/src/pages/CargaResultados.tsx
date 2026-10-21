import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// MUI Icons
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import StadiumIcon from '@mui/icons-material/Stadium';
import ScheduleIcon from '@mui/icons-material/Schedule';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LockIcon from '@mui/icons-material/Lock';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

interface Equipo {
    nombre: string;
    escudo_url: string | null;
}

interface Partido {
    id: string;
    torneo_id: string;
    fecha_hora: string;
    goles_local: number | null;
    goles_visitante: number | null;
    estado_id: number;
    torneos: { nombre: string } | null;
    local: Equipo | null;
    visitante: Equipo | null;
}

interface Torneo {
    id: string;
    nombre: string;
}

export default function CargaResultados() {
    const [searchParams] = useSearchParams();
    const location = useLocation();

    const [partidos, setPartidos] = useState<Partido[]>([]);
    const [torneos, setTorneos] = useState<Torneo[]>([]);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [partidoId, setPartidoId] = useState('');
    const [golesLocal, setGolesLocal] = useState('');
    const [golesVisitante, setGolesVisitante] = useState('');
    const [nuevoEstado, setNuevoEstado] = useState('2');

    const [busqueda, setBusqueda] = useState('');
    const [filtroTorneo, setFiltroTorneo] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [mensaje, setMensaje] = useState('');
    const [tipoMensaje, setTipoMensaje] = useState<'success' | 'danger'>('success');

    const cargarPartidos = useCallback(async () => {
        const { data, error } = await supabase
            .from('partidos')
            .select(`
        id,
        torneo_id,
        fecha_hora,
        goles_local,
        goles_visitante,
        estado_id,
        torneos ( nombre ),
        local:local_id ( nombre, escudo_url ),
        visitante:visitante_id ( nombre, escudo_url )
      `)
            .order('fecha_hora', { ascending: true });

        if (error) {
            console.error('Error al cargar partidos:', error);
            setMensaje('No fue posible cargar los partidos: ' + error.message);
            setTipoMensaje('danger');
            return;
        }

        setPartidos((data || []) as unknown as Partido[]);
    }, []);

    const cargarTorneos = useCallback(async () => {
        const { data, error } = await supabase
            .from('torneos')
            .select('id, nombre')
            .order('nombre');

        if (error) {
            console.error('Error al cargar torneos:', error);
            setMensaje('No fue posible cargar los torneos: ' + error.message);
            setTipoMensaje('danger');
            return;
        }

        setTorneos(data || []);
    }, []);

    useEffect(() => {
        let activo = true;

        const iniciar = async () => {
            setLoading(true);
            await Promise.all([cargarPartidos(), cargarTorneos()]);
            if (activo) setLoading(false);
        };

        void iniciar();

        const canal = supabase
            .channel('carga-resultados-partidos')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'partidos' },
                () => {
                    void cargarPartidos();
                }
            )
            .subscribe();

        return () => {
            activo = false;
            void supabase.removeChannel(canal);
        };
    }, [cargarPartidos, cargarTorneos]);

    const partidoSeleccionado = partidos.find(
        (partido) => partido.id === partidoId
    );

    const partidosFiltrados = useMemo(() => {
        const texto = busqueda.toLowerCase().trim();

        return partidos.filter((partido) => {
            const nombres = [
                partido.local?.nombre || '',
                partido.visitante?.nombre || '',
                partido.torneos?.nombre || '',
            ].join(' ').toLowerCase();

            const coincideTexto = !texto || nombres.includes(texto);
            const coincideTorneo =
                !filtroTorneo || partido.torneo_id === filtroTorneo;
            const coincideEstado =
                filtroEstado === 'todos' ||
                partido.estado_id === Number(filtroEstado);

            return coincideTexto && coincideTorneo && coincideEstado;
        });
    }, [partidos, busqueda, filtroTorneo, filtroEstado]);

    const estadisticas = useMemo(() => ({
        futuros: partidos.filter((p) => p.estado_id === 1).length,
        enJuego: partidos.filter((p) => p.estado_id === 2).length,
        finalizados: partidos.filter((p) => p.estado_id === 3).length,
    }), [partidos]);

    const seleccionarPartido = (partido: Partido) => {
        setPartidoId(partido.id);
        setGolesLocal(
            partido.goles_local === null ? '' : String(partido.goles_local)
        );
        setGolesVisitante(
            partido.goles_visitante === null
                ? ''
                : String(partido.goles_visitante)
        );
        setNuevoEstado(String(partido.estado_id === 1 ? 2 : partido.estado_id));
        setMensaje('');
    };

    // Auto-seleccionar partido si fue redirigido desde el Calendario
    useEffect(() => {
        const idBuscado = searchParams.get('partidoId') || (location.state as { partidoId?: string })?.partidoId;
        if (idBuscado && partidos.length > 0) {
            const partidoEncontrado = partidos.find((p) => p.id === idBuscado);
            if (partidoEncontrado) {
                seleccionarPartido(partidoEncontrado);
                if (partidoEncontrado.estado_id === 3) {
                    setMensaje(`El partido "${partidoEncontrado.local?.nombre || 'Local'} vs ${partidoEncontrado.visitante?.nombre || 'Visitante'}" ya está FINALIZADO. La carga de marcadores se encuentra bloqueada.`);
                    setTipoMensaje('danger');
                } else {
                    setMensaje(`Partido "${partidoEncontrado.local?.nombre || 'Local'} vs ${partidoEncontrado.visitante?.nombre || 'Visitante'}" listo para gestionar marcador.`);
                    setTipoMensaje('success');
                }

                setTimeout(() => {
                    const el = document.getElementById('panel-registro-marcador');
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 150);
            }
        }
    }, [partidos, searchParams, location.state]);

    const limpiarFormulario = () => {
        setPartidoId('');
        setGolesLocal('');
        setGolesVisitante('');
        setNuevoEstado('2');
        setMensaje('');
    };

    const guardarResultado = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!partidoSeleccionado) {
            setMensaje('Selecciona un partido.');
            setTipoMensaje('danger');
            return;
        }

        if (golesLocal.trim() === '' || golesVisitante.trim() === '') {
            setMensaje('Ingresa los goles de ambos equipos.');
            setTipoMensaje('danger');
            return;
        }

        const local = Number(golesLocal);
        const visitante = Number(golesVisitante);
        const estado = Number(nuevoEstado);

        if (
            !Number.isInteger(local) ||
            !Number.isInteger(visitante) ||
            local < 0 ||
            visitante < 0
        ) {
            setMensaje('Los goles deben ser números enteros iguales o mayores que cero.');
            setTipoMensaje('danger');
            return;
        }

        if (![2, 3].includes(estado)) {
            setMensaje('El resultado debe guardarse como EN JUEGO o FINALIZADO.');
            setTipoMensaje('danger');
            return;
        }

        if (partidoSeleccionado.estado_id === 3) {
            setMensaje('Este partido ya está finalizado. No se permite editarlo desde este módulo.');
            setTipoMensaje('danger');
            return;
        }

        setGuardando(true);
        setMensaje('');

        try {
            const { error } = await supabase
                .from('partidos')
                .update({
                    goles_local: local,
                    goles_visitante: visitante,
                    estado_id: estado,
                })
                .eq('id', partidoSeleccionado.id)
                .neq('estado_id', 3)
                .select('id');

            if (error) throw error;

            await cargarPartidos();

            setMensaje(
                estado === 3
                    ? 'Resultado guardado y partido finalizado correctamente.'
                    : 'Marcador actualizado. El partido continúa en juego.'
            );
            setTipoMensaje('success');
            limpiarFormulario();
        } catch (error: any) {
            console.error('Error al guardar resultado:', error);
            setMensaje('No fue posible guardar el resultado: ' + (error?.message || 'Error desconocido'));
            setTipoMensaje('danger');
        } finally {
            setGuardando(false);
        }
    };

    const nombreEstado = (estado: number) => {
        if (estado === 1) return 'FUTURO';
        if (estado === 2) return 'EN JUEGO';
        if (estado === 3) return 'FINALIZADO';
        return 'DESCONOCIDO';
    };

    const claseEstado = (estado: number) => {
        if (estado === 1) return 'bg-primary';
        if (estado === 2) return 'bg-warning text-dark';
        if (estado === 3) return 'bg-success';
        return 'bg-secondary';
    };

    const fechaLegible = (fecha: string) =>
        new Date(fecha).toLocaleString('es-GT', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });

    const Escudo = ({ equipo }: { equipo: Equipo | null }) => (
        equipo?.escudo_url ? (
            <img
                src={equipo.escudo_url}
                alt={`Escudo de ${equipo.nombre}`}
                style={{ width: 44, height: 44, objectFit: 'contain' }}
            />
        ) : (
            <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-light border text-muted shadow-sm"
                style={{ width: 44, height: 44 }}
                aria-label="Sin escudo"
            >
                <SportsSoccerIcon sx={{ fontSize: 24, color: '#6c757d' }} />
            </div>
        )
    );

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
                                <SportsScoreIcon sx={{ fontSize: 32, color: 'var(--tds-lime, #7cff4f)' }} />
                            </div>
                            <div>
                                <h2 className="fw-bold mb-1 text-white">Carga de Resultados</h2>
                                <p className="text-white-50 mb-0">
                                    Registra marcadores en tiempo real y actualiza el estado de los encuentros.
                                </p>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <Link
                                to="/partidos"
                                className="btn btn-primary d-inline-flex align-items-center gap-2 px-3.5 py-2 shadow-sm text-decoration-none"
                                style={{ borderRadius: '10px', fontWeight: 600 }}
                            >
                                <StadiumIcon sx={{ fontSize: 20 }} />
                                <span>Gestión de Partidos</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {mensaje && (
                    <div
                        className={`alert alert-${tipoMensaje} alert-dismissible d-flex align-items-center justify-content-between shadow-sm mb-4`}
                        role="alert"
                        style={{ borderRadius: '12px' }}
                    >
                        <div className="d-flex align-items-center gap-2">
                            {tipoMensaje === 'success' ? (
                                <CheckCircleIcon sx={{ fontSize: 22 }} />
                            ) : (
                                <LockIcon sx={{ fontSize: 22 }} />
                            )}
                            <div>{mensaje}</div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-link text-decoration-none p-0 text-reset"
                            aria-label="Cerrar mensaje"
                            onClick={() => setMensaje('')}
                        >
                            <CloseIcon sx={{ fontSize: 20 }} />
                        </button>
                    </div>
                )}

                {/* STATS ROW */}
                <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '14px' }}>
                            <div className="card-body d-flex justify-content-between align-items-center p-3">
                                <div>
                                    <div className="text-muted small fw-medium">Partidos Programados</div>
                                    <div className="fs-2 fw-bold text-dark">{estadisticas.futuros}</div>
                                </div>
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: 48, height: 48, backgroundColor: 'rgba(13, 110, 253, 0.12)' }}
                                >
                                    <ScheduleIcon sx={{ fontSize: 26, color: '#0d6efd' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '14px' }}>
                            <div className="card-body d-flex justify-content-between align-items-center p-3">
                                <div>
                                    <div className="text-muted small fw-medium">En Juego</div>
                                    <div className="fs-2 fw-bold text-dark">{estadisticas.enJuego}</div>
                                </div>
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: 48, height: 48, backgroundColor: 'rgba(255, 193, 7, 0.18)' }}
                                >
                                    <FiberManualRecordIcon sx={{ fontSize: 24, color: '#ff9800' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '14px' }}>
                            <div className="card-body d-flex justify-content-between align-items-center p-3">
                                <div>
                                    <div className="text-muted small fw-medium">Finalizados</div>
                                    <div className="fs-2 fw-bold text-dark">{estadisticas.finalizados}</div>
                                </div>
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: 48, height: 48, backgroundColor: 'rgba(25, 135, 84, 0.12)' }}
                                >
                                    <CheckCircleIcon sx={{ fontSize: 26, color: '#198754' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    {/* LISTA DE PARTIDOS */}
                    <div className="col-12 col-xl-7">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            <div className="card-header bg-white p-3 border-bottom">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                        <StadiumIcon sx={{ fontSize: 22, color: 'var(--tds-navy, #0f1e36)' }} />
                                        <span>Partidos Registrados</span>
                                    </h5>
                                    <span className="badge bg-light text-muted border">
                                        {partidosFiltrados.length} {partidosFiltrados.length === 1 ? 'partido' : 'partidos'}
                                    </span>
                                </div>

                                <div className="row g-2">
                                    <div className="col-12 col-md-5">
                                        <div className="input-group">
                                            <span className="input-group-text bg-white border-end-0 text-muted">
                                                <SearchIcon sx={{ fontSize: 20 }} />
                                            </span>
                                            <input
                                                className="form-control border-start-0 ps-0"
                                                value={busqueda}
                                                onChange={(e) => setBusqueda(e.target.value)}
                                                placeholder="Buscar equipo o torneo..."
                                                aria-label="Buscar equipo o torneo"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <div className="input-group">
                                            <span className="input-group-text bg-white border-end-0 text-muted">
                                                <EmojiEventsIcon sx={{ fontSize: 20 }} />
                                            </span>
                                            <select
                                                className="form-select border-start-0 ps-0"
                                                value={filtroTorneo}
                                                onChange={(e) => setFiltroTorneo(e.target.value)}
                                                aria-label="Filtrar por torneo"
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
                                            <span className="input-group-text bg-white border-end-0 text-muted">
                                                <FilterListIcon sx={{ fontSize: 20 }} />
                                            </span>
                                            <select
                                                className="form-select border-start-0 ps-0"
                                                value={filtroEstado}
                                                onChange={(e) => setFiltroEstado(e.target.value)}
                                                aria-label="Filtrar por estado"
                                            >
                                                <option value="todos">Todos</option>
                                                <option value="1">Futuros</option>
                                                <option value="2">En juego</option>
                                                <option value="3">Finalizados</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" />
                                        <p className="text-muted mt-3 mb-0">Cargando partidos...</p>
                                    </div>
                                ) : partidosFiltrados.length === 0 ? (
                                    <div className="text-center py-5 px-3">
                                        <div
                                            className="rounded-circle d-inline-flex align-items-center justify-content-center bg-light text-muted mb-3"
                                            style={{ width: 64, height: 64 }}
                                        >
                                            <SportsSoccerIcon sx={{ fontSize: 32 }} />
                                        </div>
                                        <h6 className="fw-bold">No hay partidos para mostrar</h6>
                                        <p className="text-muted small mb-0">
                                            Prueba otro filtro o programa un encuentro primero desde Gestión de Partidos.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {partidosFiltrados.map((partido) => {
                                            const isSelected = partido.id === partidoId;
                                            return (
                                                <div
                                                    key={partido.id}
                                                    className={`list-group-item p-3 transition-all ${
                                                        isSelected ? 'bg-primary-subtle border-start border-primary border-4' : ''
                                                    }`}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center gap-3">
                                                        <div className="flex-grow-1">
                                                            <div className="small text-muted mb-2 d-flex align-items-center gap-1.5 flex-wrap">
                                                                <span className="badge bg-light text-dark border">
                                                                    {partido.torneos?.nombre || 'Sin torneo'}
                                                                </span>
                                                                <span className="text-muted d-inline-flex align-items-center gap-1">
                                                                    <CalendarMonthIcon sx={{ fontSize: 15 }} />
                                                                    {fechaLegible(partido.fecha_hora)}
                                                                </span>
                                                            </div>

                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="flex-grow-1">
                                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                                        <Escudo equipo={partido.local} />
                                                                        <span className="fw-semibold">
                                                                            {partido.local?.nombre || 'Equipo local'}
                                                                        </span>
                                                                    </div>

                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <Escudo equipo={partido.visitante} />
                                                                        <span className="fw-semibold">
                                                                            {partido.visitante?.nombre || 'Equipo visitante'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="text-center px-3">
                                                                    <div className="fs-3 fw-bold text-dark font-monospace">
                                                                        {partido.goles_local ?? '–'}
                                                                        {' : '}
                                                                        {partido.goles_visitante ?? '–'}
                                                                    </div>
                                                                    <span className={`badge ${claseEstado(partido.estado_id)} px-2.5 py-1`}>
                                                                        {partido.estado_id === 2 && (
                                                                            <FiberManualRecordIcon sx={{ fontSize: 10, verticalAlign: 'middle', mr: 0.5 }} />
                                                                        )}
                                                                        {nombreEstado(partido.estado_id)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="d-flex align-items-center">
                                                            {partido.estado_id === 3 ? (
                                                                <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1 px-2.5 py-1.5">
                                                                    <CheckCircleIcon sx={{ fontSize: 16 }} />
                                                                    <span>Cerrado</span>
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className={`btn ${isSelected ? 'btn-primary' : 'btn-outline-primary'} btn-sm d-inline-flex align-items-center gap-1 px-3 py-1.5`}
                                                                    onClick={() => seleccionarPartido(partido)}
                                                                    style={{ borderRadius: '8px', fontWeight: 600 }}
                                                                >
                                                                    <EditIcon sx={{ fontSize: 16 }} />
                                                                    <span>Cargar</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PANEL DE REGISTRO DE MARCADOR */}
                    <div className="col-12 col-xl-5" id="panel-registro-marcador">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                            <div className="card-header bg-white p-3.5 border-bottom">
                                <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                                    <SportsScoreIcon sx={{ fontSize: 24, color: 'var(--tds-navy, #0f1e36)' }} />
                                    <span>Registrar Marcador</span>
                                </h5>
                                <p className="text-muted small mb-0">
                                    Selecciona un partido de la lista para actualizar su marcador o finalizarlo.
                                </p>
                            </div>

                            <div className="card-body p-4">
                                {!partidoSeleccionado ? (
                                    <div className="text-center py-5">
                                        <div
                                            className="rounded-circle d-inline-flex align-items-center justify-content-center bg-light text-muted mb-3"
                                            style={{ width: 64, height: 64 }}
                                        >
                                            <SportsScoreIcon sx={{ fontSize: 32 }} />
                                        </div>
                                        <h6 className="fw-bold">Ningún partido seleccionado</h6>
                                        <p className="text-muted small mb-0">
                                            Pulsa «Cargar» en un partido de la lista para comenzar.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-center mb-4 p-3 rounded-3 bg-light border">
                                            <span className="badge bg-primary px-2.5 py-1 mb-1">
                                                {partidoSeleccionado.torneos?.nombre || 'Sin torneo'}
                                            </span>
                                            <div className="small text-muted d-flex align-items-center justify-content-center gap-1 mt-1">
                                                <CalendarMonthIcon sx={{ fontSize: 16 }} />
                                                <span>{fechaLegible(partidoSeleccionado.fecha_hora)}</span>
                                            </div>
                                        </div>

                                        <form onSubmit={guardarResultado}>
                                            {partidoSeleccionado.estado_id === 3 && (
                                                <div
                                                    className="alert alert-danger d-flex align-items-center gap-2 mb-3"
                                                    style={{ borderRadius: '10px' }}
                                                >
                                                    <LockIcon sx={{ fontSize: 22 }} />
                                                    <div className="small">
                                                        <strong>Partido Finalizado:</strong> El marcador es definitivo y se encuentra bloqueado para modificaciones.
                                                    </div>
                                                </div>
                                            )}

                                            <div className="row align-items-center g-2 mb-4">
                                                <div className="col-5 text-center">
                                                    <div className="d-flex justify-content-center mb-2">
                                                        <Escudo equipo={partidoSeleccionado.local} />
                                                    </div>
                                                    <div className="fw-semibold text-truncate">
                                                        {partidoSeleccionado.local?.nombre || 'Local'}
                                                    </div>
                                                    <span className="badge bg-secondary-subtle text-secondary small">Local</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        inputMode="numeric"
                                                        className="form-control form-control-lg text-center mt-3 fw-bold fs-2"
                                                        style={{ borderRadius: '12px' }}
                                                        value={golesLocal}
                                                        onChange={(e) => setGolesLocal(e.target.value)}
                                                        aria-label="Goles del equipo local"
                                                        required
                                                        disabled={guardando || partidoSeleccionado.estado_id === 3}
                                                    />
                                                </div>

                                                <div className="col-2 text-center">
                                                    <div className="fw-bold fs-3 text-muted">:</div>
                                                </div>

                                                <div className="col-5 text-center">
                                                    <div className="d-flex justify-content-center mb-2">
                                                        <Escudo equipo={partidoSeleccionado.visitante} />
                                                    </div>
                                                    <div className="fw-semibold text-truncate">
                                                        {partidoSeleccionado.visitante?.nombre || 'Visitante'}
                                                    </div>
                                                    <span className="badge bg-secondary-subtle text-secondary small">Visitante</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        inputMode="numeric"
                                                        className="form-control form-control-lg text-center mt-3 fw-bold fs-2"
                                                        style={{ borderRadius: '12px' }}
                                                        value={golesVisitante}
                                                        onChange={(e) => setGolesVisitante(e.target.value)}
                                                        aria-label="Goles del equipo visitante"
                                                        required
                                                        disabled={guardando || partidoSeleccionado.estado_id === 3}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="form-label fw-semibold">
                                                    Estado del partido
                                                </label>
                                                <select
                                                    className="form-select"
                                                    style={{ borderRadius: '10px' }}
                                                    value={nuevoEstado}
                                                    onChange={(e) => setNuevoEstado(e.target.value)}
                                                    required
                                                    disabled={guardando || partidoSeleccionado.estado_id === 3}
                                                >
                                                    <option value="2">EN JUEGO (Marcador en vivo)</option>
                                                    <option value="3">FINALIZADO (Cierre definitivo)</option>
                                                </select>
                                                <div className="form-text">
                                                    Usa «Finalizado» únicamente cuando el árbitro haya pitado el final del partido.
                                                </div>
                                            </div>

                                            {nuevoEstado === '3' && partidoSeleccionado.estado_id !== 3 && (
                                                <div
                                                    className="alert alert-warning small d-flex align-items-center gap-2 mb-3"
                                                    style={{ borderRadius: '10px' }}
                                                >
                                                    <LockIcon sx={{ fontSize: 20 }} />
                                                    <div>
                                                        Al finalizar, el partido quedará cerrado y no podrá editarse de nuevo.
                                                    </div>
                                                </div>
                                            )}

                                            <div className="d-grid gap-2">
                                                <button
                                                    type="submit"
                                                    className={`btn ${
                                                        partidoSeleccionado.estado_id === 3
                                                            ? 'btn-secondary'
                                                            : 'btn-primary'
                                                    } btn-lg d-inline-flex align-items-center justify-content-center gap-2 shadow-sm`}
                                                    style={{ borderRadius: '10px', fontWeight: 600 }}
                                                    disabled={guardando || partidoSeleccionado.estado_id === 3}
                                                >
                                                    {partidoSeleccionado.estado_id === 3 ? (
                                                        <>
                                                            <LockIcon sx={{ fontSize: 20 }} />
                                                            <span>Marcador Bloqueado (Finalizado)</span>
                                                        </>
                                                    ) : guardando ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm" />
                                                            <span>Guardando...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <SaveIcon sx={{ fontSize: 20 }} />
                                                            <span>Guardar resultado</span>
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary d-inline-flex align-items-center justify-content-center gap-2"
                                                    style={{ borderRadius: '10px' }}
                                                    onClick={limpiarFormulario}
                                                    disabled={guardando}
                                                >
                                                    <RestartAltIcon sx={{ fontSize: 18 }} />
                                                    <span>Cancelar selección</span>
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

