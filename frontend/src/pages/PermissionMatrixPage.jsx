import { useState, useEffect } from 'react';
import {
  PERMISSION_PAGES,
  PERMISSION_ACTIONS,
  UPLOAD_DOWNLOAD_PAGES,
  getDefaultPermissions
} from '../config/permissions';
import { permissionsAPI } from '../services/api';

export default function PermissionMatrixPage({ role, onBack }) {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // Component mount par DB se permissions load karo
  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true);
      try {
        const res = await permissionsAPI.getByRole(role.value);

        if (res.data.isDefault) {
          // DB mein nahi hai - frontend defaults use karo
          const defaults = getDefaultPermissions(role.value);
          setPermissions(defaults);
        } else {
          // DB se mila hai - use karo
          setPermissions(res.data.permissions);
        }
      } catch (err) {
        console.error('Load failed:', err);
        // Fallback - defaults dikhao
        const defaults = getDefaultPermissions(role.value);
        setPermissions(defaults);
        setSavedMessage('⚠️ Could not load from server, showing defaults');
        setTimeout(() => setSavedMessage(''), 3000);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [role.value]);

  // Single cell toggle
  const handleToggle = (page, action) => {
    setPermissions((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [action]: !prev[page]?.[action]
      }
    }));
  };

  // Save permissions to DB
  const handleSave = async () => {
    setSaving(true);
    try {
      await permissionsAPI.save(role.value, permissions);
      setSavedMessage('✅ Saved to database!');
      setTimeout(() => setSavedMessage(''), 2000);
    } catch (err) {
      setSavedMessage('❌ Save failed: ' + err.message);
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults - DB se delete karke defaults dikhao
  const handleReset = async () => {
    if (!confirm(`Reset permissions for ${role.label} to defaults?`)) return;

    try {
      // DB se delete karo
      await permissionsAPI.reset(role.value);

      // Defaults set karo
      const defaults = getDefaultPermissions(role.value);
      setPermissions(defaults);
      setSavedMessage('🔄 Reset to defaults');
      setTimeout(() => setSavedMessage(''), 2000);
    } catch (err) {
      setSavedMessage('❌ Reset failed: ' + err.message);
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  // Check karo agar action applicable hai is page pe
  const isActionApplicable = (page, action) => {
    if (action === 'upload' || action === 'download') {
      return UPLOAD_DOWNLOAD_PAGES.includes(page);
    }
    return true;
  };

  // Action labels for display
  const ACTION_LABELS = {
    view: 'View',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    upload: 'Upload',
    download: 'Download'
  };

  return (
    <div className="permissions-content">
      {/* Header with back button */}
      <div className="permission-matrix-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2>Permissions - {role.label}</h2>
        <div className="matrix-actions">
          {savedMessage && (
            <span className="save-message">{savedMessage}</span>
          )}
          <button
            className="settings-btn-secondary"
            onClick={handleReset}
            disabled={loading || saving}
          >
            Reset
          </button>
          <button
            className="settings-btn"
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="loading-state">⏳ Loading permissions...</div>
      ) : (
        <div className="matrix-table-wrapper">
          <table className="settings-table permission-matrix-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Page</th>
                {PERMISSION_ACTIONS.map((action) => (
                  <th key={action} style={{ textAlign: 'center' }}>
                    {ACTION_LABELS[action]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_PAGES.map((page) => (
                <tr key={page}>
                  <td>{page}</td>
                  {PERMISSION_ACTIONS.map((action) => {
                    const applicable = isActionApplicable(page, action);
                    const checked = permissions[page]?.[action] || false;

                    return (
                      <td
                        key={action}
                        style={{ textAlign: 'center', padding: '12px' }}
                      >
                        {applicable ? (
                          <input
                            type="checkbox"
                            className="permission-checkbox"
                            checked={checked}
                            onChange={() => handleToggle(page, action)}
                          />
                        ) : (
                          <span style={{ color: '#ccc' }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}