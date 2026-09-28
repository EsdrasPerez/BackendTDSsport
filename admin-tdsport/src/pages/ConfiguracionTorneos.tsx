import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Catalogo } from '../types/database';

type TabType = 'tipos_torneo' | 'formatos_torneo' | 'temporadas' | 'estados_torneo';

export default function ConfiguracionTorneos() {
    const [activeTab, setActiveTab] = useState<TabType>('tipos_torneo');
    const [data, setData] = useState<Catalogo[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nombre, setNombre] = useState('');
    const [editId, setEditId] = useState<number | null>(null);

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const fetchData = async (table: TabType) => {
        setLoading(true);
        const { data: resData, error } = await supabase.from(table).select('*').order('id');
        if (!error && resData) setData(resData);
        setLoading(false);
    };

    const getTabTitle = () => {
        switch (activeTab) {
            case 'tipos_torneo': return 'Tipos de Torneo';
            case 'formatos_torneo': return 'Formatos';
            case 'temporadas': return 'Temporadas';
            case 'estados_torneo': return 'Estados';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editId) {
            await supabase.from(activeTab).update({ nombre }).eq('id', editId);
        } else {
            await supabase.from(activeTab).insert([{ nombre }]);
        }
        setIsModalOpen(false);
        fetchData(activeTab);
    };

    const handleEdit = (item: Catalogo) => {
        setNombre(item.nombre);
        setEditId(item.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Eliminar este registro?')) {
            await supabase.from(activeTab).delete().eq('id', id);
            fetchData(activeTab);
        }
    };

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            <h1 className="h3 mb-4 fw-bold text-dark">Configuración de Torneos</h1>

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-bottom p-0">
                    <ul className="nav nav-tabs border-0 mt-3 ms-3">
                        {(['tipos_torneo', 'formatos_torneo', 'temporadas', 'estados_torneo'] as TabType[]).map(tab => (
                            <li className="nav-item" key={tab}>
                                <button
                                    className={`nav-link ${activeTab === tab ? 'active fw-bold text-success border-bottom-0' : 'text-muted border-0'}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold mb-0">Gestión de {getTabTitle()}</h5>
                        <button onClick={() => { setEditId(null); setNombre(''); setIsModalOpen(true); }} className="btn btn-success btn-sm">+ Nuevo</button>
                    </div>

                    <table className="table table-hover">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={3} className="text-center py-4">Cargando...</td></tr> : data.map(item => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td className="fw-medium">{item.nombre}</td>
                                    <td className="text-end">
                                        <button onClick={() => handleEdit(item)} className="btn btn-sm btn-outline-secondary me-2">Editar</button>
                                        <button onClick={() => handleDelete(item.id)} className="btn btn-sm btn-outline-danger">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && data.length === 0 && (
                                <tr><td colSpan={3} className="text-center py-4 text-muted">No hay registros.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '400px' }}>
                        <div className="card-body p-4">
                            <h4>{editId ? 'Editar' : 'Nuevo'}</h4>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Nombre</label>
                                    <input type="text" className="form-control" value={nombre} onChange={e => setNombre(e.target.value)} required />
                                </div>
                                <div className="d-flex justify-content-end gap-2 mt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-light">Cancelar</button>
                                    <button type="submit" className="btn btn-success">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
