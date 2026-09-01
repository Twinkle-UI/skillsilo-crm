import { useState } from 'react';

export default function SnoozeFollowUpModal({ followUp, onClose, onSuccess }) {
  // Default: 1 hour from now
  const defaultTime = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  const [newDueAt, setNewDueAt] = useState(defaultTime);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Quick snooze presets
  const handleQuickSnooze = (minutes) => {
    const newTime = new Date(Date.now() + minutes * 60 * 1000)
      .toISOString()
      .slice(0, 16);
    setNewDueAt(newTime);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newDueAt) {
      setError('Please select a date and time');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('skillsilo_token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/followups/${followUp._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            dueAt: new Date(newDueAt).toISOString(),
            status: 'planned' // reset to planned
          })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      onSuccess(data.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content bulk-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Snooze Follow-Up</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p
              style={{
                background: '#f0f7ff',
                padding: '10px 14px',
                borderRadius: 6,
                borderLeft: '3px solid #1a73e8',
                margin: '0 0 16px 0',
                fontSize: 14
              }}
            >
              Reschedule follow-up for <strong>{followUp.name}</strong>
            </p>

            {error && (
              <div
                style={{
                  background: '#fff5f5',
                  color: '#c62828',
                  padding: 10,
                  borderRadius: 4,
                  marginBottom: 12,
                  fontSize: 13
                }}
              >
                ❌ {error}
              </div>
            )}

            <label className="bulk-label">Quick Snooze</label>
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                marginBottom: 14
              }}
            >
              <button
                type="button"
                className="bulk-action-btn"
                onClick={() => handleQuickSnooze(60)}
              >
                1 hour
              </button>
              <button
                type="button"
                className="bulk-action-btn"
                onClick={() => handleQuickSnooze(60 * 3)}
              >
                3 hours
              </button>
              <button
                type="button"
                className="bulk-action-btn"
                onClick={() => handleQuickSnooze(60 * 24)}
              >
                Tomorrow
              </button>
              <button
                type="button"
                className="bulk-action-btn"
                onClick={() => handleQuickSnooze(60 * 24 * 3)}
              >
                3 days
              </button>
              <button
                type="button"
                className="bulk-action-btn"
                onClick={() => handleQuickSnooze(60 * 24 * 7)}
              >
                1 week
              </button>
            </div>

            <label className="bulk-label">
              New Date & Time <span style={{ color: '#e53935' }}>*</span>
            </label>
            <input
              type="datetime-local"
              className="form-select"
              value={newDueAt}
              onChange={(e) => setNewDueAt(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="settings-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="settings-btn"
              disabled={submitting}
            >
              {submitting ? 'Snoozing...' : 'Snooze'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


