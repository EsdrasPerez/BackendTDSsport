import { supabase } from '../supabaseClient';

export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos de inactividad
export const INACTIVITY_WARNING_MS = 60 * 1000;      // 60 segundos de aviso preventivo
export const STORAGE_KEY_LAST_ACTIVITY = 'tds_admin_last_activity';
export const AUTH_CHANNEL_NAME = 'tds_admin_auth_sync';

export type LogoutReason = 'manual' | 'inactividad' | 'expirado';

/**
 * Limpia de forma exhaustiva todo el caché del navegador,
 * almacenamiento local, de sesión y registros de Service Worker.
 */
export async function limpiarCacheYSesion(): Promise<void> {
  try {
    // 1. Limpiar Service Worker CacheStorage (si está disponible en el navegador)
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    }
  } catch (err) {
    console.warn('[Seguridad] Error al purgar CacheStorage:', err);
  }

  try {
    // 2. Desregistrar Service Workers activos para forzar recarga de assets limpios
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
  } catch (err) {
    console.warn('[Seguridad] Error al desregistrar Service Workers:', err);
  }

  try {
    // 3. Limpiar almacenamiento de sesión y local
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
      window.localStorage.clear();
    }
  } catch (err) {
    console.warn('[Seguridad] Error al vaciar localStorage/sessionStorage:', err);
  }
}

/**
 * Cierre de sesión seguro y centralizado:
 * 1. Invoca signOut en Supabase
 * 2. Purga toda la caché y almacenamiento
 * 3. Notifica a otras pestañas mediante BroadcastChannel
 */
export async function cerrarSesionCompleta(motivo: LogoutReason = 'manual'): Promise<void> {
  try {
    // Cierra la sesión en Supabase
    await supabase.auth.signOut({ scope: 'local' });
  } catch (err) {
    console.warn('[Seguridad] Error al cerrar sesión en Supabase:', err);
  }

  // Notificar a otras pestañas antes de borrar almacenamiento
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      channel.postMessage({ type: 'LOGOUT', motivo, timestamp: Date.now() });
      channel.close();
    }
  } catch {
    // Ignorar si no soporta BroadcastChannel
  }

  // Purga de caché y almacenamiento
  await limpiarCacheYSesion();
}

/**
 * Registra la marca de tiempo de la última actividad del usuario
 */
export function registrarActividad(): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(Date.now()));
    }
  } catch {
    // Ignorar si el almacenamiento está restringido
  }
}

/**
 * Comprueba si la sesión ha expirado por superar el umbral de inactividad
 */
export function verificarInactividadExpirada(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const guardado = window.localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
    if (!guardado) return false;

    const timestamp = Number(guardado);
    if (isNaN(timestamp) || timestamp <= 0) return false;

    const tiempoTranscurrido = Date.now() - timestamp;
    return tiempoTranscurrido >= INACTIVITY_TIMEOUT_MS;
  } catch {
    return false;
  }
}
