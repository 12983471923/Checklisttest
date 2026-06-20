import React, { useState } from 'react';
import { signInUser, signOutUser, isHousekeepingRole, getUserProfile } from '../firebase/auth';
import { rateLimitLogin, validateUserInput } from '../utils/security';
import ThemeToggle from './ThemeToggle';
import { Link } from 'react-router-dom';

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--ios-bg)',
    padding: '24px 16px',
    fontFamily: FONT,
  },
  card: {
    background: 'var(--ios-card)',
    borderRadius: '20px',
    boxShadow: 'var(--ios-shadow)',
    padding: '48px 44px 40px',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px',
  },
  logo: { height: '48px', width: 'auto', marginBottom: '16px', objectFit: 'contain' },
  hotelName: {
    fontSize: '22px',
    fontWeight: '600',
    color: 'var(--ios-label)',
    letterSpacing: '-0.3px',
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--ios-secondary-label)',
    marginTop: '4px',
    textAlign: 'center',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: 'var(--ios-secondary-label)' },
  input: {
    width: '100%',
    padding: '13px 15px',
    fontSize: '15px',
    color: 'var(--ios-label)',
    background: 'var(--ios-input-bg)',
    border: '1.5px solid var(--ios-separator)',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: FONT,
  },
  button: {
    marginTop: '8px',
    width: '100%',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '500',
    color: 'var(--ios-primary-btn-text)',
    background: 'var(--ios-primary-btn-bg)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: FONT,
  },
  error: {
    padding: '12px 14px',
    background: 'var(--ios-error-bg)',
    border: '1px solid var(--ios-error-border)',
    borderRadius: '10px',
    fontSize: '13px',
    color: 'var(--ios-error-text)',
    marginBottom: '16px',
  },
  backLink: {
    display: 'block',
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '13px',
    color: 'var(--ios-secondary-label)',
    textDecoration: 'none',
  },
};

export default function HousekeepingLoginForm({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emailValidation = validateUserInput(formData.email, 'email');
    if (!emailValidation.valid) {
      setError('Enter a valid email address.');
      setLoading(false);
      return;
    }

    const rateLimit = rateLimitLogin(emailValidation.value);
    if (!rateLimit.allowed) {
      setError(rateLimit.error);
      setLoading(false);
      return;
    }

    try {
      const { user, error: authError } = await signInUser(emailValidation.value, formData.password);
      if (authError) {
        setError(authError);
        return;
      }

      const { profile } = await getUserProfile(user.uid);

      if (!isHousekeepingRole(profile)) {
        await signOutUser();
        setError('Access denied. This portal is for housekeeping staff only.');
        return;
      }

      setFormData({ email: '', password: '' });
      if (onLogin) onLogin(user);
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <ThemeToggle className="theme-toggle-fixed" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={s.card}>
          <div style={s.logoWrap}>
            <img src="/logo.png" alt="Scandic Falkoner" style={s.logo} />
            <h1 style={s.hotelName}>Scandic Falkoner</h1>
            <p style={s.subtitle}>Housekeeping Portal</p>
          </div>

          {error && <div style={s.error}>{error}</div>}

          <form onSubmit={handleLogin} style={s.form}>
            <div style={s.fieldWrap}>
              <label htmlFor="hsk-email" style={s.label}>Email</label>
              <input
                id="hsk-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                style={s.input}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                autoFocus
              />
            </div>
            <div style={s.fieldWrap}>
              <label htmlFor="hsk-password" style={s.label}>Password</label>
              <input
                id="hsk-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                style={s.input}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            <button type="submit" style={{ ...s.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In to Housekeeping'}
            </button>
          </form>

          <Link to="/" style={s.backLink}>
            ← Back to Reception
          </Link>
        </div>
      </div>
    </div>
  );
}
