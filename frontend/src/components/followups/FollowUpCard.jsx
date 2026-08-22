import { useState } from 'react';
import useCountdown from '../../hooks/useCountdown';

export default function FollowUpCard({
  followUp,
  onEdit,
  onMarkDone,
  onSnooze,
  onDelete,
  onView
}) {
  const countdown = useCountdown(followUp.dueAt);
  const [menuOpen, setMenuOpen] = useState(false);

  // Format the dueAt date for "Extra" column
  const formattedDate = new Date(followUp.dueAt)
    .toISOString()
    .replace('T', ' ')
    .substring(0, 19);

  // WhatsApp - direct chat link
  const handleWhatsApp = () => {
    if (!followUp.phone) {
      alert('No contact number available');
      return;
    }
    const phone = followUp.phone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('91') ? phone : `91${phone}`;
    const message = encodeURIComponent(`Hi ${followUp.name},`);
    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
  };

  // Call
  const handleCall = () => {
    if (!followUp.phone) {
      alert('No contact number available');
      return;
    }
    window.location.href = `tel:${followUp.phone}`;
  };

  // Schedule reschedule - open snooze modal
  const handleSchedule = () => {
    if (onSnooze) onSnooze(followUp);
  };

  // View lead details
  const handleView = () => {
    if (onView) onView(followUp);
  };

  // Menu toggle
  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  // Edit
  const handleEditClick = () => {
    setMenuOpen(false);
    if (onEdit) onEdit(followUp);
  };

  // Mark as Done
  const handleMarkDoneClick = () => {
    setMenuOpen(false);
    if (onMarkDone) onMarkDone(followUp);
  };

  // Snooze
  const handleSnoozeClick = () => {
    setMenuOpen(false);
    if (onSnooze) onSnooze(followUp);
  };

  // Delete
  const handleDeleteClick = () => {
    setMenuOpen(false);
    if (onDelete) onDelete(followUp._id);
  };

  // Status badge color class
  const statusClass = {
    planned: 'status-planned',
    completed: 'status-completed',
    missed: 'status-missed'
  }[followUp.status] || 'status-planned';

  return (
    <div className={`lead-card followup-card ${followUp.status === 'completed' ? 'completed' : ''}`}>
      <div className="followup-card-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 className="lead-name">{followUp.name}</h3>
          <span className={`status-badge ${statusClass}`}>
            {followUp.status}
          </span>
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
            title="Reschedule"
            onClick={handleSchedule}
          >
            📅
          </button>
          <button className="action-icon" title="View Lead" onClick={handleView}>
            👁
          </button>

          {/* 3-dot menu */}
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
                <div
                  className="menu-backdrop"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="action-menu">
                  <button className="menu-item" onClick={handleEditClick}>
                    ✎ Edit
                  </button>
                  {followUp.status !== 'completed' && (
                    <button
                      className="menu-item"
                      onClick={handleMarkDoneClick}
                    >
                      ✅ Mark as Done
                    </button>
                  )}
                  <button className="menu-item" onClick={handleSnoozeClick}>
                    🔔 Snooze
                  </button>
                  <button
                    className="menu-item menu-item-danger"
                    onClick={handleDeleteClick}
                  >
                    🗑 Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="followup-countdown">
        <span className="countdown-label">Follow Up In:</span>
        <span
          className={`countdown-value ${countdown.expired ? 'expired' : ''}`}
        >
          {countdown.display}
        </span>
      </div>

      <div className="lead-card-details">
        <div className="detail-col">
          <div className="detail-label">Contact Details:</div>
          {followUp.email && (
            <div className="detail-value contact-link">✉ {followUp.email}</div>
          )}
          <div className="detail-value contact-link" style={{ marginTop: 4 }}>
            📞 {followUp.phone}
          </div>
        </div>

        <div className="detail-col">
          <div className="detail-label">Equired For:</div>
          <div className="detail-value">{followUp.inquiredFor}</div>
          <div className="detail-sub">{followUp.program}</div>
        </div>

        <div className="detail-col">
          <div className="detail-label">Lead Stage:</div>
          <div className="detail-value">{followUp.stage}</div>
          <div className="detail-sub">{followUp.stageNote}</div>
        </div>

        <div className="detail-col">
          <div className="detail-label">Source:</div>
          <div className="detail-value">{followUp.source}</div>
          {followUp.sourceNote && (
            <div className="detail-sub">{followUp.sourceNote}</div>
          )}
        </div>

        <div className="detail-col">
          <div className="detail-label">Location:</div>
          <div className="detail-value">{followUp.location}</div>
          {followUp.locationSub && (
            <div className="detail-sub">{followUp.locationSub}</div>
          )}
        </div>

        <div className="detail-col">
          <div className="detail-label">Extra:</div>
          <div className="detail-value">{formattedDate}</div>
          {followUp.assignedTo && (
            <div className="detail-sub assigned-to">{followUp.assignedTo}</div>
          )}
        </div>
      </div>
    </div>
  );
}