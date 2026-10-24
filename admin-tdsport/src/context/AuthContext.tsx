import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import {
  cerrarSesionCompleta,
  registrarActividad,
  verificarInactividadExpirada,
  AUTH_CHANNEL_NAME,
  type LogoutReason,
} from '../services/authService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  logout: (motivo?: LogoutReason) => Promise<void>;
  recordActivity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cierre de sesión centralizado
  const logout = useCallback(async (motivo: LogoutReason = 'manual') => {
    setIsLoading(true);
    await cerrarSesionCompleta(motivo);
    setSession(null);
    setIsLoading(false);
  }, []);

  // Registrar actividad
  const recordActivity = useCallback(() => {
    registrarActividad();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const inicializarAuth = async () => {
      try {
        // 1. Validar si ya había expirado por inactividad
        if (verificarInactividadExpirada()) {
          await cerrarSesionCompleta('inactividad');
          if (isMounted) {
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        // 2. Obtener sesión de Supabase
        const { data: { session: sesionActual }, error } = await supabase.auth.getSession();

        if (error || !sesionActual) {
          if (isMounted) {
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        // 3. Si hay sesión y no expiró, renovar marca de tiempo
        registrarActividad();
        if (isMounted) {
          setSession(sesionActual);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[AuthContext] Error al inicializar sesión:', err);
        if (isMounted) {
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    void inicializarAuth();

    // 4. Suscripción a cambios de autenticación de Supabase (login, logout, refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, nuevaSesion) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (nuevaSesion) {
          registrarActividad();
          setSession(nuevaSesion);
        }
        setIsLoading(false);
      } else if (event === 'INITIAL_SESSION') {
        if (nuevaSesion && !verificarInactividadExpirada()) {
          setSession(nuevaSesion);
        } else if (verificarInactividadExpirada()) {
          void logout('inactividad');
        }
        setIsLoading(false);
      }
    });

    // 5. Sincronización entre pestañas con BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
        channel.onmessage = (event) => {
          if (event.data?.type === 'LOGOUT') {
            setSession(null);
          }
        };
      }
    } catch {
      // Ignorar
    }

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
      if (channel) {
        channel.close();
      }
    };
  }, [logout]);

  const value = useMemo<AuthContextType>(() => ({
    session,
    user: session?.user ?? null,
    isLoading,
    logout,
    recordActivity,
  }), [session, isLoading, logout, recordActivity]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un <AuthProvider>');
  }
  return context;
}
