import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isTorneosOpen, setIsTorneosOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <aside className={`sidebar-container ${isCollapsed ? 'collapsed' : 'expanded'}`}>
            <div className="sidebar-header">
                {!isCollapsed && <span className="sidebar-title">TDSPORT</span>}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="sidebar-toggle-btn"
                    title={isCollapsed ? "Expandir" : "Comprimir"}
                >
                    {isCollapsed ? '▶' : '◀'}
                </button>
            </div>

            <nav className="sidebar-nav">
                <ul className="sidebar-menu">
                    <li><Link to="/dashboard">Dashboard</Link></li>

                    {/* Menú desplegable de Equipos */}
                    <li className={`sidebar-dropdown ${isCollapsed ? 'collapsed-dropdown' : ''}`}>
                        <div
                            className="sidebar-dropdown-toggle d-flex justify-content-between align-items-center"
                            onClick={() => setIsTorneosOpen(!isTorneosOpen)}
                            style={{ cursor: 'pointer', padding: '12px 20px', color: '#020202ff' }}
                        >
                            <div className="d-flex align-items-center gap-2">
                                {!isCollapsed && <span>Partidos</span>}
                            </div>
                            {!isCollapsed && (
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                    {isTorneosOpen ? 'expand_less' : 'expand_more'}
                                </span>
                            )}
                        </div>

                        {isTorneosOpen && !isCollapsed && (
                            <ul className="sidebar-submenu" style={{ listStyle: 'none', paddingLeft: '40px', margin: 0 }}>
                                <li style={{ padding: '8px 0' }}><Link to="/partidos?torneo_id=t9-u10" style={{ color: '#000000ff', textDecoration: 'none' }}> Gestionar Partidos</Link></li>
                                <li style={{ padding: '8px 0' }}><Link to="/calendario-partidos" style={{ color: '#000000ff', textDecoration: 'none' }}> Calendario Partidos</Link></li>
                                <li style={{ padding: '8px 0' }}><Link to="/carga-resultados" style={{ color: '#000000ff', textDecoration: 'none' }}> Carga de Resultados</Link></li>
                            </ul>
                        )}
                    </li>

                    {/* Menú desplegable de Torneos */}
                    <li className={`sidebar-dropdown ${isCollapsed ? 'collapsed-dropdown' : ''}`}>
                        <div
                            className="sidebar-dropdown-toggle d-flex justify-content-between align-items-center"
                            onClick={() => setIsTorneosOpen(!isTorneosOpen)}
                            style={{ cursor: 'pointer', padding: '12px 20px', color: '#020202ff' }}
                        >
                            <div className="d-flex align-items-center gap-2">
                                {!isCollapsed && <span>Competiciones</span>}
                            </div>
                            {!isCollapsed && (
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                    {isTorneosOpen ? 'expand_less' : 'expand_more'}
                                </span>
                            )}
                        </div>

                        {isTorneosOpen && !isCollapsed && (
                            <ul className="sidebar-submenu" style={{ listStyle: 'none', paddingLeft: '40px', margin: 0 }}>
                                <li style={{ padding: '8px 0' }}><Link to="/torneos" style={{ color: '#000000ff', textDecoration: 'none' }}> Gestión de Torneos</Link></li>
                                <li style={{ padding: '8px 0' }}><Link to="/torneos/equipos" style={{ color: '#000000ff', textDecoration: 'none' }}>Equipos</Link></li>
                                <li style={{ padding: '8px 0' }}><Link to="/torneos/confederaciones" style={{ color: '#000000ff', textDecoration: 'none' }}> Confederaciones</Link></li>
                                <li style={{ padding: '8px 0' }}><Link to="/torneos/paises" style={{ color: '#000000ff', textDecoration: 'none' }}> Países</Link></li>
                                <li style={{ padding: '8px 0' }}><Link to="/torneos/configuracion" style={{ color: '#000000ff', textDecoration: 'none' }}> Configuración</Link></li>
                            </ul>
                        )}
                    </li>

                    <li><Link to="/quinielas-activas">Quinielas Activas</Link></li>
                    <li><Link to="/calendario">Calendario y Partidos</Link></li>
                    <li><Link to="/carga-resultados">Carga de Resultados</Link></li>
                    <li><Link to="/configuraciones">Configuraciones</Link></li>
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="sidebar-logout-btn">
                    {isCollapsed ? '' : 'Cerrar Sesión'}
                </button>
            </div>
        </aside>



    );
}