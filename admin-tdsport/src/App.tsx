import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AdminLayout from './layouts/AdminLayout';

// Páginas
import LoginAdmin from './pages/LoginAdmin';
import DashboardTorneos from './pages/DashboardTorneos';
import Torneo from './pages/Torneo';
import Confederaciones from './pages/Confederaciones';
import Paises from './pages/Paises';
import ConfiguracionTorneos from './pages/ConfiguracionTorneos';
import Equipos from './pages/Equipos';
import GestionPartidos from './pages/GestionPartidos';
import CalendarioPartidos from './pages/CalendarioPartidos';
import CargaResultados from './pages/CargaResultados';
import CierrePartidos from './pages/CierrePartidos';
import Configuraciones from './pages/Configuraciones';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta Pública Protegida (Si ya está autenticado, redirige al Dashboard) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginAdmin />
              </PublicRoute>
            }
          />

          {/* Rutas Privadas Blindadas (Requieren sesión activa en Supabase) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              {/* Raíz redirige al dashboard administrativo */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardTorneos />} />
              <Route path="/torneos" element={<Torneo />} />
              <Route path="/torneos/confederaciones" element={<Confederaciones />} />
              <Route path="/torneos/paises" element={<Paises />} />
              <Route path="/torneos/configuracion" element={<ConfiguracionTorneos />} />
              <Route path="/torneos/equipos" element={<Equipos />} />

              <Route path="/quinielas-activas" element={<div className="p-4 text-muted">Quinielas Activas (En construcción)</div>} />
              <Route path="/calendario-partidos" element={<CalendarioPartidos />} />
              <Route path="/carga-resultados" element={<CargaResultados />} />
              <Route path="/cierre-partidos" element={<CierrePartidos />} />
              <Route path="/configuraciones" element={<Configuraciones />} />
              <Route path="/partidos" element={<GestionPartidos />} />
            </Route>
          </Route>

          {/* Ruta Comodín: Cualquier URL desconocida redirige a la raíz protegida */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
