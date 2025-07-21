import React, { useState } from 'react';
import { signInUser, resetPassword } from '../firebase/auth';
import { validateUserInput } from '../utils/security';

const AuthLoginForm = ({ onLogin, onError }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate email
    const emailValidation = validateUserInput(formData.email, 'email');
    if (!emailValidation.valid) {
      onError(emailValidation.error);
      setLoading(false);
      return;
    }

    try {
      const { user, error } = await signInUser(formData.email, formData.password);
      
      if (error) {
        onError(error);
      } else if (user) {
        onLogin(user);
        setFormData({ email: '', password: '' });
      }
    } catch (error) {
      onError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');

    try {
      const { error } = await resetPassword(resetEmail);
      
      if (error) {
        setResetMessage(`Error: ${error}`);
      } else {
        setResetMessage('Password reset email sent! Check your inbox.');
        setResetEmail('');
        setTimeout(() => setShowResetPassword(false), 3000);
      }
    } catch (error) {
      setResetMessage('Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">Reset Password</h1>
          <p className="login-subtitle">Enter your email to receive a password reset link</p>
          
          <form onSubmit={handleResetPassword} className="login-form">
            {resetMessage && (
              <div className={`form-message ${resetMessage.includes('Error') ? 'form-error' : 'form-success'}`}>
                {resetMessage}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="resetEmail">Email Address</label>
              <input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                className="form-input"
                required
                disabled={resetLoading}
              />
            </div>
            
            <div className="form-buttons">
              <button 
                type="submit" 
                className="login-btn"
                disabled={resetLoading}
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button 
                type="button" 
                className="reset-btn"
                onClick={() => setShowResetPassword(false)}
                disabled={resetLoading}
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">🏨 Hotel Staff Login</h1>
        <p className="login-subtitle">Scandic Falkoner Checklist System</p>
        <div className="login-version">
          <span className="version-badge">v2.0 - Enhanced Security</span>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              className="form-input"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              className="form-input"
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <div className="login-footer">
            <button 
              type="button"
              className="link-btn"
              onClick={() => setShowResetPassword(true)}
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>
        </form>
        
        <div className="login-help">
          <p>Need access? Contact your manager to create an account.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLoginForm;
