import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function DashboardTorneos() {
  const [torneos, setTorneos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el formulario de creación
  const [nombre, setNombre] = useState('');
  const [formato, setFormato] = useState('Liga Regular');
  const [creando, setCreando] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTorneos();
  }, []);

  const fetchTorneos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('torneos')
      .select('*')
      .order('estado_activo', { ascending: false }); // Muestra los activos primero

    if (error) {
      console.error('Error al cargar torneos:', error);
    } else {
      setTorneos(data || []);
    }
    setLoading(false);
  };

  const handleCrearTorneo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setCreando(true);
    const { error } = await supabase.from('torneos').insert([
      {
        nombre: nombre.trim(),
        formato: formato,
        estado_activo: true
      }
    ]);

    if (error) {
      alert('Error al crear torneo: ' + error.message);
    } else {
      setNombre('');
      fetchTorneos();
    }
    setCreando(false);
  };

  // NUEVO: Función para apagar/encender torneos con un clic
  const handleToggleEstado = async (id: string, estadoActual: boolean) => {
    const { error } = await supabase
      .from('torneos')
      .update({ estado_activo: !estadoActual })
      .eq('id', id);

    if (error) {
      alert('Error al actualizar estado: ' + error.message);
    } else {
      fetchTorneos();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Cálculos rápidos para los KPIs
  const torneosActivos = torneos.filter(t => t.estado_activo).length;
  const torneosFinalizados = torneos.length - torneosActivos;
  const partidosActivos = torneos.reduce((acc, t) => acc + t.partidos_activos, 0);
  const partidosFinalizados = torneos.reduce((acc, t) => acc + t.partidos_finalizados, 0);

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar px-4 shadow-sm d-flex justify-content-center align-items-center py-3" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e0e5ec' }}>
        <span className="navbar-brand mb-0 fw-bold text-dark" style={{ fontSize: '1.75rem', letterSpacing: '0.5px' }}>TDSPORT Panel de Administración</span>
      </nav>

      <div className="container py-5">

        {/* cuadros de metricas */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card text-white bg-primary shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Total de Torneos</h5>
                <p className="card-text display-6 fw-bold">{torneos.length}</p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-white bg-success shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Partidos Activos</h5>
                <p className="card-text display-6 fw-bold">{partidosActivos}</p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-white bg-secondary shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Torneos Finalizados</h5>
                <p className="card-text display-6 fw-bold">{torneosFinalizados}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tabla de Torneos Optimizado */}
        <div className="col-12 col-md-8">
          <div className="card shadow-sm h-100 bg-white">
            <div className="card-body">
              <h2 className="card-title h5 mb-3 text-dark">Torneos Activos e Histórico</h2>

              {loading ? (
                <div className="text-center py-5 text-secondary">Cargando torneos...</div>
              ) : torneos.length === 0 ? (
                <div className="text-center py-5 text-secondary bg-light rounded border border-dashed">
                  Aún no hay torneos registrados. Utiliza el formulario para crear uno.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Nombre</th>
                        <th>Formato</th>
                        <th className="text-center">Estado</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {torneos.map((torneo) => (
                        <tr key={torneo.id}>
                          <td className="fw-medium text-dark">{torneo.nombre}</td>
                          <td className="text-secondary">{torneo.formato}</td>
                          <td className="text-center">
                            {/* Botón interactivo para cambiar el estado */}
                            <button
                              onClick={() => handleToggleEstado(torneo.id, torneo.estado_activo)}
                              className={`btn btn-sm rounded-pill w-100 fw-bold ${torneo.estado_activo ? 'btn-success' : 'btn-outline-secondary'}`}
                            >
                              {torneo.estado_activo ? 'ACTIVO' : 'FINALIZADO'}
                            </button>
                          </td>
                          <td className="text-center">
                            {/* Deep Link: Pasa el ID del torneo a la pantalla de partidos */}
                            <button
                              onClick={() => navigate(`/partidos?torneo_id=${torneo.id}`)}
                              className="btn btn-sm btn-primary"
                            >
                              Administrar Fechas
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
    </div>

  );
}