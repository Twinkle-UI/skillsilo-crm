import { useState } from 'react';
import { authAPI } from '../services/api';

export default function ForgotPasswordPage({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authAPI.forgotPassword(email.trim());
      setSuccess(true);
      if (res.resetLink) setResetLink(res.resetLink);
    } catch (err) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">🔐 Forgot Password</h1>
        <p className="auth-subtitle">
          Enter your email and we'll send you a reset link
        </p>

        {success ? (
          <div className="auth-success-state">
            <div className="auth-success-icon">✅</div>
            <h3>Check your email!</h3>
            <p>
              If <strong>{email}</strong> is registered with us, you'll receive
              a reset link shortly.
            </p>
            <p className="auth-note">
              💡 The link will expire in <strong>15 minutes</strong>.
            </p>

            {resetLink && (
              <div className="auth-dev-box">
                <strong>🔧 Development Mode:</strong>
                <p>
                  Email service not configured. Use this link to reset your
                  password:
                </p>
                
                  href={resetLink}
                  className="auth-dev-link"
                  rel="noopener noreferrer"
                <a>
                  {resetLink}
                </a>
              </div>
            )}

            <button
              type="button"
              className="auth-btn auth-btn-secondary"
              onClick={onBackToLogin}
              style={{ marginTop: 20 }}
            >
              ← Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="auth-error">❌ {error}</div>}

            <label className="auth-label">Email Address</label>
            <input
              type="email"
              className="auth-input"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <button
              type="submit"
              className="auth-btn"
              disabled={submitting}
              style={{ marginTop: 16 }}
            >
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="auth-footer">
              <button
                type="button"
                className="auth-link-btn"
                onClick={onBackToLogin}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}