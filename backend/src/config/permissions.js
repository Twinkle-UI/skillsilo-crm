// Backend permissions config - frontend/src/config/permissions.js ka mirror.
// IMPORTANT: dono files ko sync me rakhna - agar frontend me koi page/role
// add/remove ho, yahaan bhi karna warna backend enforcement galat ho jayega.

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
  'WhatsApp',
];

export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'update',
  'delete',
  'upload',
  'download',
];

export const UPLOAD_DOWNLOAD_PAGES = ['Leads'];

// settings ':type' route param -> Permission page name
// (frontend/src/pages/SettingsPage.jsx ke TYPE_TO_PERM_PAGE se match)
export const SETTINGS_TYPE_TO_PERM_PAGE = {
  university: 'University',
  category: 'Categories',
  course: 'Course and Specializations',
  stage: 'Stages',
  reason: 'Reasons',
  source: 'Sources',
  subsource: 'Sub-Sources',
  city: 'Cities',
  state: 'States',
  country: 'Countries',
  email_template: 'Email',
  sms_template: 'SMS',
  whatsapp_template: 'WhatsApp',
  lead_assignment: 'Lead Assignment',
  marketing: 'Marketing',
  apis_webhooks: 'APIs & Webhooks',
  integrations: 'Integrations',
};

// Default permissions - role ke liye (agar DB me us role ka Permission doc
// nahi bana hua toh yahi defaults apply hote hain - frontend jaisa hi)
export function getDefaultPermissions(role) {
  const perms = {};

  PERMISSION_PAGES.forEach((page) => {
    if (role === 'admin') {
      perms[page] = {
        view: true,
        create: true,
        update: true,
        delete: true,
        upload: UPLOAD_DOWNLOAD_PAGES.includes(page),
        download: UPLOAD_DOWNLOAD_PAGES.includes(page),
      };
    } else if (role === 'manager') {
      perms[page] = {
        view: true,
        create: true,
        update: true,
        delete: false,
        upload: UPLOAD_DOWNLOAD_PAGES.includes(page),
        download: UPLOAD_DOWNLOAD_PAGES.includes(page),
      };
    } else if (role === 'asst_manager') {
      perms[page] = {
        view: true,
        create: true,
        update: true,
        delete: false,
        upload: false,
        download: UPLOAD_DOWNLOAD_PAGES.includes(page),
      };
    } else if (role === 'team_lead') {
      perms[page] = {
        view: true,
        create: page === 'Leads' || page === 'Follow-Ups',
        update: page === 'Leads' || page === 'Follow-Ups',
        delete: false,
        upload: false,
        download: false,
      };
    } else if (role === 'counsellor') {
      perms[page] = {
        view: ['Leads', 'Follow-Ups', 'Dashboard'].includes(page),
        create: false,
        update: page === 'Leads' || page === 'Follow-Ups',
        delete: false,
        upload: false,
        download: false,
      };
    } else {
      perms[page] = {
        view: false,
        create: false,
        update: false,
        delete: false,
        upload: false,
        download: false,
      };
    }
  });

  return perms;
}
