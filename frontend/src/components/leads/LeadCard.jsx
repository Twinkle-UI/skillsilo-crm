import { useState } from "react";

export default function LeadCard({
  lead,
  onEdit,
  onDelete,
  onView,
  onSchedule,
  isSelected = false,
  onSelectionChange,
  canDelete = true,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Checkbox toggle
  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (onSelectionChange) onSelectionChange(lead._id, e.target.checked);
  };
  // WhatsApp - direct chat link with phone number
  const handleWhatsApp = () => {
    if (!lead.contact) {
      alert("No contact number available");
      return;
    }
    // Phone number ko clean karo (only digits)
    const phone = lead.contact.replace(/\D/g, "");
    // Add country code if not present
    const fullPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const message = encodeURIComponent(`Hi ${lead.name},`);
    window.open(`https://wa.me/${fullPhone}?text=${message}`, "_blank");
  };

  // Call - tel: protocol
  const handleCall = () => {
    if (!lead.contact) {
      alert("No contact number available");
      return;
    }
    window.location.href = `tel:${lead.contact}`;
  };

  // Schedule - placeholder for follow-up (Phase 2 mein implement karenge)
  // Schedule - open follow-up modal
  const handleSchedule = () => {
    if (onSchedule) onSchedule(lead);
  };

  // View - placeholder for lead details modal (Phase 2 mein implement karenge)
  // View - open lead details page
  const handleView = () => {
    if (onView) onView(lead);
  };

  // Menu toggle
  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  // Edit
  const handleEditClick = () => {
    setMenuOpen(false);
    if (onEdit) onEdit(lead);
  };

  // Delete
  const handleDeleteClick = () => {
    setMenuOpen(false);
    if (onDelete) onDelete(lead._id);
  };

  return (
    <div className={`lead-card ${isSelected ? "selected" : ""}`}>
      <div className="lead-card-top">
        <div className="lead-card-left">
          <input
            type="checkbox"
            className="lead-checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
          />
          <h3 className="lead-name">{lead.name}</h3>
        </div>

        <div className="lead-call-badge">
          <span className="call-icon">📞</span>
          <span className="call-count">{lead.callCount || 0}</span>
        </div>

        <div className="lead-card-actions">
          <button
            className="action-icon"
            title="WhatsApp"
            onClick={handleWhatsApp}
          >
            💬
          </button>
          <button className="action-icon" title="Call" onClick={handleCall}>
            📞
          </button>
          <button
            className="action-icon"
            title="Schedule"
            onClick={handleSchedule}
          >
            📅
          </button>
          <button className="action-icon" title="View" onClick={handleView}>
            👁
          </button>

          {/* 3-dot menu with dropdown */}
          <div className="menu-wrapper">
            <button
              className="action-icon"
              title="More"
              onClick={handleMenuToggle}
            >
              ⋮
            </button>

            {menuOpen && (
              <>
                {/* Backdrop to close menu on outside click */}
                <div
                  className="menu-backdrop"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="action-menu">
                  <button className="menu-item" onClick={handleEditClick}>
                    ✎ Edit
                  </button>
                  {canDelete && (
                    <button
                      className="menu-item menu-item-danger"
                      onClick={handleDeleteClick}
                    >
                      🗑 Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="lead-card-details">
        <div className="detail-col">
          <div className="detail-label">Contact Details:</div>
          <div className="detail-value contact-link">📞 {lead.contact}</div>
          {lead.email && <div className="detail-sub">{lead.email}</div>}
        </div>

        <div className="detail-col">
          <div className="detail-label">Equired For:</div>
          <div className="detail-value">{lead.inquiredFor}</div>
          <div className="detail-sub">{lead.program}</div>
        </div>

        <div className="detail-col">
          <div className="detail-label">Lead Stage:</div>
          <div className="detail-value">{lead.stage}</div>
          {lead.stageNote && <div className="detail-sub">{lead.stageNote}</div>}
        </div>

        <div className="detail-col">
          <div className="detail-label">Source:</div>
          <div className="detail-value">{lead.source}</div>
          {lead.sourceNote && (
            <div className="detail-sub">{lead.sourceNote}</div>
          )}
        </div>

        <div className="detail-col">
          <div className="detail-label">Location:</div>
          <div className="detail-value">{lead.country || lead.state}</div>
          {lead.location && <div className="detail-sub">{lead.location}</div>}
        </div>

        <div className="detail-col">
          <div className="detail-label">Extra:</div>
          <div className="detail-value">
            {new Date(lead.updatedAt).toLocaleString("en-IN", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          {lead.assignedTo && (
            <div className="detail-sub assigned-to">{lead.assignedTo}</div>
          )}
        </div>
      </div>

      {lead.remark && (
        <div className="lead-remark">
          <strong>Remark:</strong> {lead.remark}
        </div>
      )}
    </div>
  );
}