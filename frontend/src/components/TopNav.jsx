import { useState, useRef, useEffect } from "react";
import ChangePasswordModal from "./ChangePasswordModal";

export default function TopNav({
  onMenuToggle,
  user,
  onLogout,
  onSettingsClick,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside detect karke dropdown close karo
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChangePassword = () => {
    setShowDropdown(false);
    setShowPasswordModal(true);
  };

  const handleSettings = () => {
    setShowDropdown(false);
    if (onSettingsClick) onSettingsClick();
  };

  return (
    <>
      <div className="top-nav">
        <div className="logo">
          <div className="logo-icon">S</div>
          <div className="logo-text">
            Skills
            <br />
            E-Learnings
          </div>
        </div>
        <div className="nav-right">
          <span className="icon">⚡</span>
          <span className="icon">⛶</span>
          <span className="icon">
            🔔<span className="badge">1</span>
          </span>

          <div className="admin-avatar" ref={dropdownRef}>
            <div
              className="avatar-trigger"
              onClick={() => setShowDropdown((prev) => !prev)}
            >
              <div className="avatar-circle"></div>
              <span>{user?.name || "Admin"} ▾</span>
            </div>

            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-user-info">
                  <div className="dropdown-name">{user?.name}</div>
                  <div className="dropdown-email">{user?.email}</div>
                </div>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={handleChangePassword}
                >
                  🔒 Change Password
                </button>
                <button className="dropdown-item" onClick={handleSettings}>
                  ⚙️ Settings
                </button>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item dropdown-logout"
                  onClick={onLogout}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>

          <button
            className="hamburger"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
}
