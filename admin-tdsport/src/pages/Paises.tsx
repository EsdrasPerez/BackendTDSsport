import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Pais, Confederacion } from '../types/database';

// Material-UI Icons
import PublicIcon from '@mui/icons-material/Public';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineRounded';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import FlagIcon from '@mui/icons-material/Flag';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LanguageIcon from '@mui/icons-material/Language';

export default function Paises() {
    const [paises, setPaises] = useState<Pais[]>([]);
    const [confederaciones, setConfederaciones] = useState<Confederacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nombre, setNombre] = useState('');
    const [codigoIso, setCodigoIso] = useState('');
    const [confId, setConfId] = useState('');
    const [editId, setEditId] = useState<number | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [filtroConf, setFiltroConf] = useState('');

    useEffect(() => {
        fetchDatos();
    }, []);

    const fetchDatos = async () => {
        setLoading(true);
        const [paisesRes, confRes] = await Promise.all([
            supabase.from('paises').select('*, confederacion:confederaciones(nombre, codigo)').order('nombre'),
            supabase.from('confederaciones').select('*').order('nombre')
        ]);
        if (paisesRes.data) setPaises(paisesRes.data);
        if (confRes.data) setConfederaciones(confRes.data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const payload = { nombre: nombre.trim(), codigo_iso: codigoIso.trim().toUpperCase(), confederacion_id: parseInt(confId) };
            if (editId) {
                const { error } = await supabase.from('paises').update(payload).eq('id', editId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('paises').insert([payload]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            await fetchDatos();
        } catch (error: any) {
            console.error('Error al guardar país:', error);
            alert('Error al guardar el país: ' + (error?.message || 'Error desconocido'));
        } finally {
            setGuardando(false);
        }
    };

    const handleEdit = (pais: Pais) => {
        setNombre(pais.nombre);
        setCodigoIso(pais.codigo_iso);
        setConfId(pais.confederacion_id.toString());
        setEditId(pais.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Está seguro de eliminar este país?')) {
            const { error } = await supabase.from('paises').delete().eq('id', id);
            if (error) {
                alert('No fue posible eliminar el país: ' + error.message);
                return;
            }
            fetchDatos();
        }
    };

    const paisesFiltrados = useMemo(() => {
        return paises.filter(p =>
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
            (filtroConf ? p.confederacion_id.toString() === filtroConf : true)
        );
    }, [paises, busqueda, filtroConf]);

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
                                <PublicIcon sx={{ fontSize: 30, color: 'var(--tds-lime, #7cff4f)' }} />
                            </div>
                            <div>
                                <h2 className="fw-bold mb-1 text-white">Gestión de Países</h2>
                                <p className="text-white-50 mb-0">
                                    Administra los países, códigos ISO y confederaciones asociadas.
                                </p>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <button
                                className="btn btn-primary d-inline-flex align-items-center gap-2 px-3.5 py-2 shadow-sm"
                                onClick={() => {
                                    setEditId(null);
                                    setNombre('');
                                    setCodigoIso('');
                                    setConfId('');
                                    setIsModalOpen(true);
                                }}
                                style={{ borderRadius: '10px', fontWeight: 600 }}
                            >
                                <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                <span>Nuevo país</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* TARJETAS DE ESTADÍSTICAS */}
                <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                            <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <small className="text-muted fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                            Total de países
                                        </small>
                                        <h3 className="fw-bold mb-0 mt-1 text-dark">{paises.length}</h3>
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
                                        <PublicIcon sx={{ fontSize: 24 }} />
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
                                            Con confederación
                                        </small>
                                        <h3 className="fw-bold mb-0 mt-1 text-success">
                                            {paises.filter(p => p.confederacion_id).length}
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
                                        <AccountBalanceIcon sx={{ fontSize: 24 }} />
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
                                            Confederaciones
                                        </small>
                                        <h3 className="fw-bold mb-0 mt-1 text-primary">
                                            {confederaciones.length}
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
                                        <LanguageIcon sx={{ fontSize: 24 }} />
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
                                        placeholder="Buscar por nombre de país..."
                                        value={busqueda}
                                        onChange={e => setBusqueda(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="col-12 col-md-6 col-lg-4">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0 text-muted">
                                        <FilterListIcon sx={{ fontSize: 20 }} />
                                    </span>
                                    <select
                                        className="form-select border-start-0 ps-1"
                                        value={filtroConf}
                                        onChange={e => setFiltroConf(e.target.value)}
                                    >
                                        <option value="">Todas las confederaciones</option>
                                        {confederaciones.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nombre ? `${c.codigo} - ${c.nombre}` : c.codigo}
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
                                <p className="text-muted mt-3 mb-0">Cargando países...</p>
                            </div>
                        ) : paisesFiltrados.length === 0 ? (
                            <div className="text-center py-5">
                                <div
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-2"
                                    style={{ width: 64, height: 64 }}
                                >
                                    <PublicIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
                                </div>
                                <h5 className="text-muted mt-2 mb-0">No se encontraron países</h5>
                                <p className="text-muted small">Prueba cambiando el texto de búsqueda o el filtro.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="px-4 py-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>PAÍS</th>
                                            <th className="py-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>CÓDIGO ISO</th>
                                            <th className="py-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>CONFEDERACIÓN</th>
                                            <th className="px-4 py-3 text-end" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paisesFiltrados.map(pais => (
                                            <tr key={pais.id}>
                                                <td className="px-4 py-3">
                                                    <div className="d-flex align-items-center gap-2.5">
                                                        <div
                                                            className="rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle text-primary"
                                                            style={{ width: 34, height: 34, flexShrink: 0 }}
                                                        >
                                                            <FlagIcon sx={{ fontSize: 18 }} />
                                                        </div>
                                                        <span className="fw-semibold text-dark">{pais.nombre}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <span className="badge bg-light text-secondary border px-2 py-1 font-monospace">
                                                        {pais.codigo_iso || '---'}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    {pais.confederacion?.codigo ? (
                                                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5 fw-semibold">
                                                            {pais.confederacion.codigo}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted small">Sin asignar</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-end">
                                                    <div className="d-flex justify-content-end gap-1">
                                                        <button
                                                            onClick={() => handleEdit(pais)}
                                                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                                                            title="Editar país"
                                                            style={{ width: 34, height: 34, borderRadius: '8px' }}
                                                        >
                                                            <EditIcon sx={{ fontSize: 18 }} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(pais.id)}
                                                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
                                                            title="Eliminar país"
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
                </div>

                {/* MODAL CREAR / EDITAR PAÍS */}
                {isModalOpen && (
                    <div
                        className="modal d-block"
                        tabIndex={-1}
                        style={{ backgroundColor: 'rgba(7, 26, 51, 0.55)', backdropFilter: 'blur(3px)' }}
                    >
                        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
                            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '18px', overflow: 'hidden' }}>
                                <div className="modal-header border-bottom py-3 px-4 bg-light">
                                    <div className="d-flex align-items-center gap-2.5">
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white"
                                            style={{ width: 36, height: 36 }}
                                        >
                                            <PublicIcon sx={{ fontSize: 20 }} />
                                        </div>
                                        <div>
                                            <h5 className="modal-title fw-bold mb-0">
                                                {editId ? 'Editar País' : 'Nuevo País'}
                                            </h5>
                                            <small className="text-muted">
                                                {editId ? 'Modifica los datos del país' : 'Completa los datos para registrar un país'}
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

                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body p-4">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold small text-dark">
                                                Nombre del país *
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0 text-muted">
                                                    <FlagIcon sx={{ fontSize: 18 }} />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control border-start-0 ps-1"
                                                    placeholder="Ej. España, México, Argentina"
                                                    value={nombre}
                                                    onChange={e => setNombre(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold small text-dark">
                                                Código ISO (2 o 3 caracteres) *
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0 text-muted">
                                                    <LanguageIcon sx={{ fontSize: 18 }} />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control border-start-0 ps-1 text-uppercase"
                                                    placeholder="Ej. ESP, MEX, ARG"
                                                    maxLength={3}
                                                    value={codigoIso}
                                                    onChange={e => setCodigoIso(e.target.value.toUpperCase())}
                                                    required
                                                />
                                            </div>
                                            <div className="form-text small">Código estándar internacional de 2 o 3 letras.</div>
                                        </div>

                                        <div className="mb-2">
                                            <label className="form-label fw-semibold small text-dark">
                                                Confederación *
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0 text-muted">
                                                    <AccountBalanceIcon sx={{ fontSize: 18 }} />
                                                </span>
                                                <select
                                                    className="form-select border-start-0 ps-1"
                                                    value={confId}
                                                    onChange={e => setConfId(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Selecciona una confederación...</option>
                                                    {confederaciones.map(c => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.codigo} {c.nombre ? `- ${c.nombre}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer border-top bg-light px-4 py-3">
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
                                                    <span>{editId ? 'Guardar cambios' : 'Crear país'}</span>
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
        </div>
    );
}
