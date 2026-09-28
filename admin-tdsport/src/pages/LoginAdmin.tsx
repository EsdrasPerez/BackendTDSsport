import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './LoginAdmin.css';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // Limpiar errores previos

    // 1. Validaciones Frontend (US-1.1)
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (password.trim() === '') {
      setErrorMessage('La contraseña es obligatoria.');
      return;
    }

    setLoading(true);

    try {
      // 2. Autenticación segura vía Supabase (NFR-S1 y NFR-S2)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        // 3. Regla de Negocio (US-1.2): Mensaje genérico por seguridad
        setErrorMessage('Error: Correo o contraseña incorrectos.');
      } else if (data.session) {
        // Éxito: Navegar al Dashboard Administrativo
        navigate('/torneos');
      }
    } catch (err) {
      setErrorMessage('Error de conexión con el servidor. Inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-orb login-orb-one" aria-hidden="true" />
      <div className="login-orb login-orb-two" aria-hidden="true" />
      <div className="login-grid" aria-hidden="true" />

      <section className="login-card">
        <div className="login-brand">
          <div className="login-logo-wrap">
            <img src="/TDLOGOAZUL.png" alt="Logo de la empresa" className="login-logo" />
          </div>
          <span className="login-kicker">Panel de gestión deportiva</span>
        </div>


        {/* Cabecera */}
        <div className="login-header">
          <h1>TDSPORT <span>Admin</span></h1>
          <p>Acceso exclusivo para administradores</p>
        </div>

        {/* Alerta de Error UI */}
        {errorMessage && (
          <div className="login-error" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="login-form">
          <div>
            <label htmlFor="admin-email">Correo Electrónico</label>
            <input
              id="admin-email"
              type="email"
              placeholder="admin@tdsport.com"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password">Contraseña</label>
            <input
              id="admin-password"
              type="password"
              placeholder="••••••••"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-submit"
          >
            {loading ? (
              <>
                <svg className="login-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validando credenciales...
              </>
            ) : (
              'Ingresar al Panel'
            )}
          </button>
        </form>

        <p className="login-footer">TDSPORT <span>•</span> Administración segura</p>
      </section>
    </main>
  );
}