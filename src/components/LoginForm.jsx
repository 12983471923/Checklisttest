import React, { useState } from 'react';
import { users } from '../users';

const LoginForm = ({ onLogin, onError }) => {
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    const match = users.find(
      (u) => u.username === loginForm.username && u.password === loginForm.password
    );
    
    if (match) {
      onLogin(match);
      setLoginForm({ username: "", password: "" });
      setLoginError("");
    } else {
      const errorMsg = "Incorrect username or password.";
      setLoginError(errorMsg);
      onError(errorMsg);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Hotel Staff Login</h1>
        <p className="login-subtitle">Scandic Falkoner Checklist System</p>
        
        <form onSubmit={handleLogin} className="login-form">
          {(loginError || onError) && (
            <div className="form-error">{loginError}</div>
          )}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username"
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              className="form-input"
              required
            />
          </div>
          
          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
