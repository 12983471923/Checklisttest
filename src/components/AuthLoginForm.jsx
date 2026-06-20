import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInUser, resetPassword } from '../firebase/auth';
import { rateLimitLogin, validateUserInput } from '../utils/security';
import ThemeToggle from './ThemeToggle';

/* ─── Inline styles ─────────────────────────────────────────────────────────
   Kept here so the component is self-contained. All values follow
   Apple's Human Interface Guidelines: system font stack, #1d1d1f text,
   #f5f5f7 background, and a near-black CTA button.
   ─────────────────────────────────────────────────────────────────────────── */
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
  logo: {
    height: '48px',
    width: 'auto',
    marginBottom: '16px',
    objectFit: 'contain',
  },
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
    fontWeight: '500',
    color: 'var(--ios-secondary-label)',
    letterSpacing: '0px',
  },
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
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    fontFamily: FONT,
    WebkitAppearance: 'none',
  },
  inputFocus: {
    borderColor: 'var(--ios-label)',
    boxShadow: '0 0 0 3px var(--ios-fill)',
    background: 'var(--ios-input-bg-focus)',
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
    transition: 'background 0.15s ease, opacity 0.15s ease',
    fontFamily: FONT,
    letterSpacing: '-0.1px',
  },
  buttonHover: {
    background: 'var(--ios-primary-btn-bg-hover)',
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
    color: 'var(--ios-secondary-label)',
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
    background: 'var(--ios-error-bg)',
    border: '1px solid var(--ios-error-border)',
    borderRadius: '10px',
    fontSize: '13px',
    color: 'var(--ios-error-text)',
    lineHeight: '1.45',
  },
  success: {
    padding: '12px 14px',
    background: 'var(--ios-success-bg)',
    border: '1px solid var(--ios-success-border)',
    borderRadius: '10px',
    fontSize: '13px',
    color: 'var(--ios-success-text)',
    lineHeight: '1.45',
  },
  divider: {
    height: '1px',
    background: 'var(--ios-separator)',
    margin: '24px 0',
  },
  backBtn: {
    background: 'none',
    border: '1.5px solid var(--ios-separator)',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '14px',
    color: 'var(--ios-label)',
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
    color: 'var(--ios-tertiary-label)',
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
        <ThemeToggle className="theme-toggle-fixed" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={s.card}>
            <Header />
            <div style={s.divider} />
            <p style={{ fontSize: '20px', fontWeight: '600', color: 'var(--ios-label)', marginTop: 0, marginBottom: '6px' }}>
              Reset Password
            </p>
            <p style={{ fontSize: '14px', color: 'var(--ios-secondary-label)', marginTop: 0, marginBottom: '20px' }}>
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
      <ThemeToggle className="theme-toggle-fixed" />
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
              onMouseEnter={e => { e.target.style.color = 'var(--ios-label)'; }}
              onMouseLeave={e => { e.target.style.color = 'var(--ios-secondary-label)'; }}
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <p style={s.disclaimer}>
          Internal use only · Scandic Falkoner · No guest data stored
        </p>
        <Link to="/housekeeping" style={{ ...s.disclaimer, marginTop: '12px', display: 'block' }}>
          Housekeeping Portal →
        </Link>
      </div>
    </div>
  );
};

export default AuthLoginForm;
