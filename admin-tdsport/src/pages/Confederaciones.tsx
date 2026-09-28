import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Confederacion } from '../types/database';

export default function Confederaciones() {
    const [confederaciones, setConfederaciones] = useState<Confederacion[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nombre, setNombre] = useState('');
    const [codigo, setCodigo] = useState('');
    const [editId, setEditId] = useState<number | null>(null);

    useEffect(() => {
        fetchConfederaciones();
    }, []);

    const fetchConfederaciones = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('confederaciones').select('*').order('nombre');
        if (!error && data) setConfederaciones(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editId) {
            await supabase.from('confederaciones').update({ nombre, codigo }).eq('id', editId);
        } else {
            await supabase.from('confederaciones').insert([{ nombre, codigo }]);
        }
        setNombre('');
        setCodigo('');
        setEditId(null);
        setIsModalOpen(false);
        fetchConfederaciones();
    };

    const handleEdit = (conf: Confederacion) => {
        setNombre(conf.nombre);
        setCodigo(conf.codigo);
        setEditId(conf.id);
        setIsModalOpen(true);
    };

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Cabecera */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1 fw-bold text-dark">Gestión de Confederaciones</h1>
                </div>
                <button onClick={() => { setEditId(null); setNombre(''); setCodigo(''); setIsModalOpen(true); }} className="btn btn-success fw-bold shadow-sm">
                    + Nueva confederación
                </button>
            </div>

            <div className="row g-4">
                {loading ? <p>Cargando...</p> : confederaciones.map(conf => (
                    <div key={conf.id} className="col-12 col-md-6 col-lg-4">
                        <div className="card shadow-sm border-0">
                            <div className="card-body">
                                <h5 className="card-title fw-bold">{conf.codigo}</h5>
                                <p className="card-text text-muted">{conf.nombre}</p>
                                <div className="d-flex justify-content-end mt-3 pt-3 border-top">
                                    <button onClick={() => handleEdit(conf)} className="btn btn-sm btn-outline-primary">Editar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '500px' }}>
                        <div className="card-body p-4">
                            <h4>{editId ? 'Editar' : 'Nueva'} Confederación</h4>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Código</label>
                                    <input type="text" className="form-control" value={codigo} onChange={e => setCodigo(e.target.value)} required />
                                </div>
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
