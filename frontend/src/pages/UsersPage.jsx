import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import AddUserModal from '../components/users/AddUserModal';


// Role internal value → display label
const ROLE_LABELS = {
  admin: 'Administrator',
  team_lead: 'Team Lead',
  manager: 'Manager',
  employee: 'Employee'
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null); // null = add mode, object = edit mode

  // Fetch users when search/entries change (with debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await usersAPI.getAll({
          search,
          page: 1,
          limit: entries
        });
        setUsers(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, entries]);

  // Toggle user status (admin ki nahi ho sakti)
  const handleToggle = async (user) => {
    if (user.role === 'admin') {
      alert('Admin status cannot be changed');
      return;
    }

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u._id === user._id ? { ...u, isActive: !u.isActive } : u
      )
    );

    try {
      await usersAPI.toggle(user._id);
    } catch (err) {
      alert('Toggle failed: ' + err.message);
      // Revert on error
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isActive: !u.isActive } : u
        )
      );
    }
  };

  // Delete user (admin nahi delete ho sakta)
  const handleDelete = async (user) => {
    if (user.role === 'admin') {
      alert('Admin user cannot be deleted');
      return;
    }

    if (!confirm(`Delete user "${user.name}"?`)) return;

    try {
      await usersAPI.delete(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Edit user - placeholder (Step 9 mein modal banayenge)
// Edit user - modal khole with pre-filled data
  const handleEdit = (user) => {
    setEditUser(user);
  };

  // Edit success - list mein user update karo
  const handleEditSuccess = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
    );
  };

  // Add new user - placeholder (Step 9 mein modal banayenge)
  // Add new user - modal khole
  const handleAdd = () => {
    setShowAddModal(true);
  };

  // Modal se success aane par list update karo
  const handleAddSuccess = (newUser) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  return (
    <div className="users-content">
      {/* Header */}
      <div className="users-header">
        <h2>Users</h2>
        <button className="settings-btn" onClick={handleAdd}>
          Add
        </button>
      </div>

      {/* Controls */}
      <div className="table-controls">
        <div className="show-entries">
          <span>Show</span>
          <select
            value={entries}
            onChange={(e) => setEntries(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="search-box">
          <label>Search:</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-state">❌ {error}</div>}

      {/* Table */}
      {loading ? (
        <div className="loading-state">⏳ Loading...</div>
      ) : users.length === 0 ? (
        <div className="no-results">No users found</div>
      ) : (
        <table className="settings-table users-table">
          <thead>
            <tr>
              <th>
                <span className="th-content">
                  Employee ID
                  <span className="sort-icon">↕</span>
                </span>
              </th>
              <th>
                <span className="th-content">
                  Name
                  <span className="sort-icon">↕</span>
                </span>
              </th>
              <th>
                <span className="th-content">
                  Email
                  <span className="sort-icon">↕</span>
                </span>
              </th>
              <th>
                <span className="th-content">
                  Password
                  <span className="sort-icon">↕</span>
                </span>
              </th>
              <th>
                <span className="th-content">
                  Role
                  <span className="sort-icon">↕</span>
                </span>
              </th>
              <th>
                <span className="th-content">
                  Department
                  <span className="sort-icon">↕</span>
                </span>
              </th>
              <th style={{ width: 100 }}>Status</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.employeeId || '—'}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className="password-masked">••••••••••</span>
                </td>
                <td>{ROLE_LABELS[user.role] || user.role}</td>
                <td>
                  {user.departments && user.departments.length > 0 ? (
                    <div className="departments-list">
                      {user.departments.map((d) => (
                        <div key={d._id}>{d.name}</div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#aaa' }}>—</span>
                  )}
                </td>
                <td>
                  {/* Admin ka toggle hide */}
                  {user.role !== 'admin' && (
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={user.isActive}
                        onChange={() => handleToggle(user)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  )}
                </td>
                <td className="action-cell">
                  <button
                    className="icon-btn edit"
                    onClick={() => handleEdit(user)}
                    title="Edit"
                  >
                    ✎
                  </button>
                  {/* Admin ka delete hide */}
                  {user.role !== 'admin' && (
                    <button
                      className="icon-btn delete"
                      onClick={() => handleDelete(user)}
                      title="Delete"
                    >
                      🗑
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

{/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Edit User Modal - same component, edit mode */}
      {editUser && (
        <AddUserModal
          editUser={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}