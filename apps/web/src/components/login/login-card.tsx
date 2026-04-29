'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export function LoginCard() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn('keycloak', { callbackUrl: '/' });
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: 400,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(24px)',
      borderRadius: 20,
      padding: '40px 36px 36px',
      boxShadow: '0 8px 40px rgba(139,92,246,0.14), 0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid rgba(255,255,255,0.9)',
    }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          background: 'linear-gradient(135deg, #e8317a, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <GridIcon />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px', color: '#1a1428' }}>PeopleOS</div>
          <div style={{ fontSize: 10.5, color: '#9590a8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>HRIS Platform</div>
        </div>
      </div>

      {/* Heading */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#1a1428', margin: '0 0 6px' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 13.5, color: '#9590a8', margin: 0, lineHeight: 1.5 }}>
          Sign in with your organisation account to continue.
        </p>
      </div>

      {/* Sign-in button */}
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        style={{
          width: '100%',
          padding: '13px 20px',
          borderRadius: 12,
          border: 'none',
          background: loading
            ? 'rgba(232,49,122,0.6)'
            : 'linear-gradient(135deg, #e8317a, #a855f7)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '-0.2px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'opacity 180ms ease, transform 120ms ease',
          boxShadow: '0 4px 16px rgba(232,49,122,0.28)',
        }}
        onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      >
        {loading ? (
          <>
            <Spinner />
            Redirecting to login…
          </>
        ) : (
          <>
            <KeyIcon />
            Sign in with SSO
          </>
        )}
      </button>

      {/* Footer note */}
      <p style={{ marginTop: 24, fontSize: 11.5, color: '#9590a8', textAlign: 'center', lineHeight: 1.6 }}>
        Your session is secured via Keycloak single sign-on.
        <br />
        Contact your administrator if you cannot log in.
      </p>

      {/* Dev hint */}
      {process.env['NODE_ENV'] === 'development' && (
        <div style={{
          marginTop: 20,
          padding: '12px 14px',
          borderRadius: 10,
          background: 'rgba(139,92,246,0.07)',
          border: '1px solid rgba(139,92,246,0.12)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#8b5cf6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Dev test accounts
          </div>
          {[
            { label: 'HRIS Admin', user: 'hris.admin' },
            { label: 'HR Manager', user: 'hr.manager' },
            { label: 'Employee',   user: 'john.employee' },
          ].map(({ label, user }) => (
            <div key={user} style={{ fontSize: 11.5, color: '#4b4563', marginBottom: 2 }}>
              <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{label}</span>
              {' — '}
              <span style={{ fontFamily: 'monospace' }}>{user}</span>
              {' / '}
              <span style={{ fontFamily: 'monospace' }}>Test@1234</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
