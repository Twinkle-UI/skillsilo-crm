import { useState, useEffect } from 'react';
import FollowUpsHeader from '../components/followups/FollowUpsHeader';
import FollowUpFilters from '../components/followups/FollowUpFilters';
import FollowUpCard from '../components/followups/FollowUpCard';
import EditFollowUpModal from '../components/followups/EditFollowUpModal';
import SnoozeFollowUpModal from '../components/followups/SnoozeFollowUpModal';
import TableControls from '../components/leads/TableControls';
import { followUpsAPI } from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function FollowUpsPage({ onViewLead }) {
  const [entries, setEntries] = useState(10);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('today');

  const [followUps, setFollowUps] = useState([]);
  const [filterCounts, setFilterCounts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal state
  const [editFollowUp, setEditFollowUp] = useState(null);
  const [snoozeFollowUp, setSnoozeFollowUp] = useState(null);

  // Fetch filter counts
  useEffect(() => {
    refreshCounts();
  }, []);

  const refreshCounts = () => {
    followUpsAPI
      .getFilterCounts()
      .then((res) => setFilterCounts(res.data))
      .catch((err) => console.error('Filter counts error:', err));
  };

  // Fetch follow-ups when filter/search/entries changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await followUpsAPI.getAll({
          filter: activeFilter,
          search,
          page: 1,
          limit: entries
        });
        setFollowUps(res.data);
        setPagination(res.pagination);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeFilter, search, entries]);

  // Reload helper
  const reloadFollowUps = async () => {
    try {
      const res = await followUpsAPI.getAll({
        filter: activeFilter,
        search,
        page: 1,
        limit: entries
      });
      setFollowUps(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Reload failed:', err);
    }
  };

  // ============ Handlers ============

  // Download CSV
  const handleDownload = async () => {
    try {
      const result = await followUpsAPI.exportCSV({
        filter: activeFilter,
        search
      });
      console.log('✅ Downloaded:', result.filename);
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
  };

  // Edit
  const handleEdit = (followUp) => {
    setEditFollowUp(followUp);
  };

  const handleEditSuccess = (updated) => {
    setFollowUps((prev) =>
      prev.map((f) => (f._id === updated._id ? updated : f))
    );
    refreshCounts();
  };

  // Mark as Done
  const handleMarkDone = async (followUp) => {
    if (!confirm(`Mark follow-up for ${followUp.name} as Done?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/followups/${followUp._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ status: 'completed' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFollowUps((prev) =>
        prev.map((f) => (f._id === followUp._id ? data.data : f))
      );
      refreshCounts();
    } catch (err) {
      alert('Mark as done failed: ' + err.message);
    }
  };

  // Snooze
  const handleSnooze = (followUp) => {
    setSnoozeFollowUp(followUp);
  };

  const handleSnoozeSuccess = (updated) => {
    setFollowUps((prev) =>
      prev.map((f) => (f._id === updated._id ? updated : f))
    );
    refreshCounts();
  };

  // Delete
  const handleDelete = async (followUpId) => {
    if (!confirm('Are you sure you want to delete this follow-up?')) return;

    try {
      await followUpsAPI.delete(followUpId);
      setFollowUps((prev) => prev.filter((f) => f._id !== followUpId));
      refreshCounts();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  // View lead - navigate to LeadDetailsPage
  const handleView = (followUp) => {
    if (onViewLead && followUp.leadId) {
      onViewLead({ _id: followUp.leadId });
    }
  };

  return (
    <>
      <FollowUpsHeader onDownload={handleDownload} />
      <FollowUpFilters
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

        <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          Total: {pagination.total} follow-ups
        </div>

        <div className="leads-list">
          {loading ? (
            <div className="loading-state">⏳ Loading...</div>
          ) : error ? (
            <div className="error-state">❌ {error}</div>
          ) : followUps.length === 0 ? (
            <div className="no-results">No follow-ups found</div>
          ) : (
            followUps.map((f) => (
              <FollowUpCard
                key={f._id}
                followUp={f}
                onEdit={handleEdit}
                onMarkDone={handleMarkDone}
                onSnooze={handleSnooze}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editFollowUp && (
        <EditFollowUpModal
          followUp={editFollowUp}
          onClose={() => setEditFollowUp(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Snooze Modal */}
      {snoozeFollowUp && (
        <SnoozeFollowUpModal
          followUp={snoozeFollowUp}
          onClose={() => setSnoozeFollowUp(null)}
          onSuccess={handleSnoozeSuccess}
        />
      )}
    </>
  );
}