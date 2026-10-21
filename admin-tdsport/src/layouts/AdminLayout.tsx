import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import InactivityHandler from '../components/InactivityHandler';

export default function AdminLayout() {
    return (
        <div className="d-flex min-vh-100 bg-light">
            <Sidebar />
            <InactivityHandler />

            <main className="flex-grow-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}