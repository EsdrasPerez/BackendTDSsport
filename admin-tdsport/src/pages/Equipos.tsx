import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

interface Pais {
    id: number;
    nombre: string;
    codigo_iso?: string;
}

interface Torneo {
    id: string;
    nombre: string;
}

interface Equipo {
    id: string;
    nombre: string;
    pais_id: number | null;
    escudo_url: string | null;
    pais?: Pais | null;
}

interface EquipoDBResponse extends Omit<Equipo, 'pais'> {
    pais?: Pais | Pais[] | null;
}

interface TorneoEquipo {
    torneo_id: string;
    equipo_id: string;
}

interface EquipoConTorneos extends Equipo {
    torneos: Torneo[];
}

export default function Equipos() {

    // DATOS
    const [equipos, setEquipos] = useState<EquipoConTorneos[]>([]);
    const [paises, setPaises] = useState<Pais[]>([]);
    const [torneos, setTorneos] = useState<Torneo[]>([]);

    // ESTADOS
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [eliminando, setEliminando] = useState(false);

    const [busqueda, setBusqueda] = useState('');
    const [paisFiltro, setPaisFiltro] = useState('');

    const [mostrarModal, setMostrarModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);

    // FORMULARIO
    const [equipoId, setEquipoId] = useState('');
    const [nombre, setNombre] = useState('');
    const [paisId, setPaisId] = useState('');

    const [torneosSeleccionados, setTorneosSeleccionados] = useState<string[]>(
        []
    );

    const [archivoEscudo, setArchivoEscudo] = useState<File | null>(null);
    const [escudoPreview, setEscudoPreview] = useState<string | null>(null);
    const [escudoActual, setEscudoActual] = useState<string | null>(null);

    // MODAL ELIMINA
    const [equipoEliminar, setEquipoEliminar] =
        useState<EquipoConTorneos | null>(null);

    // CARGAR DATOS
    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const [
                { data: dataEquipos, error: errorEquipos },
                { data: dataPaises, error: errorPaises },
                { data: dataTorneos, error: errorTorneos },
                { data: dataRelaciones, error: errorRelaciones },
            ] = await Promise.all([
                supabase
                    .from('equipos')
                    .select(`
            id,
            nombre,
            pais_id,
            escudo_url,
            pais:paises!equipos_pais_fk (
              id,
              nombre,
              codigo_iso
            )
          `)
                    .order('nombre'),

                supabase
                    .from('paises')
                    .select('id, nombre, codigo_iso')
                    .order('nombre'),

                supabase
                    .from('torneos')
                    .select('id, nombre')
                    .order('nombre'),

                supabase
                    .from('torneo_equipos')
                    .select('torneo_id, equipo_id'),
            ]);

            if (errorEquipos) {
                console.error('Error equipos:', errorEquipos);
                throw errorEquipos;
            }

            if (errorPaises) {
                console.error('Error países:', errorPaises);
                throw errorPaises;
            }

            if (errorTorneos) {
                console.error('Error torneos:', errorTorneos);
                throw errorTorneos;
            }

            if (errorRelaciones) {
                console.error('Error torneo_equipos:', errorRelaciones);
                throw errorRelaciones;
            }

            const relaciones =
                (dataRelaciones as TorneoEquipo[] | null) ?? [];

            const equiposProcesados: EquipoConTorneos[] = (
                (dataEquipos as unknown as EquipoDBResponse[]) ?? []
            ).map((equipo) => {
                const relacionesEquipo = relaciones.filter(
                    (relacion) => relacion.equipo_id === equipo.id
                );

                const torneosEquipo =
                    ((dataTorneos as Torneo[]) ?? []).filter((torneo) =>
                        relacionesEquipo.some(
                            (relacion) => relacion.torneo_id === torneo.id
                        )
                    );

                const paisNormalizado: Pais | null = Array.isArray(equipo.pais)
                    ? (equipo.pais[0] ?? null)
                    : (equipo.pais ?? null);

                return {
                    ...equipo,
                    pais: paisNormalizado,
                    torneos: torneosEquipo,
                };
            });

            setEquipos(equiposProcesados);
            setPaises((dataPaises as Pais[]) ?? []);
            setTorneos((dataTorneos as Torneo[]) ?? []);
        } catch (error: any) {
            console.error(error);

            alert(
                'No fue posible cargar los datos: ' +
                (error?.message || 'Error desconocido')
            );
        } finally {
            setLoading(false);
        }
    };

    // FILTROS
    const equiposFiltrados = useMemo(() => {
        const texto = busqueda.toLowerCase().trim();

        return equipos.filter((equipo) => {
            const coincideBusqueda =
                !texto ||
                equipo.nombre.toLowerCase().includes(texto) ||
                equipo.pais?.nombre?.toLowerCase().includes(texto);

            const coincidePais =
                !paisFiltro || String(equipo.pais_id) === paisFiltro;

            return coincideBusqueda && coincidePais;
        });
    }, [equipos, busqueda, paisFiltro]);

    // ABRIR NUEVO
    const abrirNuevoEquipo = () => {
        setModoEdicion(false);

        setEquipoId('');
        setNombre('');
        setPaisId('');
        setTorneosSeleccionados([]);

        setArchivoEscudo(null);
        setEscudoPreview(null);
        setEscudoActual(null);

        setMostrarModal(true);
    };

    // ABRIR EDITAR
    const abrirEditarEquipo = (equipo: EquipoConTorneos) => {
        setModoEdicion(true);

        setEquipoId(equipo.id);
        setNombre(equipo.nombre);
        setPaisId(equipo.pais_id ? String(equipo.pais_id) : '');

        setTorneosSeleccionados(equipo.torneos.map((torneo) => torneo.id));

        setArchivoEscudo(null);
        setEscudoPreview(null);
        setEscudoActual(equipo.escudo_url);

        setMostrarModal(true);
    };

    // CERRAR MODAL
    const cerrarModal = () => {
        if (guardando) return;

        setMostrarModal(false);

        setEquipoId('');
        setNombre('');
        setPaisId('');
        setTorneosSeleccionados([]);

        setArchivoEscudo(null);
        setEscudoPreview(null);
        setEscudoActual(null);
    };

    // SELECCIONAR ESCUDO
    const manejarArchivoEscudo = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const archivo = e.target.files?.[0];

        if (!archivo) return;

        // Validar tipo
        if (!archivo.type.startsWith('image/')) {
            alert('Seleccione un archivo de imagen válido.');
            return;
        }

        // Validar tamaño: 2 MB
        if (archivo.size > 2 * 1024 * 1024) {
            alert('El escudo no puede superar los 2 MB.');
            return;
        }

        setArchivoEscudo(archivo);

        const url = URL.createObjectURL(archivo);
        setEscudoPreview(url);
    };

    // TOGGLE TORNEO
    const cambiarTorneo = (torneoId: string) => {
        setTorneosSeleccionados((actuales) => {
            if (actuales.includes(torneoId)) {
                return actuales.filter((id) => id !== torneoId);
            }

            return [...actuales, torneoId];
        });
    };

    // SUBIR ESCUDO
    const subirEscudo = async (): Promise<string | null> => {
        if (!archivoEscudo) {
            return escudoActual;
        }

        const extension =
            archivoEscudo.name.split('.').pop()?.toLowerCase() || 'png';

        const nombreArchivo = `${crypto.randomUUID()}.${extension}`;

        const ruta = `equipos/${nombreArchivo}`;

        const { error: errorUpload } = await supabase.storage
            .from('escudos')
            .upload(ruta, archivoEscudo, {
                cacheControl: '3600',
                upsert: false,
            });

        if (errorUpload) {
            console.error(errorUpload);
            throw new Error(
                'No fue posible subir el escudo: ' + errorUpload.message
            );
        }

        const { data } = supabase.storage
            .from('escudos')
            .getPublicUrl(ruta);

        return data.publicUrl;
    };

    // GUARDAR EQUIPO
    const guardarEquipo = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre.trim()) {
            alert('Ingrese el nombre del equipo.');
            return;
        }

        if (!paisId) {
            alert('Seleccione el país del equipo.');
            return;
        }

        setGuardando(true);

        try {
            // SUBIR ESCUDO
            const escudoUrl = await subirEscudo();

            let idEquipo = equipoId;

            // CREAR
            if (!modoEdicion) {
                const { data, error } = await supabase
                    .from('equipos')
                    .insert({
                        nombre: nombre.trim(),
                        pais_id: Number(paisId),
                        escudo_url: escudoUrl,
                    })
                    .select('id')
                    .single();

                if (error) {
                    console.error(error);
                    throw error;
                }

                idEquipo = data.id;
            }

            // EDITAR
            else {
                const { error } = await supabase
                    .from('equipos')
                    .update({
                        nombre: nombre.trim(),
                        pais_id: Number(paisId),
                        escudo_url: escudoUrl,
                    })
                    .eq('id', equipoId);

                if (error) {
                    console.error(error);
                    throw error;
                }

                const { error: errorEliminarRelaciones } = await supabase
                    .from('torneo_equipos')
                    .delete()
                    .eq('equipo_id', equipoId);

                if (errorEliminarRelaciones) {
                    console.error(errorEliminarRelaciones);
                    throw errorEliminarRelaciones;
                }
            }

            // CREAR RELACIONES TORNEO-EQUIPO
            if (torneosSeleccionados.length > 0) {
                const relaciones = torneosSeleccionados.map((torneoId) => ({
                    torneo_id: torneoId,
                    equipo_id: idEquipo,
                }));

                const { error: errorRelaciones } = await supabase
                    .from('torneo_equipos')
                    .insert(relaciones);

                if (errorRelaciones) {
                    console.error(errorRelaciones);
                    throw errorRelaciones;
                }
            }

            alert(
                modoEdicion
                    ? 'Equipo actualizado correctamente.'
                    : 'Equipo creado correctamente.'
            );

            cerrarModal();

            await cargarDatos();
        } catch (error: any) {
            console.error(error);

            alert(
                'No fue posible guardar el equipo: ' +
                (error?.message || 'Error desconocido')
            );
        } finally {
            setGuardando(false);
        }
    };

    // PREPARAR ELIMINACIÓN
    const confirmarEliminar = (equipo: EquipoConTorneos) => {
        setEquipoEliminar(equipo);
    };

    // ELIMINAR EQUIPO
    const eliminarEquipo = async () => {
        if (!equipoEliminar) return;

        setEliminando(true);

        try {
            // Primero comprobamos si tiene partidos
            const { data: partidos, error: errorPartidos } = await supabase
                .from('partidos')
                .select('id')
                .or(
                    `local_id.eq.${equipoEliminar.id},visitante_id.eq.${equipoEliminar.id}`
                )
                .limit(1);

            if (errorPartidos) {
                throw errorPartidos;
            }

            if (partidos && partidos.length > 0) {
                alert(
                    'No se puede eliminar este equipo porque ya tiene partidos registrados.'
                );

                setEquipoEliminar(null);
                return;
            }

            // Eliminar relaciones torneo-equipo
            const { error: errorRelaciones } = await supabase
                .from('torneo_equipos')
                .delete()
                .eq('equipo_id', equipoEliminar.id);

            if (errorRelaciones) {
                throw errorRelaciones;
            }

            // Eliminar equipo
            const { error: errorEquipo } = await supabase
                .from('equipos')
                .delete()
                .eq('id', equipoEliminar.id);

            if (errorEquipo) {
                throw errorEquipo;
            }

            alert('Equipo eliminado correctamente.');

            setEquipoEliminar(null);

            await cargarDatos();
        } catch (error: any) {
            console.error(error);

            alert(
                'No fue posible eliminar el equipo: ' +
                (error?.message || 'Error desconocido')
            );
        } finally {
            setEliminando(false);
        }
    };

    // ESTADÍSTICAS
    const totalEquipos = equipos.length;

    const equiposConEscudo = equipos.filter(
        (equipo) => equipo.escudo_url
    ).length;

    const equiposSinEscudo = totalEquipos - equiposConEscudo;

    // RENDER
    return (
        <div className="container-fluid py-4 bg-light min-vh-100">

            {/* ========================= */}
            {/* ENCABEZADO */}
            {/* ========================= */}

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

                <div>
                    <h1 className="h3 fw-bold text-dark mb-1">
                        Gestión de Equipos
                    </h1>

                    <p className="text-secondary mb-0">
                        Administra los equipos, países, escudos y torneos.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary px-4"
                    onClick={abrirNuevoEquipo}
                >
                    <span className="me-2">+</span>
                    Nuevo equipo
                </button>

            </div>

            {/* ========================= */}
            {/* ESTADÍSTICAS */}
            {/* ========================= */}

            <div className="row g-3 mb-4">

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">

                                <div>
                                    <p className="text-secondary mb-1">
                                        Total de equipos
                                    </p>

                                    <h3 className="fw-bold mb-0">
                                        {totalEquipos}
                                    </h3>
                                </div>

                                <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 50, height: 50 }}>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">

                                <div>
                                    <p className="text-secondary mb-1">Con escudo</p>
                                    <h3 className="fw-bold mb-0 text-success">{equiposConEscudo}</h3>
                                </div>

                                <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 50, height: 50 }}>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">

                                <div>
                                    <p className="text-secondary mb-1">Sin escudo</p>
                                    <h3 className="fw-bold mb-0 text-warning">{equiposSinEscudo}</h3>
                                </div>

                                <div className="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 50, height: 50 }}>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* ========================= */}
            {/* FILTROS */}
            {/* ========================= */}

            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">

                    <div className="row g-3">

                        <div className="col-12 col-lg-8">

                            <label className="form-label fw-semibold">Buscar equipo</label>

                            <div className="input-group">

                                <span className="input-group-text"></span>

                                <input type="text" className="form-control" placeholder="Buscar por nombre o país..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

                            </div>

                        </div>

                        <div className="col-12 col-lg-4">

                            <label className="form-label fw-semibold">Filtrar por país</label>

                            <select className="form-select" value={paisFiltro} onChange={(e) => setPaisFiltro(e.target.value)}>

                                <option value="">Todos los países</option>

                                {paises.map((pais) => (
                                    <option key={pais.id} value={pais.id}>{pais.nombre}</option>
                                ))}

                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================= */}
            {/* TABLA */}
            {/* ========================= */}

            <div className="card border-0 shadow-sm">

                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary mb-3" role="status" />
                            <p className="text-secondary mb-0">Cargando equipos...</p>
                        </div>

                    ) : equiposFiltrados.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="display-5 mb-3"></div>
                            <h5 className="fw-bold">No se encontraron equipos</h5>
                            <p className="text-secondary">Prueba cambiando los filtros o registra un nuevo equipo.</p>
                            <button className="btn btn-primary" onClick={abrirNuevoEquipo}>Registrar equipo</button>
                        </div>
                    ) : (

                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="px-4">Escudo</th>
                                        <th>Equipo</th>
                                        <th>País</th>
                                        <th>Torneos</th>
                                        <th className="text-end px-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>

                                    {equiposFiltrados.map((equipo) => (

                                        <tr key={equipo.id}>
                                            {/* ESCUDO */}
                                            <td className="px-4">
                                                {equipo.escudo_url ? (
                                                    <img
                                                        src={equipo.escudo_url}
                                                        alt={`Escudo de ${equipo.nombre}`}
                                                        style={{
                                                            width: 52,
                                                            height: 52,
                                                            objectFit: 'contain',
                                                        }}
                                                        className="rounded"
                                                    />
                                                ) : (

                                                    <div
                                                        className="bg-light border rounded d-flex align-items-center justify-content-center text-secondary"
                                                        style={{
                                                            width: 52,
                                                            height: 52,
                                                        }}>
                                                    </div>

                                                )}

                                            </td>

                                            {/* NOMBRE */}

                                            <td>
                                                <div className="fw-bold text-dark">
                                                    {equipo.nombre}
                                                </div>

                                                <small className="text-secondary">
                                                    ID: {equipo.id.substring(0, 8)}...
                                                </small>
                                            </td>

                                            {/* PAÍS */}

                                            <td>
                                                {equipo.pais ? (
                                                    <span className="badge bg-light text-dark border">
                                                        {equipo.pais.nombre}
                                                    </span>
                                                ) : (

                                                    <span className="text-secondary">
                                                        Sin país
                                                    </span>

                                                )}

                                            </td>

                                            {/* TORNEOS */}
                                            <td>
                                                {equipo.torneos.length === 0 ? (
                                                    <span className="badge bg-secondary">
                                                        Sin torneos
                                                    </span>

                                                ) : (

                                                    <div className="d-flex flex-wrap gap-1">
                                                        {equipo.torneos.slice(0, 3).map((torneo) => (
                                                            <span
                                                                key={torneo.id}
                                                                className="badge bg-primary">
                                                                {torneo.nombre}
                                                            </span>

                                                        ))}

                                                        {equipo.torneos.length > 3 && (
                                                            <span className="badge bg-light text-dark border">
                                                                +{equipo.torneos.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* ACCIONES */}
                                            <td className="text-end px-4">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() =>
                                                            abrirEditarEquipo(equipo)
                                                        }>
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() =>
                                                            confirmarEliminar(equipo)
                                                        }>
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {!loading && equiposFiltrados.length > 0 && (
                    <div className="card-footer bg-white border-top">
                        <small className="text-secondary">
                            Mostrando {equiposFiltrados.length} de{' '}
                            {equipos.length} equipos
                        </small>
                    </div>
                )}
            </div>

            {/* ================================================= */}
            {/* MODAL CREAR / EDITAR */}
            {/* ================================================= */}

            {mostrarModal && (
                <div
                    className="modal d-block"
                    tabIndex={-1}
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                    }}>

                    <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                        <div className="modal-content">

                            {/* HEADER */}
                            <div className="modal-header">
                                <div>
                                    <h5 className="modal-title fw-bold">
                                        {modoEdicion
                                            ? 'Editar equipo'
                                            : 'Nuevo equipo'}
                                    </h5>

                                    <small className="text-secondary">
                                        Registra la información del equipo.
                                    </small>
                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={cerrarModal}
                                    disabled={guardando}
                                />

                            </div>

                            {/* FORMULARIO */}

                            <form onSubmit={guardarEquipo}>

                                <div className="modal-body">

                                    {/* INFORMACIÓN GENERAL */}

                                    <div className="mb-4">

                                        <h6 className="fw-bold border-bottom pb-2">
                                            Información general
                                        </h6>

                                        <div className="row g-3">

                                            <div className="col-12 col-md-7">

                                                <label className="form-label fw-semibold">
                                                    Nombre del equipo *
                                                </label>

                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Ej. Real Madrid"
                                                    value={nombre}
                                                    onChange={(e) =>
                                                        setNombre(e.target.value)
                                                    }
                                                    required
                                                />

                                            </div>

                                            <div className="col-12 col-md-5">

                                                <label className="form-label fw-semibold">
                                                    País *
                                                </label>

                                                <select
                                                    className="form-select"
                                                    value={paisId}
                                                    onChange={(e) =>
                                                        setPaisId(e.target.value)
                                                    }
                                                    required
                                                >

                                                    <option value="">
                                                        Seleccione un país...
                                                    </option>

                                                    {paises.map((pais) => (

                                                        <option
                                                            key={pais.id}
                                                            value={pais.id}
                                                        >
                                                            {pais.nombre}
                                                        </option>

                                                    ))}

                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ESCUDO */}

                                    <div className="mb-4">

                                        <h6 className="fw-bold border-bottom pb-2">
                                            Escudo del equipo
                                        </h6>

                                        <div className="row align-items-center g-4">

                                            <div className="col-12 col-md-4 text-center">

                                                {escudoPreview || escudoActual ? (

                                                    <img
                                                        src={
                                                            escudoPreview ||
                                                            escudoActual ||
                                                            ''
                                                        }
                                                        alt="Vista previa del escudo"
                                                        className="border rounded p-2 bg-white"
                                                        style={{
                                                            width: 150,
                                                            height: 150,
                                                            objectFit: 'contain',
                                                        }}
                                                    />

                                                ) : (

                                                    <div
                                                        className="border rounded bg-light d-flex align-items-center justify-content-center mx-auto"
                                                        style={{
                                                            width: 150,
                                                            height: 150,
                                                        }}
                                                    >

                                                        <div className="text-center text-secondary">

                                                            <div className="display-5">
                                                            </div>

                                                            <small>
                                                                Sin escudo
                                                            </small>
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                            <div className="col-12 col-md-8">
                                                <label className="form-label fw-semibold">
                                                    Seleccionar escudo
                                                </label>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    accept="image/png,image/jpeg,image/webp"
                                                    onChange={manejarArchivoEscudo}
                                                />

                                                <div className="form-text">
                                                    Formatos permitidos: PNG, JPG o WEBP.
                                                    Tamaño máximo: 2 MB.
                                                </div>

                                                {archivoEscudo && (

                                                    <div className="alert alert-success mt-3 mb-0">
                                                        <strong>Archivo seleccionado:</strong>
                                                        <br />
                                                        {archivoEscudo.name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* TORNEOS */}

                                    <div>

                                        <h6 className="fw-bold border-bottom pb-2">
                                            Torneos donde participa
                                        </h6>

                                        <p className="text-secondary small">
                                            Selecciona los torneos en los que participa
                                            este equipo.
                                        </p>

                                        {torneos.length === 0 ? (

                                            <div className="alert alert-warning">
                                                No hay torneos registrados.
                                            </div>

                                        ) : (

                                            <div
                                                className="border rounded p-3"
                                                style={{
                                                    maxHeight: 250,
                                                    overflowY: 'auto',
                                                }}>

                                                <div className="row g-2">

                                                    {torneos.map((torneo) => (

                                                        <div
                                                            className="col-12 col-md-6"
                                                            key={torneo.id}
                                                        >

                                                            <div className="form-check">

                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    id={`torneo-${torneo.id}`}
                                                                    checked={torneosSeleccionados.includes(
                                                                        torneo.id
                                                                    )}
                                                                    onChange={() =>
                                                                        cambiarTorneo(torneo.id)
                                                                    }
                                                                />

                                                                <label
                                                                    className="form-check-label"
                                                                    htmlFor={`torneo-${torneo.id}`}
                                                                >
                                                                    {torneo.nombre}
                                                                </label>

                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        )}

                                        <small className="text-secondary">
                                            {torneosSeleccionados.length}{' '}
                                            torneo(s) seleccionado(s)
                                        </small>

                                    </div>

                                </div>

                                {/* FOOTER */}

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={cerrarModal}
                                        disabled={guardando}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4"
                                        disabled={guardando}
                                    >

                                        {guardando ? (

                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                />

                                                Guardando...
                                            </>

                                        ) : (

                                            modoEdicion
                                                ? 'Guardar cambios'
                                                : 'Crear equipo'

                                        )}

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}

            {/* ================================================= */}
            {/* MODAL ELIMINAR */}
            {/* ================================================= */}

            {equipoEliminar && (

                <div
                    className="modal d-block"
                    tabIndex={-1}
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                    }}
                >

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content">

                            <div className="modal-header">

                                <h5 className="modal-title fw-bold text-danger">
                                    Eliminar equipo
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setEquipoEliminar(null)}
                                    disabled={eliminando}
                                />

                            </div>

                            <div className="modal-body">

                                <div className="text-center mb-3">

                                    {equipoEliminar.escudo_url ? (

                                        <img
                                            src={equipoEliminar.escudo_url}
                                            alt={equipoEliminar.nombre}
                                            style={{
                                                width: 80,
                                                height: 80,
                                                objectFit: 'contain',
                                            }}
                                        />

                                    ) : (

                                        <div className="display-4">
                                        </div>

                                    )}

                                </div>

                                <p className="text-center mb-2">
                                    ¿Está seguro de eliminar el equipo?
                                </p>

                                <h5 className="text-center fw-bold">
                                    {equipoEliminar.nombre}
                                </h5>

                                <div className="alert alert-warning mt-3 mb-0">

                                    <small>
                                        Esta acción eliminará también las asociaciones
                                        del equipo con los torneos.
                                        <br />
                                        No se podrá eliminar si el equipo ya tiene
                                        partidos registrados.
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setEquipoEliminar(null)}
                                    disabled={eliminando}>Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={eliminarEquipo}
                                    disabled={eliminando}>
                                    {eliminando ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            />

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