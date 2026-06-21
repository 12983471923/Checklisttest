import React, { useState } from 'react';
import { signInUserForPortal, HSK_PORTAL_ROLES } from '../../firebase/auth';
import { rateLimitLogin, validateUserInput } from '../../utils/security';
import ThemeToggle from '../ThemeToggle';
import '../auth.css';
import './hsk.css';

function Field({ id, label, type = 'text', value, onChange, placeholder, disabled, autoComplete, autoFocus }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="hsk-login-field">
      <label htmlFor={id}>{label}</label>
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
        className={focused ? 'is-focused' : ''}
      />
    </div>
  );
}

export default function HskLoginForm({ onLogin, onBack, externalError }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState('');

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
      const { user, error: authError } = await signInUserForPortal(
        emailValidation.value,
        formData.password,
        {
          allowedRoles: HSK_PORTAL_ROLES,
          portalLabel: 'Housekeeping (HSK)',
        }
      );
      if (authError) {
        setInlineError(authError);
      } else if (user && onLogin) {
        setFormData({ email: '', password: '' });
        onLogin(user);
      }
    } catch {
      setInlineError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hsk-login-page">
      <ThemeToggle className="theme-toggle-fixed" />
      <div className="hsk-login-wrap">
        <div className="hsk-login-card">
          <div className="hsk-login-header">
            <img src="/logo.png" alt="Scandic Falkoner" />
            <h1>Housekeeping Portal</h1>
            <p>Scandic Falkoner · HSK Staff &amp; Admin</p>
          </div>

          {error && <div className="hsk-login-error">{error}</div>}

          <form onSubmit={handleLogin} className="hsk-login-form">
            <Field
              id="hsk-email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setInlineError('');
                setFormData((p) => ({ ...p, email: e.target.value }));
              }}
              placeholder="housekeeping@example.com"
              autoComplete="email"
              disabled={loading}
              autoFocus
            />
            <Field
              id="hsk-password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => {
                setInlineError('');
                setFormData((p) => ({ ...p, password: e.target.value }));
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
            />
            <button type="submit" className="hsk-login-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In to HSK Portal'}
            </button>
          </form>

          <button type="button" className="hsk-login-back" onClick={onBack} disabled={loading}>
            ← Back to Reception Login
          </button>
        </div>
        <p className="hsk-login-disclaimer">Housekeeping accounts are managed in Firebase by hotel administration.</p>
      </div>
    </div>
  );
}
