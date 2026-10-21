import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

// Material-UI Icons
import ShieldIcon from '@mui/icons-material/Shield';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineRounded';
import SearchIcon from '@mui/icons-material/Search';
import PublicIcon from '@mui/icons-material/Public';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import FlagIcon from '@mui/icons-material/Flag';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineRounded';

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
    const [torneosSeleccionados, setTorneosSeleccionados] = useState<string[]>([]);

    const [archivoEscudo, setArchivoEscudo] = useState<File | null>(null);
    const [escudoPreview, setEscudoPreview] = useState<string | null>(null);
    const [escudoActual, setEscudoActual] = useState<string | null>(null);

    // MODAL ELIMINAR
    const [equipoEliminar, setEquipoEliminar] = useState<EquipoConTorneos | null>(null);

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

            if (errorEquipos) throw errorEquipos;
            if (errorPaises) throw errorPaises;
            if (errorTorneos) throw errorTorneos;
            if (errorRelaciones) throw errorRelaciones;

            const torneosMap = new Map<string, Torneo>();
            (dataTorneos || []).forEach((t: Torneo) => {
                torneosMap.set(t.id, t);
            });

            const relacionesMap = new Map<string, string[]>();
            (dataRelaciones || []).forEach((rel: TorneoEquipo) => {
                const lista = relacionesMap.get(rel.equipo_id) || [];
                lista.push(rel.torneo_id);
                relacionesMap.set(rel.equipo_id, lista);
            });

            const equiposMapeados: EquipoConTorneos[] = (
                (dataEquipos as EquipoDBResponse[]) || []
            ).map((item) => {
                const paisNormalizado = Array.isArray(item.pais)
                    ? item.pais[0] || null
                    : item.pais || null;

                const idsTorneos = relacionesMap.get(item.id) || [];
                const torneosDelEquipo: Torneo[] = idsTorneos
                    .map((id) => torneosMap.get(id))
                    .filter((t): t is Torneo => Boolean(t));

                return {
                    id: item.id,
                    nombre: item.nombre,
                    pais_id: item.pais_id,
                    escudo_url: item.escudo_url,
                    pais: paisNormalizado,
                    torneos: torneosDelEquipo,
                };
            });

            setEquipos(equiposMapeados);
            setPaises(dataPaises || []);
            setTorneos(dataTorneos || []);
        } catch (error: any) {
            console.error('Error cargando equipos:', error);
            alert('No fue posible cargar los datos: ' + (error?.message || 'Error desconocido'));
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
    const manejarArchivoEscudo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;

        if (!archivo.type.startsWith('image/')) {
            alert('Seleccione un archivo de imagen válido (PNG, JPG, WEBP).');
            return;
        }

        if (archivo.size > 2 * 1024 * 1024) {
            alert('El escudo no puede superar los 2 MB.');
            return;
        }

        setArchivoEscudo(archivo);
        const url = URL.createObjectURL(archivo);
        setEscudoPreview(url);
    };

    // QUITAR ARCHIVO SELECCIONADO
    const quitarArchivoSeleccionado = () => {
        setArchivoEscudo(null);
        setEscudoPreview(null);
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

        const extension = archivoEscudo.name.split('.').pop()?.toLowerCase() || 'png';
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
            throw new Error('No fue posible subir el escudo: ' + errorUpload.message);
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

                if (error) throw error;
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

                if (error) throw error;
            }

            // GESTIÓN DE RELACIONES CON TORNEOS
            const { error: errorDeleteRelaciones } = await supabase
                .from('torneo_equipos')
                .delete()
                .eq('equipo_id', idEquipo);

            if (errorDeleteRelaciones) throw errorDeleteRelaciones;

            if (torneosSeleccionados.length > 0) {
                const filasTorneoEquipos = torneosSeleccionados.map((tId) => ({
                    equipo_id: idEquipo,
                    torneo_id: tId,
                }));

                const { error: errorInsertRelaciones } = await supabase
                    .from('torneo_equipos')
                    .insert(filasTorneoEquipos);

                if (errorInsertRelaciones) throw errorInsertRelaciones;
            }

            cerrarModal();
            await cargarDatos();
        } catch (error: any) {
            console.error(error);
            alert('No fue posible guardar el equipo: ' + (error?.message || 'Error desconocido'));
        } finally {
            setGuardando(false);
        }
    };

    // CONFIRMAR ELIMINAR
    const confirmarEliminar = (equipo: EquipoConTorneos) => {
        setEquipoEliminar(equipo);
    };

    // ELIMINAR EQUIPO
    const eliminarEquipo = async () => {
        if (!equipoEliminar) return;

        setEliminando(true);

        try {
            // Verificar si el equipo tiene partidos asociados
            const { data: partidos, error: errorPartidos } = await supabase
                .from('partidos')
                .select('id')
                .or(`local_id.eq.${equipoEliminar.id},visitante_id.eq.${equipoEliminar.id}`)
                .limit(1);

            if (errorPartidos) throw errorPartidos;

            if (partidos && partidos.length > 0) {
                alert('No se puede eliminar este equipo porque ya tiene partidos registrados en competiciones.');
                setEquipoEliminar(null);
                return;
            }

            // Eliminar relaciones torneo-equipo
            const { error: errorRelaciones } = await supabase
                .from('torneo_equipos')
                .delete()
                .eq('equipo_id', equipoEliminar.id);

            if (errorRelaciones) throw errorRelaciones;

            // Eliminar equipo
            const { error: errorEquipo } = await supabase
                .from('equipos')
                .delete()
                .eq('id', equipoEliminar.id);

            if (errorEquipo) throw errorEquipo;

            alert('Equipo eliminado correctamente.');
            setEquipoEliminar(null);
            await cargarDatos();
        } catch (error: any) {
            console.error(error);
            alert('No fue posible eliminar el equipo: ' + (error?.message || 'Error desconocido'));
        } finally {
            setEliminando(false);
        }
    };

    // ESTADÍSTICAS
    const totalEquipos = equipos.length;
    const equiposConEscudo = equipos.filter((e) => e.escudo_url).length;
    const equiposSinEscudo = totalEquipos - equiposConEscudo;

    // RENDER
    return (
        <div className="min-vh-100 bg-light">
            <div className="container-fluid py-4 px-3 px-md-4">

                {/* HERO HEADER - Estilo idéntico a Gestión de Torneos */}
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
                                <ShieldIcon sx={{ fontSize: 30, color: 'var(--tds-lime, #7cff4f)' }} />
                            </div>
                            <div>
                                <h2 className="fw-bold mb-1 text-white">Gestión de Equipos</h2>
                                <p className="text-white-50 mb-0">
                                    Administra los clubes, países, escudos y competiciones asignadas.
                                </p>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <button
                                className="btn btn-primary d-inline-flex align-items-center gap-2 px-3.5 py-2 shadow-sm"
                                onClick={abrirNuevoEquipo}
                                style={{ borderRadius: '10px', fontWeight: 600 }}
                            >
                                <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                <span>Nuevo equipo</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ESTADÍSTICAS */}
                <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                            <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <small className="text-muted fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                            Total de equipos
                                        </small>
                                        <h3 className="fw-bold mb-0 mt-1 text-dark">
                                            {totalEquipos}
                                        </h3>
                                    </div>
                                    <div
                                        className="rounded-3 d-flex align-items-center justify-content-center"
                                        style={{
                                            width: 46,
                                            height: 46,
                                            backgroundColor: 'rgba(13, 110, 253, 0.1)',
                                            color: '#0d6efd',
                                        }}
                                    >
                                        <GroupsIcon sx={{ fontSize: 24 }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                            <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <small className="text-muted fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                            Con escudo oficial
                                        </small>
                                        <h3 className="fw-bold mb-0 mt-1 text-success">
                                            {equiposConEscudo}
                                        </h3>
                                    </div>
                                    <div
                                        className="rounded-3 d-flex align-items-center justify-content-center"
                                        style={{
                                            width: 46,
                                            height: 46,
                                            backgroundColor: 'rgba(25, 135, 84, 0.1)',
                                            color: '#198754',
                                        }}
                                    >
                                        <VerifiedUserIcon sx={{ fontSize: 24 }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                            <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <small className="text-muted fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                            Sin escudo
                                        </small>
                                        <h3 className="fw-bold mb-0 mt-1 text-warning">
                                            {equiposSinEscudo}
                                        </h3>
                                    </div>
                                    <div
                                        className="rounded-3 d-flex align-items-center justify-content-center"
                                        style={{
                                            width: 46,
                                            height: 46,
                                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                            color: '#f59e0b',
                                        }}
                                    >
                                        <HelpOutlineIcon sx={{ fontSize: 24 }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTROS Y TABLA */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                    <div className="card-header bg-white border-bottom py-3">
                        <div className="row g-3">
                            <div className="col-12 col-md-6 col-lg-5">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0 text-muted">
                                        <SearchIcon sx={{ fontSize: 20 }} />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 ps-1"
                                        placeholder="Buscar por nombre de equipo..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="col-12 col-md-6 col-lg-4">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0 text-muted">
                                        <PublicIcon sx={{ fontSize: 20 }} />
                                    </span>
                                    <select
                                        className="form-select border-start-0 ps-1"
                                        value={paisFiltro}
                                        onChange={(e) => setPaisFiltro(e.target.value)}
                                    >
                                        <option value="">Todos los países</option>
                                        {paises.map((pais) => (
                                            <option key={pais.id} value={pais.id}>
                                                {pais.nombre}
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
                                <div className="spinner-border text-primary mb-3" role="status" />
                                <p className="text-secondary mb-0">Cargando equipos...</p>
                            </div>
                        ) : equiposFiltrados.length === 0 ? (
                            <div className="text-center py-5">
                                <div
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-2"
                                    style={{ width: 64, height: 64 }}
                                >
                                    <ShieldOutlinedIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
                                </div>
                                <h5 className="fw-bold mt-2 mb-1 text-dark">No se encontraron equipos</h5>
                                <p className="text-secondary small mb-3">
                                    Prueba cambiando los filtros o registra un nuevo equipo.
                                </p>
                                <button
                                    className="btn btn-primary d-inline-flex align-items-center gap-1.5 px-3 py-2"
                                    style={{ borderRadius: '8px' }}
                                    onClick={abrirNuevoEquipo}
                                >
                                    <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
                                    <span>Registrar equipo</span>
                                </button>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="px-4 py-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>ESCUDO</th>
                                            <th className="py-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>EQUIPO</th>
                                            <th className="py-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>PAÍS</th>
                                            <th className="py-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>TORNEOS</th>
                                            <th className="text-end px-4 py-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {equiposFiltrados.map((equipo) => (
                                            <tr key={equipo.id}>
                                                {/* ESCUDO */}
                                                <td className="px-4 py-3">
                                                    {equipo.escudo_url ? (
                                                        <div
                                                            className="rounded-3 bg-white p-1 shadow-sm border d-flex align-items-center justify-content-center"
                                                            style={{ width: 44, height: 44 }}
                                                        >
                                                            <img
                                                                src={equipo.escudo_url}
                                                                alt={`Escudo de ${equipo.nombre}`}
                                                                style={{
                                                                    maxWidth: 36,
                                                                    maxHeight: 36,
                                                                    objectFit: 'contain',
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="rounded-3 bg-light border d-flex align-items-center justify-content-center text-muted"
                                                            style={{ width: 44, height: 44 }}
                                                        >
                                                            <ShieldOutlinedIcon sx={{ fontSize: 22, color: '#94a3b8' }} />
                                                        </div>
                                                    )}
                                                </td>

                                                {/* NOMBRE */}
                                                <td className="py-3">
                                                    <div className="fw-semibold text-dark">
                                                        {equipo.nombre}
                                                    </div>
                                                    <small className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                                                        ID: {equipo.id.substring(0, 8)}...
                                                    </small>
                                                </td>

                                                {/* PAÍS */}
                                                <td className="py-3">
                                                    {equipo.pais ? (
                                                        <div className="d-flex align-items-center gap-1.5">
                                                            <FlagIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                                            <span className="text-dark small fw-medium">
                                                                {equipo.pais.nombre}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small">Sin país</span>
                                                    )}
                                                </td>

                                                {/* TORNEOS */}
                                                <td className="py-3">
                                                    {equipo.torneos.length === 0 ? (
                                                        <span className="badge bg-light text-muted border">
                                                            Sin torneos
                                                        </span>
                                                    ) : (
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {equipo.torneos.slice(0, 3).map((torneo) => (
                                                                <span
                                                                    key={torneo.id}
                                                                    className="badge bg-primary-subtle text-primary border border-primary-subtle"
                                                                    style={{ borderRadius: '6px', fontSize: '0.75rem' }}
                                                                >
                                                                    {torneo.nombre}
                                                                </span>
                                                            ))}
                                                            {equipo.torneos.length > 3 && (
                                                                <span
                                                                    className="badge bg-light text-secondary border"
                                                                    style={{ borderRadius: '6px', fontSize: '0.75rem' }}
                                                                >
                                                                    +{equipo.torneos.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* ACCIONES */}
                                                <td className="text-end px-4 py-3">
                                                    <div className="d-flex justify-content-end gap-1">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                                                            title="Editar equipo"
                                                            onClick={() => abrirEditarEquipo(equipo)}
                                                            style={{ width: 34, height: 34, borderRadius: '8px' }}
                                                        >
                                                            <EditIcon sx={{ fontSize: 18 }} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
                                                            title="Eliminar equipo"
                                                            onClick={() => confirmarEliminar(equipo)}
                                                            style={{ width: 34, height: 34, borderRadius: '8px' }}
                                                        >
                                                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
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
                        <div className="card-footer bg-white border-top py-2.5 px-4 d-flex justify-content-between align-items-center">
                            <small className="text-secondary">
                                Mostrando <strong>{equiposFiltrados.length}</strong> de <strong>{equipos.length}</strong> equipos
                            </small>
                        </div>
                    )}
                </div>


                {mostrarModal && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                        style={{
                            zIndex: 1055,
                            backgroundColor: 'rgba(7, 26, 51, 0.65)',
                            backdropFilter: 'blur(4px)',
                            padding: '16px',
                            overflowY: 'auto',
                        }}
                    >
                        <div
                            className="card border-0 shadow-lg d-flex flex-column"
                            style={{
                                width: '100%',
                                maxWidth: '820px',
                                maxHeight: '90vh',
                                borderRadius: '20px',
                                overflow: 'hidden',
                            }}
                        >
                            {/* MODAL HEADER (fijo arriba) */}
                            <div className="card-header border-bottom py-3 px-4 bg-light d-flex align-items-center justify-content-between flex-shrink-0">
                                <div className="d-flex align-items-center gap-2.5">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white shadow-sm"
                                        style={{ width: 38, height: 38 }}
                                    >
                                        <ShieldIcon sx={{ fontSize: 22 }} />
                                    </div>
                                    <div>
                                        <h5 className="modal-title fw-bold mb-0 text-dark">
                                            {modoEdicion ? 'Editar Equipo' : 'Nuevo Equipo'}
                                        </h5>
                                        <small className="text-muted">
                                            {modoEdicion
                                                ? 'Actualiza los datos, escudo o torneos del equipo'
                                                : 'Ingresa los datos para registrar un nuevo club o selección'}
                                        </small>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={cerrarModal}
                                    disabled={guardando}
                                />
                            </div>

                            {/* FORMULARIO FLEXIBLE */}
                            <form
                                onSubmit={guardarEquipo}
                                className="d-flex flex-column"
                                style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}
                            >
                                <div
                                    className="p-4"
                                    style={{
                                        overflowY: 'auto',
                                        flex: '1 1 auto',
                                        minHeight: 0,
                                    }}
                                >

                                    {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                            <SportsSoccerIcon sx={{ fontSize: 20, color: '#0d6efd' }} />
                                            <h6 className="fw-bold mb-0 text-dark">Información General</h6>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-12 col-md-7">
                                                <label className="form-label fw-semibold small text-dark">
                                                    Nombre del equipo *
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-end-0 text-muted">
                                                        <SportsSoccerIcon sx={{ fontSize: 18 }} />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="form-control border-start-0 ps-1"
                                                        placeholder="Ej. Real Madrid, FC Barcelona, Boca Juniors"
                                                        value={nombre}
                                                        onChange={(e) => setNombre(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-12 col-md-5">
                                                <label className="form-label fw-semibold small text-dark">
                                                    País de origen *
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-end-0 text-muted">
                                                        <PublicIcon sx={{ fontSize: 18 }} />
                                                    </span>
                                                    <select
                                                        className="form-select border-start-0 ps-1"
                                                        value={paisId}
                                                        onChange={(e) => setPaisId(e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Selecciona un país...</option>
                                                        {paises.map((pais) => (
                                                            <option key={pais.id} value={pais.id}>
                                                                {pais.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECCIÓN 2: ESCUDO DEL EQUIPO */}
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                            <ShieldIcon sx={{ fontSize: 20, color: '#0d6efd' }} />
                                            <h6 className="fw-bold mb-0 text-dark">Escudo o Emblema</h6>
                                        </div>

                                        <div className="row align-items-center g-3">
                                            {/* PREVIEW BOX */}
                                            <div className="col-12 col-sm-4 text-center">
                                                <div
                                                    className="border rounded-4 p-3 bg-white shadow-sm d-flex flex-column align-items-center justify-content-center mx-auto position-relative"
                                                    style={{
                                                        width: 140,
                                                        height: 140,
                                                        borderStyle: 'dashed',
                                                        borderColor: escudoPreview || escudoActual ? '#10b981' : '#cbd5e1',
                                                    }}
                                                >
                                                    {escudoPreview || escudoActual ? (
                                                        <>
                                                            <img
                                                                src={escudoPreview || escudoActual || ''}
                                                                alt="Vista previa"
                                                                style={{
                                                                    maxWidth: '100%',
                                                                    maxHeight: 100,
                                                                    objectFit: 'contain',
                                                                }}
                                                            />
                                                            <span
                                                                className="badge bg-success position-absolute top-0 end-0 m-1 rounded-circle p-1 shadow-sm"
                                                                title="Escudo cargado"
                                                            >
                                                                <CheckCircleIcon sx={{ fontSize: 14 }} />
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <div className="text-center text-muted">
                                                            <ShieldOutlinedIcon sx={{ fontSize: 44, color: '#cbd5e1' }} />
                                                            <div className="small mt-1" style={{ fontSize: '0.75rem' }}>
                                                                Sin escudo
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* UPLOAD CONTROLS */}
                                            <div className="col-12 col-sm-8">
                                                <label className="form-label fw-semibold small text-dark mb-1">
                                                    Cargar archivo de escudo
                                                </label>
                                                <div className="input-group mb-2">
                                                    <span className="input-group-text bg-light text-muted border-end-0">
                                                        <CloudUploadIcon sx={{ fontSize: 20 }} />
                                                    </span>
                                                    <input
                                                        type="file"
                                                        className="form-control border-start-0 ps-1"
                                                        accept="image/png,image/jpeg,image/webp"
                                                        onChange={manejarArchivoEscudo}
                                                    />
                                                </div>

                                                <div className="d-flex align-items-center gap-2 flex-wrap small text-muted">
                                                    <span className="badge bg-light text-secondary border">PNG</span>
                                                    <span className="badge bg-light text-secondary border">JPG</span>
                                                    <span className="badge bg-light text-secondary border">WEBP</span>
                                                    <span>Tamaño máximo: 2 MB</span>
                                                </div>

                                                {archivoEscudo && (
                                                    <div className="alert alert-success d-flex align-items-center justify-content-between py-2 px-3 mt-2.5 mb-0" style={{ borderRadius: '10px' }}>
                                                        <div className="d-flex align-items-center gap-2 text-truncate">
                                                            <CheckCircleIcon sx={{ fontSize: 18, color: '#198754' }} />
                                                            <span className="small fw-semibold text-truncate">{archivoEscudo.name}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-link text-danger p-0 ms-2 text-decoration-none small"
                                                            onClick={quitarArchivoSeleccionado}
                                                        >
                                                            Quitar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECCIÓN 3: TORNEOS DONDE PARTICIPA */}
                                    <div>
                                        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                            <div className="d-flex align-items-center gap-2">
                                                <EmojiEventsIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
                                                <h6 className="fw-bold mb-0 text-dark">Competiciones Asociadas</h6>
                                            </div>
                                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1">
                                                {torneosSeleccionados.length} seleccionado(s)
                                            </span>
                                        </div>

                                        <p className="text-muted small mb-2.5">
                                            Selecciona los torneos en los que participará este equipo:
                                        </p>

                                        {torneos.length === 0 ? (
                                            <div className="alert alert-warning py-2 small mb-0">
                                                No hay torneos registrados actualmente.
                                            </div>
                                        ) : (
                                            <div
                                                className="border rounded-3 p-2.5 bg-light"
                                                style={{ maxHeight: 220, overflowY: 'auto' }}
                                            >
                                                <div className="row g-2">
                                                    {torneos.map((torneo) => {
                                                        const seleccionado = torneosSeleccionados.includes(torneo.id);
                                                        return (
                                                            <div className="col-12 col-sm-6" key={torneo.id}>
                                                                <div
                                                                    onClick={() => cambiarTorneo(torneo.id)}
                                                                    className={`p-2.5 rounded-3 border d-flex align-items-center gap-2.5 transition-all ${seleccionado
                                                                        ? 'bg-white border-primary shadow-sm text-primary'
                                                                        : 'bg-white border-secondary-subtle text-dark'
                                                                        }`}
                                                                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-check-input mt-0 flex-shrink-0"
                                                                        id={`torneo-${torneo.id}`}
                                                                        checked={seleccionado}
                                                                        onChange={() => { }} // Manejado por el contenedor onClick
                                                                        style={{ cursor: 'pointer' }}
                                                                    />
                                                                    <EmojiEventsIcon
                                                                        sx={{
                                                                            fontSize: 18,
                                                                            color: seleccionado ? '#0d6efd' : '#94a3b8',
                                                                        }}
                                                                    />
                                                                    <label
                                                                        className="small fw-semibold mb-0 text-truncate"
                                                                        style={{ cursor: 'pointer' }}
                                                                    >
                                                                        {torneo.nombre}
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* FOOTER (fijo abajo, siempre visible) */}
                                <div className="border-top bg-light px-4 py-3 d-flex justify-content-end gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary d-inline-flex align-items-center gap-1.5 px-3 py-2"
                                        onClick={cerrarModal}
                                        disabled={guardando}
                                        style={{ borderRadius: '10px' }}
                                    >
                                        <CloseIcon sx={{ fontSize: 18 }} />
                                        <span>Cancelar</span>
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary d-inline-flex align-items-center gap-1.5 px-4 py-2"
                                        disabled={guardando}
                                        style={{ borderRadius: '10px', fontWeight: 600 }}
                                    >
                                        {guardando ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" />
                                                <span>Guardando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <SaveIcon sx={{ fontSize: 18 }} />
                                                <span>{modoEdicion ? 'Guardar cambios' : 'Crear equipo'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ================================================= */}
                {/* MODAL ELIMINAR CON ALERTA MODERNA */}
                {/* ================================================= */}
                {equipoEliminar && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                        style={{
                            zIndex: 1055,
                            backgroundColor: 'rgba(7, 26, 51, 0.65)',
                            backdropFilter: 'blur(4px)',
                            padding: '16px',
                            overflowY: 'auto',
                        }}
                    >
                        <div
                            className="card border-0 shadow-lg"
                            style={{
                                width: '100%',
                                maxWidth: '440px',
                                borderRadius: '20px',
                                overflow: 'hidden',
                            }}
                        >
                            <div className="card-header border-bottom py-3 px-4 bg-danger-subtle text-danger d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                    <WarningAmberIcon sx={{ fontSize: 22 }} />
                                    <h5 className="modal-title fw-bold mb-0">Eliminar equipo</h5>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setEquipoEliminar(null)}
                                    disabled={eliminando}
                                />
                            </div>

                            <div className="card-body p-4 text-center">
                                <div className="mb-3">
                                    {equipoEliminar.escudo_url ? (
                                        <div
                                            className="rounded-circle bg-white shadow-sm border p-2 d-inline-flex align-items-center justify-content-center"
                                            style={{ width: 80, height: 80 }}
                                        >
                                            <img
                                                src={equipoEliminar.escudo_url}
                                                alt={equipoEliminar.nombre}
                                                style={{ maxWidth: 64, maxHeight: 64, objectFit: 'contain' }}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center text-muted"
                                            style={{ width: 80, height: 80 }}
                                        >
                                            <ShieldOutlinedIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
                                        </div>
                                    )}
                                </div>

                                <h5 className="fw-bold mb-1 text-dark">{equipoEliminar.nombre}</h5>
                                <p className="text-secondary small mb-3">
                                    ¿Está seguro de eliminar este equipo de la plataforma?
                                </p>

                                <div className="alert alert-warning text-start small mb-0 py-2.5 px-3" style={{ borderRadius: '10px' }}>
                                    <strong>Atención:</strong> Esta acción removerá también las asociaciones del equipo con los torneos. No se podrá eliminar si ya cuenta con partidos jugados o programados.
                                </div>
                            </div>

                            <div className="card-footer border-top bg-light px-4 py-3 d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary d-inline-flex align-items-center gap-1.5 px-3 py-2"
                                    onClick={() => setEquipoEliminar(null)}
                                    disabled={eliminando}
                                    style={{ borderRadius: '10px' }}
                                >
                                    <CloseIcon sx={{ fontSize: 18 }} />
                                    <span>Cancelar</span>
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-danger d-inline-flex align-items-center gap-1.5 px-4 py-2"
                                    onClick={eliminarEquipo}
                                    disabled={eliminando}
                                    style={{ borderRadius: '10px', fontWeight: 600 }}
                                >
                                    {eliminando ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status" />
                                            <span>Eliminando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                            <span>Sí, eliminar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}