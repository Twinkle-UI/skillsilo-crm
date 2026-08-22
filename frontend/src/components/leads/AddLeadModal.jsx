import { useState, useEffect } from 'react';
import { leadsAPI, settingsAPI, usersAPI } from '../../services/api';

export default function AddLeadModal({ editLead, onClose, onSuccess }) {
  const isEditMode = !!editLead;

  // Form state
  const [form, setForm] = useState({
    name: '',
    contact: '',
    email: '',
    inquiredFor: '', // University name (text)
    inquiredForId: '', // For dropdown selection
    program: '', // Category name
    programId: '', // For dropdown selection
    category: '', // Course name
    categoryId: '', // For dropdown selection
    stage: 'New Leads',
    stageId: '',
    stageNote: '', // Reason name
    stageNoteId: '',
    source: '',
    sourceId: '',
    sourceNote: '', // Sub-source name
    sourceNoteId: '',
    country: 'India',
    countryId: '',
    state: '',
    stateId: '',
    location: '', // City
    locationId: '',
    assignedTo: '',
    remark: ''
  });

  // Dropdown options state
  const [universities, setUniversities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stages, setStages] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [sources, setSources] = useState([]);
  const [subSources, setSubSources] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [users, setUsers] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load all static dropdowns on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [uni, stg, src, cnt, usr] = await Promise.all([
          settingsAPI.getAll('university', { limit: 100 }),
          settingsAPI.getAll('stage', { limit: 100 }),
          settingsAPI.getAll('source', { limit: 100 }),
          settingsAPI.getAll('country', { limit: 100 }),
          usersAPI.getAll({ limit: 100 })
        ]);
        setUniversities(uni.data);
        setStages(stg.data);
        setSources(src.data);
        setCountries(cnt.data);
        setUsers(usr.data);
      } catch (err) {
        console.error('Error loading dropdowns:', err);
      }
    };
    loadDropdowns();
  }, []);

  // Edit mode - pre-fill form
  useEffect(() => {
    if (editLead) {
      setForm({
        name: editLead.name || '',
        contact: editLead.contact || '',
        email: editLead.email || '',
        inquiredFor: editLead.inquiredFor || '',
        program: editLead.program || '',
        category: editLead.category || '',
        stage: editLead.stage || 'New Leads',
        stageNote: editLead.stageNote || '',
        source: editLead.source || '',
        sourceNote: editLead.sourceNote || '',
        country: editLead.country || 'India',
        state: editLead.state || '',
        location: editLead.location || '',
        assignedTo: editLead.assignedTo || '',
        remark: editLead.remark || ''
      });
    }
  }, [editLead]);

  // Cascading: University change → Load Categories
  useEffect(() => {
    if (!form.inquiredForId) {
      setCategories([]);
      return;
    }
    settingsAPI
      .getAll('category', { limit: 100, parentId: form.inquiredForId })
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err));
  }, [form.inquiredForId]);

  // Cascading: Category change → Load Courses
  useEffect(() => {
    if (!form.programId) {
      setCourses([]);
      return;
    }
    settingsAPI
      .getAll('course', { limit: 100, parentId: form.programId })
      .then((res) => setCourses(res.data))
      .catch((err) => console.error(err));
  }, [form.programId]);

  // Cascading: Stage change → Load Reasons
  useEffect(() => {
    if (!form.stageId) {
      setReasons([]);
      return;
    }
    settingsAPI
      .getAll('reason', { limit: 100, parentId: form.stageId })
      .then((res) => setReasons(res.data))
      .catch((err) => console.error(err));
  }, [form.stageId]);

  // Cascading: Source change → Load Sub-Sources
  useEffect(() => {
    if (!form.sourceId) {
      setSubSources([]);
      return;
    }
    settingsAPI
      .getAll('subsource', { limit: 100, parentId: form.sourceId })
      .then((res) => setSubSources(res.data))
      .catch((err) => console.error(err));
  }, [form.sourceId]);

  // Cascading: Country change → Load States
  useEffect(() => {
    if (!form.countryId) {
      setStates([]);
      return;
    }
    settingsAPI
      .getAll('state', { limit: 100, parentId: form.countryId })
      .then((res) => setStates(res.data))
      .catch((err) => console.error(err));
  }, [form.countryId]);

  // Cascading: State change → Load Cities
  useEffect(() => {
    if (!form.stateId) {
      setCities([]);
      return;
    }
    settingsAPI
      .getAll('city', { limit: 100, parentId: form.stateId })
      .then((res) => setCities(res.data))
      .catch((err) => console.error(err));
  }, [form.stateId]);

  // Generic handler for parent dropdowns - sets both name and ID
  const handleParentSelect = (e, idField, nameField, options) => {
    const selectedId = e.target.value;
    const selected = options.find((o) => o._id === selectedId);
    setForm((prev) => ({
      ...prev,
      [idField]: selectedId,
      [nameField]: selected?.name || ''
    }));
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Name is required');
    if (!form.contact.trim()) return setError('Contact is required');

    // Build payload - send only the name fields (not IDs)
    const payload = {
      name: form.name.trim(),
      contact: form.contact.trim(),
      email: form.email.trim().toLowerCase(),
      inquiredFor: form.inquiredFor,
      program: form.program,
      category: form.category,
      stage: form.stage,
      stageNote: form.stageNote,
      source: form.source,
      sourceNote: form.sourceNote,
      country: form.country,
      state: form.state,
      location: form.location,
      assignedTo: form.assignedTo,
      remark: form.remark.trim()
    };

    setLoading(true);
    try {
      let res;
      if (isEditMode) {
        res = await leadsAPI.update(editLead._id, payload);
      } else {
        res = await leadsAPI.create(payload);
      }
      onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'add'} lead`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content add-lead-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Lead' : 'Add Lead'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="login-error">❌ {error}</div>}

            {/* Section 1: Contact Details */}
            <div className="form-section">
              <h3 className="form-section-title">Contact Details</h3>
              <div className="form-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={loading}
                  autoFocus
                />
                <input
                  type="tel"
                  className="form-input"
                  placeholder="Phone *"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  disabled={loading}
                />
              </div>
              <input
                type="email"
                className="form-input"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={loading}
              />
            </div>

            {/* Section 2: Inquiry Info */}
            <div className="form-section">
              <h3 className="form-section-title">Inquiry Info</h3>
              <div className="form-row">
                <select
                  className="form-select"
                  value={form.inquiredForId}
                  onChange={(e) =>
                    handleParentSelect(
                      e,
                      'inquiredForId',
                      'inquiredFor',
                      universities
                    )
                  }
                  disabled={loading}
                >
                  <option value="">Select University</option>
                  {universities.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={form.programId}
                  onChange={(e) =>
                    handleParentSelect(e, 'programId', 'program', categories)
                  }
                  disabled={loading || !form.inquiredForId}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <select
                className="form-select"
                value={form.categoryId}
                onChange={(e) =>
                  handleParentSelect(e, 'categoryId', 'category', courses)
                }
                disabled={loading || !form.programId}
              >
                <option value="">Select Course (optional)</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section 3: Lead Stage */}
            <div className="form-section">
              <h3 className="form-section-title">Lead Stage</h3>
              <div className="form-row">
                <select
                  className="form-select"
                  value={form.stageId}
                  onChange={(e) =>
                    handleParentSelect(e, 'stageId', 'stage', stages)
                  }
                  disabled={loading}
                >
                  <option value="">Select Stage</option>
                  {stages.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={form.stageNoteId}
                  onChange={(e) =>
                    handleParentSelect(e, 'stageNoteId', 'stageNote', reasons)
                  }
                  disabled={loading || !form.stageId}
                >
                  <option value="">Select Reason</option>
                  {reasons.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 4: Source */}
            <div className="form-section">
              <h3 className="form-section-title">Source</h3>
              <div className="form-row">
                <select
                  className="form-select"
                  value={form.sourceId}
                  onChange={(e) =>
                    handleParentSelect(e, 'sourceId', 'source', sources)
                  }
                  disabled={loading}
                >
                  <option value="">Select Source</option>
                  {sources.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={form.sourceNoteId}
                  onChange={(e) =>
                    handleParentSelect(
                      e,
                      'sourceNoteId',
                      'sourceNote',
                      subSources
                    )
                  }
                  disabled={loading || !form.sourceId}
                >
                  <option value="">Select Sub-Source</option>
                  {subSources.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 5: Location */}
            <div className="form-section">
              <h3 className="form-section-title">Location</h3>
              <div className="form-row">
                <select
                  className="form-select"
                  value={form.countryId}
                  onChange={(e) =>
                    handleParentSelect(e, 'countryId', 'country', countries)
                  }
                  disabled={loading}
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={form.stateId}
                  onChange={(e) =>
                    handleParentSelect(e, 'stateId', 'state', states)
                  }
                  disabled={loading || !form.countryId}
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <select
                className="form-select"
                value={form.locationId}
                onChange={(e) =>
                  handleParentSelect(e, 'locationId', 'location', cities)
                }
                disabled={loading || !form.stateId}
              >
                <option value="">Select City</option>
                {cities.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section 6: Extra Info */}
            <div className="form-section">
              <h3 className="form-section-title">Extra Info</h3>
              <select
                className="form-select"
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({ ...form, assignedTo: e.target.value })
                }
                disabled={loading}
              >
                <option value="">Assign To (optional)</option>
                {users.map((u) => (
                  <option key={u._id} value={`${u.name} (${u.employeeId})`}>
                    {u.name} ({u.employeeId})
                  </option>
                ))}
              </select>
              <textarea
                className="form-textarea"
                placeholder="Remark / Notes"
                rows={3}
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-footer add-user-footer">
            <button type="submit" className="settings-btn" disabled={loading}>
              {loading
                ? isEditMode ? 'Updating...' : 'Adding...'
                : isEditMode ? 'Update Lead' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}