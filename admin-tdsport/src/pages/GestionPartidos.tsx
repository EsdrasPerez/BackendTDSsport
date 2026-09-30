import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

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

        setPartidos((data as Partido[]) || []);
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
    // I will adjust the select query in cargarPartidos.

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

    // ESTADO DEL PARTIDO
    const obtenerEstado = (estadoId: number) => {
        switch (estadoId) {
            case 1:
                return { texto: 'FUTURO', clase: 'bg-primary' };
            case 2:
                return { texto: 'EN JUEGO', clase: 'bg-warning text-dark' };
            case 3:
                return { texto: 'FINALIZADO', clase: 'bg-success' };
            default:
                return { texto: 'DESCONOCIDO', clase: 'bg-secondary' };
        }
    };

    // FORMATEAR FECHA
    const formatearFecha = (fecha: string) => {
        const date = new Date(fecha);
        // Usamos UTC para que la fecha y hora se muestren tal cual están en la base de datos
        const opcionesFecha: Intl.DateTimeFormatOptions = { timeZone: 'UTC', dateStyle: 'medium' };
        const opcionesHora: Intl.DateTimeFormatOptions = { timeZone: 'UTC', timeStyle: 'short' };
        return `${date.toLocaleDateString('es-GT', opcionesFecha)}, ${date.toLocaleTimeString('es-GT', opcionesHora)}`;
    };

    const formatearFechaInput = (fecha: string) => {
        const date = new Date(fecha);
        const pad = (n: number) => n.toString().padStart(2, '0');
        // Usamos los métodos getUTC* para extraer la hora exacta de la BD sin conversión de zona horaria local
        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
    };

    // RENDER
    return (
        <div className="min-vh-100 bg-light">
            {/* HEADER */}
            <nav className="navbar navbar-dark bg-dark shadow-sm px-4">
                <div className="container-fluid">
                    <span className="navbar-brand fw-bold">TDSPORT</span>
                    <span className="text-white">Gestión de Partidos</span>
                </div>
            </nav>

            <div className="container-fluid py-4">
                {/* TITULO */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">Gestión de Partidos</h2>
                        <p className="text-muted mb-0">Programa y administra los partidos de los torneos.</p>
                    </div>
                    <button className="btn btn-primary" onClick={abrirModalNuevo}>
                        <i className="bi bi-plus-lg me-2"></i>Programar partido
                    </button>
                </div>

                <div className="row g-4">
                    {/* ===================================== */}
                    {/* LISTADO */}
                    {/* ===================================== */}
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0 p-4">
                                <div className="row g-3 align-items-center">
                                    <div className="col-md-3">
                                        <h5 className="fw-bold mb-1">Partidos programados</h5>
                                        <small className="text-muted">{partidosFiltrados.length} partido(s)</small>
                                    </div>
                                    <div className="col-md-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Buscar equipo o torneo..."
                                            value={busqueda}
                                            onChange={(e) => setBusqueda(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-3">
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
                                    <div className="col-md-3">
                                        <select
                                            className="form-select"
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

                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status"></div>
                                        <p className="text-muted mt-3 mb-0">Cargando partidos...</p>
                                    </div>
                                ) : partidosFiltrados.length === 0 ? (
                                    <div className="text-center py-5">
                                        <h5 className="text-muted mt-3 mb-0">No hay partidos</h5>
                                        <p className="text-muted">Todavía no existen partidos programados.</p>
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
                                                                            ></div>
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
                                                                            ></div>
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
                                                                <span className={`badge ${estado.clase}`}>
                                                                    {estado.texto}
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary me-2"
                                                                    onClick={() => abrirModalEditar(partido)}
                                                                    title="Editar partido"
                                                                >
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => setPartidoEliminar(partido)}
                                                                    title="Eliminar partido"
                                                                >
                                                                    Eliminar
                                                                </button>
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
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    {partidoAEditar ? 'Editar Partido' : 'Programar Partido'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setMostrarModal(false)}
                                    disabled={guardando}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                <form id="partidoForm" onSubmit={guardarPartido}>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Torneo</label>
                                            <select
                                                className="form-select"
                                                value={torneoId}
                                                onChange={manejarCambioTorneo}
                                                required
                                            >
                                                <option value="">Seleccione un torneo</option>
                                                {torneos.map((torneo) => (
                                                    <option key={torneo.id} value={torneo.id}>
                                                        {torneo.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Estado</label>
                                            <select
                                                className="form-select"
                                                value={estadoId}
                                                onChange={(e) => setEstadoId(Number(e.target.value))}
                                                required
                                            >
                                                <option value={1}>FUTURO</option>
                                                <option value={2}>EN JUEGO</option>
                                                <option value={3}>FINALIZADO</option>
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-12">
                                            <label className="form-label fw-semibold">Jornada</label>
                                            <select
                                                className="form-select"
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

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Estadio</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Ej. Estadio Nacional"
                                                value={estadio}
                                                onChange={(e) => setEstadio(e.target.value)}
                                            />
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Equipo local</label>
                                            <select
                                                className="form-select"
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
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Goles local</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={golesLocal}
                                                onChange={(e) => setGolesLocal(e.target.value === '' ? '' : Number(e.target.value))}
                                                min="0"
                                            />
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Equipo visitante</label>
                                            <select
                                                className="form-select"
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
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Goles visitante</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={golesVisitante}
                                                onChange={(e) => setGolesVisitante(e.target.value === '' ? '' : Number(e.target.value))}
                                                min="0"
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Fecha y hora</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={fechaHora}
                                                onChange={(e) => setFechaHora(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setMostrarModal(false)}
                                    disabled={guardando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    form="partidoForm"
                                    className="btn btn-primary"
                                    disabled={guardando}
                                >
                                    {guardando ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Guardando...
                                        </>
                                    ) : partidoAEditar ? (
                                        'Actualizar'
                                    ) : (
                                        'Programar'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================================== */}
            {/* MODAL ELIMINAR */}
            {/* ===================================== */}
            {partidoEliminar && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Eliminar partido</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setPartidoEliminar(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>¿Está seguro de que desea eliminar este partido?</p>
                                <div className="alert alert-warning">
                                    <strong>{partidoEliminar.local?.nombre}</strong>
                                    {' VS '}
                                    <strong>{partidoEliminar.visitante?.nombre}</strong>
                                    <br />
                                    <small>{formatearFecha(partidoEliminar.fecha_hora)}</small>
                                </div>
                                <p className="text-muted small mb-0">Esta acción no se puede deshacer.</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setPartidoEliminar(null)}
                                    disabled={eliminando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={eliminarPartido}
                                    disabled={eliminando}
                                >
                                    {eliminando ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Eliminando...
                                        </>
                                    ) : (
                                        'Sí, eliminar'
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