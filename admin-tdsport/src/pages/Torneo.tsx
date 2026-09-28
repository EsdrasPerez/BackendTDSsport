import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import type { Confederacion, Pais, Catalogo, Torneo as TorneoType } from '../types/database';

export default function Torneo() {

    const navigate = useNavigate();
    const [torneos, setTorneos] = useState<TorneoType[]>([]);
    const [loading, setLoading] = useState(true);
    const [creando, setCreando] = useState(false);

    // CATÁLOGOS
    const [confederaciones, setConfederaciones] = useState<Confederacion[]>([]);
    const [paises, setPaises] = useState<Pais[]>([]);
    const [tipos, setTipos] = useState<Catalogo[]>([]);
    const [formatos, setFormatos] = useState<Catalogo[]>([]);
    const [temporadas, setTemporadas] = useState<Catalogo[]>([]);
    const [estados, setEstados] = useState<Catalogo[]>([]);

    // MODAL
    const [isModalOpen, setIsModalOpen] = useState(false);

    // FORMULARIO
    const [nombre, setNombre] = useState('');
    const [confederacionId, setConfederacionId] = useState('');
    const [paisId, setPaisId] = useState('');
    const [paisesSeleccionados, setPaisesSeleccionados] = useState<Pais[]>([]);
    const [tipoId, setTipoId] = useState('');
    const [formatoId, setFormatoId] = useState('');
    const [temporadaId, setTemporadaId] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [estadoId, setEstadoId] = useState('');
    const [numeroEquipos, setNumeroEquipos] = useState('');

    // FILTROS
    const [busqueda, setBusqueda] = useState('');
    const [filtroConfederacion, setFiltroConfederacion] = useState('');
    const [filtroPais, setFiltroPais] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroTemporada, setFiltroTemporada] = useState('');

    // EDITAR
    const [torneoEditando, setTorneoEditando] = useState<TorneoType | null>(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    // CARGAR TODOS LOS DATOS
    const cargarDatos = async () => {

        setLoading(true);

        try {

            const [
                torneosRes, confederacionesRes, paisesRes, tiposRes, formatosRes,
                temporadasRes, estadosRes
            ] = await Promise.all([
                supabase
                    .from('torneos')
                    .select(` id, nombre, pais_id, tipo_id, formato_id, temporada_id, fecha_inicio,
                        fecha_fin, estado_id, numero_equipos,
                        torneo_paises (
                            pais_id,
                            pais:paises ( id, nombre, codigo_iso,
                                confederacion:confederaciones ( id, nombre, codigo )
                            )
                        ),
                        tipo:tipos_torneo ( id, nombre ),
                        formato:formatos_torneo ( id, nombre ),
                        temporada:temporadas ( id, nombre ),
                        estado:estados_torneo ( id, nombre )
                    `)
                    .order('fecha_inicio', { ascending: false }),

                supabase
                    .from('confederaciones')
                    .select('*')
                    .order('nombre'),

                supabase
                    .from('paises')
                    .select('*')
                    .order('nombre'),

                supabase
                    .from('tipos_torneo')
                    .select('*')
                    .order('nombre'),

                supabase
                    .from('formatos_torneo')
                    .select('*')
                    .order('nombre'),

                supabase
                    .from('temporadas')
                    .select('*')
                    .order('nombre', { ascending: false }),

                supabase
                    .from('estados_torneo')
                    .select('*')
                    .order('id')
            ]);

            if (torneosRes.error) {
                console.error(torneosRes.error);
                alert('No se pudieron cargar los torneos.');
            } else {
                setTorneos((torneosRes.data || []) as TorneoType[]);
            }

            if (confederacionesRes.error) {
                console.error(confederacionesRes.error);
            } else {
                setConfederaciones(confederacionesRes.data || []);
            }

            if (paisesRes.error) {
                console.error(paisesRes.error);
            } else {
                setPaises(paisesRes.data || []);
            }

            if (tiposRes.error) {
                console.error(tiposRes.error);
            } else {
                setTipos(tiposRes.data || []);
            }

            if (formatosRes.error) {
                console.error(formatosRes.error);
            } else {
                setFormatos(formatosRes.data || []);
            }

            if (temporadasRes.error) {
                console.error(temporadasRes.error);
            } else {
                setTemporadas(temporadasRes.data || []);
            }

            if (estadosRes.error) {
                console.error(estadosRes.error);
            } else {
                setEstados(estadosRes.data || []);
            }

        } catch (error) {

            console.error('Error cargando datos:', error);
            alert('Ocurrió un error al cargar el módulo de torneos.');

        } finally {
            setLoading(false);

        }
    };

    // PAÍSES DEL FORMULARIO SEGÚN CONFEDERACIÓN
    const paisesDelFormulario = useMemo(() => {

        if (!confederacionId) {
            return [];
        }

        return paises.filter(
            pais => pais.confederacion_id === Number(confederacionId)
        );

    }, [paises, confederacionId]);

    // PAÍSES DEL FILTRO SEGÚN CONFEDERACIÓN
    const paisesDelFiltro = useMemo(() => {

        if (!filtroConfederacion) {
            return paises;
        }

        return paises.filter(
            pais => pais.confederacion_id === Number(filtroConfederacion)
        );

    }, [paises, filtroConfederacion]);

    // TORNEOS FILTRADOS
    const torneosFiltrados = useMemo(() => {

        return torneos.filter(torneo => {

            const coincideBusqueda =
                torneo.nombre
                    .toLowerCase()
                    .includes(busqueda.toLowerCase());

            const coincideConfederacion =
                !filtroConfederacion ||
                torneo.torneo_paises?.some(tp => tp.pais?.confederacion?.id === Number(filtroConfederacion));

            const coincidePais =
                !filtroPais ||
                torneo.torneo_paises?.some(tp => tp.pais_id === Number(filtroPais));

            const coincideEstado =
                !filtroEstado ||
                torneo.estado_id === Number(filtroEstado);

            const coincideTemporada =
                !filtroTemporada ||
                torneo.temporada_id === Number(filtroTemporada);

            return (
                coincideBusqueda &&
                coincideConfederacion &&
                coincidePais &&
                coincideEstado &&
                coincideTemporada
            );

        });

    }, [
        torneos,
        busqueda,
        filtroConfederacion,
        filtroPais,
        filtroEstado,
        filtroTemporada
    ]);

    // ESTADÍSTICAS
    const estadisticas = useMemo(() => {

        const buscarEstado = (nombreEstado: string) => {

            const estado = estados.find(
                e => e.nombre.toUpperCase() === nombreEstado.toUpperCase()
            );

            if (!estado) {
                return 0;
            }

            return torneos.filter(
                torneo => torneo.estado_id === estado.id
            ).length;
        };

        return {
            total: torneos.length,
            enCurso: buscarEstado('EN CURSO'),
            proximos: buscarEstado('PRÓXIMO'),
            finalizados: buscarEstado('FINALIZADO')
        };

    }, [torneos, estados]);

    // CAMBIAR CONFEDERACIÓN DEL FORMULARIO
    const handleConfederacionChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {

        setConfederacionId(e.target.value);
        setPaisId('');
    };

    // CAMBIAR CONFEDERACIÓN DEL FILTRO
    const handleFiltroConfederacion = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {

        setFiltroConfederacion(e.target.value);
        setFiltroPais('');

    }

    const abrirModalCrear = () => {

        limpiarFormulario();
        setTorneoEditando(null);
        setIsModalOpen(true);

    };

    const limpiarFormulario = () => {

        setNombre('');
        setConfederacionId('');
        setPaisId('');
        setPaisesSeleccionados([]);
        setTipoId('');
        setFormatoId('');
        setTemporadaId('');
        setFechaInicio('');
        setFechaFin('');
        setEstadoId('');
        setNumeroEquipos('');

    };

    // CREAR / EDITAR TORNEO
    const handleGuardarTorneo = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();
        if (!nombre.trim()) {
            alert('Ingresa el nombre del torneo.');
            return;
        }
        if (paisesSeleccionados.length === 0) {
            alert('Selecciona al menos un país.');
            return;
        }
        if (!tipoId) {
            alert('Selecciona el tipo de torneo.');
            return;
        }
        if (!formatoId) {
            alert('Selecciona el formato.');
            return;
        }
        if (!temporadaId) {
            alert('Selecciona la temporada.');
            return;
        }
        if (!fechaInicio || !fechaFin) {
            alert('Selecciona las fechas del torneo.');
            return;
        }
        if (new Date(fechaFin) < new Date(fechaInicio)) {
            alert('La fecha final no puede ser anterior a la fecha inicial.');
            return;
        }
        if (!numeroEquipos || Number(numeroEquipos) < 2) {
            alert('El torneo debe tener al menos 2 equipos.');
            return;
        }
        if (!estadoId) {
            alert('Selecciona el estado del torneo.');
            return;
        }

        // VALIDAR DUPLICADOS: nombre + temporada
        const torneoDuplicado = torneos.find(t => 
            t.nombre.trim().toLowerCase() === nombre.trim().toLowerCase() && 
            t.temporada_id === Number(temporadaId) &&
            t.id !== torneoEditando?.id
        );

        if (torneoDuplicado) {
            alert('Ya existe un torneo con ese nombre para la temporada seleccionada.');
            return;
        }

        setCreando(true);

        const datosTorneo = {
            nombre: nombre.trim(),
            pais_id: paisesSeleccionados.length > 0 ? paisesSeleccionados[0].id : null,
            tipo_id: Number(tipoId),
            formato_id: Number(formatoId),
            temporada_id: Number(temporadaId),
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            estado_id: Number(estadoId),
            numero_equipos: Number(numeroEquipos)
        };

        try {
            let torneoId = torneoEditando?.id;
            
            if (torneoEditando) {
                const { error } = await supabase
                    .from('torneos')
                    .update(datosTorneo)
                    .eq('id', torneoEditando.id);
                if (error) throw error;
                
                const { error: deleteError } = await supabase
                    .from('torneo_paises')
                    .delete()
                    .eq('torneo_id', torneoEditando.id);
                if (deleteError) throw deleteError;
                
            } else {
                const { data, error } = await supabase
                    .from('torneos')
                    .insert(datosTorneo)
                    .select()
                    .single();
                if (error) throw error;
                torneoId = data.id;
            }

            if (torneoId && paisesSeleccionados.length > 0) {
                const relaciones = paisesSeleccionados.map(pais => ({
                    torneo_id: torneoId,
                    pais_id: pais.id
                }));
                const { error } = await supabase
                    .from('torneo_paises')
                    .insert(relaciones);
                if (error) throw error;
            }

            alert(torneoEditando ? 'Torneo actualizado correctamente.' : 'Torneo creado correctamente.');
            
            limpiarFormulario();
            setTorneoEditando(null);
            setIsModalOpen(false);
            await cargarDatos();
        } catch (error: any) {

            console.error(error);

            alert(
                'No se pudo guardar el torneo: ' +
                (error?.message || 'Error desconocido')
            );

        } finally {

            setCreando(false);

        }

    };

    // EDITAR TORNEO
    const editarTorneo = (torneo: TorneoType) => {

        setTorneoEditando(torneo);
        setNombre(torneo.nombre);
        const paisesDelTorneo = torneo.torneo_paises?.map(tp => tp.pais).filter(Boolean) as Pais[] || [];
        setPaisesSeleccionados(paisesDelTorneo);
        setPaisId('');
        setTipoId(String(torneo.tipo_id));
        setFormatoId(String(torneo.formato_id));
        setTemporadaId(String(torneo.temporada_id));
        setFechaInicio(torneo.fecha_inicio);
        setFechaFin(torneo.fecha_fin);
        setEstadoId(String(torneo.estado_id));
        setNumeroEquipos(String(torneo.numero_equipos));

        if (paisesDelTorneo.length > 0 && paisesDelTorneo[0].confederacion_id) {
            setConfederacionId(String(paisesDelTorneo[0].confederacion_id));
        } else {
            setConfederacionId('');
        }
        setIsModalOpen(true);
    };

    // ELIMINAR TORNEO
    const eliminarTorneo = async (torneo: TorneoType) => {
        const confirmar = window.confirm(
            `¿Estás seguro de eliminar "${torneo.nombre}"?\n\n` +
            'Esta acción puede afectar partidos y quinielas relacionadas.'
        );
        if (!confirmar) {
            return;
        }
        try {
            const { error } = await supabase
                .from('torneos')
                .delete()
                .eq('id', torneo.id);
            if (error) {
                throw error;
            }
            alert('Torneo eliminado.');
            await cargarDatos();
        } catch (error: any) {
            console.error(error);
            alert(
                'No se pudo eliminar el torneo: ' +
                (error?.message || 'Error desconocido')
            );
        }
    };

    // LIMPIAR FILTROS
    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroConfederacion('');
        setFiltroPais('');
        setFiltroEstado('');
        setFiltroTemporada('');

    };

    // BADGE DE ESTADO
    const obtenerClaseEstado = (nombreEstado?: string) => {
        switch (nombreEstado?.toUpperCase()) {
            case 'EN CURSO':
                return 'bg-success-subtle text-success';
            case 'PRÓXIMO':
            case 'PROXIMO':
                return 'bg-primary-subtle text-primary';
            case 'FINALIZADO':
                return 'bg-secondary-subtle text-secondary';
            case 'SUSPENDIDO':
                return 'bg-warning-subtle text-warning';
            case 'CANCELADO':
                return 'bg-danger-subtle text-danger';
            default:
                return 'bg-light text-dark';
        }
    };

    return (

        <div className="container-fluid py-4 bg-light min-vh-100">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h1 className="h3 mb-1 fw-bold text-dark">
                        Gestión de Torneos
                    </h1>
                    <p className="text-muted mb-0">
                        Administra competencias, temporadas, equipos y estados.
                    </p>
                </div>
                <button
                    onClick={abrirModalCrear}
                    className="btn btn-success d-flex align-items-center gap-2 fw-bold shadow-sm">
                    <span className="material-symbols-outlined">
                        add
                    </span>
                    Nuevo torneo
                </button>
            </div>

            {/* ESTADÍSTICAS */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <small className="text-muted">
                                        Total de torneos
                                    </small>
                                    <h3 className="fw-bold mb-0 mt-1">
                                        {estadisticas.total}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <small className="text-muted">
                                        En curso
                                    </small>
                                    <h3 className="fw-bold mb-0 mt-1">
                                        {estadisticas.enCurso}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <small className="text-muted">
                                        Finalizados
                                    </small>
                                    <h3 className="fw-bold mb-0 mt-1">
                                        {estadisticas.finalizados}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <small className="text-muted">
                                        Próximos
                                    </small>
                                    <h3 className="fw-bold mb-0 mt-1">
                                        {estadisticas.proximos}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* ================================================== */}
            {/* FILTROS */}
            {/* ================================================== */}

            <div className="card border-0 shadow-sm mb-4">

                <div className="card-body">

                    <div className="row g-3">

                        {/* BÚSQUEDA */}

                        <div className="col-12 col-lg-4">

                            <label className="form-label small fw-bold">
                                Buscar torneo
                            </label>

                            <div className="input-group">

                                <span className="input-group-text bg-white">
                                    <span className="material-symbols-outlined">
                                        search
                                    </span>
                                </span>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ej. Premier League..."
                                    value={busqueda}
                                    onChange={(e) =>
                                        setBusqueda(e.target.value)
                                    }
                                />

                            </div>

                        </div>


                        {/* CONFEDERACIÓN */}

                        <div className="col-12 col-md-6 col-lg-2">

                            <label className="form-label small fw-bold">
                                Confederación
                            </label>

                            <select
                                className="form-select"
                                value={filtroConfederacion}
                                onChange={handleFiltroConfederacion}>

                                <option value="">
                                    Todas
                                </option>

                                {confederaciones.map(conf => (
                                    <option
                                        key={conf.id}
                                        value={conf.id}>
                                        {conf.codigo}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* PAÍS */}
                        <div className="col-12 col-md-6 col-lg-2">
                            <label className="form-label small fw-bold">País</label>
                            <select
                                className="form-select"
                                value={filtroPais}
                                onChange={(e) =>
                                    setFiltroPais(e.target.value)
                                }>
                                <option value="">Todos</option>
                                {paisesDelFiltro.map(pais => (
                                    <option
                                        key={pais.id}
                                        value={pais.id}>
                                        {pais.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ESTADO */}
                        <div className="col-12 col-md-6 col-lg-2">
                            <label className="form-label small fw-bold">Estado</label>
                            <select
                                className="form-select"
                                value={filtroEstado}
                                onChange={(e) =>
                                    setFiltroEstado(e.target.value)
                                }>
                                <option value="">Todos</option>
                                {estados.map(estado => (
                                    <option
                                        key={estado.id}
                                        value={estado.id}>
                                        {estado.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>


                        {/* TEMPORADA */}
                        <div className="col-12 col-md-6 col-lg-2">
                            <label className="form-label small fw-bold">Temporada</label>
                            <select
                                className="form-select"
                                value={filtroTemporada}
                                onChange={(e) =>
                                    setFiltroTemporada(e.target.value)
                                }>
                                <option value="">Todas</option>
                                {temporadas.map(temporada => (
                                    <option
                                        key={temporada.id}
                                        value={temporada.id}>
                                        {temporada.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                        <small className="text-muted">
                            Mostrando {torneosFiltrados.length} de {torneos.length} torneos
                        </small>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={limpiarFiltros}
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLA */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-1 fw-bold">
                                Torneos registrados
                            </h5>
                            <small className="text-muted">
                                Administra las competencias disponibles para las quinielas.
                            </small>
                        </div>
                        <span className="badge bg-light text-dark border">
                            {torneosFiltrados.length} registros
                        </span>
                    </div>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="px-4 py-3">
                                        Torneo
                                    </th>

                                    <th className="py-3">
                                        País
                                    </th>

                                    <th className="py-3">
                                        Confederación
                                    </th>

                                    <th className="py-3">
                                        Temporada
                                    </th>

                                    <th className="py-3 text-center">
                                        Equipos
                                    </th>

                                    <th className="py-3">
                                        Estado
                                    </th>

                                    <th className="px-4 py-3 text-end">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <div className="spinner-border text-success" role="status" />

                                            <div className="text-muted mt-2">
                                                Cargando torneos...
                                            </div>
                                        </td>
                                    </tr>
                                ) : torneosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <span className="material-symbols-outlined text-muted fs-1">
                                                search_off
                                            </span>

                                            <h6 className="fw-bold mt-2">
                                                No se encontraron torneos
                                            </h6>

                                            <p className="text-muted mb-3">
                                                Prueba modificando los filtros.
                                            </p>

                                            <button className="btn btn-outline-secondary btn-sm" onClick={limpiarFiltros}>Limpiar filtros</button>
                                        </td>
                                    </tr>

                                ) : (

                                    torneosFiltrados.map(torneo => (
                                        <tr key={torneo.id}>

                                            {/* TORNEO */}
                                            <td className="px-4 py-3">
                                                <div className="d-flex align-items-center gap-3"><div>

                                                    <div className="fw-bold text-dark">
                                                        {torneo.nombre}
                                                    </div>

                                                    <small className="text-muted">
                                                        {torneo.tipo?.nombre || 'Sin tipo'}
                                                        {' · '}
                                                        {torneo.formato?.nombre || 'Sin formato'}
                                                    </small>
                                                </div>
                                                </div>
                                            </td>


                                            {/* PAÍS */}
                                            <td>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {torneo.torneo_paises && torneo.torneo_paises.length > 0 
                                                        ? torneo.torneo_paises.map(tp => (
                                                            <span key={tp.pais_id} className="badge bg-light text-dark border">
                                                                {tp.pais?.nombre}
                                                            </span>
                                                        ))
                                                        : '-'}
                                                </div>
                                            </td>

                                            {/* CONFEDERACIÓN */}
                                            <td>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {torneo.torneo_paises && torneo.torneo_paises.length > 0
                                                        ? Array.from(new Set(torneo.torneo_paises.map(tp => tp.pais?.confederacion?.codigo))).map(codigo => (
                                                            codigo && <span key={codigo} className="badge bg-light text-dark border">{codigo}</span>
                                                        ))
                                                        : '-'}
                                                </div>
                                            </td>

                                            {/* TEMPORADA */}
                                            <td>
                                                <span className="fw-semibold">{torneo.temporada?.nombre || '-'}</span>
                                            </td>

                                            {/* EQUIPOS */}
                                            <td className="text-center">
                                                <span className="badge bg-light text-dark border">{torneo.numero_equipos}</span>
                                            </td>

                                            {/* ESTADO */}
                                            <td>
                                                <span className={`badge rounded-pill px-3 py-2 ${obtenerClaseEstado(torneo.estado?.nombre)}`}>{torneo.estado?.nombre || 'SIN ESTADO'}</span>
                                            </td>

                                            {/* ACCIONES */}
                                            <td className="px-4 text-end">
                                                <div className="d-flex justify-content-end gap-1">
                                                    <button className="btn btn-sm btn-outline-primary" title="Administrar partidos"
                                                        onClick={() => navigate(`/partidos?torneo_id=${torneo.id}`)}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendario</span>
                                                    </button>

                                                    <button className="btn btn-sm btn-outline-secondary" title="Editar torneo" onClick={() => editarTorneo(torneo)}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>editar</span>
                                                    </button>

                                                    <button className="btn btn-sm btn-outline-danger" title="Eliminar torneo" onClick={() => eliminarTorneo(torneo)}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>Eliminar</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL CREAR / EDITAR */}
            {isModalOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{
                        zIndex: 1050,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        overflowY: 'auto',
                        padding: '20px'
                    }}>

                    <div
                        className="card shadow-lg border-0"
                        style={{
                            width: '100%',
                            maxWidth: '800px'
                        }}>

                        {/* HEADER */}
                        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                            <div>
                                <h4 className="mb-1 fw-bold">
                                    {torneoEditando
                                        ? 'Editar torneo'
                                        : 'Nuevo torneo'}
                                </h4>

                                <small className="text-muted">
                                    Completa la información de la competición.
                                </small>
                            </div>

                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setIsModalOpen(false)} />
                        </div>

                        {/* BODY */}
                        <div className="card-body p-4">
                            <form onSubmit={handleGuardarTorneo}>

                                {/* INFORMACIÓN GENERAL */}
                                <h6 className="fw-bold mb-3">
                                    Información general
                                </h6>
                                <div className="row g-3 mb-4">

                                    {/* NOMBRE */}
                                    <div className="col-12">
                                        <label className="form-label fw-bold">
                                            Nombre del torneo
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ej. Premier League"
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            required />
                                    </div>

                                    {/* CONFEDERACIÓN */}
                                    <div className="col-md-6">

                                        <label className="form-label fw-bold">Confederación</label>

                                        <select
                                            className="form-select"
                                            value={confederacionId}
                                            onChange={handleConfederacionChange}
                                            required>

                                            <option value="">
                                                Seleccionar confederación
                                            </option>
                                            {confederaciones.map(conf => (
                                                <option
                                                    key={conf.id}
                                                    value={conf.id}>
                                                    {conf.codigo} — {conf.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* PAÍS */}

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Agregar País</label>
                                        <div className="d-flex gap-2">
                                            <select
                                                className="form-select"
                                                value={paisId}
                                                onChange={(e) => setPaisId(e.target.value)}
                                                disabled={!confederacionId}>
                                                <option value="">{!confederacionId ? 'Primero selecciona una confederación' : 'Seleccionar país...'}</option>
                                                {paisesDelFormulario.map(pais => (
                                                    <option key={pais.id} value={pais.id}>{pais.nombre}</option>
                                                ))}
                                            </select>
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-success text-nowrap"
                                                disabled={!paisId}
                                                onClick={() => {
                                                    const pais = paises.find(p => p.id === Number(paisId));
                                                    if (pais && !paisesSeleccionados.some(p => p.id === pais.id)) {
                                                        setPaisesSeleccionados([...paisesSeleccionados, pais]);
                                                    }
                                                    setPaisId('');
                                                }}
                                            >
                                                Añadir
                                            </button>
                                        </div>
                                        
                                        <div className="mt-3">
                                            {paisesSeleccionados.length > 0 ? (
                                                <div className="d-flex flex-wrap gap-2">
                                                    {paisesSeleccionados.map(pais => (
                                                        <span key={pais.id} className="badge bg-light text-dark border d-flex align-items-center gap-1 p-2">
                                                            {pais.nombre}
                                                            <button 
                                                                type="button" 
                                                                className="btn-close" 
                                                                style={{ fontSize: '0.65rem' }}
                                                                onClick={() => setPaisesSeleccionados(paisesSeleccionados.filter(p => p.id !== pais.id))}
                                                            />
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <small className="text-muted">No hay países seleccionados</small>
                                            )}
                                        </div>
                                    </div>
                                </div>


                                {/* COMPETICIÓN */}
                                <h6 className="fw-bold mb-3">Configuración de la competición</h6>
                                <div className="row g-3 mb-4">

                                    {/* TIPO */}
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Tipo</label>
                                        <select
                                            className="form-select"
                                            value={tipoId}
                                            onChange={(e) =>
                                                setTipoId(e.target.value)
                                            }
                                            required>
                                            <option value="">Seleccionar</option>
                                            {tipos.map(tipo => (
                                                <option
                                                    key={tipo.id}
                                                    value={tipo.id}>
                                                    {tipo.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>


                                    {/* FORMATO */}
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Formato</label>

                                        <select
                                            className="form-select"
                                            value={formatoId}
                                            onChange={(e) =>
                                                setFormatoId(e.target.value)
                                            }
                                            required>

                                            <option value="">Seleccionar</option>

                                            {formatos.map(formato => (

                                                <option
                                                    key={formato.id}
                                                    value={formato.id}>
                                                    {formato.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* TEMPORADA */}
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Temporada</label>

                                        <select
                                            className="form-select"
                                            value={temporadaId}
                                            onChange={(e) =>
                                                setTemporadaId(e.target.value)
                                            }
                                            required>

                                            <option value="">Seleccionar</option>

                                            {temporadas.map(temporada => (
                                                <option
                                                    key={temporada.id}
                                                    value={temporada.id}>
                                                    {temporada.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* FECHAS */}
                                <h6 className="fw-bold mb-3">Duración del torneo</h6>
                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Fecha de inicio</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={fechaInicio}
                                            onChange={(e) =>
                                                setFechaInicio(e.target.value)
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Fecha de finalización</label>

                                        <input
                                            type="date"
                                            className="form-control"
                                            value={fechaFin}
                                            onChange={(e) =>
                                                setFechaFin(e.target.value)
                                            }
                                            required />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Número de equipos</label>

                                        <input
                                            type="number"
                                            min="2"
                                            className="form-control"
                                            placeholder="Ej. 20"
                                            value={numeroEquipos}
                                            onChange={(e) =>
                                                setNumeroEquipos(e.target.value)
                                            }
                                            required />
                                    </div>
                                </div>

                                {/* ESTADO */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Estado del torneo</label>

                                    <select
                                        className="form-select"
                                        value={estadoId}
                                        onChange={(e) =>
                                            setEstadoId(e.target.value)
                                        }
                                        required>
                                        <option value="">Seleccionar estado</option>
                                        {estados.map(estado => (
                                            <option
                                                key={estado.id}
                                                value={estado.id}>
                                                {estado.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* BOTONES */}
                                <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                                    <button
                                        type="button"
                                        className="btn btn-light fw-bold"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            setTorneoEditando(null);
                                        }}>Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success fw-bold px-4"
                                        disabled={creando}>
                                        {creando ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined align-middle me-1">save</span>
                                                {torneoEditando ? 'Actualizar torneo' : 'Crear torneo'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
