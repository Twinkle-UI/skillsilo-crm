import { useState } from 'react';
import { ROLES } from '../config/permissions';
import PermissionMatrixPage from './PermissionMatrixPage';

export default function PermissionsPage() {
  // null = list view, role object = matrix view
  const [editingRole, setEditingRole] = useState(null);

  // Edit click - role ke liye matrix page khole
  const handleEdit = (role) => {
    setEditingRole(role);
  };

  // Matrix se wapas list pe
  const handleBack = () => {
    setEditingRole(null);
  };

  // Agar editing mode hai toh matrix page render karo
  if (editingRole) {
    return <PermissionMatrixPage role={editingRole} onBack={handleBack} />;
  }

  // List view (image 1 jaisa)
  return (
    <div className="permissions-content">
      <div className="permissions-header">
        <h2>Permissions</h2>
      </div>

      <table className="settings-table permissions-table">
        <thead>
          <tr>
            <th>Role</th>
            <th style={{ width: 60, textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {ROLES.map((role) => (
            <tr key={role.value}>
              <td>{role.label}</td>
              <td style={{ textAlign: 'right' }}>
                <button
                  className="icon-btn edit"
                  onClick={() => handleEdit(role)}
                  title={`Edit permissions for ${role.label}`}
                >
                  ✎
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}