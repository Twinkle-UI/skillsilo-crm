import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export default function ResetPasswordPage({ onBackToLogin }) {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Extract token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('No reset token found. Please request a new reset link.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Reset token is missing');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      await authAPI.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    // Clear URL query params
    window.history.replaceState({}, '', '/');
    if (onBackToLogin) onBackToLogin();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">🔑 Reset Password</h1>
        <p className="auth-subtitle">
          {success
            ? 'Your password has been reset successfully'
            : 'Enter your new password below'}
        </p>

        {success ? (
          <div className="auth-success-state">
            <div className="auth-success-icon">✅</div>
            <h3>Password Reset Successful!</h3>
            <p>You can now login with your new password.</p>

            <button
              type="button"
              className="auth-btn"
              onClick={handleGoToLogin}
              style={{ marginTop: 20 }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="auth-error">❌ {error}</div>}

            <label className="auth-label">New Password</label>
            <input
              type="password"
              className="auth-input"
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoFocus
              minLength={6}
            />

            <label className="auth-label" style={{ marginTop: 14 }}>
              Confirm Password
            </label>
            <input
              type="password"
              className="auth-input"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />

            <button
              type="submit"
              className="auth-btn"
              disabled={submitting || !token}
              style={{ marginTop: 20 }}
            >
              {submitting ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="auth-footer">
              <button
                type="button"
                className="auth-link-btn"
                onClick={handleGoToLogin}
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