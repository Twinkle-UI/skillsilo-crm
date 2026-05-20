import Permission from '../models/Permission.js';

// GET /api/permissions/:role
// Specific role ki permissions fetch karo
export const getPermissionsByRole = async (req, res) => {
  try {
    const { role } = req.params;

    const permDoc = await Permission.findOne({ role });

    // Agar DB mein nahi hain, toh empty object return karo
    // Frontend client side defaults use karega
    if (!permDoc) {
      return res.json({
        success: true,
        data: {
          role,
          permissions: {},
          isDefault: true // Indicator ki DB mein nahi hai
        }
      });
    }

    res.json({
      success: true,
      data: {
        role: permDoc.role,
        permissions: permDoc.permissions,
        isDefault: false,
        updatedAt: permDoc.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/permissions
// Saare roles ki permissions ek saath fetch karo
export const getAllPermissions = async (req, res) => {
  try {
    const allPerms = await Permission.find({});

    // Object format mein convert: { admin: {...}, manager: {...} }
    const data = {};
    allPerms.forEach((p) => {
      data[p.role] = p.permissions;
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/permissions/:role
// Specific role ki permissions save/update karo
// Upsert pattern - agar exist nahi karta toh banao, varna update
export const savePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid permissions data'
      });
    }

    // Upsert: agar role ka document hai toh update, varna create
    const updated = await Permission.findOneAndUpdate(
      { role },
      { role, permissions },
      {
        new: true, // Updated document return karo
        upsert: true, // Naya create karo agar nahi mila
        runValidators: true
      }
    );

    res.json({
      success: true,
      data: {
        role: updated.role,
        permissions: updated.permissions,
        updatedAt: updated.updatedAt
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/permissions/:role
// Specific role ki permissions reset karo (DB se delete karo)
// Frontend defaults use kar lega
export const resetPermissions = async (req, res) => {
  try {
    const { role } = req.params;

    await Permission.findOneAndDelete({ role });

    res.json({
      success: true,
      message: `Permissions for ${role} reset to defaults`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};