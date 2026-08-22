import { useState, useEffect } from "react";
import SettingsSidebar from "../components/settings/SettingsSidebar";
import SettingsTable from "../components/settings/SettingsTable";
import AddSettingModal from "../components/settings/AddSettingModal";
import UsersPage from "./UsersPage";
import PermissionsPage from "./PermissionsPage";
import { settingsAPI } from "../services/api";
import { usePermissions } from "../contexts/PermissionsContext";

// Type → display label mapping
const TYPE_LABELS = {
  university: "University",
  category: "Categories",
  course: "Course and Specializations",
  stage: "Stages",
  reason: "Reasons",
  source: "Sources",
  subsource: "Sub-Sources",
  city: "Cities",
  state: "States",
  country: "Countries",
  email_template: "Email Templates",
  sms_template: "SMS Templates",
  whatsapp_template: "WhatsApp Templates",
  users: "Users",
  permissions: "Permissions",
  lead_assignment: "Lead Assignment",
  marketing: "Marketing",
  apis_webhooks: "APIs & Webhooks",
  integrations: "Integrations",
};

// activeType → permission page name mapping
const TYPE_TO_PERM_PAGE = {
  university: "University",
  category: "Categories",
  course: "Course and Specializations",
  stage: "Stages",
  reason: "Reasons",
  source: "Sources",
  subsource: "Sub-Sources",
  city: "Cities",
  state: "States",
  country: "Countries",
  email_template: "Email",
  sms_template: "SMS",
  whatsapp_template: "WhatsApp",
  users: "Users",
  permissions: "Permissions",
  lead_assignment: "Lead Assignment",
  marketing: "Marketing",
  apis_webhooks: "APIs & Webhooks",
  integrations: "Integrations",
};

// Yeh items abhi placeholder hain - data API se nahi aata
const PLACEHOLDER_ITEMS = [
  "marketing",
  "apis_webhooks",
  "integrations",
];

export default function SettingsPage() {
  const { hasPermission } = usePermissions();
  const [activeType, setActiveType] = useState("university");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch items when type/search/entries changes (with debounce)
  useEffect(() => {
    // Users aur Permissions pages apna data khud handle karte hain
    if (activeType === "users" || activeType === "permissions") {
      return;
    }

    // Placeholder items ke liye API call nahi karna
    if (PLACEHOLDER_ITEMS.includes(activeType)) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await settingsAPI.getAll(activeType, {
          search,
          page: 1,
          limit: entries,
        });
        setItems(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeType, search, entries]);

  // Toggle status - optimistic update
  const handleToggle = async (id) => {
    setItems((prev) =>
      prev.map((i) => (i._id === id ? { ...i, isActive: !i.isActive } : i)),
    );

    try {
      await settingsAPI.toggle(activeType, id);
    } catch (err) {
      alert("Toggle failed: " + err.message);
      setItems((prev) =>
        prev.map((i) => (i._id === id ? { ...i, isActive: !i.isActive } : i)),
      );
    }
  };

  // Toggle specific field (isInitial, isFinal, isReEnquired)
  const handleToggleField = async (id, field) => {
    setItems((prev) =>
      prev.map((i) => (i._id === id ? { ...i, [field]: !i[field] } : i)),
    );

    try {
      await settingsAPI.toggle(activeType, id, field);
    } catch (err) {
      alert(`Toggle ${field} failed: ` + err.message);
      setItems((prev) =>
        prev.map((i) => (i._id === id ? { ...i, [field]: !i[field] } : i)),
      );
    }
  };

  // Add new item - modal khole
  const handleAdd = () => {
    setShowAddModal(true);
  };

  // Modal se success aane par list update
  const handleAddSuccess = (newItem) => {
    setItems((prev) => [newItem, ...prev]);
  };

  // Edit item name
  const handleEdit = async (item) => {
    const newName = prompt("Edit name:", item.name);
    if (!newName || newName.trim() === item.name) return;

    try {
      const res = await settingsAPI.update(activeType, item._id, {
        name: newName.trim(),
      });
      setItems((prev) => prev.map((i) => (i._id === item._id ? res.data : i)));
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  // Delete item
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await settingsAPI.delete(activeType, id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // Download CSV
  const handleDownload = () => {
    if (items.length === 0) {
      alert("No data to download");
      return;
    }

    const csv = [
      "Name,Status",
      ...items.map(
        (i) => `"${i.name}","${i.isActive ? "Active" : "Inactive"}"`,
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeType}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isPlaceholder = PLACEHOLDER_ITEMS.includes(activeType);
  const isUsersPage = activeType === "users";
  const isPermissionsPage = activeType === "permissions";

  // Permission checks
  const permPage = TYPE_TO_PERM_PAGE[activeType];
  const canView = hasPermission(permPage, "view");
  const canCreate = hasPermission(permPage, "create");
  const canUpdate = hasPermission(permPage, "update");
  const canDelete = hasPermission(permPage, "delete");
  const canDownload = hasPermission(permPage, "download");

  return (
    <div className="settings-page">
      <h1 className="settings-page-title">Settings</h1>

      <div className="settings-layout">
        <SettingsSidebar active={activeType} onChange={setActiveType} />

        <div className="settings-content">
          {/* CASE 0: No view permission - Access Denied */}
          {!canView && (
            <div className="coming-soon-state">
              <div className="coming-soon-icon">🚫</div>
              <h3>Access Denied</h3>
              <p>
                You don't have permission to view {TYPE_LABELS[activeType]}.
              </p>
            </div>
          )}

          {/* CASE 1: Users page */}
          {canView && isUsersPage && <UsersPage />}

          {/* CASE 2: Permissions page */}
          {canView && isPermissionsPage && <PermissionsPage />}

          {/* CASE 3: Placeholder items (Marketing, etc.) */}
          {canView && !isUsersPage && !isPermissionsPage && isPlaceholder && (
            <>
              <div className="settings-content-header">
                <h2>{TYPE_LABELS[activeType]}</h2>
              </div>
              <div className="coming-soon-state">
                <div className="coming-soon-icon">🚧</div>
                <h3>Coming Soon</h3>
                <p>
                  {TYPE_LABELS[activeType]} feature will be available in the
                  next update.
                </p>
              </div>
            </>
          )}

          {/* CASE 4: Normal settings (University, Categories, Lead Assignment, etc.) */}
          {canView && !isUsersPage && !isPermissionsPage && !isPlaceholder && (
            <>
              <div className="settings-content-header">
                <h2>{TYPE_LABELS[activeType]}</h2>
                <div className="settings-actions">
                  {canCreate && (
                    <button className="settings-btn" onClick={handleAdd}>
                      Add
                    </button>
                  )}
                  {activeType !== "whatsapp_template" && canDownload && (
                    <button className="settings-btn" onClick={handleDownload}>
                      Download
                    </button>
                  )}
                </div>
              </div>

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
                    <option value={100}>100</option>
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

              <SettingsTable
                items={items}
                loading={loading}
                showCategory={
                  activeType === "course" || activeType === "lead_assignment"
                }
                showSubject={activeType === "email_template"}
                showTemplateId={activeType === "sms_template"}
                hideStatus={activeType === "whatsapp_template"}
                canEdit={canUpdate}
                canDelete={canDelete}
                showDepartment={
                  activeType === "category" ||
                  activeType === "course" ||
                  activeType === "lead_assignment" ||
                  activeType === "reason" ||
                  activeType === "subsource" ||
                  activeType === "state" ||
                  activeType === "city" ||
                  activeType === "email_template" ||
                  activeType === "sms_template" ||
                  activeType === "whatsapp_template"
                }
                showStageFlags={activeType === "stage"}
                parentColumnLabel={
                  activeType === "reason"
                    ? "Stage"
                    : activeType === "subsource"
                      ? "Source"
                      : activeType === "state"
                        ? "Country"
                        : activeType === "city"
                          ? "State"
                          : "Department"
                }
                onToggle={handleToggle}
                onToggleField={handleToggleField}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddSettingModal
          type={activeType}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
}