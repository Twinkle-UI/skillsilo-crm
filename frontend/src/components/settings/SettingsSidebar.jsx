import { usePermissions } from "../../contexts/PermissionsContext";

const GROUPS = [
  {
    title: "Products",
    items: [
      { key: "university", label: "University", permPage: "University" },
      { key: "category", label: "Categories", permPage: "Categories" },
      {
        key: "course",
        label: "Course and Specializations",
        permPage: "Course and Specializations",
      },
    ],
  },
  {
    title: "Lead Funnels",
    items: [
      { key: "stage", label: "Stages", permPage: "Stages" },
      { key: "reason", label: "Reasons", permPage: "Reasons" },
      { key: "source", label: "Sources", permPage: "Sources" },
      { key: "subsource", label: "Sub-Sources", permPage: "Sub-Sources" },
    ],
  },
  {
    title: "Regions",
    items: [
      { key: "city", label: "Cities", permPage: "Cities" },
      { key: "state", label: "States", permPage: "States" },
      { key: "country", label: "Countries", permPage: "Countries" },
    ],
  },
  {
    title: "Templates",
    items: [
      { key: "email_template", label: "Email", permPage: "Email" },
      { key: "sms_template", label: "SMS", permPage: "SMS" },
      { key: "whatsapp_template", label: "WhatsApp", permPage: "WhatsApp" },
    ],
  },
  {
    title: "Access Controls",
    items: [
      { key: "users", label: "Users", permPage: "Users" },
      { key: "permissions", label: "Permissions", permPage: "Permissions" },
    ],
  },
  {
    title: "Automation",
    items: [
      {
        key: "lead_assignment",
        label: "Lead Assignment",
        permPage: "Lead Assignment",
      },
      { key: "marketing", label: "Marketing", permPage: "Marketing" },
    ],
  },
  {
    title: "Developer Options",
    items: [
      {
        key: "apis_webhooks",
        label: "APIs & Webhooks",
        permPage: "APIs & Webhooks",
      },
      { key: "integrations", label: "Integrations", permPage: "Integrations" },
    ],
  },
];

// Inline styles for sidebar items
const sidebarItemStyle = {
  padding: "8px 16px",
  cursor: "pointer",
  fontSize: "14px",
  color: "#555",
  borderRadius: "4px",
  transition: "background 0.2s",
  listStyle: "none",
};

const sidebarItemActiveStyle = {
  ...sidebarItemStyle,
  background: "#e8f0fe",
  color: "#1a73e8",
  fontWeight: "500",
};

const groupTitleStyle = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#333",
  margin: "16px 0 8px 0",
  padding: "0 16px",
};

export default function SettingsSidebar({ active, onChange }) {
  const { hasPermission, loading } = usePermissions();

  const visibleGroups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPermission(item.permPage, "view")),
  })).filter((group) => group.items.length > 0);

  if (loading) {
    return (
      <aside className="settings-sidebar">
        <div className="settings-sidebar-inner">
          <div style={{ padding: 20, color: "#888" }}>⏳ Loading...</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="settings-sidebar">
      <div className="settings-sidebar-inner">
        {visibleGroups.length === 0 ? (
          <div style={{ padding: 30, color: "#888", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🚫</div>
            <div>No accessible items</div>
          </div>
        ) : (
          visibleGroups.map((group) => (
            <div key={group.title} className="sidebar-group">
              <h3 style={groupTitleStyle}>{group.title}</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {group.items.map((item) => {
                  const isActive = active === item.key;
                  return (
                    <li
                      key={item.key}
                      style={
                        isActive ? sidebarItemActiveStyle : sidebarItemStyle
                      }
                      onClick={() => onChange(item.key)}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = "#f5f5f5";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {item.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}

        <div
          style={{
            padding: "20px 16px",
            fontSize: "12px",
            color: "#888",
            borderTop: "1px solid #eee",
            marginTop: "16px",
          }}
        >
          2026 © Skills E-Learnings
        </div>
      </div>
    </aside>
  );
}
