import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
    return (
        <div className="d-flex min-vh-100 bg-light">
            {/* Menú Lateral Fijo */}
            <Sidebar />

            {/* Contenedor Principal Dinámico */}
            <main className="flex-grow-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}