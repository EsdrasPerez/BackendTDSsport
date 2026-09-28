import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginAdmin from './pages/LoginAdmin';
import DashboardTorneos from './pages/DashboardTorneos';
import AdminLayout from './layouts/AdminLayout';
import Torneo from './pages/Torneo';
import Confederaciones from './pages/Confederaciones';
import Paises from './pages/Paises';
import ConfiguracionTorneos from './pages/ConfiguracionTorneos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública (Pantalla completa, sin Sidebar) */}
        <Route path="/login" element={<LoginAdmin />} />

        {/* Rutas Privadas (Envueltas en el Sidebar) */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={<DashboardTorneos />} />
          <Route path="/dashboard" element={<DashboardTorneos />} />
          <Route path="/torneos" element={<Torneo />} />
          <Route path="/torneos/confederaciones" element={<Confederaciones />} />
          <Route path="/torneos/paises" element={<Paises />} />
          <Route path="/torneos/configuracion" element={<ConfiguracionTorneos />} />
          <Route path="/partidos" element={<div>Gestión de Partidos (En construcción)</div>} />
          <Route path="/quinielas-activas" element={<div>Quinielas Activas (En construcción)</div>} />
          <Route path="/calendario" element={<div>Calendario (En construcción)</div>} />
          <Route path="/carga-resultados" element={<div>Resultados (En construcción)</div>} />
          <Route path="/configuraciones" element={<div>Configuraciones (En construcción)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

