import { useState, useEffect } from "react";
import { leadsAPI, followUpsAPI } from "../services/api";

export default function LeadDetailsPage({ leadId, onBack, onEdit }) {
  const [lead, setLead] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("followups"); // 'followups' or 'journey'

  // Load lead + follow-ups + activity (journey)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Parallel: lead details + its follow-ups + journey activity
        const [leadRes, followUpsRes, activityRes] = await Promise.all([
          leadsAPI.getById(leadId),
          followUpsAPI.getByLead(leadId),
          leadsAPI.getActivity(leadId),
        ]);

        setLead(leadRes.data);
        setFollowUps(followUpsRes.data);
        setActivities(activityRes.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (leadId) loadData();
  }, [leadId]);

  // Format date helper
  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date short
  // Format date short
  const formatDateShort = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Journey tab date format - "26th Aug 2026 03:42 PM"
  const formatJourneyDate = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    const day = d.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
          ? "nd"
          : day % 10 === 3 && day !== 13
            ? "rd"
            : "th";
    const month = d.toLocaleString("en-IN", { month: "short" });
    const year = d.getFullYear();
    const time = d.toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${day}${suffix} ${month} ${year} ${time}`;
  };

  // Edit click
  const handleEdit = () => {
    if (onEdit) onEdit(lead);
  };

  // Loading
  if (loading) {
    return (
      <div className="lead-details-page">
        <div className="loading-state">⏳ Loading lead details...</div>
      </div>
    );
  }

  // Error
  if (error || !lead) {
    return (
      <div className="lead-details-page">
        <div className="error-state">
          ❌ {error || "Lead not found"}
          <br />
          <button
            className="settings-btn"
            onClick={onBack}
            style={{ marginTop: 16 }}
          >
            ← Back to Leads
          </button>
        </div>
      </div>
    );
  }

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Reusable info row
  const InfoRow = ({ label, value, isLink, linkType }) => (
    <div className="ld-info-row">
      <div className="ld-info-label">{label}</div>
      <div className="ld-info-value">
        {isLink && value && linkType === "phone" ? (
          <a href={`tel:${value}`}>{value}</a>
        ) : isLink && value && linkType === "email" ? (
          <a href={`mailto:${value}`}>{value}</a>
        ) : (
          value || "—"
        )}
      </div>
    </div>
  );

  return (
    <div className="lead-details-page">
      {/* Top bar */}
      <div className="ld-topbar">
        <button className="ld-back-btn" onClick={onBack}>
          ← Back to Leads
        </button>
        <button className="ld-edit-btn" onClick={handleEdit}>
          ✎ Edit Lead
        </button>
      </div>

      <div className="ld-layout">
        {/* ==================== LEFT PANEL ==================== */}
        <div className="ld-left-panel">
          {/* Header with avatar */}
          <div className="ld-header">
            <div className="ld-avatar">{getInitials(lead.name)}</div>
            <h2 className="ld-name">{lead.name}</h2>
            <div className="ld-stage-badge">
              {lead.stage}
              {lead.stageNote && ` (${lead.stageNote})`}
            </div>
          </div>

          {/* Interested In */}
          <div className="ld-section">
            <h3 className="ld-section-title">Interested In</h3>
            <InfoRow label="Department" value={lead.inquiredFor} />
            <InfoRow label="Category" value={lead.program} />
            <InfoRow label="Specialization" value={lead.category} />
          </div>

          {/* Contact Information */}
          <div className="ld-section">
            <h3 className="ld-section-title">Contact Information</h3>
            <InfoRow label="Email" value={lead.email} isLink linkType="email" />
            <InfoRow
              label="Mobile"
              value={lead.contact}
              isLink
              linkType="phone"
            />
            <InfoRow
              label="Location"
              value={
                [lead.location, lead.state, lead.country]
                  .filter(Boolean)
                  .join(", ") || "—"
              }
            />
          </div>

          {/* Extra Information */}
          <div className="ld-section">
            <h3 className="ld-section-title">Extra Information</h3>
            <InfoRow label="Source" value={lead.source} />
            <InfoRow label="Sub-Source" value={lead.sourceNote} />
            <InfoRow label="Assigned To" value={lead.assignedTo} />
            <InfoRow label="Call Count" value={lead.callCount || 0} />
            <InfoRow label="Created" value={formatDate(lead.createdAt)} />
            <InfoRow label="Last Updated" value={formatDate(lead.updatedAt)} />
          </div>

          {/* Tags */}
          {lead.program && (
            <div className="ld-section">
              <h3 className="ld-section-title">Tags</h3>
              <div className="ld-tags">
                <span className="ld-tag">{lead.program}</span>
                {lead.category && (
                  <span className="ld-tag">{lead.category}</span>
                )}
              </div>
            </div>
          )}

          {/* Remark if present */}
          {lead.remark && (
            <div className="ld-section">
              <h3 className="ld-section-title">Remark</h3>
              <div className="ld-remark-box">{lead.remark}</div>
            </div>
          )}
        </div>

        {/* ==================== RIGHT PANEL ==================== */}
        <div className="ld-right-panel">
          {/* Tabs */}
          <div className="ld-tabs">
            <button
              className={`ld-tab ${activeTab === "journey" ? "active" : ""}`}
              onClick={() => setActiveTab("journey")}
            >
              Journey
            </button>
            <button
              className={`ld-tab ${activeTab === "followups" ? "active" : ""}`}
              onClick={() => setActiveTab("followups")}
            >
              Follow-Up(s) ({followUps.length})
            </button>
          </div>

          {/* Tab content */}
          <div className="ld-tab-content">
                        {activeTab === "journey" && (
              <div className="ld-journey-timeline">
                {activities.length === 0 ? (
                  <div className="ld-empty-state">
                    <div className="ld-empty-icon">🚧</div>
                    <h3>No Activity Yet</h3>
                    <p>Lead updates aur follow-ups yahan dikhengi.</p>
                  </div>
                ) : (
                  activities.map((act) => (
                    <div key={act._id} className="ld-journey-item">
                      <div className="ld-journey-dot" />
                      <div className="ld-journey-date-badge">
                        {formatJourneyDate(act.createdAt)}
                      </div>
                      <div className="ld-journey-content">
                        {act.type === "created" && (
                          <>
                            <strong>Lead Created</strong>
                            <div className="ld-journey-detail">
                              Lead Created
                              {act.details?.assignedTo &&
                                ` and assigned to ${act.details.assignedTo}`}
                            </div>
                          </>
                        )}

                        {act.type === "updated" && (
                          <>
                            <strong>Lead Updated</strong>
                            {act.changes?.map((c, i) => (
                              <div className="ld-journey-detail" key={i}>
                                <span className="ld-detail-label">
                                  {c.label}:
                                </span>{" "}
                                Old - {c.oldValue} | New - {c.newValue}
                              </div>
                            ))}
                            <div className="ld-journey-by">
                              By: {act.performedBy}
                            </div>
                          </>
                        )}

                        {act.type === "followup_added" && (
                          <>
                            <strong>Follow-Up</strong>
                            <div className="ld-journey-detail">
                              Added Follow-Up for{" "}
                              {formatJourneyDate(act.details?.dueAt)}
                            </div>
                            {act.details?.remark && (
                              <div className="ld-journey-detail">
                                <span className="ld-detail-label">
                                  Remark:
                                </span>{" "}
                                {act.details.remark}
                              </div>
                            )}
                            <div className="ld-journey-detail">
                              <span className="ld-detail-label">
                                Status:
                              </span>{" "}
                              {act.details?.status}
                            </div>
                            <div className="ld-journey-by">
                              By: {act.performedBy}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "followups" && (
              <div className="ld-followups-list">
                {followUps.length === 0 ? (
                  <div className="ld-empty-state">
                    <div className="ld-empty-icon">📅</div>
                    <h3>No Follow-ups</h3>
                    <p>No follow-ups have been scheduled for this lead yet.</p>
                  </div>
                ) : (
                  followUps.map((fu) => (
                    <div key={fu._id} className="ld-followup-item">
                      <div className="ld-followup-left">
                        <div className="ld-followup-date">
                          {formatDateShort(fu.dueAt)}
                        </div>
                        <div className="ld-followup-time">
                          {new Date(fu.dueAt).toLocaleString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      <div className="ld-followup-right">
                        <div className="ld-followup-header">
                          <strong>Follow-Up</strong>
                          <span
                            className={`ld-status-badge status-${fu.status}`}
                          >
                            {fu.status}
                          </span>
                        </div>

                        {fu.stageNote && (
                          <div className="ld-followup-detail">
                            <span className="ld-detail-label">Remark:</span>{" "}
                            {fu.stageNote}
                          </div>
                        )}

                        <div className="ld-followup-detail">
                          <span className="ld-detail-label">Stage:</span>{" "}
                          {fu.stage}
                        </div>

                        {fu.assignedTo && (
                          <div className="ld-followup-detail ld-detail-by">
                            For: <strong>{fu.assignedTo}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
