import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

// MUI Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import RefreshIcon from "@mui/icons-material/Refresh";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ShieldIcon from "@mui/icons-material/Shield";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import StadiumIcon from "@mui/icons-material/Stadium";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface Estadisticas {
  torneos: number;
  equipos: number;
  partidosPendientes: number;
  quinielasActivas: number | null;
  partidosEnJuego: number;
  partidosFinalizados: number;
}

interface Partido {
  id: string;
  fecha_hora: string;
  goles_local: number | null;
  goles_visitante: number | null;
  estado_id: number;
  torneo_nombre: string;
  local_nombre: string;
  visitante_nombre: string;
}

export default function Dashboard() {
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    torneos: 0,
    equipos: 0,
    partidosPendientes: 0,
    quinielasActivas: null,
    partidosEnJuego: 0,
    partidosFinalizados: 0,
  });

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDashboard();
  }, []);

  async function cargarDashboard() {
    setCargando(true);
    setError("");

    try {
      const [
        torneosRes,
        equiposRes,
        pendientesRes,
        enJuegoRes,
        finalizadosRes,
        quinielasRes,
        partidosRes,
      ] = await Promise.all([
        supabase
          .from("torneos")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("equipos")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("partidos")
          .select("*", { count: "exact", head: true })
          .eq("estado_id", 1),

        supabase
          .from("partidos")
          .select("*", { count: "exact", head: true })
          .eq("estado_id", 2),

        supabase
          .from("partidos")
          .select("*", { count: "exact", head: true })
          .eq("estado_id", 3),

        supabase
          .from("quinielas")
          .select("id, estado"),

        supabase
          .from("partidos")
          .select(`
            id,
            fecha_hora,
            goles_local,
            goles_visitante,
            estado_id,
            torneos ( nombre ),
            local:local_id ( nombre ),
            visitante:visitante_id ( nombre )
          `)
          .eq("estado_id", 1)
          .gte("fecha_hora", new Date().toISOString())
          .order("fecha_hora", { ascending: true })
          .limit(5),
      ]);

      const errores = [
        torneosRes.error,
        equiposRes.error,
        pendientesRes.error,
        enJuegoRes.error,
        finalizadosRes.error,
        partidosRes.error,
      ].filter(Boolean);

      if (errores.length > 0) {
        throw new Error(
          errores.map((e) => e?.message).join(" | ")
        );
      }

      // El campo estado debe existir en quinielas.
      // Si aún no existe, el resto del dashboard seguirá funcionando.
      const quinielasActivas = quinielasRes.error
        ? null
        : (quinielasRes.data ?? []).filter(
          (q) => q.estado === "ACTIVA"
        ).length;

      setEstadisticas({
        torneos: torneosRes.count ?? 0,
        equipos: equiposRes.count ?? 0,
        partidosPendientes: pendientesRes.count ?? 0,
        quinielasActivas,
        partidosEnJuego: enJuegoRes.count ?? 0,
        partidosFinalizados: finalizadosRes.count ?? 0,
      });

      if (partidosRes.data) {
        const lista = partidosRes.data as any[];

        setPartidos(
          lista.map((p) => ({
            id: p.id,
            fecha_hora: p.fecha_hora,
            goles_local: p.goles_local,
            goles_visitante: p.goles_visitante,
            estado_id: p.estado_id,
            torneo_nombre: p.torneos?.nombre ?? "Sin torneo",
            local_nombre: p.local?.nombre ?? "Equipo local",
            visitante_nombre:
              p.visitante?.nombre ?? "Equipo visitante",
          }))
        );
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo cargar el dashboard."
      );
    } finally {
      setCargando(false);
    }
  }

  const tarjetas = [
    {
      titulo: "Torneos",
      valor: estadisticas.torneos,
      icon: EmojiEventsIcon,
      color: "#ff9800",
      bg: "rgba(255, 152, 0, 0.12)",
      descripcion: "Torneos registrados",
    },
    {
      titulo: "Equipos",
      valor: estadisticas.equipos,
      icon: ShieldIcon,
      color: "#0d6efd",
      bg: "rgba(13, 110, 253, 0.12)",
      descripcion: "Equipos registrados",
    },
    {
      titulo: "Partidos pendientes",
      valor: estadisticas.partidosPendientes,
      icon: CalendarMonthIcon,
      color: "#6f42c1",
      bg: "rgba(111, 66, 193, 0.12)",
      descripcion: "Por disputarse",
    },
    {
      titulo: "Quinielas activas",
      valor: estadisticas.quinielasActivas,
      icon: GroupsIcon,
      color: "#198754",
      bg: "rgba(25, 135, 84, 0.12)",
      descripcion: "En funcionamiento",
    },
  ];

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
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <DashboardIcon sx={{ fontSize: 32, color: "var(--tds-lime, #7cff4f)" }} />
              </div>
              <div>
                <h2 className="fw-bold mb-1 text-white">Dashboard Principal</h2>
                <p className="text-white-50 mb-0">
                  Resumen general y métricas del sistema TDSPORT.
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className="btn btn-primary d-inline-flex align-items-center gap-2 px-3.5 py-2 shadow-sm"
                onClick={cargarDashboard}
                disabled={cargando}
                style={{ borderRadius: "10px", fontWeight: 600 }}
              >
                <RefreshIcon sx={{ fontSize: 20 }} className={cargando ? "spin" : ""} />
                <span>{cargando ? "Actualizando..." : "Actualizar datos"}</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger shadow-sm mb-4" role="alert" style={{ borderRadius: "12px" }}>
            <strong>Error al cargar los datos:</strong> {error}
          </div>
        )}

        {/* STATS CARDS */}
        <div className="row g-3 mb-4">
          {tarjetas.map((tarjeta) => {
            const Icon = tarjeta.icon;
            return (
              <div className="col-12 col-sm-6 col-xl-3" key={tarjeta.titulo}>
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "16px" }}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="text-muted small fw-medium mb-1">
                          {tarjeta.titulo}
                        </p>
                        <h2 className="fw-bold mb-1 text-dark">
                          {cargando
                            ? "..."
                            : tarjeta.valor === null
                              ? "N/D"
                              : tarjeta.valor}
                        </h2>
                        <small className="text-muted">
                          {tarjeta.descripcion}
                        </small>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: tarjeta.bg,
                        }}
                      >
                        <Icon sx={{ fontSize: 26, color: tarjeta.color }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* MIDDLE SECTION */}
        <div className="row g-4 mb-4">
          {/* ESTADO DE LOS PARTIDOS */}
          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "16px" }}>
              <div className="card-header bg-white py-3 px-4 border-bottom">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <SportsSoccerIcon sx={{ fontSize: 22, color: "var(--tds-navy, #0f1e36)" }} />
                  <span>Estado de los Partidos</span>
                </h5>
              </div>

              <div className="card-body p-4 d-flex flex-column justify-content-around">
                <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle p-2 rounded-circle d-flex align-items-center justify-content-center">
                      <FiberManualRecordIcon sx={{ fontSize: 16, color: "#ff9800" }} />
                    </span>
                    <div>
                      <div className="fw-semibold">En Juego</div>
                      <div className="small text-muted">Partidos con marcador en vivo</div>
                    </div>
                  </div>
                  <span className="fs-4 fw-bold text-dark">
                    {cargando ? "..." : estadisticas.partidosEnJuego}
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success-subtle text-success border border-success-subtle p-2 rounded-circle d-flex align-items-center justify-content-center">
                      <CheckCircleIcon sx={{ fontSize: 16, color: "#198754" }} />
                    </span>
                    <div>
                      <div className="fw-semibold">Finalizados</div>
                      <div className="small text-muted">Partidos concluidos</div>
                    </div>
                  </div>
                  <span className="fs-4 fw-bold text-dark">
                    {cargando ? "..." : estadisticas.partidosFinalizados}
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle p-2 rounded-circle d-flex align-items-center justify-content-center">
                      <ScheduleIcon sx={{ fontSize: 16, color: "#0d6efd" }} />
                    </span>
                    <div>
                      <div className="fw-semibold">Programados</div>
                      <div className="small text-muted">Pendientes por disputarse</div>
                    </div>
                  </div>
                  <span className="fs-4 fw-bold text-dark">
                    {cargando ? "..." : estadisticas.partidosPendientes}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ACCIONES RAPIDAS */}
          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "16px" }}>
              <div className="card-header bg-white py-3 px-4 border-bottom">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <StadiumIcon sx={{ fontSize: 22, color: "var(--tds-navy, #0f1e36)" }} />
                  <span>Acciones Rápidas</span>
                </h5>
              </div>

              <div className="card-body p-4 d-flex flex-column justify-content-between gap-3">
                <Link
                  to="/partidos"
                  className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border rounded-3 text-decoration-none shadow-sm transition-all"
                  style={{ borderRadius: "12px" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 44, height: 44, backgroundColor: "rgba(13, 110, 253, 0.12)" }}
                    >
                      <StadiumIcon sx={{ fontSize: 24, color: "#0d6efd" }} />
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">Gestionar Partidos</div>
                      <div className="small text-muted">Programar, editar o cancelar encuentros</div>
                    </div>
                  </div>
                  <ArrowForwardIcon sx={{ fontSize: 20, color: "#6c757d" }} />
                </Link>

                <Link
                  to="/carga-resultados"
                  className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border rounded-3 text-decoration-none shadow-sm transition-all"
                  style={{ borderRadius: "12px" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 44, height: 44, backgroundColor: "rgba(25, 135, 84, 0.12)" }}
                    >
                      <SportsScoreIcon sx={{ fontSize: 24, color: "#198754" }} />
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">Cargar Resultados</div>
                      <div className="small text-muted">Registrar marcadores y finalizar partidos</div>
                    </div>
                  </div>
                  <ArrowForwardIcon sx={{ fontSize: 20, color: "#6c757d" }} />
                </Link>

                <Link
                  to="/calendario-partidos"
                  className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border rounded-3 text-decoration-none shadow-sm transition-all"
                  style={{ borderRadius: "12px" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 44, height: 44, backgroundColor: "rgba(111, 66, 193, 0.12)" }}
                    >
                      <CalendarMonthIcon sx={{ fontSize: 24, color: "#6f42c1" }} />
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">Calendario de Partidos</div>
                      <div className="small text-muted">Visualizar calendario mensual y semanal</div>
                    </div>
                  </div>
                  <ArrowForwardIcon sx={{ fontSize: 20, color: "#6c757d" }} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* PROXIMOS PARTIDOS */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: "16px", overflow: "hidden" }}>
          <div className="p-4 border-bottom bg-white d-flex align-items-center justify-content-between">
            <div>
              <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                <CalendarMonthIcon sx={{ fontSize: 22, color: "var(--tds-navy, #0f1e36)" }} />
                <span>Próximos Partidos</span>
              </h5>
              <p className="text-muted small mb-0">
                Los siguientes 5 encuentros programados por disputarse.
              </p>
            </div>
            <Link
              to="/partidos"
              className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1 px-3 py-1.5"
              style={{ borderRadius: "8px", fontWeight: 600 }}
            >
              <span>Ver todos</span>
              <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Link>
          </div>

          {cargando ? (
            <div className="p-5 text-center text-muted">
              <div className="spinner-border text-primary mb-2" />
              <div>Cargando próximos partidos...</div>
            </div>
          ) : partidos.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center bg-light text-muted mb-3"
                style={{ width: 64, height: 64 }}
              >
                <SportsSoccerIcon sx={{ fontSize: 32 }} />
              </div>
              <h6 className="fw-bold">No hay próximos partidos programados</h6>
              <p className="small mb-0">Programa nuevos encuentros en Gestión de Partidos.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Fecha y hora</th>
                    <th>Torneo</th>
                    <th>Partido</th>
                    <th>Estado</th>
                    <th className="text-end pe-4">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {partidos.map((partido) => (
                    <tr key={partido.id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-1.5 text-muted small">
                          <ScheduleIcon sx={{ fontSize: 16 }} />
                          <span>
                            {new Date(partido.fecha_hora).toLocaleString("es-GT", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {partido.torneo_nombre}
                        </span>
                      </td>
                      <td className="fw-semibold">
                        <span>{partido.local_nombre}</span>
                        <span className="text-muted mx-2 fw-normal">vs</span>
                        <span>{partido.visitante_nombre}</span>
                      </td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1 px-2.5 py-1">
                          <ScheduleIcon sx={{ fontSize: 14 }} />
                          <span>Programado</span>
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <Link
                          to={`/carga-resultados?partidoId=${partido.id}`}
                          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1 px-2.5 py-1"
                          style={{ borderRadius: "8px", fontSize: "0.825rem" }}
                        >
                          <SportsScoreIcon sx={{ fontSize: 16 }} />
                          <span>Marcador</span>
                        </Link>
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
  );
}

