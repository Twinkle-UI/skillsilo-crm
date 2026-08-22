import Permission from '../models/Permission.js';
import { getDefaultPermissions, SETTINGS_TYPE_TO_PERM_PAGE } from '../config/permissions.js';

// IMPORTANT: hamesha 'protect' ke baad use karo (req.user chahiye hota hai)
//
// checkPermission('Users', 'create') -> middleware jo verify karega ki
// logged-in user ke role ko 'Users' page pe 'create' action allowed hai ya nahi.
// Logic frontend/src/contexts/PermissionsContext.jsx ke hasPermission() jaisa
// hi hai: admin hamesha allowed, warna DB me role ka Permission doc dekho,
// na mile toh getDefaultPermissions() fallback.
export const checkPermission = (page, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, no user',
        });
      }

      // Admin override - hamesha sab kuch
      if (req.user.role === 'admin') {
        return next();
      }

      const permDoc = await Permission.findOne({ role: req.user.role });
      const permissions = permDoc ? permDoc.permissions : getDefaultPermissions(req.user.role);

      if (permissions?.[page]?.[action] === true) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${action} ${page}`,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
};

// Settings routes ke liye - ':type' URL param se dynamically permission page
// resolve karta hai (e.g. 'university' -> 'University', 'source' -> 'Sources')
// aur phir wahi checkPermission() logic apply karta hai.
// Agar :type kisi known page se map na ho, to fail-safe: deny.
export const checkSettingPermission = (action) => {
  return async (req, res, next) => {
    const page = SETTINGS_TYPE_TO_PERM_PAGE[req.params.type];

    if (!page) {
      return res.status(400).json({
        success: false,
        message: `Unknown settings type: ${req.params.type}`,
      });
    }

    return checkPermission(page, action)(req, res, next);
  };
};
