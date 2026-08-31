// Centralized API service - sab backend calls yahan se
import { getToken } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Generic fetch wrapper - automatic token attach + error handling
async function apiFetch(endpoint, options = {}) {
  try {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// ========== Auth ==========
export const authAPI = {
  login: (username, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  getMe: () => apiFetch("/auth/me"),
  changePassword: (oldPassword, newPassword) =>
    apiFetch("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
    // Forgot password - request reset link
  forgotPassword: (email) =>
    apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // Reset password using token
  resetPassword: (token, newPassword) =>
    apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),

  // Change password (logged-in user)
  changePassword: (oldPassword, newPassword) =>
    apiFetch("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
};

// ========== Dashboard ==========
export const dashboardAPI = {
  getStats: (university) => {
    const params = new URLSearchParams();
    if (university) params.append("university", university);
    const qs = params.toString();
    return apiFetch(`/dashboard/stats${qs ? `?${qs}` : ""}`);
  },
};

// ========== Universities (header switcher) ==========
export const universityAPI = {
  getAll: () => apiFetch("/universities"),
};

// ========== Leads ==========
export const leadsAPI = {
  getAll: ({ filter, search, page, limit, university } = {}) => {
    const params = new URLSearchParams();
    if (filter) params.append("filter", filter);
    if (search) params.append("search", search);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    if (university) params.append("university", university);
    return apiFetch(`/leads?${params}`);
  },
    getFilterCounts: (university) => {
    const params = new URLSearchParams();
    if (university) params.append("university", university);
    const qs = params.toString();
    return apiFetch(`/leads/filters/counts${qs ? `?${qs}` : ""}`);
  },
  // Export filtered leads as CSV - downloads file directly
  exportCSV: async ({ filter, search } = {}) => {
    const token = getToken();
    const params = new URLSearchParams();
    if (filter) params.append("filter", filter);
    if (search) params.append("search", search);

    const res = await fetch(`${API_BASE}/leads/export?${params}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!res.ok) {
      throw new Error("Export failed");
    }

    // Get filename from response header
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="(.+)"/);
    const filename = match ? match[1] : `leads-${Date.now()}.csv`;

    // Convert to blob and trigger download
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  },
    getById: (id) => apiFetch(`/leads/${id}`),
  getActivity: (id) => apiFetch(`/leads/${id}/activity`),
  create: (data) =>
    apiFetch("/leads", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/leads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/leads/${id}`, { method: "DELETE" }),
};

// ========== Follow-Ups ==========
export const followUpsAPI = {
  getAll: ({ filter, search, page, limit } = {}) => {
    const params = new URLSearchParams();
    if (filter) params.append("filter", filter);
    if (search) params.append("search", search);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    return apiFetch(`/followups?${params}`);
  },
  getFilterCounts: () => apiFetch("/followups/filters/counts"),
  getByLead: (leadId) => apiFetch(`/followups/lead/${leadId}`),
  // Export filtered follow-ups as CSV - downloads file directly
  exportCSV: async ({ filter, search } = {}) => {
    const token = getToken();
    const params = new URLSearchParams();
    if (filter) params.append("filter", filter);
    if (search) params.append("search", search);

    const res = await fetch(`${API_BASE}/followups/export?${params}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!res.ok) {
      throw new Error("Export failed");
    }

    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="(.+)"/);
    const filename = match ? match[1] : `followups-${Date.now()}.csv`;

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  },
  create: (data) =>
    apiFetch("/followups", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/followups/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/followups/${id}`, { method: "DELETE" }),
};

// ========== Settings ==========
export const settingsAPI = {
  getAll: (type, { search, page, limit } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    return apiFetch(`/settings/${type}?${params}`);
  },

  create: (type, data) =>
    apiFetch(`/settings/${type}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (type, id, data) =>
    apiFetch(`/settings/${type}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Toggle a specific field (isActive, isInitial, isFinal, isReEnquired)
  toggle: (type, id, field = "isActive") =>
    apiFetch(`/settings/${type}/${id}/toggle?field=${field}`, {
      method: "PATCH",
    }),

  delete: (type, id) =>
    apiFetch(`/settings/${type}/${id}`, {
      method: "DELETE",
    }),
};

// ========== Users ==========
export const usersAPI = {
  // List users with optional search & pagination
  getAll: ({ search, page, limit } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    return apiFetch(`/users?${params}`);
  },

  // Create new user
  create: (data) =>
    apiFetch("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update existing user
  update: (id, data) =>
    apiFetch(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Toggle active/inactive status
  toggle: (id) =>
    apiFetch(`/users/${id}/toggle`, {
      method: "PATCH",
    }),

  // Delete user
  delete: (id) =>
    apiFetch(`/users/${id}`, {
      method: "DELETE",
    }),
};

// ========== Permissions ==========
export const permissionsAPI = {
  // Saare roles ki permissions
  getAll: () => apiFetch("/permissions"),

  // Specific role ki permissions
  getByRole: (role) => apiFetch(`/permissions/${role}`),

  // Save/Update permissions for a role (upsert)
  save: (role, permissions) =>
    apiFetch(`/permissions/${role}`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    }),

  // Reset permissions for a role (DB se delete)
  reset: (role) =>
    apiFetch(`/permissions/${role}`, {
      method: "DELETE",
    }),
};
