import type { ReactNode } from 'react';
import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

interface PublicRouteProps {
  children?: ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { session, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const esPorInactividad = searchParams.get('inactividad') === '1';

  if (isLoading) {
    return <LoadingScreen message="Cargando panel de acceso..." />;
  }

  // Si ya tiene sesión activa y no proviene de aviso de inactividad, enviarlo directo al Dashboard
  if (session && !esPorInactividad) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
