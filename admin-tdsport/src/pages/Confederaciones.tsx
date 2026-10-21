import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Confederacion } from '../types/database';

// Material-UI Icons
import LanguageIcon from '@mui/icons-material/Language';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineRounded';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function Confederaciones() {
    const [confederaciones, setConfederaciones] = useState<Confederacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nombre, setNombre] = useState('');
    const [codigo, setCodigo] = useState('');
    const [editId, setEditId] = useState<number | null>(null);

    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        fetchConfederaciones();
    }, []);

    const fetchConfederaciones = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('confederaciones')
                .select('*')
                .order('nombre');

            if (error) throw error;
            if (data) setConfederaciones(data);
        } catch (error: any) {
            console.error('Error cargando confederaciones:', error);
            alert('No fue posible cargar las confederaciones: ' + (error?.message || 'Error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const payload = {
                nombre: nombre.trim(),
                codigo: codigo.trim().toUpperCase(),
            };

            if (editId) {
                const { error } = await supabase
                    .from('confederaciones')
                    .update(payload)
                    .eq('id', editId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('confederaciones')
                    .insert([payload]);
                if (error) throw error;
            }

            setNombre('');
            setCodigo('');
            setEditId(null);
            setIsModalOpen(false);
            await fetchConfederaciones();
        } catch (error: any) {
            console.error('Error guardando confederación:', error);
            alert('Error al guardar la confederación: ' + (error?.message || 'Error desconocido'));
        } finally {
            setGuardando(false);
        }
    };

    const handleEdit = (conf: Confederacion) => {
        setNombre(conf.nombre);
        setCodigo(conf.codigo);
        setEditId(conf.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (conf: Confederacion) => {
        if (!confirm(`¿Está seguro de eliminar la confederación ${conf.codigo}?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('confederaciones')
                .delete()
                .eq('id', conf.id);

            if (error) throw error;
            await fetchConfederaciones();
        } catch (error: any) {
            console.error('Error eliminando confederación:', error);
            alert('No fue posible eliminar la confederación. Asegúrese de que no tenga países vinculados: ' + (error?.message || ''));
        }
    };

    const confederacionesFiltradas = useMemo(() => {
        const texto = busqueda.toLowerCase().trim();
        if (!texto) return confederaciones;
        return confederaciones.filter(c =>
            c.nombre.toLowerCase().includes(texto) ||
            c.codigo.toLowerCase().includes(texto)
        );
    }, [confederaciones, busqueda]);

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
                                <LanguageIcon sx={{ fontSize: 30, color: 'var(--tds-lime, #7cff4f)' }} />
                            </div>
                            <div>
                                <h2 className="fw-bold mb-1 text-white">Gestión de Confederaciones</h2>
                                <p className="text-white-50 mb-0">
                                    Administra las confederaciones continentales de fútbol y sus códigos internacionales.
                                </p>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <button
                                className="btn btn-primary d-inline-flex align-items-center gap-2 px-3.5 py-2 shadow-sm"
                                onClick={() => {
                                    setEditId(null);
                                    setNombre('');
                                    setCodigo('');
                                    setIsModalOpen(true);
                                }}
                                style={{ borderRadius: '10px', fontWeight: 600 }}
                            >
                                <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                <span>Nueva confederación</span>
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
                                            Total confederaciones
                                        </small>
                                        <h3 className="fw-bold mb-0 mt-1 text-dark">
                                            {confederaciones.length}
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
                                        <LanguageIcon sx={{ fontSize: 24 }} />
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
                                            Con código internacional
                                        </small>
                                        <h3 className="fw-bold mb-0 mt-1 text-success">
                                            {confederaciones.filter(c => c.codigo).length}
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
                                        <FlagIcon sx={{ fontSize: 24 }} />
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
                                            Estado general
                                        </small>
                                        <h3 className="fw-bold mb-0 mt-1 text-primary">
                                            Activas
                                        </h3>
                                    </div>
                                    <div
                                        className="rounded-3 d-flex align-items-center justify-content-center"
                                        style={{
                                            width: 46,
                                            height: 46,
                                            backgroundColor: 'rgba(102, 16, 242, 0.1)',
                                            color: '#6610f2',
                                        }}
                                    >
                                        <CheckCircleIcon sx={{ fontSize: 24 }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTROS Y TABLA */}
                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
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
                                        placeholder="Buscar por código o nombre..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="text-muted mt-3 mb-0">Cargando confederaciones...</p>
                            </div>
                        ) : confederacionesFiltradas.length === 0 ? (
                            <div className="text-center py-5">
                                <div
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-2"
                                    style={{ width: 64, height: 64 }}
                                >
                                    <LanguageIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
                                </div>
                                <h5 className="text-muted mt-2 mb-0">No se encontraron confederaciones</h5>
                                <p className="text-muted small">Prueba cambiando el texto de búsqueda o registra una nueva.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="px-4 py-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>CÓDIGO</th>
                                            <th className="py-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>NOMBRE COMPLETO</th>
                                            <th className="px-4 py-3 text-end" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {confederacionesFiltradas.map((conf) => (
                                            <tr key={conf.id}>
                                                <td className="px-4 py-3">
                                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5 fw-bold font-monospace" style={{ fontSize: '0.85rem' }}>
                                                        {conf.codigo}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <AccountBalanceIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                                        <span className="fw-semibold text-dark">{conf.nombre}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-end">
                                                    <div className="d-flex justify-content-end gap-1">
                                                        <button
                                                            onClick={() => handleEdit(conf)}
                                                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                                                            title="Editar confederación"
                                                            style={{ width: 34, height: 34, borderRadius: '8px' }}
                                                        >
                                                            <EditIcon sx={{ fontSize: 18 }} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(conf)}
                                                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
                                                            title="Eliminar confederación"
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

                    {!loading && confederacionesFiltradas.length > 0 && (
                        <div className="card-footer bg-white border-top py-2.5 px-4 d-flex justify-content-between align-items-center">
                            <small className="text-secondary">
                                Mostrando <strong>{confederacionesFiltradas.length}</strong> de <strong>{confederaciones.length}</strong> confederaciones
                            </small>
                        </div>
                    )}
                </div>

                {/* MODAL CREAR / EDITAR */}
                {isModalOpen && (
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
                                maxWidth: '500px',
                                maxHeight: '90vh',
                                borderRadius: '20px',
                                overflow: 'hidden',
                            }}
                        >
                            <div className="card-header border-bottom py-3 px-4 bg-light d-flex align-items-center justify-content-between flex-shrink-0">
                                <div className="d-flex align-items-center gap-2.5">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white shadow-sm"
                                        style={{ width: 38, height: 38 }}
                                    >
                                        <LanguageIcon sx={{ fontSize: 22 }} />
                                    </div>
                                    <div>
                                        <h5 className="modal-title fw-bold mb-0 text-dark">
                                            {editId ? 'Editar Confederación' : 'Nueva Confederación'}
                                        </h5>
                                        <small className="text-muted">
                                            {editId ? 'Modifica los datos de la confederación' : 'Ingresa los datos para registrar la confederación'}
                                        </small>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={guardando}
                                />
                            </div>

                            <form
                                onSubmit={handleSubmit}
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
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small text-dark">
                                            Código (siglas) *
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted">
                                                <FlagIcon sx={{ fontSize: 18 }} />
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control border-start-0 ps-1 text-uppercase"
                                                placeholder="Ej. CONCACAF, UEFA, CONMEBOL"
                                                value={codigo}
                                                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                                required
                                            />
                                        </div>
                                        <div className="form-text small">Identificador oficial o abreviación en mayúsculas.</div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label fw-semibold small text-dark">
                                            Nombre completo *
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted">
                                                <AccountBalanceIcon sx={{ fontSize: 18 }} />
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control border-start-0 ps-1"
                                                placeholder="Ej. Confederación de Norte, Centroamérica y el Caribe de Fútbol"
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-top bg-light px-4 py-3 d-flex justify-content-end gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="btn btn-outline-secondary d-inline-flex align-items-center gap-1.5 px-3 py-2"
                                        style={{ borderRadius: '10px' }}
                                        disabled={guardando}
                                    >
                                        <CloseIcon sx={{ fontSize: 18 }} />
                                        <span>Cancelar</span>
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary d-inline-flex align-items-center gap-1.5 px-4 py-2"
                                        style={{ borderRadius: '10px', fontWeight: 600 }}
                                        disabled={guardando}
                                    >
                                        {guardando ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" />
                                                <span>Guardando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <SaveIcon sx={{ fontSize: 18 }} />
                                                <span>{editId ? 'Guardar cambios' : 'Crear confederación'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
