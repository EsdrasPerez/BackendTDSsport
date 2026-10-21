import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// MUI Icons
import SecurityIcon from '@mui/icons-material/Security';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineRounded';

// Configuración de tiempos (Estilo bancario)
// 15 minutos de inactividad total
const TIEMPO_INACTIVIDAD_MS = 15 * 60 * 1000;
// Aviso preventivo durante los últimos 60 segundos
const TIEMPO_AVISO_PREVIO_MS = 60 * 1000;
const STORAGE_KEY = 'tds_admin_last_activity';

export default function InactivityHandler() {
    const [mostrarAviso, setMostrarAviso] = useState(false);
    const [segundosRestantes, setSegundosRestantes] = useState(60);
    const navigate = useNavigate();

    const ultimaActividadRef = useRef<number>(Date.now());
    const throttleRef = useRef<number>(Date.now());

    // Cerrar sesión por inactividad
    const cerrarPorInactividad = useCallback(async () => {
        setMostrarAviso(false);
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            localStorage.removeItem(STORAGE_KEY);
            navigate('/login?inactividad=1', { replace: true });
        }
    }, [navigate]);

    // Registrar actividad del usuario
    const registrarActividad = useCallback(() => {
        const ahora = Date.now();
        // Throttle para no saturar con eventos continuos como mousemove
        if (ahora - throttleRef.current < 1500) {
            return;
        }

        throttleRef.current = ahora;
        ultimaActividadRef.current = ahora;
        try {
            localStorage.setItem(STORAGE_KEY, String(ahora));
        } catch {
            // Ignorar errores en navegadores con almacenamiento restringido
        }
    }, []);

    // Reiniciar temporizador cuando el usuario pulsa "Continuar"
    const continuarSesion = () => {
        const ahora = Date.now();
        ultimaActividadRef.current = ahora;
        throttleRef.current = ahora;
        try {
            localStorage.setItem(STORAGE_KEY, String(ahora));
        } catch {
            // Ignorar
        }
        setMostrarAviso(false);
    };

    // Cerrar sesión inmediatamente si el usuario lo decide
    const cerrarManual = async () => {
        setMostrarAviso(false);
        await supabase.auth.signOut();
        localStorage.removeItem(STORAGE_KEY);
        navigate('/login', { replace: true });
    };

    useEffect(() => {
        // Inicializar la última actividad
        const guardado = localStorage.getItem(STORAGE_KEY);
        const ahora = Date.now();
        const tiempoInicial = guardado ? Number(guardado) : ahora;
        ultimaActividadRef.current = tiempoInicial;

        // Lista de eventos que demuestran actividad del usuario
        const eventos: (keyof WindowEventMap)[] = [
            'mousemove',
            'mousedown',
            'keydown',
            'touchstart',
            'scroll',
            'click',
        ];

        const manejarEventoActividad = () => {
            // Solo resetea automáticamente si NO está abierta la advertencia de cuenta regresiva
            if (!mostrarAviso) {
                registrarActividad();
            }
        };

        eventos.forEach((evento) => {
            window.addEventListener(evento, manejarEventoActividad, { passive: true });
        });

        // Sincronización entre múltiples pestañas del navegador
        const sincronizarPestanas = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                const tiempoRemoto = Number(e.newValue);
                ultimaActividadRef.current = tiempoRemoto;
                // Si otra pestaña registró actividad, se quita el aviso de esta pestaña
                setMostrarAviso(false);
            }
        };
        window.addEventListener('storage', sincronizarPestanas);

        // Intervalo de chequeo cada segundo
        const intervalId = window.setInterval(() => {
            const almacenado = Number(localStorage.getItem(STORAGE_KEY)) || ultimaActividadRef.current;
            const tiempoTranscurrido = Date.now() - almacenado;

            if (tiempoTranscurrido >= TIEMPO_INACTIVIDAD_MS) {
                // Se agotó el tiempo total: cerrar sesión
                clearInterval(intervalId);
                void cerrarPorInactividad();
            } else if (tiempoTranscurrido >= TIEMPO_INACTIVIDAD_MS - TIEMPO_AVISO_PREVIO_MS) {
                // Estamos dentro del rango de advertencia (últimos 60s)
                setMostrarAviso(true);
                const restantes = Math.max(0, Math.ceil((TIEMPO_INACTIVIDAD_MS - tiempoTranscurrido) / 1000));
                setSegundosRestantes(restantes);
            } else {
                // Actividad normal
                if (mostrarAviso) {
                    setMostrarAviso(false);
                }
            }
        }, 1000);

        return () => {
            eventos.forEach((evento) => {
                window.removeEventListener(evento, manejarEventoActividad);
            });
            window.removeEventListener('storage', sincronizarPestanas);
            clearInterval(intervalId);
        };
    }, [mostrarAviso, registrarActividad, cerrarPorInactividad]);

    if (!mostrarAviso) return null;

    const porcentajeRestante = Math.max(0, Math.min(100, (segundosRestantes / 60) * 100));

    return (
        <div
            className="inactivity-modal-overlay"
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(7, 26, 51, 0.82)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                animation: 'inactivityFadeIn 0.25s ease-out',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inactivity-title"
        >
            <div
                className="card shadow-lg border-0 text-white"
                style={{
                    maxWidth: '460px',
                    width: '100%',
                    backgroundColor: '#0c1b33',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                }}
            >
                {/* BARRA DE PROGRESO DE CUENTA REGRESIVA */}
                <div
                    style={{
                        height: '4px',
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            width: `${porcentajeRestante}%`,
                            backgroundColor: segundosRestantes < 20 ? '#ff4d4f' : 'var(--tds-lime, #7cff4f)',
                            transition: 'width 1s linear, background-color 0.3s ease',
                        }}
                    />
                </div>

                <div className="card-body p-4 p-md-5 text-center">
                    {/* ICONO DE SEGURIDAD BANCARIA */}
                    <div
                        className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
                        style={{
                            width: 68,
                            height: 68,
                            backgroundColor: 'rgba(255, 193, 7, 0.15)',
                            border: '1px solid rgba(255, 193, 7, 0.35)',
                        }}
                    >
                        <SecurityIcon sx={{ fontSize: 36, color: '#ffc107' }} />
                    </div>

                    <h4 id="inactivity-title" className="fw-bold text-white mb-2">
                        Aviso de Inactividad
                    </h4>

                    <p className="text-white-50 small mb-4">
                        Por motivos de seguridad bancaria y protección de datos, tu sesión administrativa se cerrará automáticamente en:
                    </p>

                    {/* CONTADOR DE SEGUNDOS */}
                    <div
                        className="p-3 rounded-4 mb-4 d-inline-flex align-items-center justify-content-center gap-2"
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            minWidth: '160px',
                        }}
                    >
                        <AccessTimeIcon sx={{ fontSize: 24, color: segundosRestantes < 20 ? '#ff4d4f' : 'var(--tds-lime, #7cff4f)' }} />
                        <span
                            className="fs-2 fw-bold font-monospace"
                            style={{ color: segundosRestantes < 20 ? '#ff4d4f' : '#ffffff' }}
                        >
                            {segundosRestantes}s
                        </span>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="d-grid gap-2">
                        <button
                            type="button"
                            className="btn btn-primary btn-lg d-inline-flex align-items-center justify-content-center gap-2 shadow-sm"
                            style={{ borderRadius: '12px', fontWeight: 600, padding: '12px' }}
                            onClick={continuarSesion}
                            autoFocus
                        >
                            <CheckCircleOutlineIcon sx={{ fontSize: 22 }} />
                            <span>Continuar en el sistema</span>
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-secondary d-inline-flex align-items-center justify-content-center gap-2 text-white-50"
                            style={{ borderRadius: '12px', borderColor: 'rgba(255, 255, 255, 0.15)', padding: '10px' }}
                            onClick={cerrarManual}
                        >
                            <LogoutIcon sx={{ fontSize: 18 }} />
                            <span>Cerrar sesión ahora</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
