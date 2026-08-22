// Permissions config - hardcoded for Phase 1

// All pages/modules in the CRM (image jaise + extra)
export const PERMISSION_PAGES = [
  'APIs & Webhooks',
  'Categories',
  'Cities',
  'Countries',
  'Course and Specializations',
  'Dashboard',
  'Departments',
  'Email',
  'Follow-Ups',
  'Integrations',
  'Lead Assignment',
  'Leads',
  'Marketing',
  'Permissions',
  'Reasons',
  'SMS',
  'Sources',
  'Stages',
  'States',
  'Sub-Sources',
  'University',
  'Users',
  'WhatsApp'
];

// Action types
export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'update',
  'delete',
  'upload',
  'download'
];

// Actions that only apply to "Leads" (CSV import/export feature)
export const UPLOAD_DOWNLOAD_PAGES = ['Leads'];

// All roles (admin internal value → display)
export const ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'asst_manager', label: 'Asst. Manager' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'counsellor', label: 'Counsellor' }
];

// Generate default permissions - har role ke liye
export function getDefaultPermissions(role) {
  const perms = {};

  PERMISSION_PAGES.forEach((page) => {
    // Administrator: sab kuch true (image jaisa)
    if (role === 'admin') {
      perms[page] = {
        view: true,
        create: true,
        update: true,
        delete: true,
        upload: UPLOAD_DOWNLOAD_PAGES.includes(page),
        download: UPLOAD_DOWNLOAD_PAGES.includes(page)
      };
    }
    // Manager: most things but not delete
    else if (role === 'manager') {
      perms[page] = {
        view: true,
        create: true,
        update: true,
        delete: false,
        upload: UPLOAD_DOWNLOAD_PAGES.includes(page),
        download: UPLOAD_DOWNLOAD_PAGES.includes(page)
      };
    }
    // Asst. Manager: view + create + update, no delete
    else if (role === 'asst_manager') {
      perms[page] = {
        view: true,
        create: true,
        update: true,
        delete: false,
        upload: false,
        download: UPLOAD_DOWNLOAD_PAGES.includes(page)
      };
    }
    // Team Lead: limited
    else if (role === 'team_lead') {
      perms[page] = {
        view: true,
        create: page === 'Leads' || page === 'Follow-Ups',
        update: page === 'Leads' || page === 'Follow-Ups',
        delete: false,
        upload: false,
        download: false
      };
    }
    // Counsellor: only leads + follow-ups view
    else if (role === 'counsellor') {
      perms[page] = {
        view: ['Leads', 'Follow-Ups', 'Dashboard'].includes(page),
        create: false,
        update: page === 'Leads' || page === 'Follow-Ups',
        delete: false,
        upload: false,
        download: false
      };
    } else {
      // Fallback - sab false
      perms[page] = {
        view: false,
        create: false,
        update: false,
        delete: false,
        upload: false,
        download: false
      };
    }
  });

  return perms;
}

// localStorage helpers - permissions ko persist karne ke liye
const STORAGE_KEY = 'skillsilo_permissions';

export function getPermissions(role) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const allPerms = JSON.parse(stored);
      if (allPerms[role]) return allPerms[role];
    }
  } catch (e) {
    console.error('Error loading permissions:', e);
  }
  // Fallback to defaults
  return getDefaultPermissions(role);
}

export function savePermissions(role, perms) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allPerms = stored ? JSON.parse(stored) : {};
    allPerms[role] = perms;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allPerms));
    return true;
  } catch (e) {
    console.error('Error saving permissions:', e);
    return false;
  }
}

export function resetPermissions(role) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allPerms = stored ? JSON.parse(stored) : {};
    delete allPerms[role];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allPerms));
    return true;
  } catch (e) {
    return false;
  }
}