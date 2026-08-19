import { useState, useEffect } from 'react';
import { settingsAPI, usersAPI } from '../../services/api';

const UNIVERSITIES = [
  "Vikrant University",
  "Mahakaushal University",
  "Dr.Preeti Global University",
  "Glocal University",
  "Old Admission",
  "Mahaveer University",
  "HRIT",
];

export default function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onDelete,
  onAssign,
  onChangeStage,
  onExport,
  onChangeUniversity
}) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showUniversityModal, setShowUniversityModal] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="bulk-actions-bar">
        <div className="bulk-bar-left">
          <span className="bulk-count">
            <strong>{selectedCount}</strong> selected
          </span>
          <button className="bulk-clear-btn" onClick={onClearSelection}>
            Clear selection
          </button>
        </div>

        <div className="bulk-bar-actions">
          <button
            className="bulk-action-btn"
            onClick={() => setShowAssignModal(true)}
            title="Assign to user"
          >
            👤 Assign To
          </button>
          <button
            className="bulk-action-btn"
            onClick={() => setShowStageModal(true)}
            title="Change stage"
          >
            📊 Change Stage
          </button>
          <button
            className="bulk-action-btn"
            onClick={() => setShowUniversityModal(true)}
            title="Change university"
          >
            🏫 Change University
          </button>
          <button
            className="bulk-action-btn"
            onClick={onExport}
            title="Export selected as CSV"
          >
            📥 Export
          </button>
          <button
            className="bulk-action-btn bulk-action-danger"
            onClick={onDelete}
            title="Delete selected"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {showAssignModal && (
        <AssignUserModal
          selectedCount={selectedCount}
          onClose={() => setShowAssignModal(false)}
          onConfirm={(user) => {
            onAssign(user);
            setShowAssignModal(false);
          }}
        />
      )}

      {showStageModal && (
        <ChangeStageModal
          selectedCount={selectedCount}
          onClose={() => setShowStageModal(false)}
          onConfirm={(stage, reason) => {
            onChangeStage(stage, reason);
            setShowStageModal(false);
          }}
        />
      )}

      {showUniversityModal && (
        <ChangeUniversityModal
          selectedCount={selectedCount}
          onClose={() => setShowUniversityModal(false)}
          onConfirm={(university, assignedTo) => {
            onChangeUniversity(university, assignedTo);
            setShowUniversityModal(false);
          }}
        />
      )}
    </>
  );
}

// ==================== Change University Modal ====================

function ChangeUniversityModal({ selectedCount, onClose, onConfirm }) {
  const [users, setUsers] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersAPI
      .getAll({ limit: 200 })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = () => {
    if (!selectedUniversity) {
      alert('Please select a university');
      return;
    }
    onConfirm(selectedUniversity, selectedUser);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bulk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Change University</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="bulk-modal-info">
            Changing university for <strong>{selectedCount}</strong> lead{selectedCount > 1 ? 's' : ''}
          </p>

          <label className="bulk-label">
            University <span style={{ color: '#e53935' }}>*</span>
          </label>
          <select
            className="form-select"
            value={selectedUniversity}
            onChange={(e) => setSelectedUniversity(e.target.value)}
            autoFocus
          >
            <option value="">Select University</option>
            {UNIVERSITIES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <label className="bulk-label" style={{ marginTop: 12 }}>
            Assign To (optional)
          </label>
          {loading ? (
            <div style={{ padding: 10 }}>⏳ Loading users...</div>
          ) : (
            <select
              className="form-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">-- Keep existing assignment --</option>
              {users.map((u) => (
                <option key={u._id} value={`${u.name} (${u.employeeId})`}>
                  {u.name} ({u.employeeId})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="modal-footer">
          <button className="settings-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="settings-btn" onClick={handleConfirm}>
            Update {selectedCount} Lead{selectedCount > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Assign User Modal ====================

function AssignUserModal({ selectedCount, onClose, onConfirm }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersAPI
      .getAll({ limit: 200 })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = () => {
    if (!selectedUser) { alert('Please select a user'); return; }
    onConfirm(selectedUser);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bulk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign To User</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="bulk-modal-info">
            Assigning <strong>{selectedCount}</strong> lead{selectedCount > 1 ? 's' : ''} to:
          </p>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center' }}>⏳ Loading users...</div>
          ) : (
            <select
              className="form-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              autoFocus
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u._id} value={`${u.name} (${u.employeeId})`}>
                  {u.name} ({u.employeeId})
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="modal-footer">
          <button className="settings-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="settings-btn" onClick={handleConfirm}>
            Assign {selectedCount} Lead{selectedCount > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Change Stage Modal ====================

function ChangeStageModal({ selectedCount, onClose, onConfirm }) {
  const [stages, setStages] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsAPI
      .getAll('stage', { limit: 100 })
      .then((res) => setStages(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedStageId) { setReasons([]); return; }
    settingsAPI
      .getAll('reason', { limit: 100, parentId: selectedStageId })
      .then((res) => setReasons(res.data))
      .catch((err) => console.error(err));
  }, [selectedStageId]);

  const handleStageChange = (e) => {
    const id = e.target.value;
    const stage = stages.find((s) => s._id === id);
    setSelectedStageId(id);
    setSelectedStage(stage?.name || '');
    setSelectedReason('');
  };

  const handleConfirm = () => {
    if (!selectedStage) { alert('Please select a stage'); return; }
    onConfirm(selectedStage, selectedReason);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bulk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Change Stage</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="bulk-modal-info">
            Changing stage for <strong>{selectedCount}</strong> lead{selectedCount > 1 ? 's' : ''}:
          </p>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center' }}>⏳ Loading...</div>
          ) : (
            <>
              <label className="bulk-label">Stage <span style={{ color: '#e53935' }}>*</span></label>
              <select className="form-select" value={selectedStageId} onChange={handleStageChange} autoFocus>
                <option value="">Select Stage</option>
                {stages.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              <label className="bulk-label" style={{ marginTop: 12 }}>Reason (optional)</label>
              <select
                className="form-select"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                disabled={!selectedStageId}
              >
                <option value="">Select Reason</option>
                {reasons.map((r) => (
                  <option key={r._id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="settings-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="settings-btn" onClick={handleConfirm}>
            Change Stage for {selectedCount} Lead{selectedCount > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}