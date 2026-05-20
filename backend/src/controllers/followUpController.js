import FollowUp from '../models/FollowUp.js';

// Helper: get date ranges for filters
const getDateRange = (filter) => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  switch (filter) {
    case 'today':
      return { dueAt: { $gte: today, $lt: tomorrow }, status: { $ne: 'completed' } };
    case 'tomorrow':
      return { dueAt: { $gte: tomorrow, $lt: dayAfter }, status: { $ne: 'completed' } };
    case 'planed':
      return { dueAt: { $gte: dayAfter }, status: 'planned' };
    case 'missed':
      return { dueAt: { $lt: now }, status: { $ne: 'completed' } };
    default:
      return {};
  }
};

// GET /api/followups
export const getFollowUps = async (req, res) => {
  try {
    const { filter = 'today', search = '', page = 1, limit = 10 } = req.query;

    const query = getDateRange(filter);

    if (search.trim()) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { inquiredFor: regex }
      ];
    }

    const [total, followUps] = await Promise.all([
      FollowUp.countDocuments(query),
      FollowUp.find(query)
        .sort({ dueAt: 1 }) // soonest first
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean()
    ]);

    res.json({
      success: true,
      data: followUps,
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

// GET /api/followups/filters/counts
export const getFollowUpCounts = async (req, res) => {
  try {
    const filters = ['today', 'tomorrow', 'planed', 'missed'];
    const counts = {};

    // Run all 4 counts in parallel
    await Promise.all(
      filters.map(async (f) => {
        counts[f] = await FollowUp.countDocuments(getDateRange(f));
      })
    );

    res.json({
      success: true,
      data: [
        { name: 'Today', count: counts.today, key: 'today' },
        { name: 'Tomorrow', count: counts.tomorrow, key: 'tomorrow' },
        { name: 'Planed', count: counts.planed, key: 'planed' },
        { name: 'Missed', count: counts.missed, key: 'missed' }
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/followups
export const createFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.create(req.body);
    res.status(201).json({ success: true, data: followUp });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/followups/:id
export const updateFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }
    res.json({ success: true, data: followUp });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/followups/:id
export const deleteFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndDelete(req.params.id);
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }
    res.json({ success: true, message: 'Follow-up deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/followups/lead/:leadId - get all follow-ups for a specific lead
export const getFollowUpsByLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    // ObjectId validation
    if (!leadId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID format'
      });
    }

    const followUps = await FollowUp.find({ leadId })
      .sort({ dueAt: -1 })
      .lean();

    res.json({ success: true, data: followUps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// GET /api/followups/export - download filtered follow-ups as CSV
export const exportFollowUps = async (req, res) => {
  try {
    const { filter, search = '' } = req.query;

    // Same filtering logic as getFollowUps
    const query = getDateRange(filter || 'today');

    if (search.trim()) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { inquiredFor: regex }
      ];
    }

    const followUps = await FollowUp.find(query).sort({ dueAt: 1 }).lean();

    // CSV headers
    const headers = [
      'Name',
      'Phone',
      'Email',
      'University',
      'Program',
      'Stage',
      'Reason',
      'Source',
      'Sub-Source',
      'Location',
      'Location Sub',
      'Assigned To',
      'Due At',
      'Status',
      'Created At'
    ];

    // Escape CSV values
    const escapeCSV = (val) => {
      if (val == null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = followUps.map((f) =>
      [
        escapeCSV(f.name),
        escapeCSV(f.phone),
        escapeCSV(f.email),
        escapeCSV(f.inquiredFor),
        escapeCSV(f.program),
        escapeCSV(f.stage),
        escapeCSV(f.stageNote),
        escapeCSV(f.source),
        escapeCSV(f.sourceNote),
        escapeCSV(f.location),
        escapeCSV(f.locationSub),
        escapeCSV(f.assignedTo),
        escapeCSV(
          f.dueAt ? new Date(f.dueAt).toLocaleString('en-IN') : ''
        ),
        escapeCSV(f.status),
        escapeCSV(
          f.createdAt ? new Date(f.createdAt).toLocaleString('en-IN') : ''
        )
      ].join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');

    const filename = `followups-${filter || 'today'}-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};