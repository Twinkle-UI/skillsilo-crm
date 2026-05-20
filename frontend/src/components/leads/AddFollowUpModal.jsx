import { useState, useEffect } from 'react';
import { followUpsAPI, leadsAPI, settingsAPI } from '../../services/api';

export default function AddFollowUpModal({ lead, onClose, onSuccess }) {
  // Default: tomorrow 10 AM in YYYY-MM-DD HH:mm format
  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const hh = String(tomorrow.getHours()).padStart(2, '0');
    const min = String(tomorrow.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Form state
  const [form, setForm] = useState({
    stageId: '',
    stage: '',
    reasonId: '',
    reason: '',
    remark: '',
    addFollowUp: true, // checkbox default checked
    dueAt: getDefaultDateTime()
  });

  // Dropdown options
  const [stages, setStages] = useState([]);
  const [reasons, setReasons] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load stages on mount
  useEffect(() => {
    settingsAPI
      .getAll('stage', { limit: 100 })
      .then((res) => setStages(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Cascading: Stage → load Reasons
  useEffect(() => {
    if (!form.stageId) {
      setReasons([]);
      return;
    }
    settingsAPI
      .getAll('reason', { limit: 100, parentId: form.stageId })
      .then((res) => setReasons(res.data))
      .catch((err) => console.error(err));
  }, [form.stageId]);

  // Stage select handler
  const handleStageChange = (e) => {
    const selectedId = e.target.value;
    const selected = stages.find((s) => s._id === selectedId);
    setForm((prev) => ({
      ...prev,
      stageId: selectedId,
      stage: selected?.name || '',
      // Reset reason when stage changes
      reasonId: '',
      reason: ''
    }));
  };

  // Reason select handler
  const handleReasonChange = (e) => {
    const selectedId = e.target.value;
    const selected = reasons.find((r) => r._id === selectedId);
    setForm((prev) => ({
      ...prev,
      reasonId: selectedId,
      reason: selected?.name || ''
    }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.stage) return setError('Stage is required');
    if (!form.reason) return setError('Reason is required');
    if (!form.remark.trim()) return setError('Remark is required');
    if (form.addFollowUp && !form.dueAt) {
      return setError('Date & Time is required for follow-up');
    }

    setLoading(true);
    try {
      // Step 1: Update lead with new stage + reason
      const updatedLead = await leadsAPI.update(lead._id, {
        stage: form.stage,
        stageNote: form.reason,
        remark: form.remark.trim()
      });

      // Step 2: If checkbox checked, also create a follow-up
      let newFollowUp = null;
      if (form.addFollowUp) {
        const followUpPayload = {
          leadId: lead._id,
          name: lead.name,
          email: lead.email || '',
          phone: lead.contact,
          inquiredFor: lead.inquiredFor || 'Unknown',
          program: lead.program || 'Regular Program',
          stage: form.stage,
          stageNote: form.reason,
          source: lead.source || 'Unknown',
          sourceNote: lead.sourceNote || '',
          location: lead.country || 'India',
          locationSub: lead.state || '',
          assignedTo: lead.assignedTo || '',
          dueAt: new Date(form.dueAt).toISOString(),
          status: 'planned'
        };
        const fuRes = await followUpsAPI.create(followUpPayload);
        newFollowUp = fuRes.data;
      }

      // Notify parent with updated lead + optional follow-up
      onSuccess(updatedLead.data, newFollowUp);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content addfu-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Add Follow-Up For Student</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="login-error">❌ {error}</div>}

            {/* Stage */}
            <label className="addfu-label">
              Stage<span className="required-star">*</span>
            </label>
            <select
              className="form-select"
              value={form.stageId}
              onChange={handleStageChange}
              disabled={loading}
            >
              <option value="">Select</option>
              {stages.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            {/* Reason */}
            <label className="addfu-label">
              Reason<span className="required-star">*</span>
            </label>
            <select
              className="form-select"
              value={form.reasonId}
              onChange={handleReasonChange}
              disabled={loading || !form.stageId}
            >
              <option value="">Select</option>
              {reasons.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>

            {/* Remark */}
            <label className="addfu-label">
              Remark<span className="required-star">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              disabled={loading}
            />

            {/* Add Follow-Up checkbox */}
            <div className="addfu-checkbox-row">
              <input
                type="checkbox"
                id="addFollowUpCheck"
                className="addfu-checkbox"
                checked={form.addFollowUp}
                onChange={(e) =>
                  setForm({ ...form, addFollowUp: e.target.checked })
                }
                disabled={loading}
              />
              <label htmlFor="addFollowUpCheck" className="addfu-checkbox-label">
                Add Follow-Up
              </label>
            </div>

            {/* Date & Time (conditional) */}
            {form.addFollowUp && (
              <input
                type="datetime-local"
                className="form-input"
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                disabled={loading}
                style={{ marginTop: 8 }}
              />
            )}
          </div>

          <div className="modal-footer addfu-footer">
            <button type="submit" className="settings-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}