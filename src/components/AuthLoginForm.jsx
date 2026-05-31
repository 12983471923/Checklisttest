import React, { useState } from 'react';
import { signInUser, resetPassword } from '../firebase/auth';
import { rateLimitLogin, validateUserInput } from '../utils/security';

/* ─── Inline styles ─────────────────────────────────────────────────────────
   Kept here so the component is self-contained. Values mirror the global
   Inter-based dashboard design tokens used by the rest of the app.
   ─────────────────────────────────────────────────────────────────────────── */
const FONT = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top left, rgba(79, 70, 229, 0.10), transparent 34rem), radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 28rem), #FAFAFA',
    padding: '24px 16px',
    fontFamily: FONT,
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(17, 24, 39, 0.09)',
    borderRadius: '24px',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.10)',
    padding: '46px 42px 38px',
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
  logo: {
    height: '48px',
    width: 'auto',
    marginBottom: '16px',
    objectFit: 'contain',
  },
  hotelName: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#111827',
    letterSpacing: '-0.6px',
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6B7280',
    marginTop: '4px',
    textAlign: 'center',
    letterSpacing: '0px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fieldWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#374151',
    letterSpacing: '-0.01em',
  },
  input: {
    width: '100%',
    minHeight: '46px',
    padding: '13px 15px',
    fontSize: '15px',
    color: '#111827',
    background: '#FFFFFF',
    border: '1px solid rgba(17, 24, 39, 0.13)',
    borderRadius: '12px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
    fontFamily: FONT,
    WebkitAppearance: 'none',
  },
  inputFocus: {
    borderColor: 'rgba(79, 70, 229, 0.55)',
    boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.14)',
    background: '#ffffff',
  },
  button: {
    marginTop: '8px',
    width: '100%',
    minHeight: '46px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
    background: '#111827',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background 0.18s ease, opacity 0.18s ease, transform 0.14s ease, box-shadow 0.18s ease',
    fontFamily: FONT,
    letterSpacing: '-0.1px',
    boxShadow: '0 12px 24px rgba(17, 24, 39, 0.16)',
  },
  buttonHover: {
    background: '#0F172A',
    boxShadow: '0 16px 32px rgba(17, 24, 39, 0.22)',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  forgotWrap: {
    textAlign: 'center',
    marginTop: '14px',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    color: '#4F46E5',
    cursor: 'pointer',
    padding: '0',
    fontFamily: FONT,
    transition: 'color 0.15s ease',
  },
  error: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '12px 14px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.18)',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#B91C1C',
    lineHeight: '1.45',
  },
  success: {
    padding: '12px 14px',
    background: 'rgba(34, 197, 94, 0.10)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#15803D',
    lineHeight: '1.45',
  },
  divider: {
    height: '1px',
    background: 'rgba(17, 24, 39, 0.09)',
    margin: '24px 0',
  },
  backBtn: {
    background: 'none',
    border: '1px solid rgba(79, 70, 229, 0.28)',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '14px',
    color: '#4F46E5',
    cursor: 'pointer',
    width: '100%',
    fontFamily: FONT,
    transition: 'border-color 0.15s ease',
    marginTop: '4px',
  },
  disclaimer: {
    marginTop: '28px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#9CA3AF',
    lineHeight: '1.5',
    maxWidth: '400px',
    width: '100%',
  },
};

/* ─── Stateful input that applies focus ring ────────────────────────────── */
function Field({ id, label, type = 'text', value, onChange, placeholder, disabled, autoComplete, autoFocus }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={s.fieldWrap}>
      <label htmlFor={id} style={s.label}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        style={{
          ...s.input,
          ...(focused ? s.inputFocus : {}),
          ...(disabled ? { opacity: 0.55 } : {}),
        }}
      />
    </div>
  );
}

/* ─── Stateful button that applies hover state ──────────────────────────── */
function PrimaryButton({ children, disabled, type = 'submit' }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...s.button,
        ...(hovered && !disabled ? s.buttonHover : {}),
        ...(disabled ? s.buttonDisabled : {}),
      }}
    >
      {children}
    </button>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */
const AuthLoginForm = ({ onLogin, onError, externalError }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState('');

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const error = inlineError || externalError || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setInlineError('');
    setLoading(true);

    const emailValidation = validateUserInput(formData.email, 'email');
    if (!emailValidation.valid) {
      setInlineError('Enter a valid email address.');
      setLoading(false);
      return;
    }

    const rateLimit = rateLimitLogin(emailValidation.value);
    if (!rateLimit.allowed) {
      setInlineError(rateLimit.error);
      setLoading(false);
      return;
    }

    try {
      const { user, error: authError } = await signInUser(emailValidation.value, formData.password);
      if (authError) {
        setInlineError(authError);
        if (onError) onError(authError);
      } else if (user) {
        setFormData({ email: '', password: '' });
        if (onLogin) onLogin(user);
      }
    } catch {
      setInlineError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setResetLoading(true);

    const emailValidation = validateUserInput(resetEmail, 'email');
    if (!emailValidation.valid) {
      setResetMessage('error:Enter a valid email address.');
      setResetLoading(false);
      return;
    }

    try {
      const { error: resetError } = await resetPassword(emailValidation.value);
      if (resetError) {
        setResetMessage(`error:${resetError}`);
      } else {
        setResetMessage('ok:Password reset email sent — check your inbox.');
        setResetEmail('');
        setTimeout(() => setShowReset(false), 3500);
      }
    } catch {
      setResetMessage('error:Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const Header = () => (
    <div style={s.logoWrap}>
      <img src="/logo.png" alt="Scandic Falkoner" style={s.logo} />
      <h1 style={s.hotelName}>Scandic Falkoner</h1>
      <p style={s.subtitle}>Shift Checklist</p>
    </div>
  );

  if (showReset) {
    const isOk = resetMessage.startsWith('ok:');
    const isErr = resetMessage.startsWith('error:');
    const msg = resetMessage.replace(/^(ok|error):/, '');

    return (
      <div style={s.page}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={s.card}>
            <Header />
            <div style={s.divider} />
            <p style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginTop: 0, marginBottom: '6px', letterSpacing: '-0.03em' }}>
              Reset Password
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280', marginTop: 0, marginBottom: '20px' }}>
              Enter your email and we'll send a reset link.
            </p>

            {msg && (
              <div style={{ ...( isOk ? s.success : s.error ), marginBottom: '16px' }}>{msg}</div>
            )}

            <form onSubmit={handleResetPassword} style={s.form}>
              <Field
                id="resetEmail"
                label="Email Address"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={resetLoading || isOk}
                autoFocus
              />
              <PrimaryButton disabled={resetLoading || isOk}>
                {resetLoading ? 'Sending…' : 'Send Reset Link'}
              </PrimaryButton>
              <button
                type="button"
                style={s.backBtn}
                onClick={() => { setShowReset(false); setResetMessage(''); }}
                disabled={resetLoading}
              >
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={s.card}>
          <Header />
          <div style={s.divider} />

          {error && (
            <div style={{ ...s.error, marginBottom: '16px' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={s.form}>
            <Field
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => { setInlineError(''); setFormData(p => ({ ...p, email: e.target.value })); }}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
              autoFocus
            />
            <Field
              id="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => { setInlineError(''); setFormData(p => ({ ...p, password: e.target.value })); }}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
            />
            <PrimaryButton disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </PrimaryButton>
          </form>

          <div style={s.forgotWrap}>
            <button
              type="button"
              style={s.forgotBtn}
              onClick={() => { setShowReset(true); setInlineError(''); }}
              onMouseEnter={e => e.target.style.color = '#4338CA'}
              onMouseLeave={e => e.target.style.color = '#4F46E5'}
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <p style={s.disclaimer}>
          Internal use only · Scandic Falkoner · No guest data stored
        </p>
      </div>
    </div>
  );
};

export default AuthLoginForm;
