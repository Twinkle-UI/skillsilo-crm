import { useState } from 'react';
import { authAPI } from '../services/api';
import { setToken, setUser } from '../utils/auth';
import './LoginPage.css';

export default function LoginPage({ onForgotPassword }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.login(username, password);
      setToken(res.data.token);
      setUser(res.data.user);
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form-side">
          <div className="login-logo">
            <div className="logo-placeholder">
              <div className="logo-placeholder-icon">S</div>
              <div className="logo-placeholder-text">
                Skillsilo
                <small>E-Learnings · ABHI SOCHE AAJ HI KARE</small>
              </div>
            </div>
          </div>

          <div className="login-welcome">Welcome back!</div>

          {error && <div className="login-error">❌ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email or Employee ID</label>
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16
              }}
            >
              <label className="remember-row" style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  className="remember-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="remember-label">Remember me</span>
              </label>

              <button
                type="button"
                onClick={onForgotPassword}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1a73e8',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>

        <div className="login-image-side"></div>
      </div>
    </div>
  );
}