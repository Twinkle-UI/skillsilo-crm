import Setting from '../models/Setting.js';

// GET /api/settings/:type - list with search & pagination
export const getSettings = async (req, res) => {
  try {
    const { type } = req.params;
    const { search = '', page = 1, limit = 10, parentId } = req.query;

    const query = { type };
    if (search.trim()) {
      query.name = new RegExp(search, 'i');
    }
    if (parentId) {
      query.parentId = parentId;
    }

   const [total, items] = await Promise.all([
      Setting.countDocuments(query),
      Setting.find(query)
        .populate({
          path: 'parentId',
          select: 'name type parentId',
          // Nested populate - parent ka parent bhi fetch karo (Course → Category → University)
          populate: { path: 'parentId', select: 'name type' }
        })
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean()
    ]);

    res.json({
      success: true,
      data: items,
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

// POST /api/settings/:type
export const createSetting = async (req, res) => {
  try {
    const { type } = req.params;
    const item = await Setting.create({ ...req.body, type });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/settings/:type/:id
export const updateSetting = async (req, res) => {
  try {
    const item = await Setting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/settings/:type/:id/toggle?field=isActive
// Specific field toggle (isActive, isInitial, isFinal, isReEnquired)
export const toggleSetting = async (req, res) => {
  try {
    // Query param se field decide hoga - default 'isActive'
    const { field = 'isActive' } = req.query;

    // Sirf yeh fields toggle ho sakti hain (security)
    const allowedFields = ['isActive', 'isInitial', 'isFinal', 'isReEnquired'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: `Invalid field. Allowed: ${allowedFields.join(', ')}`
      });
    }

    const item = await Setting.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    // Specific field toggle karo
    item[field] = !item[field];
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/settings/:type/:id
export const deleteSetting = async (req, res) => {
  try {
    const item = await Setting.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};