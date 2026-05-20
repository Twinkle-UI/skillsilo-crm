import { useState, useEffect } from 'react';
import { usersAPI, settingsAPI } from '../../services/api';

// Image jaise 6 roles
const ROLES = [
  { value: '', label: 'Select Role', disabled: true },
  { value: 'manager', label: 'Manager' },
  { value: 'asst_manager', label: 'Asst. Manager' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'counsellor', label: 'Counsellor' },
  { value: 'publisher', label: 'Publisher' }
];

export default function AddUserModal({ editUser, onClose, onSuccess }) {
  const isEditMode = !!editUser;

  // Form fields
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  // Universities dropdown ke liye
  const [universities, setUniversities] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Edit mode mein existing data pre-fill
  useEffect(() => {
    if (editUser) {
      setEmployeeId(editUser.employeeId || '');
      setName(editUser.name || '');
      setEmail(editUser.email || '');
      setMobile(editUser.mobile || '');
      setRole(editUser.role || '');
      setPhotoName(editUser.profilePhoto || '');

      // Existing departments pre-fill - sirf IDs ka array
      const deptIds = (editUser.departments || []).map((d) =>
        typeof d === 'string' ? d : d._id
      );
      setSelectedDepartments(deptIds);
    }
  }, [editUser]);

  // Universities fetch karo
  useEffect(() => {
    setLoadingUniversities(true);
    settingsAPI
      .getAll('university', { limit: 100 })
      .then((res) => setUniversities(res.data))
      .catch((err) => console.error('Error loading universities:', err))
      .finally(() => setLoadingUniversities(false));
  }, []);

  // File select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setPhotoName(file.name);
  };

  // Toggle university selection
  const toggleDepartment = (uniId) => {
    setSelectedDepartments((prev) =>
      prev.includes(uniId)
        ? prev.filter((id) => id !== uniId)
        : [...prev, uniId]
    );
  };

  // Remove department chip
  const removeDepartment = (uniId) => {
    setSelectedDepartments((prev) => prev.filter((id) => id !== uniId));
  };

  // Get university name from ID
  const getUniversityName = (id) => {
    const uni = universities.find((u) => u._id === id);
    return uni?.name || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!employeeId.trim()) return setError('Employee ID is required');
    if (!name.trim()) return setError('Name is required');
    if (!email.trim()) return setError('Email is required');

    if (!isEditMode) {
      if (!password.trim()) return setError('Password is required');
      if (password.length < 6)
        return setError('Password must be at least 6 characters');
    } else if (password.trim() && password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    if (!role) return setError('Please select a role');

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        employeeId: employeeId.trim(),
        role,
        mobile: mobile.trim(),
        profilePhoto: photoName,
        departments: selectedDepartments
      };

      if (password.trim()) {
        payload.password = password;
      }

      // Selected departments ko full objects mein convert karo (table ke liye)
      const populatedDepartments = selectedDepartments.map((id) => ({
        _id: id,
        name: getUniversityName(id),
        type: 'university'
      }));

      let res;
      if (isEditMode) {
        res = await usersAPI.update(editUser._id, payload);
        onSuccess({
          ...res.data,
          departments: populatedDepartments
        });
      } else {
        res = await usersAPI.create(payload);
        onSuccess({
          ...res.data,
          departments: populatedDepartments
        });
      }

      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'add'} user`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content add-user-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Users' : 'Add Users'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="login-error">❌ {error}</div>}

            {/* 2-column grid */}
            <div className="user-form-grid">
              {/* LEFT COLUMN */}
              <div className="form-col">
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Employee ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    className="form-input"
                    placeholder={
                      isEditMode
                        ? 'Password (leave blank to keep)'
                        : 'Password'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={loading}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value} disabled={r.disabled}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="form-col">
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Mobile No."
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <div className="photo-upload-row">
                    {isEditMode && (
                      <div className="photo-preview">
                        {photoName ? (
                          <span className="photo-placeholder" title={photoName}>
                            🖼️
                          </span>
                        ) : (
                          <span className="photo-placeholder">👤</span>
                        )}
                      </div>
                    )}

                    <div className="file-input-wrapper" style={{ flex: 1 }}>
                      <label className="file-input-label">
                        Choose file
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={loading}
                          hidden
                        />
                      </label>
                      <span className="file-name">
                        {photoName || 'No file chosen'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Departments - Full width section */}
            <div className="form-group departments-section">
              <label className="form-label">
                Departments
                {selectedDepartments.length > 0 && (
                  <span className="dept-count">
                    {' '}({selectedDepartments.length} selected)
                  </span>
                )}
              </label>

              {/* Selected chips */}
              {selectedDepartments.length > 0 && (
                <div className="chips-container">
                  {selectedDepartments.map((id) => (
                    <span key={id} className="chip">
                      {getUniversityName(id)}
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => removeDepartment(id)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* University checkbox list */}
              <div className="university-list">
                {loadingUniversities ? (
                  <div style={{ padding: 12, color: '#888' }}>Loading...</div>
                ) : universities.length === 0 ? (
                  <div style={{ padding: 12, color: '#888' }}>
                    No universities found
                  </div>
                ) : (
                  universities.map((uni) => (
                    <label key={uni._id} className="university-row">
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(uni._id)}
                        onChange={() => toggleDepartment(uni._id)}
                      />
                      <span>{uni.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer add-user-footer">
            <button type="submit" className="settings-btn" disabled={loading}>
              {loading
                ? isEditMode ? 'Updating...' : 'Adding...'
                : isEditMode ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


