import { useState, useEffect } from "react";
import { settingsAPI } from "../../services/api";

// Type → Form configuration mapping
const FORM_CONFIG = {
  university: {
    title: "Add University",
    fields: ["name"],
  },
  category: {
    title: "Add Category",
    fields: ["name", "parent"],
    parentType: "university",
    parentLabel: "Department",
  },
  course: {
    title: "Add Course",
    fields: ["name", "parent"],
    parentType: "category",
    parentLabel: "Category",
  },
  stage: {
    title: "Add Stage",
    fields: ["name", "stageFlags"],
  },
  reason: {
    title: "Add Reason",
    fields: ["name", "parent"],
    parentType: "stage",
    parentLabel: "Stage",
  },
  source: {
    title: "Add Source",
    fields: ["name"],
  },
  subsource: {
    title: "Add Sub-Source",
    fields: ["name", "parent"],
    parentType: "source",
    parentLabel: "Source",
  },
  city: {
    title: "Add City",
    fields: ["name", "parent"],
    parentType: "state",
    parentLabel: "State",
  },
  state: {
    title: "Add State",
    fields: ["name", "parent"],
    parentType: "country",
    parentLabel: "Country",
  },
  country: {
    title: "Add Country",
    fields: ["name"],
  },
  email_template: {
    title: "Add Email Template",
    fields: ["name", "subject", "body", "parent"],
    parentType: "university",
    parentLabel: "Department",
  },
  sms_template: {
    title: 'Add SMS Template',
    fields: ['name', 'templateId', 'body', 'parent'],
    parentType: 'university',
    parentLabel: 'Department'
  },
   whatsapp_template: {
    title: 'Add WhatsApp Template',
    fields: ['name', 'body', 'parent'],
    parentType: 'university',
    parentLabel: 'Department'
  },
  lead_assignment: {
    title: 'Add Lead Assignment',
    fields: ['name', 'description', 'parent'],
    parentType: 'category',
    parentLabel: 'Category',
  },
};

export default function AddSettingModal({ type, onClose, onSuccess }) {
  const config = FORM_CONFIG[type] || { title: "Add Item", fields: ["name"] };

  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
   const [templateId, setTemplateId] = useState('');
  const [parentId, setParentId] = useState("");
  const [isInitial, setIsInitial] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [isReEnquired, setIsReEnquired] = useState(false);

  // Parent options dropdown ke liye
  const [parentOptions, setParentOptions] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // Submit state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Parent dropdown ke liye options fetch karo
  useEffect(() => {
    if (config.fields.includes("parent") && config.parentType) {
      setLoadingParents(true);
      settingsAPI
        .getAll(config.parentType, { limit: 100 })
        .then((res) => setParentOptions(res.data))
        .catch((err) => console.error("Error loading parents:", err))
        .finally(() => setLoadingParents(false));
    }
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    // Build data payload
    const data = { name: name.trim() };

    if (config.fields.includes("parent") && parentId) {
      data.parentId = parentId;
    }

    if (config.fields.includes("subject")) {
      data.subject = subject.trim();
    }

    if (config.fields.includes("description")) {
      data.description = description.trim();
    }

    if (config.fields.includes("body")) {
      data.body = body.trim();
    }
    if (config.fields.includes('templateId')) {
      data.templateId = templateId.trim();
    }

    if (config.fields.includes("stageFlags")) {
      data.isInitial = isInitial;
      data.isFinal = isFinal;
      data.isReEnquired = isReEnquired;
    }

    setLoading(true);
    try {
      const res = await settingsAPI.create(type, data);
      onSuccess(res.data); // Parent ko notify karo
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{config.title}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="login-error">❌ {error}</div>}

            {/* Name field - hamesha hota hai */}
            <div className="form-group">
              <label className="form-label">Name *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {/* Subject - sirf email template ke liye */}
            {config.fields.includes("subject") && (
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Welcome to {{university}}!"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            {/* Template ID - sirf SMS template ke liye */}
            {config.fields.includes('templateId') && (
              <div className="form-group">
                <label className="form-label">Template ID *</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1207161780123456789"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Description - Lead Assignment jaise types ke liye */}
            {config.fields.includes("description") && (
              <div className="form-group">
                <label className="form-label">Description</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Body - sirf email template ke liye */}
            {config.fields.includes("body") && (
              <div className="form-group">
                <label className="form-label">
                  Body (use {`{{name}}, {{course}}`} for variables)
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Email content..."
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            {/* Parent dropdown - linked types ke liye */}
            {config.fields.includes("parent") && (
              <div className="form-group">
                <label className="form-label">{config.parentLabel} *</label>
                <select
                  className="form-select"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  disabled={loading || loadingParents}
                  required
                >
                  <option value="">
                    {loadingParents
                      ? "Loading..."
                      : `Select ${config.parentLabel}`}
                  </option>
                  {parentOptions.map((option) => (
                    <option key={option._id} value={option._id}>
                      {option.name}
                      {option.parentId?.name && ` (${option.parentId.name})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Stage flags - sirf Stages ke liye */}
            {config.fields.includes("stageFlags") && (
              <div className="form-group">
                <label className="form-label">Stage Type</label>
                <div className="checkbox-group">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={isInitial}
                      onChange={(e) => setIsInitial(e.target.checked)}
                      disabled={loading}
                    />
                    <span>Initial Stage</span>
                  </label>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={isFinal}
                      onChange={(e) => setIsFinal(e.target.checked)}
                      disabled={loading}
                    />
                    <span>Final Stage</span>
                  </label>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={isReEnquired}
                      onChange={(e) => setIsReEnquired(e.target.checked)}
                      disabled={loading}
                    />
                    <span>Re-Enquired Stage</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="settings-btn" disabled={loading}>
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}