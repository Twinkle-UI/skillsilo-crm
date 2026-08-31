import { leadsAPI } from '../services/api';
import { usePermissions } from '../contexts/PermissionsContext';
import { useUniversity } from '../contexts/UniversityContext';
import { useState, useEffect } from 'react';
import LeadsHeader from '../components/leads/LeadsHeader';
import FilterChips from '../components/leads/FilterChips';
import TableControls from '../components/leads/TableControls';
import LeadCard from '../components/leads/LeadCard';
import AddLeadModal from '../components/leads/AddLeadModal';
import AddFollowUpModal from '../components/leads/AddFollowUpModal';
import UploadLeadsModal from '../components/leads/UploadLeadsModal';
import FilterModal from '../components/leads/FilterModal';
import BulkActionsBar from '../components/leads/BulkActionsBar';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function LeadsPage({
  onViewLead,
  pendingEditLead,
  onPendingEditConsumed
}) {
    // const { isAdmin } = usePermissions();
        const { isAdmin } = usePermissions();
  const { selectedUniversity } = useUniversity();
  const [entries, setEntries] = useState(10);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Leads');

  const [leads, setLeads] = useState([]);
  const [filterCounts, setFilterCounts] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editLead, setEditLead] = useState(null);

  // Follow-up modal state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [scheduleLead, setScheduleLead] = useState(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterRules, setFilterRules] = useState([]);

  // Bulk selection state - Set of selected lead IDs
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Handle pending edit from LeadDetailsPage
  useEffect(() => {
    if (pendingEditLead) {
      setEditLead(pendingEditLead);
      setShowAddModal(true);
      if (onPendingEditConsumed) onPendingEditConsumed();
    }
  }, [pendingEditLead, onPendingEditConsumed]);

  // Fetch filter counts once
  useEffect(() => {
    leadsAPI
      .getFilterCounts(selectedUniversity)
      .then((res) => setFilterCounts(res.data))
      .catch((err) => console.error('Filter counts error:', err));
  }, [selectedUniversity]);

  // Build query params
    const buildQuery = () => {
    const query = {
      filter: activeFilter,
      search,
      page: 1,
      limit: entries
    };
    if (filterRules.length > 0) {
      query.rules = JSON.stringify(filterRules);
    }
    if (selectedUniversity) {
      query.university = selectedUniversity;
    }
    return query;
  };

  // Fetch leads when filters change
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await leadsAPI.getAll(buildQuery());
        setLeads(res.data);
        setPagination(res.pagination);
        setError(null);
        // Clear selection when leads change
        setSelectedIds(new Set());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
    }, [activeFilter, search, entries, filterRules, selectedUniversity]);

  // Refresh counts helper
   const refreshCounts = () => {
    leadsAPI
      .getFilterCounts(selectedUniversity)
      .then((res) => setFilterCounts(res.data))
      .catch((err) => console.error(err));
  };

  // Reload leads helper
  const reloadLeads = async () => {
    try {
      const res = await leadsAPI.getAll(buildQuery());
      setLeads(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Reload failed:', err);
    }
  };

  // ==================== Selection Handlers ====================

  // Toggle individual lead selection
  const handleSelectionChange = (leadId, isChecked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(leadId);
      } else {
        next.delete(leadId);
      }
      return next;
    });
  };

  // Master checkbox - select all visible
  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedIds(new Set(leads.map((l) => l._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // ==================== Bulk Action Handlers ====================

  // Bulk delete
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} lead${count > 1 ? 's' : ''}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/leads/bulk/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(`✅ ${data.message}`);
      setSelectedIds(new Set());
      await reloadLeads();
      refreshCounts();
    } catch (err) {
      alert('Bulk delete failed: ' + err.message);
    }
  };

  // Bulk assign
  const handleBulkAssign = async (user) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/leads/bulk/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          assignedTo: user
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(`✅ ${data.message}`);
      setSelectedIds(new Set());
      await reloadLeads();
    } catch (err) {
      alert('Bulk assign failed: ' + err.message);
    }
  };

  // Bulk change stage
  const handleBulkChangeStage = async (stage, reason) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/leads/bulk/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          stage,
          stageNote: reason || ''
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(`✅ ${data.message}`);
      setSelectedIds(new Set());
      await reloadLeads();
      refreshCounts();
    } catch (err) {
      alert('Bulk stage change failed: ' + err.message);
    }
  };

  // Bulk export
  const handleBulkExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/leads/bulk/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      if (!res.ok) throw new Error('Export failed');

      // Get filename
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : `leads-selected-${Date.now()}.csv`;

      // Download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`✅ Exported ${selectedIds.size} leads`);
    } catch (err) {
      alert('Bulk export failed: ' + err.message);
    }
  };


const handleBulkChangeUniversity = async (university, assignedTo) => {
  try {
    const token = localStorage.getItem('token');
    const body = { ids: Array.from(selectedIds), inquiredFor: university };
    if (assignedTo) body.assignedTo = assignedTo;

    const res = await fetch(`${API_BASE}/leads/bulk/university`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    alert(`✅ ${data.message}`);
    setSelectedIds(new Set());
    await reloadLeads();
    refreshCounts();
  } catch (err) {
    alert('University change failed: ' + err.message);
  }
};




  // ==================== Other Handlers ====================

  const handleAdd = () => {
    setEditLead(null);
    setShowAddModal(true);
  };

  const handleEdit = (lead) => {
    setEditLead(lead);
    setShowAddModal(true);
  };

  const handleAddSuccess = (savedLead) => {
    if (editLead) {
      setLeads((prev) =>
        prev.map((l) => (l._id === savedLead._id ? savedLead : l))
      );
    } else {
      setLeads((prev) => [savedLead, ...prev]);
    }
    refreshCounts();
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditLead(null);
  };

  const handleDelete = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      await leadsAPI.delete(leadId);
      setLeads((prev) => prev.filter((l) => l._id !== leadId));
      refreshCounts();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleView = (lead) => {
    if (onViewLead) onViewLead(lead);
  };

  const handleSchedule = (lead) => {
    setScheduleLead(lead);
    setShowFollowUpModal(true);
  };

  const handleFollowUpSuccess = (updatedLead) => {
    setLeads((prev) =>
      prev.map((l) => (l._id === updatedLead._id ? updatedLead : l))
    );
    refreshCounts();
  };

  const handleFollowUpClose = () => {
    setShowFollowUpModal(false);
    setScheduleLead(null);
  };

  const handleDownload = async () => {
    try {
      const result = await leadsAPI.exportCSV({
        filter: activeFilter,
        search
      });
      console.log('✅ Downloaded:', result.filename);
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
  };

  const handleUpload = () => {
    setShowUploadModal(true);
  };

  const handleUploadSuccess = async () => {
    await reloadLeads();
    refreshCounts();
  };

  const handleUploadClose = () => {
    setShowUploadModal(false);
  };

  const handleOpenFilters = () => {
    setShowFilterModal(true);
  };

  const handleCloseFilters = () => {
    setShowFilterModal(false);
  };

  const handleApplyFilters = (newRules) => {
    setFilterRules(newRules);
  };

  const handleResetFilters = () => {
    setFilterRules([]);
  };

  const activeFilterCount = filterRules.length;
  const allSelected = leads.length > 0 && selectedIds.size === leads.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < leads.length;

  return (
    <>
      <LeadsHeader
        onAdd={handleAdd}
        onUpload={handleUpload}
        onDownload={handleDownload}
        onFilters={handleOpenFilters}
        activeFilterCount={activeFilterCount}
      />
      <FilterChips
        filters={filterCounts}
        active={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <div className="leads-container">
        <TableControls
          entries={entries}
          onEntriesChange={setEntries}
          search={search}
          onSearchChange={setSearch}
        />

        <div className="select-all-row">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
          <span style={{ marginLeft: 10, fontSize: 12, color: '#666' }}>
            Total: {pagination.total} leads
            {activeFilterCount > 0 && (
              <span style={{ marginLeft: 10, color: '#1a73e8' }}>
                • {activeFilterCount} filter
                {activeFilterCount > 1 ? 's' : ''} applied
              </span>
            )}
            {selectedIds.size > 0 && (
              <span style={{ marginLeft: 10, color: '#1a73e8', fontWeight: 600 }}>
                • {selectedIds.size} selected
              </span>
            )}
          </span>
        </div>

        <div className="leads-list">
          {loading ? (
            <div className="loading-state">⏳ Loading...</div>
          ) : error ? (
            <div className="error-state">❌ {error}</div>
          ) : leads.length === 0 ? (
            <div className="no-results">No leads found</div>
          ) : (
            leads.map((lead) => (
            <LeadCard
  key={lead._id}
  lead={lead}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onView={handleView}
  onSchedule={handleSchedule}
  isSelected={selectedIds.has(lead._id)}
  onSelectionChange={handleSelectionChange}
  canDelete={isAdmin}
/>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Lead Modal */}
      {showAddModal && (
        <AddLeadModal
          editLead={editLead}
          onClose={handleModalClose}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Schedule Follow-Up Modal */}
      {showFollowUpModal && scheduleLead && (
        <AddFollowUpModal
          lead={scheduleLead}
          onClose={handleFollowUpClose}
          onSuccess={handleFollowUpSuccess}
        />
      )}

      {/* Upload Leads Modal */}
      {showUploadModal && (
        <UploadLeadsModal
          onClose={handleUploadClose}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={handleCloseFilters}
        currentRules={filterRules}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Bulk Actions Bar - shows only when selection exists */}
     <BulkActionsBar
   selectedCount={selectedIds.size}
  onClearSelection={handleClearSelection}
  onDelete={handleBulkDelete}
  onAssign={handleBulkAssign}
  onChangeStage={handleBulkChangeStage}
  onExport={handleBulkExport}
  onChangeUniversity={handleBulkChangeUniversity}
  canDelete={isAdmin}
/>
    </>
  );
}