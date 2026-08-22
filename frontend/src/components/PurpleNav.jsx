import useMediaQuery from "../hooks/useMediaQuery";

export default function PurpleNav({ isMobileOpen, currentPage, onPageChange }) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const tabs = [
    { name: "Dashboard", icon: "🏠", key: "dashboard" },
    { name: "Leads", icon: "👥", key: "leads" },
    { name: "Follow-Ups (344)", icon: "📅", key: "followups" },
    { name: "Settings", icon: "⚙️", key: "settings" },
  ];

  // Mobile pe sirf tab dikhao jab user ne hamburger click kiya ho
  if (isMobile && !isMobileOpen) {
    return null;
  }

  return (
    <div className="purple-nav">
      {tabs.map((tab) => (
        <a
          key={tab.key}
          className={currentPage === tab.key ? "active" : ""}
          onClick={() => onPageChange(tab.key)}
        >
          {tab.icon} {tab.name}
        </a>
      ))}
    </div>
  );
}
