import { createContext, useContext, useState, useEffect } from "react";
import { getUser } from "../utils/auth";
import { permissionsAPI } from "../services/api";
import {
  getDefaultPermissions,
  UPLOAD_DOWNLOAD_PAGES,
} from "../config/permissions";

// Context create karo
const PermissionsContext = createContext(null);

// Provider component - App ko wrap karega
export function PermissionsProvider({ children }) {
  const [permissions, setPermissions] = useState({});
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Logged-in user ke permissions load karo
  useEffect(() => {
    const loadPermissions = async () => {
      const user = getUser();
      if (!user || !user.role) {
        setLoading(false);
        return;
      }

      setRole(user.role);

      // Admin ko hard-coded full access (safety override)
      if (user.role === "admin") {
        setPermissions(getDefaultPermissions("admin"));
        setLoading(false);
        return;
      }

      // Backend se permissions fetch karo
      try {
        const res = await permissionsAPI.getByRole(user.role);

        if (res.data.isDefault) {
          // DB mein nahi hai - frontend defaults use karo
          setPermissions(getDefaultPermissions(user.role));
        } else {
          setPermissions(res.data.permissions);
        }
      } catch (err) {
        console.error("Failed to load permissions:", err);
        // Fallback - defaults
        setPermissions(getDefaultPermissions(user.role));
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  // Permission check function - sab components yahaan se check karenge
  const hasPermission = (page, action) => {
    // Admin override - hamesha sab kuch
    if (role === "admin") return true;

    // Upload/Download sirf certain pages pe applicable
    if (
      (action === "upload" || action === "download") &&
      !UPLOAD_DOWNLOAD_PAGES.includes(page)
    ) {
      return false;
    }

    return permissions[page]?.[action] === true;
  };

  // Aaj loaded hone tak ya admin hone par, sab true return karo
  // (taaki UI flash na ho)
  const value = {
    permissions,
    role,
    loading,
    hasPermission,
    isAdmin: role === "admin",
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// Custom hook - components mein simple use karne ke liye
export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return context;
}
