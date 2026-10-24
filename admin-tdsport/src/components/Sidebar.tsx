import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Material-UI Icons
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StadiumIcon from '@mui/icons-material/Stadium';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ShieldIcon from '@mui/icons-material/Shield';
import PublicIcon from '@mui/icons-material/Public';
import FlagIcon from '@mui/icons-material/Flag';
import TuneIcon from '@mui/icons-material/Tune';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function Sidebar() {
    const { logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const currentPath = location.pathname;

    const isPartidosActive = currentPath.startsWith('/partidos') || currentPath === '/calendario-partidos';
    const isCompeticionesActive = currentPath.startsWith('/torneos');

    const [isPartidosOpen, setIsPartidosOpen] = useState(isPartidosActive);
    const [isCompeticionesOpen, setIsCompeticionesOpen] = useState(isCompeticionesActive);

    // Mantener abierto el submenú si la ruta activa corresponde a él
    useEffect(() => {
        if (isPartidosActive) setIsPartidosOpen(true);
        if (isCompeticionesActive) setIsCompeticionesOpen(true);
    }, [currentPath, isPartidosActive, isCompeticionesActive]);

    const handleTogglePartidos = () => {
        if (isCollapsed) {
            setIsCollapsed(false);
            setIsPartidosOpen(true);
        } else {
            setIsPartidosOpen(!isPartidosOpen);
        }
    };

    const handleToggleCompeticiones = () => {
        if (isCollapsed) {
            setIsCollapsed(false);
            setIsCompeticionesOpen(true);
        } else {
            setIsCompeticionesOpen(!isCompeticionesOpen);
        }
    };

    const handleLogout = async () => {
        try {
            await logout('manual');
        } finally {
            navigate('/login', { replace: true });
        }
    };

    return (
        <aside className={`sidebar-container ${isCollapsed ? 'collapsed' : 'expanded'}`}>
            {/* SIDEBAR HEADER */}
            <div className="sidebar-header">
                {!isCollapsed && (
                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                        <img
                            src="/TDLOGOAZUL.png"
                            alt="TDSPORT Logo"
                            style={{ height: '36px', objectFit: 'contain' }}
                        />
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="sidebar-toggle-btn"
                    title={isCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
                    aria-label={isCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
                >
                    {isCollapsed ? (
                        <ChevronRightIcon sx={{ fontSize: 22 }} />
                    ) : (
                        <ChevronLeftIcon sx={{ fontSize: 22 }} />
                    )}
                </button>
            </div>

            {/* SIDEBAR NAVIGATION */}
            <nav className="sidebar-nav">
                <ul className="sidebar-menu">
                    {/* Dashboard */}
                    <li>
                        <Link
                            to="/dashboard"
                            className={`sidebar-link ${currentPath === '/dashboard' || currentPath === '/' ? 'active' : ''}`}
                            title="Dashboard"
                        >
                            <span className="sidebar-icon">
                                <DashboardIcon sx={{ fontSize: 22 }} />
                            </span>
                            <span className="sidebar-label">Dashboard</span>
                        </Link>
                    </li>

                    {/* Menú desplegable: Partidos */}
                    <li className="sidebar-dropdown">
                        <div
                            className={`sidebar-dropdown-toggle ${isPartidosActive ? 'active-parent' : ''}`}
                            onClick={handleTogglePartidos}
                            title="Partidos"
                        >
                            <span className="sidebar-icon">
                                <StadiumIcon sx={{ fontSize: 22 }} />
                            </span>
                            <span className="sidebar-label">Partidos</span>
                            <span className={`sidebar-chevron ${isPartidosOpen && !isCollapsed ? 'open' : ''}`}>
                                <ExpandMoreIcon sx={{ fontSize: 20 }} />
                            </span>
                        </div>

                        {isPartidosOpen && !isCollapsed && (
                            <ul className="sidebar-submenu">
                                <li>
                                    <Link
                                        to="/partidos"
                                        className={`sidebar-submenu-link ${currentPath === '/partidos' ? 'active' : ''}`}
                                    >
                                        <SportsSoccerIcon sx={{ fontSize: 16 }} />
                                        <span>Gestionar Partidos</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/calendario-partidos"
                                        className={`sidebar-submenu-link ${currentPath === '/calendario-partidos' ? 'active' : ''}`}
                                    >
                                        <CalendarMonthIcon sx={{ fontSize: 16 }} />
                                        <span>Calendario Partidos</span>
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>

                    {/* Menú desplegable: Competiciones */}
                    <li className="sidebar-dropdown">
                        <div
                            className={`sidebar-dropdown-toggle ${isCompeticionesActive ? 'active-parent' : ''}`}
                            onClick={handleToggleCompeticiones}
                            title="Competiciones"
                        >
                            <span className="sidebar-icon">
                                <EmojiEventsIcon sx={{ fontSize: 22 }} />
                            </span>
                            <span className="sidebar-label">Competiciones</span>
                            <span className={`sidebar-chevron ${isCompeticionesOpen && !isCollapsed ? 'open' : ''}`}>
                                <ExpandMoreIcon sx={{ fontSize: 20 }} />
                            </span>
                        </div>

                        {isCompeticionesOpen && !isCollapsed && (
                            <ul className="sidebar-submenu">
                                <li>
                                    <Link
                                        to="/torneos"
                                        className={`sidebar-submenu-link ${currentPath === '/torneos' ? 'active' : ''}`}
                                    >
                                        <EmojiEventsIcon sx={{ fontSize: 16 }} />
                                        <span>Gestión de Torneos</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/torneos/equipos"
                                        className={`sidebar-submenu-link ${currentPath === '/torneos/equipos' ? 'active' : ''}`}
                                    >
                                        <ShieldIcon sx={{ fontSize: 16 }} />
                                        <span>Equipos</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/torneos/confederaciones"
                                        className={`sidebar-submenu-link ${currentPath === '/torneos/confederaciones' ? 'active' : ''}`}
                                    >
                                        <PublicIcon sx={{ fontSize: 16 }} />
                                        <span>Confederaciones</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/torneos/paises"
                                        className={`sidebar-submenu-link ${currentPath === '/torneos/paises' ? 'active' : ''}`}
                                    >
                                        <FlagIcon sx={{ fontSize: 16 }} />
                                        <span>Países</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/torneos/configuracion"
                                        className={`sidebar-submenu-link ${currentPath === '/torneos/configuracion' ? 'active' : ''}`}
                                    >
                                        <TuneIcon sx={{ fontSize: 16 }} />
                                        <span>Configuración</span>
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>

                    {/* Carga de Resultados */}
                    <li>
                        <Link
                            to="/carga-resultados"
                            className={`sidebar-link ${currentPath === '/carga-resultados' ? 'active' : ''}`}
                            title="Carga de Resultados"
                        >
                            <span className="sidebar-icon">
                                <SportsScoreIcon sx={{ fontSize: 22 }} />
                            </span>
                            <span className="sidebar-label">Carga de Resultados</span>
                        </Link>
                    </li>

                    {/* Configuraciones */}
                    <li>
                        <Link
                            to="/configuraciones"
                            className={`sidebar-link ${currentPath === '/configuraciones' ? 'active' : ''}`}
                            title="Configuraciones"
                        >
                            <span className="sidebar-icon">
                                <SettingsIcon sx={{ fontSize: 22 }} />
                            </span>
                            <span className="sidebar-label">Configuraciones</span>
                        </Link>
                    </li>
                </ul>
            </nav>

            {/* SIDEBAR FOOTER */}
            <div className="sidebar-footer">
                <button
                    onClick={handleLogout}
                    className="sidebar-logout-btn"
                    title="Cerrar Sesión"
                    aria-label="Cerrar Sesión"
                >
                    <LogoutIcon sx={{ fontSize: 20 }} />
                    {!isCollapsed && <span>Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
}