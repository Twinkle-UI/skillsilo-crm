// Reusable table - flexible based on type

export default function SettingsTable({
  items,
  loading,
  showCategory,
  showDepartment,
  showStageFlags,
  showSubject,
  showTemplateId,
  hideStatus,
  canEdit = true, // update permission
  canDelete = true, // delete permission
  parentColumnLabel = "Department",
  onToggle,
  onToggleField,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return <div className="loading-state">⏳ Loading...</div>;
  }

  if (!items || items.length === 0) {
    return <div className="no-results">No items found</div>;
  }

  // Helpers
  const getCategory = (item) => item.parentId?.name || "—";
  const getDepartment = (item) => {
    if (showCategory) return item.parentId?.parentId?.name || "—";
    return item.parentId?.name || "—";
  };

  // Reusable mini toggle
  const Toggle = ({ checked, onChange }) => (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-slider"></span>
    </label>
  );

  return (
    <table className="settings-table">
      <thead>
        <tr>
          <th>
            <span className="th-content">
              Name
              <span className="sort-icon">↕</span>
            </span>
          </th>

          {/* Category column - Course ke liye */}
          {showCategory && (
            <th>
              <span className="th-content">
                Category
                <span className="sort-icon">↕</span>
              </span>
            </th>
          )}

          {/* Subject column - Email Templates ke liye */}
          {showSubject && (
            <th>
              <span className="th-content">
                Subject
                <span className="sort-icon">↕</span>
              </span>
            </th>
          )}

          {/* Template ID column - SMS Templates ke liye */}
          {showTemplateId && (
            <th>
              <span className="th-content">
                Template ID
                <span className="sort-icon">↕</span>
              </span>
            </th>
          )}

          {/* Parent column - Department / Stage / Source / etc. */}
          {showDepartment && (
            <th>
              <span className="th-content">
                {parentColumnLabel}
                <span className="sort-icon">↕</span>
              </span>
            </th>
          )}

          {/* Stage flag columns */}
          {showStageFlags && <th>Initial Stage</th>}
          {showStageFlags && <th>Final Stage</th>}
          {showStageFlags && <th>Re-Enquired Stage</th>}

          {/* Status column (hidden for WhatsApp templates) */}
          {!hideStatus && (
            <th style={{ width: 120, textAlign: "left" }}>Status</th>
          )}
          <th style={{ width: 100 }}></th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item._id}>
            <td>{item.name}</td>

            {showCategory && <td>{getCategory(item)}</td>}

            {/* Subject cell - truncate if too long */}
            {showSubject && (
              <td className="subject-cell" title={item.subject}>
                {item.subject || "—"}
              </td>
            )}

            {/* Template ID cell */}
            {showTemplateId && (
              <td className="subject-cell" title={item.templateId}>
                {item.templateId || "—"}
              </td>
            )}

            {showDepartment && <td>{getDepartment(item)}</td>}

            {/* Stage flags ke 3 toggles */}
            {showStageFlags && (
              <>
                <td>
                  <Toggle
                    checked={!!item.isInitial}
                    onChange={() => onToggleField(item._id, "isInitial")}
                  />
                </td>
                <td>
                  <Toggle
                    checked={!!item.isFinal}
                    onChange={() => onToggleField(item._id, "isFinal")}
                  />
                </td>
                <td>
                  <Toggle
                    checked={!!item.isReEnquired}
                    onChange={() => onToggleField(item._id, "isReEnquired")}
                  />
                </td>
              </>
            )}

            {/* Status toggle (hidden for WhatsApp templates) */}
            {!hideStatus && (
              <td>
                <Toggle
                  checked={item.isActive}
                  onChange={() => onToggle(item._id)}
                />
              </td>
            )}

            {/* Edit + Delete - conditional based on permissions */}
            <td className="action-cell">
              {canEdit && (
                <button
                  className="icon-btn edit"
                  onClick={() => onEdit(item)}
                  title="Edit"
                >
                  ✎
                </button>
              )}
              {canDelete && (
                <button
                  className="icon-btn delete"
                  onClick={() => onDelete(item._id)}
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
  );
}
