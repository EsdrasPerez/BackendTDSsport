import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  INACTIVITY_TIMEOUT_MS,
  INACTIVITY_WARNING_MS,
  STORAGE_KEY_LAST_ACTIVITY,
} from '../services/authService';

// MUI Icons
import SecurityIcon from '@mui/icons-material/Security';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineRounded';

export default function InactivityHandler() {
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(60);
  const { logout, recordActivity } = useAuth();
  const navigate = useNavigate();

  const ultimaActividadRef = useRef<number>(Date.now());
  const throttleRef = useRef<number>(Date.now());

  // Cerrar sesión por inactividad con purga total de caché
  const cerrarPorInactividad = useCallback(async () => {
    setMostrarAviso(false);
    try {
      await logout('inactividad');
    } catch (error) {
      console.error('Error al cerrar sesión por inactividad:', error);
    } finally {
      navigate('/login?inactividad=1', { replace: true });
    }
  }, [logout, navigate]);

  // Registrar actividad del usuario (throttled)
  const manejarActividad = useCallback(() => {
    const ahora = Date.now();
    if (ahora - throttleRef.current < 1500) {
      return;
    }

    throttleRef.current = ahora;
    ultimaActividadRef.current = ahora;
    recordActivity();
  }, [recordActivity]);

  // Reiniciar temporizador cuando el usuario pulsa "Continuar en el sistema"
  const continuarSesion = () => {
    const ahora = Date.now();
    ultimaActividadRef.current = ahora;
    throttleRef.current = ahora;
    recordActivity();
    setMostrarAviso(false);
  };

  // Cerrar sesión inmediatamente si el usuario lo decide
  const cerrarManual = async () => {
    setMostrarAviso(false);
    try {
      await logout('manual');
    } finally {
      navigate('/login', { replace: true });
    }
  };

  useEffect(() => {
    // Inicializar la marca de tiempo de actividad
    const guardado = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
    const ahora = Date.now();
    const tiempoInicial = guardado ? Number(guardado) : ahora;
    ultimaActividadRef.current = tiempoInicial;

    // Si ya venció al montar el componente, cerrar inmediatamente
    if (ahora - tiempoInicial >= INACTIVITY_TIMEOUT_MS) {
      void cerrarPorInactividad();
      return;
    }

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
      // Solo renueva automáticamente si NO está activa la ventana de confirmación
      if (!mostrarAviso) {
        manejarActividad();
      }
    };

    eventos.forEach((evento) => {
      window.addEventListener(evento, manejarEventoActividad, { passive: true });
    });

    // Sincronización entre múltiples pestañas del navegador
    const sincronizarPestanas = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_LAST_ACTIVITY && e.newValue) {
        const tiempoRemoto = Number(e.newValue);
        ultimaActividadRef.current = tiempoRemoto;
        setMostrarAviso(false);
      }
    };
    window.addEventListener('storage', sincronizarPestanas);

    // Intervalo de chequeo cada segundo
    const intervalId = window.setInterval(() => {
      const almacenado =
        Number(localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY)) || ultimaActividadRef.current;
      const tiempoTranscurrido = Date.now() - almacenado;

      if (tiempoTranscurrido >= INACTIVITY_TIMEOUT_MS) {
        // Se agotó el tiempo total: cerrar sesión y purgar caché
        clearInterval(intervalId);
        void cerrarPorInactividad();
      } else if (tiempoTranscurrido >= INACTIVITY_TIMEOUT_MS - INACTIVITY_WARNING_MS) {
        // Dentro de la ventana preventiva (últimos 60 segundos)
        setMostrarAviso(true);
        const restantes = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - tiempoTranscurrido) / 1000));
        setSegundosRestantes(restantes);
      } else {
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
  }, [mostrarAviso, manejarActividad, cerrarPorInactividad]);

  if (!mostrarAviso) return null;

  const porcentajeRestante = Math.max(0, Math.min(100, (segundosRestantes / 60) * 100));

  return (
    <div
      className="inactivity-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 26, 51, 0.85)',
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
            Por motivos de seguridad y protección de datos administrativos, tu sesión se cerrará y se limpiará el caché en:
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
            <AccessTimeIcon
              sx={{
                fontSize: 24,
                color: segundosRestantes < 20 ? '#ff4d4f' : 'var(--tds-lime, #7cff4f)',
              }}
            />
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
              style={{
                borderRadius: '12px',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                padding: '10px',
              }}
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
