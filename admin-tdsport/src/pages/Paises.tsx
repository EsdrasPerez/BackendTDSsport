import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Pais, Confederacion } from '../types/database';

export default function Paises() {
    const [paises, setPaises] = useState<Pais[]>([]);
    const [confederaciones, setConfederaciones] = useState<Confederacion[]>([]);
    const [loading, setLoading] = useState(true);

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
        const payload = { nombre, codigo_iso: codigoIso, confederacion_id: parseInt(confId) };
        if (editId) {
            await supabase.from('paises').update(payload).eq('id', editId);
        } else {
            await supabase.from('paises').insert([payload]);
        }
        setIsModalOpen(false);
        fetchDatos();
    };

    const handleEdit = (pais: Pais) => {
        setNombre(pais.nombre);
        setCodigoIso(pais.codigo_iso);
        setConfId(pais.confederacion_id.toString());
        setEditId(pais.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Eliminar país?')) {
            await supabase.from('paises').delete().eq('id', id);
            fetchDatos();
        }
    };

    const paisesFiltrados = paises.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        (filtroConf ? p.confederacion_id.toString() === filtroConf : true)
    );

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 mb-1 fw-bold text-dark">Gestión de Países</h1>
                <button onClick={() => { setEditId(null); setNombre(''); setCodigoIso(''); setConfId(''); setIsModalOpen(true); }} className="btn btn-success fw-bold shadow-sm">
                    + Nuevo país
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-bottom py-3 d-flex gap-3">
                    <input type="text" className="form-control w-25" placeholder="Buscar país..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                    <select className="form-select w-25" value={filtroConf} onChange={e => setFiltroConf(e.target.value)}>
                        <option value="">Todas las confederaciones</option>
                        {confederaciones.map(c => <option key={c.id} value={c.id}>{c.codigo}</option>)}
                    </select>
                </div>
                <div className="card-body p-0">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="px-4 py-3">País</th>
                                <th className="py-3">Código ISO</th>
                                <th className="py-3">Confederación</th>
                                <th className="px-4 py-3 text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={4} className="text-center py-4">Cargando...</td></tr> : paisesFiltrados.map(pais => (
                                <tr key={pais.id}>
                                    <td className="px-4 py-3 fw-bold">{pais.nombre}</td>
                                    <td className="py-3">{pais.codigo_iso}</td>
                                    <td className="py-3"><span className="badge bg-light text-dark border">{pais.confederacion?.codigo}</span></td>
                                    <td className="px-4 py-3 text-end">
                                        <button onClick={() => handleEdit(pais)} className="btn btn-sm btn-outline-secondary me-2">✏️</button>
                                        <button onClick={() => handleDelete(pais.id)} className="btn btn-sm btn-outline-danger">🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '500px' }}>
                        <div className="card-body p-4">
                            <h4>{editId ? 'Editar' : 'Nuevo'} País</h4>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Nombre</label>
                                    <input type="text" className="form-control" value={nombre} onChange={e => setNombre(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Código ISO</label>
                                    <input type="text" className="form-control" value={codigoIso} onChange={e => setCodigoIso(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Confederación</label>
                                    <select className="form-select" value={confId} onChange={e => setConfId(e.target.value)} required>
                                        <option value="">Selecciona...</option>
                                        {confederaciones.map(c => <option key={c.id} value={c.id}>{c.codigo}</option>)}
                                    </select>
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
