import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function GestionPartidos() {
  const navigate = useNavigate();
  const [torneos, setTorneos] = useState<any[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del formulario
  const [torneoId, setTorneoId] = useState('');
  const [localId, setLocalId] = useState('');
  const [visitanteId, setVisitanteId] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatosBase();
    cargarPartidos();

    const suscripcion = supabase
      .channel('cambios-partidos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partidos'
        },
        (payload) => {
          console.log('Cambio recibido:', payload);
          cargarPartidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(suscripcion);
    };
  }, []);

  const cargarDatosBase = async () => {
    const { data: dataTorneos } = await supabase.from('torneos').select('*').eq('estado_activo', true);
    const { data: dataEquipos } = await supabase.from('equipos').select('*').order('nombre');

    if (dataTorneos) setTorneos(dataTorneos);
    if (dataEquipos) setEquipos(dataEquipos);
  };

  const cargarPartidos = async () => {
    setLoading(true);
    // Hacemos un JOIN simple para traer los nombres en lugar de solo los IDs
    const { data, error } = await supabase
      .from('partidos')
      .select(`
        id, fecha_hora, goles_local, goles_visitante, estado_id,
        torneos ( nombre ),
        local:local_id ( nombre ),
        visitante:visitante_id ( nombre )
      `)
      .order('fecha_hora', { ascending: true });

    if (!error && data) setPartidos(data);
    setLoading(false);
  };

  const handleProgramarPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localId === visitanteId) {
      alert("Un equipo no puede jugar contra sí mismo");
      return;
    }

    setGuardando(true);
    const { error } = await supabase.from('partidos').insert([
      {
        torneo_id: torneoId,
        local_id: localId,
        visitante_id: visitanteId,
        fecha_hora: fechaHora,
        estado_id: 1 // 1 = "FUTURO" según tus reglas de negocio
      }
    ]);

    if (error) {
      alert("Error al programar: " + error.message);
    } else {
      // Limpiar formulario
      setLocalId(''); setVisitanteId(''); setFechaHora('');
      cargarPartidos(); // Recargar la tabla
    }
    setGuardando(false);
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-dark px-4 shadow-sm d-flex justify-content-between align-items-center">
        <span className="navbar-brand mb-0 h1">TDSPORT - Gestión de Partidos</span>
        <button onClick={() => navigate('/torneos')} className="btn btn-secondary">
          Volver a Torneos
        </button>
      </nav>

      <div className="container py-5">
        <div className="row g-4">

          {/* COLUMNA IZQUIERDA: Formulario */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="card-title h5 mb-3 text-dark">Programar Nueva Fecha</h2>
                <form onSubmit={handleProgramarPartido} className="d-flex flex-column gap-3">

                  <div>
                    <label className="form-label mb-1 fw-medium">Torneo</label>
                    <select
                      className="form-select"
                      value={torneoId} onChange={(e) => setTorneoId(e.target.value)} required
                    >
                      <option value="">Seleccione un torneo...</option>
                      {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="form-label mb-1 fw-medium">Equipo Local</label>
                    <select
                      className="form-select"
                      value={localId} onChange={(e) => setLocalId(e.target.value)} required
                    >
                      <option value="">Seleccione local...</option>
                      {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="form-label mb-1 fw-medium">Equipo Visitante</label>
                    <select
                      className="form-select"
                      value={visitanteId} onChange={(e) => setVisitanteId(e.target.value)} required
                    >
                      <option value="">Seleccione visitante...</option>
                      {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="form-label mb-1 fw-medium">Fecha y Hora</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={fechaHora} onChange={(e) => setFechaHora(e.target.value)} required
                    />
                  </div>

                  <button
                    type="submit" disabled={guardando}
                    className="btn btn-primary mt-2 fw-bold"
                  >
                    {guardando ? 'Guardando...' : 'Agendar Partido'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Tabla de Partidos */}
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="card-title h5 mb-3 text-dark">Calendario de Partidos</h2>

                {loading ? (
                  <div className="text-center py-5 text-secondary">Cargando calendario...</div>
                ) : partidos.length === 0 ? (
                  <div className="text-center py-5 text-secondary bg-light rounded border border-dashed">No hay partidos programados.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Fecha</th>
                          <th>Torneo</th>
                          <th className="text-end">Local</th>
                          <th className="text-center">vs</th>
                          <th>Visitante</th>
                          <th className="text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partidos.map(p => (
                          <tr key={p.id}>
                            <td className="text-nowrap">{new Date(p.fecha_hora).toLocaleString()}</td>
                            <td>{p.torneos?.nombre}</td>
                            <td className="text-end fw-bold">{p.local?.nombre}</td>
                            <td className="text-center text-secondary">-</td>
                            <td className="fw-bold">{p.visitante?.nombre}</td>
                            <td className="text-center">
                              <span className="badge bg-primary rounded-pill">
                                {p.estado_id === 1 ? 'FUTURO' : 'OTRO'}
                              </span>
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
      </div>
    </div>
  );
}