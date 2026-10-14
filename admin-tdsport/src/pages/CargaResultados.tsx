
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

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
                style={{ width: 48, height: 48, objectFit: 'contain' }}
            />
        ) : (
            <div
                className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48, fontSize: 24 }}
                aria-label="Sin escudo"
            >
                ⚽
            </div>
        )
    );

    return (
        <div className="min-vh-100 bg-light">
            <nav className="navbar navbar-dark bg-dark px-4 shadow-sm">
                <span className="navbar-brand fw-bold">⚽ TDSPORT</span>
                <span className="text-white">Carga de resultados</span>
            </nav>

            <main className="container-fluid py-4">
                <div className="mb-4">
                    <h2 className="fw-bold mb-1">Carga de resultados</h2>
                    <p className="text-muted mb-0">
                        Registra marcadores y actualiza el estado de los encuentros.
                    </p>
                </div>

                {mensaje && (
                    <div
                        className={`alert alert-${tipoMensaje} alert-dismissible`}
                        role="alert"
                    >
                        {mensaje}
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Cerrar mensaje"
                            onClick={() => setMensaje('')}
                        />
                    </div>
                )}

                <div className="row g-3 mb-4">
                    {[
                        { titulo: 'Programados', cantidad: estadisticas.futuros, clase: 'primary' },
                        { titulo: 'En juego', cantidad: estadisticas.enJuego, clase: 'warning' },
                        { titulo: 'Finalizados', cantidad: estadisticas.finalizados, clase: 'success' },
                    ].map((item) => (
                        <div className="col-12 col-md-4" key={item.titulo}>
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="text-muted">{item.titulo}</div>
                                        <div className="fs-2 fw-bold">{item.cantidad}</div>
                                    </div>
                                    <span className={`badge bg-${item.clase} fs-6`}>
                                        {item.titulo === 'Programados' ? '📅' : item.titulo === 'En juego' ? '🔴' : '✓'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="row g-4">
                    <div className="col-12 col-xl-7">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white p-3">
                                <h5 className="fw-bold mb-3">Partidos registrados</h5>

                                <div className="row g-2">
                                    <div className="col-12 col-md-6">
                                        <input
                                            className="form-control"
                                            value={busqueda}
                                            onChange={(e) => setBusqueda(e.target.value)}
                                            placeholder="Buscar equipo o torneo..."
                                            aria-label="Buscar equipo o torneo"
                                        />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <select
                                            className="form-select"
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

                                    <div className="col-12">
                                        <select
                                            className="form-select"
                                            value={filtroEstado}
                                            onChange={(e) => setFiltroEstado(e.target.value)}
                                            aria-label="Filtrar por estado"
                                        >
                                            <option value="todos">Todos los estados</option>
                                            <option value="1">Futuros</option>
                                            <option value="2">En juego</option>
                                            <option value="3">Finalizados</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" />
                                        <p className="text-muted mt-3">Cargando partidos...</p>
                                    </div>
                                ) : partidosFiltrados.length === 0 ? (
                                    <div className="text-center py-5 px-3">
                                        <div className="display-5 mb-2">⚽</div>
                                        <h6>No hay partidos para mostrar</h6>
                                        <p className="text-muted mb-0">
                                            Prueba otro filtro o programa un encuentro primero.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {partidosFiltrados.map((partido) => (
                                            <div
                                                key={partido.id}
                                                className="list-group-item p-3"
                                            >
                                                <div className="d-flex justify-content-between gap-3">
                                                    <div className="flex-grow-1">
                                                        <div className="small text-muted mb-2">
                                                            {partido.torneos?.nombre || 'Sin torneo'}
                                                            {' · '}
                                                            {fechaLegible(partido.fecha_hora)}
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

                                                            <div className="text-center px-2">
                                                                <div className="fs-4 fw-bold">
                                                                    {partido.goles_local ?? '–'}
                                                                    {' : '}
                                                                    {partido.goles_visitante ?? '–'}
                                                                </div>
                                                                <span className={`badge ${claseEstado(partido.estado_id)}`}>
                                                                    {nombreEstado(partido.estado_id)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        {partido.estado_id === 3 ? (
                                                            <span className="text-success small fw-semibold">
                                                                Cerrado
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-primary btn-sm"
                                                                onClick={() => seleccionarPartido(partido)}
                                                            >
                                                                Cargar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-xl-5" id="panel-registro-marcador">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white p-4">
                                <h5 className="fw-bold mb-1">Registrar marcador</h5>
                                <p className="text-muted small mb-0">
                                    Selecciona un partido de la lista para cargar su resultado.
                                </p>
                            </div>

                            <div className="card-body p-4">
                                {!partidoSeleccionado ? (
                                    <div className="text-center py-5">
                                        <div className="display-4 mb-3">📝</div>
                                        <h6>Ningún partido seleccionado</h6>
                                        <p className="text-muted">
                                            Pulsa «Cargar» en un partido pendiente.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-center mb-4">
                                            <span className="badge bg-light text-dark border mb-2">
                                                {partidoSeleccionado.torneos?.nombre || 'Sin torneo'}
                                            </span>
                                            <div className="small text-muted">
                                                {fechaLegible(partidoSeleccionado.fecha_hora)}
                                            </div>
                                        </div>

                                        <form onSubmit={guardarResultado}>
                                            {partidoSeleccionado.estado_id === 3 && (
                                                <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                                                    <span className="fs-5">🔒</span>
                                                    <div>
                                                        <strong>Partido Finalizado:</strong> El marcador de este encuentro ya es definitivo. Los campos de edición y guardado se encuentran bloqueados.
                                                    </div>
                                                </div>
                                            )}

                                            <div className="row align-items-center g-2 mb-4">
                                                <div className="col-5 text-center">
                                                    <div className="d-flex justify-content-center mb-2">
                                                        <Escudo equipo={partidoSeleccionado.local} />
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {partidoSeleccionado.local?.nombre || 'Local'}
                                                    </div>
                                                    <div className="text-muted small">Local</div>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        inputMode="numeric"
                                                        className="form-control form-control-lg text-center mt-3 fw-bold"
                                                        value={golesLocal}
                                                        onChange={(e) => setGolesLocal(e.target.value)}
                                                        aria-label="Goles del equipo local"
                                                        required
                                                        disabled={guardando || partidoSeleccionado.estado_id === 3}
                                                    />
                                                </div>

                                                <div className="col-2 text-center">
                                                    <div className="fw-bold fs-4">:</div>
                                                </div>

                                                <div className="col-5 text-center">
                                                    <div className="d-flex justify-content-center mb-2">
                                                        <Escudo equipo={partidoSeleccionado.visitante} />
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {partidoSeleccionado.visitante?.nombre || 'Visitante'}
                                                    </div>
                                                    <div className="text-muted small">Visitante</div>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        inputMode="numeric"
                                                        className="form-control form-control-lg text-center mt-3 fw-bold"
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
                                                    value={nuevoEstado}
                                                    onChange={(e) => setNuevoEstado(e.target.value)}
                                                    required
                                                    disabled={guardando || partidoSeleccionado.estado_id === 3}
                                                >
                                                    <option value="2">EN JUEGO</option>
                                                    <option value="3">FINALIZADO</option>
                                                </select>
                                                <div className="form-text">
                                                    Usa «Finalizado» únicamente cuando el encuentro haya terminado.
                                                </div>
                                            </div>

                                            {nuevoEstado === '3' && partidoSeleccionado.estado_id !== 3 && (
                                                <div className="alert alert-warning small">
                                                    Al finalizar, el partido quedará cerrado para este módulo.
                                                    Verifica que el marcador sea correcto antes de guardar.
                                                </div>
                                            )}

                                            <div className="d-grid gap-2">
                                                <button
                                                    type="submit"
                                                    className={`btn ${partidoSeleccionado.estado_id === 3 ? 'btn-secondary' : 'btn-primary'} btn-lg`}
                                                    disabled={guardando || partidoSeleccionado.estado_id === 3}
                                                >
                                                    {partidoSeleccionado.estado_id === 3
                                                        ? 'Marcador Bloqueado (Finalizado)'
                                                        : guardando
                                                            ? 'Guardando...'
                                                            : 'Guardar resultado'}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={limpiarFormulario}
                                                    disabled={guardando}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
