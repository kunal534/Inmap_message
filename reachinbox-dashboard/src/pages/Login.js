import React, { useState } from 'react';
import './Login.css';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('test123');
  const [tenantId, setTenantId] = useState('tenant-001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔑 Login attempt:', email);

      // Use fetch with explicit HTTP (bypass HTTPS issue)
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('✅ Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const { token, tenantId: tid } = data.data;

      console.log('💾 Saving token...');
      localStorage.setItem('token', token);
      localStorage.setItem('tenantId', tid);
      localStorage.setItem('email', email);

      console.log('✅ Token saved!');
      onLogin();

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🎉 ReachInbox</h1>
        <p className="subtitle">AI-Powered Email Categorization</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Tenant ID</label>
              <input
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
              />
            </div>
          )}

          {error && <div className="error-message">❌ {error}</div>}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Logging in...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <p className="toggle-mode">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="toggle-btn"
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
