import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function CierrePartidos() {
    const navigate = useNavigate();
    const [partidos, setPartidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado temporal para guardar los goles que el admin escribe en los inputs
    const [resultados, setResultados] = useState<Record<string, { local: number, visitante: number }>>({});

    useEffect(() => {
        cargarPartidosPendientes();
    }, []);

    const cargarPartidosPendientes = async () => {
        setLoading(true);
        // Traemos solo los partidos que NO están finalizados (estado_id diferente de 3)
        const { data, error } = await supabase
            .from('partidos')
            .select(`
        id, fecha_hora, 
        torneos ( nombre ),
        local:local_id ( nombre ),
        visitante:visitante_id ( nombre )
      `)
            .neq('estado_id', 3)
            .order('fecha_hora', { ascending: true });

        if (!error && data) setPartidos(data);
        setLoading(false);
    };

    const handleGolesChange = (partidoId: string, tipo: 'local' | 'visitante', valor: string) => {
        const goles = parseInt(valor) || 0;
        setResultados(prev => ({
            ...prev,
            [partidoId]: {
                ...prev[partidoId],
                [tipo]: goles
            }
        }));
    };

    const finalizarPartido = async (partidoId: string) => {
        const res = resultados[partidoId];
        if (!res || res.local === undefined || res.visitante === undefined) {
            alert("Por favor ingresa los goles de ambos equipos antes de finalizar.");
            return;
        }

        if (!window.confirm("¿Estás seguro? Esto disparará el cálculo de puntos y no se puede deshacer.")) return;

        // AL HACER ESTE UPDATE, EL TRIGGER DE POSTGRESQL SE DISPARARÁ AUTOMÁTICAMENTE
        const { error } = await supabase
            .from('partidos')
            .update({
                goles_local: res.local,
                goles_visitante: res.visitante,
                estado_id: 3 // 3 = FINALIZADO
            })
            .eq('id', partidoId);

        if (error) {
            alert("Error al finalizar: " + error.message);
        } else {
            alert("¡Partido finalizado! El trigger ha calculado los puntos.");
            cargarPartidosPendientes(); // Recargamos para que desaparezca de esta lista
        }
    };

    return (
        <div className="min-vh-100 bg-light">
            <nav className="navbar navbar-dark bg-dark px-4 shadow-sm d-flex justify-content-between align-items-center">
                <span className="navbar-brand mb-0 h1">TDSPORT - Cierre de Partidos</span>
                <div className="d-flex gap-2">
                    <button onClick={() => navigate('/partidos')} className="btn btn-secondary">
                        Volver a Agenda
                    </button>
                </div>
            </nav>

            <div className="container py-5">
                <div className="card shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title h5 mb-3 text-dark">Partidos Pendientes de Resultado</h2>

                        {loading ? (
                            <div className="text-center py-5 text-secondary">Buscando partidos...</div>
                        ) : partidos.length === 0 ? (
                            <div className="text-center py-5 text-secondary bg-light rounded border border-dashed">
                                No hay partidos pendientes. Todos han sido finalizados.
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Torneo</th>
                                            <th className="text-end">Local</th>
                                            <th className="text-center">Goles</th>
                                            <th>Visitante</th>
                                            <th className="text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {partidos.map(p => (
                                            <tr key={p.id}>
                                                <td className="text-secondary">{p.torneos?.nombre}</td>
                                                <td className="text-end fw-bold text-dark">{p.local?.nombre}</td>
                                                <td className="text-center">
                                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                                        <input
                                                            type="number" min="0" className="form-control text-center" style={{width: '60px'}}
                                                            onChange={(e) => handleGolesChange(p.id, 'local', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                        <span className="fw-bold text-secondary">-</span>
                                                        <input
                                                            type="number" min="0" className="form-control text-center" style={{width: '60px'}}
                                                            onChange={(e) => handleGolesChange(p.id, 'visitante', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="fw-bold text-dark">{p.visitante?.nombre}</td>
                                                <td className="text-center">
                                                    <button
                                                        onClick={() => finalizarPartido(p.id)}
                                                        className="btn btn-success btn-sm fw-bold"
                                                    >
                                                        Cerrar Partido
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}