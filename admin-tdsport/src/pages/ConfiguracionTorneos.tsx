import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Catalogo } from '../types/database';

// Material-UI Icons
import TuneIcon from '@mui/icons-material/Tune';
import CategoryIcon from '@mui/icons-material/Category';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineRounded';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

type TabType = 'tipos_torneo' | 'formatos_torneo' | 'temporadas' | 'estados_torneo';

interface TabConfig {
    id: TabType;
    label: string;
    description: string;
    icon: React.ElementType;
}

const TABS: TabConfig[] = [
    { id: 'tipos_torneo', label: 'Tipos de Torneo', description: 'Ej. Liga, Copa, Torneo Corto', icon: CategoryIcon },
    { id: 'formatos_torneo', label: 'Formatos', description: 'Ej. Todos contra todos, Eliminación directa', icon: FormatListBulletedIcon },
    { id: 'temporadas', label: 'Temporadas', description: 'Ej. 2025, Apertura 2026, Clausura 2026', icon: CalendarMonthIcon },
    { id: 'estados_torneo', label: 'Estados', description: 'Ej. Programado, En Curso, Finalizado', icon: ToggleOnIcon },
];

export default function ConfiguracionTorneos() {
    const [activeTab, setActiveTab] = useState<TabType>('tipos_torneo');
    const [data, setData] = useState<Catalogo[]>([]);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nombre, setNombre] = useState('');
    const [editId, setEditId] = useState<number | null>(null);

    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const fetchData = async (table: TabType) => {
        setLoading(true);
        try {
            const { data: resData, error } = await supabase
                .from(table)
                .select('*')
                .order('id');

            if (error) throw error;
            if (resData) setData(resData);
        } catch (error: any) {
            console.error('Error cargando catálogo:', error);
            alert('No fue posible cargar el catálogo: ' + (error?.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const currentTabConfig = useMemo(() => {
        return TABS.find(t => t.id === activeTab) || TABS[0];
    }, [activeTab]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const payload = { nombre: nombre.trim() };
            if (editId) {
                const { error } = await supabase
                    .from(activeTab)
                    .update(payload)
                    .eq('id', editId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from(activeTab)
                    .insert([payload]);
                if (error) throw error;
            }

            setNombre('');
            setEditId(null);
            setIsModalOpen(false);
            await fetchData(activeTab);
        } catch (error: any) {
            console.error('Error guardando registro:', error);
            alert('Error al guardar el registro: ' + (error?.message || 'Error'));
        } finally {
            setGuardando(false);
        }
    };

    const handleEdit = (item: Catalogo) => {
        setNombre(item.nombre);
        setEditId(item.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (item: Catalogo) => {
        if (!confirm(`¿Eliminar "${item.nombre}" del catálogo ${currentTabConfig.label}?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from(activeTab)
                .delete()
                .eq('id', item.id);

            if (error) throw error;
            await fetchData(activeTab);
        } catch (error: any) {
            console.error('Error eliminando registro:', error);
            alert('No fue posible eliminar este registro porque puede estar asociado a torneos existentes: ' + (error?.message || ''));
        }
    };

    const dataFiltrada = useMemo(() => {
        const texto = busqueda.toLowerCase().trim();
        if (!texto) return data;
        return data.filter(item => item.nombre.toLowerCase().includes(texto));
    }, [data, busqueda]);

    const TabIcon = currentTabConfig.icon;

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
                                <TuneIcon sx={{ fontSize: 30, color: 'var(--tds-lime, #7cff4f)' }} />
                            </div>
                            <div>
                                <h2 className="fw-bold mb-1 text-white">Configuración de Torneos</h2>
                                <p className="text-white-50 mb-0">
                                    Administra los catálogos base: tipos de torneo, formatos, temporadas y estados.
                                </p>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <button
                                className="btn btn-primary d-inline-flex align-items-center gap-2 px-3.5 py-2 shadow-sm"
                                onClick={() => {
                                    setEditId(null);
                                    setNombre('');
                                    setIsModalOpen(true);
                                }}
                                style={{ borderRadius: '10px', fontWeight: 600 }}
                            >
                                <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                <span>Nuevo registro</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                <div className="card-body p-2.5">
                    <div className="d-flex flex-wrap gap-2">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setBusqueda('');
                                    }}
                                    className={`btn d-inline-flex align-items-center gap-2 px-3 py-2 transition-all ${isActive
                                        ? 'btn-primary shadow-sm fw-semibold'
                                        : 'btn-light text-secondary border-0 fw-medium'
                                        }`}
                                    style={{ borderRadius: '10px', fontSize: '0.9rem' }}
                                >
                                    <Icon sx={{ fontSize: 19 }} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
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
                                        Registros en {currentTabConfig.label}
                                    </small>
                                    <h3 className="fw-bold mb-0 mt-1 text-dark">
                                        {data.length}
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
                                    <TabIcon sx={{ fontSize: 24 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTROS Y TABLA */}
                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                    <div className="card-header bg-white border-bottom py-3">
                        <div className="row align-items-center justify-content-between g-3">
                            <div className="col-12 col-md-6 col-lg-5">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0 text-muted">
                                        <SearchIcon sx={{ fontSize: 20 }} />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 ps-1"
                                        placeholder={`Buscar en ${currentTabConfig.label.toLowerCase()}...`}
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="col-12 col-md-auto text-md-end text-muted small">
                                {currentTabConfig.description}
                            </div>
                        </div>
                    </div>

                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="text-muted mt-3 mb-0">Cargando catálogo...</p>
                            </div>
                        ) : dataFiltrada.length === 0 ? (
                            <div className="text-center py-5">
                                <div
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-2"
                                    style={{ width: 64, height: 64 }}
                                >
                                    <TabIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
                                </div>
                                <h5 className="text-muted mt-2 mb-0">No se encontraron registros</h5>
                                <p className="text-muted small">Prueba cambiando el texto de búsqueda o crea un nuevo elemento.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="px-4 py-3" style={{ width: '120px', fontSize: '0.8rem', letterSpacing: '0.5px' }}>ID</th>
                                            <th className="py-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>NOMBRE / DESCRIPCIÓN</th>
                                            <th className="px-4 py-3 text-end" style={{ width: '160px', fontSize: '0.8rem', letterSpacing: '0.5px' }}>ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dataFiltrada.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3">
                                                    <span className="badge bg-light text-secondary border font-monospace px-2 py-1">
                                                        #{item.id}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div
                                                            className="rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle text-primary"
                                                            style={{ width: 32, height: 32, flexShrink: 0 }}
                                                        >
                                                            <TabIcon sx={{ fontSize: 17 }} />
                                                        </div>
                                                        <span className="fw-semibold text-dark">{item.nombre}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-end">
                                                    <div className="d-flex justify-content-end gap-1">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                                                            title="Editar registro"
                                                            style={{ width: 34, height: 34, borderRadius: '8px' }}
                                                        >
                                                            <EditIcon sx={{ fontSize: 18 }} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item)}
                                                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
                                                            title="Eliminar registro"
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

                    {!loading && dataFiltrada.length > 0 && (
                        <div className="card-footer bg-white border-top py-2.5 px-4 d-flex justify-content-between align-items-center">
                            <small className="text-secondary">
                                Mostrando <strong>{dataFiltrada.length}</strong> de <strong>{data.length}</strong> registros en {currentTabConfig.label}
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
                                maxWidth: '480px',
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
                                        <TabIcon sx={{ fontSize: 20 }} />
                                    </div>
                                    <div>
                                        <h5 className="modal-title fw-bold mb-0 text-dark">
                                            {editId ? `Editar ${currentTabConfig.label}` : `Nuevo ${currentTabConfig.label}`}
                                        </h5>
                                        <small className="text-muted">
                                            Catálogo: {currentTabConfig.label}
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
                                    <div className="mb-2">
                                        <label className="form-label fw-semibold small text-dark">
                                            Nombre / Valor *
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted">
                                                <TabIcon sx={{ fontSize: 18 }} />
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control border-start-0 ps-1"
                                                placeholder={`Ej. ${currentTabConfig.description.replace('Ej. ', '')}`}
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                required
                                                autoFocus
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
                                                <span>{editId ? 'Guardar cambios' : 'Crear registro'}</span>
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
