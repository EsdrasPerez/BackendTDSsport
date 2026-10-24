interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Verificando sesión segura...' }: LoadingScreenProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#071A33',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        color: '#F7F9FC',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Orbe decorativo de fondo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(23, 105, 255, 0.25) 0%, rgba(7, 26, 51, 0) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          padding: '24px',
          maxWidth: '380px',
          textAlign: 'center',
        }}
      >
        {/* Contenedor de Logo */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <img
            src="/TDLOGOAZUL.png"
            alt="TDSPORT"
            style={{
              height: '46px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            }}
          />
        </div>

        {/* Spinner animado personalizado con los colores de marca */}
        <div style={{ position: 'relative', width: '40px', height: '40px' }}>
          <svg
            style={{
              animation: 'spin 1s linear infinite',
              width: '100%',
              height: '100%',
            }}
            viewBox="0 0 50 50"
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="4"
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="#7CFF4F"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="80, 200"
              strokeDashoffset="0"
            />
          </svg>
        </div>

        <div>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              margin: '0 0 6px 0',
              color: '#FFFFFF',
            }}
          >
            TDSPORT <span style={{ color: '#7CFF4F', fontWeight: 600 }}>Admin</span>
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.65)',
              margin: 0,
            }}
          >
            {message}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
