import User from '../models/User.js';

// GET /api/users - list with search & pagination
export const getUsers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;

    const query = {};
    if (search.trim()) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { employeeId: regex }
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .populate('departments', 'name type')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean()
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users - create new user
export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      employeeId,
      password,
      role,
      departments,
      mobile,
      profilePhoto
    } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      employeeId,
      password,
      role: role || 'employee',
      departments: departments || [],
      mobile: mobile || '',
      profilePhoto: profilePhoto || ''
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ success: true, data: userObj });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id - update user (password optional)
export const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      employeeId,
      password,
      role,
      departments,
      mobile,
      profilePhoto
    } = req.body;

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (role) user.role = role;
    if (departments) user.departments = departments;
    if (mobile !== undefined) user.mobile = mobile;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    if (password && password.trim()) {
      user.password = password;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, data: userObj });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/users/:id/toggle - status toggle (admin ka skip karo)
export const toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Admin ki status toggle nahi ho sakti
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin status cannot be changed'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/:id (admin ka delete nahi ho sakta)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin user cannot be deleted'
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};