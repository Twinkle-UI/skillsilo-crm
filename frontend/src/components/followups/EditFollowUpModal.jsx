import { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';

export default function EditFollowUpModal({ followUp, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    stage: followUp.stage || '',
    stageNote: followUp.stageNote || '',
    dueAt: followUp.dueAt
      ? new Date(followUp.dueAt).toISOString().slice(0, 16)
      : '',
    status: followUp.status || 'planned',
    remark: followUp.remark || ''
  });

  const [stages, setStages] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
   
  // Load stages
  useEffect(() => {
    settingsAPI
      .getAll('stage', { limit: 100 })
      .then((res) => {
        setStages(res.data);
        // Auto-select current stage
        const current = res.data.find((s) => s.name === followUp.stage);
        if (current) setSelectedStageId(current._id);
      })
      .catch((err) => console.error(err));
  }, [followUp.stage]);

  // Load reasons when stage changes
  useEffect(() => {
    if (!selectedStageId) {
      setReasons([]);
      return;
    }
    settingsAPI
      .getAll('reason', { limit: 100, parentId: selectedStageId })
      .then((res) => setReasons(res.data))
      .catch((err) => console.error(err));
  }, [selectedStageId]);

  const handleStageChange = (e) => {
    const id = e.target.value;
    const stage = stages.find((s) => s._id === id);
    setSelectedStageId(id);
    setFormData({
      ...formData,
      stage: stage?.name || '',
      stageNote: '' // reset
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.stage) {
      setError('Stage is required');
      return;
    }
    if (!formData.dueAt) {
      setError('Due date is required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/followups/${followUp._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            stage: formData.stage,
            stageNote: formData.stageNote,
            dueAt: new Date(formData.dueAt).toISOString(),
            status: formData.status,
            remark: formData.remark
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Follow-Up</h2>
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
              Editing follow-up for <strong>{followUp.name}</strong>
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

            <label className="bulk-label">
              Stage <span style={{ color: '#e53935' }}>*</span>
            </label>
            <select
              className="form-select"
              value={selectedStageId}
              onChange={handleStageChange}
              required
            >
              <option value="">Select Stage</option>
              {stages.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>

            <label className="bulk-label" style={{ marginTop: 12 }}>
              Reason
            </label>
            <select
              className="form-select"
              value={formData.stageNote}
              onChange={(e) =>
                setFormData({ ...formData, stageNote: e.target.value })
              }
              disabled={!selectedStageId}
            >
              <option value="">Select Reason</option>
              {reasons.map((r) => (
                <option key={r._id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>

            <label className="bulk-label" style={{ marginTop: 12 }}>
              Due Date & Time <span style={{ color: '#e53935' }}>*</span>
            </label>
            <input
              type="datetime-local"
              className="form-select"
              value={formData.dueAt}
              onChange={(e) =>
                setFormData({ ...formData, dueAt: e.target.value })
              }
              required
            />

            <label className="bulk-label" style={{ marginTop: 12 }}>
              Status
            </label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
            </select>

            <label className="bulk-label" style={{ marginTop: 12 }}>
              Remark
            </label>
            <textarea
              className="form-select"
              value={formData.remark}
              onChange={(e) =>
                setFormData({ ...formData, remark: e.target.value })
              }
              rows="3"
              placeholder="Add a remark (optional)"
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}