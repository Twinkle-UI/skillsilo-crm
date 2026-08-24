import Lead from "../models/Lead.js";
import * as XLSX from "xlsx";

// Non-admin users ko sirf apni assigned leads dikhengi.
// Admin ko koi restriction nahi (sab leads dikhengi).
// Lead.assignedTo format hamesha "Name (EmployeeId)" hota hai (leadAssignmentService.js dekho)
function getAssignedOnlyFilter(user) {
  if (!user || user.role === "admin") return null;
  return user.employeeId ? `${user.name} (${user.employeeId})` : user.name;
}

// GET /api/leads - list with filter, search, pagination, advanced rules
export const getLeads = async (req, res) => {
    const {
      filter,
      search = '',
      page = 1,
      limit = 10,
      rules, // JSON string of filter rules array
      university // header ke University-dropdown se aata hai
    } = req.query;

    // Build query - all filters combined with AND
    const query = {};

    if (university) {
      query.inquiredFor = university;
    } try {


    // 1. Filter chip (stage from top chips)
    if (filter && filter !== 'all' && filter !== 'All Leads') {
      if (filter === 'own' || filter === 'Own Leads') {
        query.isOwn = true;
      } else {
        query.stage = filter;
      }
    }

    // 2. Search across name, email, contact
    if (search.trim()) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { contact: regex }
      ];
    }

    // 3. Advanced filter rules
    if (rules) {
      try {
        const parsedRules = JSON.parse(rules);
        if (Array.isArray(parsedRules)) {
          applyFilterRules(query, parsedRules);
        }
      } catch (err) {
        console.error('Failed to parse rules:', err);
      }
    }

    // 4. Non-admin users ko sirf apni assigned leads dikhengi
    const assignedOnly = getAssignedOnlyFilter(req.user);
    if (assignedOnly) {
      query.assignedTo = assignedOnly;
    }

    // Execute query
    const [total, leads] = await Promise.all([
      Lead.countDocuments(query),
      Lead.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean()
    ]);

    res.json({
      success: true,
      data: leads,
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

// =============================================================
// Helper: Convert filter rules to MongoDB query operators
// =============================================================

// Field key → DB field mapping
const FIELD_DB_MAP = {
  department: 'inquiredFor',
  category: 'program',
  specialization: 'category',
  stage: 'stage',
  reason: 'stageNote',
  source: 'source',
  subSource: 'sourceNote',
  user: 'assignedTo',
  totalCalls: 'callCount',
  createdOn: 'createdAt',
  updatedOn: 'updatedAt'
};

// Field key → type mapping (for value parsing)
const FIELD_TYPE_MAP = {
  totalCalls: 'number',
  createdOn: 'date',
  updatedOn: 'date'
  // All others default to string
};

// Apply filter rules to query object
function applyFilterRules(query, rules) {
  // Group rules by field - same field with multiple rules → AND
  // Different fields → AND (default)
  for (const rule of rules) {
    const { fieldKey, operatorKey, value } = rule;

    if (!fieldKey || !operatorKey) continue;
    if (value === '' || value === null || value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;

    const dbField = FIELD_DB_MAP[fieldKey];
    if (!dbField) continue;

    const fieldType = FIELD_TYPE_MAP[fieldKey];
    const operator = buildMongoOperator(operatorKey, value, fieldType);
    if (operator === null) continue;

    // Merge with existing query for same field
    if (query[dbField]) {
      // Already has filter for this field - merge using $and on root
      if (!query.$and) query.$and = [];
      query.$and.push({ [dbField]: operator });
    } else {
      query[dbField] = operator;
    }
  }
}

// Convert (operator + value) to MongoDB operator object
function buildMongoOperator(operatorKey, value, fieldType) {
  // Parse value based on field type
  const parseValue = (val) => {
    if (fieldType === 'number') return Number(val) || 0;
    if (fieldType === 'date') {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    return val;
  };

  // Helper for date end-of-day
  const endOfDay = (val) => {
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    d.setHours(23, 59, 59, 999);
    return d;
  };

  // Escape regex special chars
  const escapeRegex = (str) =>
    String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  switch (operatorKey) {
    case 'eq': {
      const v = parseValue(value);
      if (v === null) return null;
      // For dates: match the whole day
      if (fieldType === 'date') {
        return { $gte: v, $lte: endOfDay(value) };
      }
      return v;
    }

    case 'neq': {
      const v = parseValue(value);
      if (v === null) return null;
      if (fieldType === 'date') {
        return { $not: { $gte: v, $lte: endOfDay(value) } };
      }
      return { $ne: v };
    }

    case 'lt': {
      const v = parseValue(value);
      if (v === null) return null;
      return { $lt: v };
    }

    case 'gt': {
      const v = parseValue(value);
      if (v === null) return null;
      // For dates: greater than end of selected day
      if (fieldType === 'date') {
        return { $gt: endOfDay(value) };
      }
      return { $gt: v };
    }

    case 'lte': {
      const v = parseValue(value);
      if (v === null) return null;
      // For dates: include the whole day
      if (fieldType === 'date') {
        return { $lte: endOfDay(value) };
      }
      return { $lte: v };
    }

    case 'gte': {
      const v = parseValue(value);
      if (v === null) return null;
      return { $gte: v };
    }

    case 'in': {
      if (!Array.isArray(value)) return null;
      return { $in: value };
    }

    case 'nin': {
      if (!Array.isArray(value)) return null;
      return { $nin: value };
    }

    case 'contains': {
      return { $regex: escapeRegex(value), $options: 'i' };
    }

    case 'ncontains': {
      return { $not: new RegExp(escapeRegex(value), 'i') };
    }

    case 'prefix': {
      return { $regex: '^' + escapeRegex(value), $options: 'i' };
    }

    case 'suffix': {
      return { $regex: escapeRegex(value) + '$', $options: 'i' };
    }

    default:
      return null;
  }
}

// GET /api/leads/filters/counts - count of leads in each filter chip
// GET /api/leads/filters/counts - count of leads in each filter chip
export const getFilterCounts = async (req, res) => {
  try {
    // Non-admin users ke counts bhi sirf unki assigned leads ke hisaab se
    const assignedOnly = getAssignedOnlyFilter(req.user);
    const baseQuery = assignedOnly ? { assignedTo: assignedOnly } : {};

    // Total + own
    const allCount = await Lead.countDocuments(baseQuery);
    const ownCount = await Lead.countDocuments({ ...baseQuery, isOwn: true });

    // Each stage count
    const stages = [
      "New Leads",
      "Opportunities",
      "Re-inquired",
      "Admission Done",
      "Not Connected",
      "Not Interested",
      "Dump",
      "Documents Received",
      "Follow-Ups",
      "Location Barrier",
      "Call Back Later",
      "Interested for Later",
      "Registration Done",
    ];

    const stageCounts = await Promise.all(
      stages.map((stage) => Lead.countDocuments({ ...baseQuery, stage })),
    );

    // Return as array - FilterChips component ke liye
    const data = [
      { name: "All Leads", count: allCount },
      { name: "Own Leads", count: ownCount },
      ...stages.map((stage, idx) => ({ name: stage, count: stageCounts[idx] })),
    ];

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/leads/:id - get single lead
export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    // Non-admin ko sirf apni assigned lead dekhne dena
    const assignedOnly = getAssignedOnlyFilter(req.user);
    if (assignedOnly && lead.assignedTo !== assignedOnly) {
      return res
        .status(403)
        .json({ success: false, message: "This lead is not assigned to you" });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/leads - create new lead
export const createLead = async (req, res) => {
  try {
    const { name, contact } = req.body;

    // Required validation
    if (!name || !contact) {
      return res.status(400).json({
        success: false,
        message: "Name and contact are required",
      });
    }

    const lead = await Lead.create(req.body);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/leads/:id - update existing lead
export const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/leads/:id
export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }
    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/leads/export - download filtered leads as CSV
export const exportLeads = async (req, res) => {
  try {
    const { filter, search = "" } = req.query;

    // Same filtering logic as getLeads
    const query = {};

    if (filter && filter !== "all") {
      if (filter === "own") {
        query.isOwn = true;
      } else {
        query.stage = filter;
      }
    }

    if (search.trim()) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { email: regex }, { contact: regex }];
    }

    // Non-admin users ko sirf apni assigned leads export karne dena
    const assignedOnly = getAssignedOnlyFilter(req.user);
    if (assignedOnly) {
      query.assignedTo = assignedOnly;
    }

    // Fetch all matching leads (no pagination)
    const leads = await Lead.find(query).sort({ createdAt: -1 }).lean();

    // CSV headers
    const headers = [
      "Name",
      "Phone",
      "Email",
      "University",
      "Category",
      "Course",
      "Stage",
      "Reason",
      "Source",
      "Sub-Source",
      "Country",
      "State",
      "City",
      "Assigned To",
      "Call Count",
      "Remark",
      "Created At",
    ];

    // CSV rows - har field ko escape karo (commas/quotes/newlines)
    const escapeCSV = (val) => {
      if (val == null) return "";
      const str = String(val);
      // Agar comma/quote/newline hai toh quotes mein wrap karo + internal quotes escape
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = leads.map((l) =>
      [
        escapeCSV(l.name),
        escapeCSV(l.contact),
        escapeCSV(l.email),
        escapeCSV(l.inquiredFor),
        escapeCSV(l.program),
        escapeCSV(l.category),
        escapeCSV(l.stage),
        escapeCSV(l.stageNote),
        escapeCSV(l.source),
        escapeCSV(l.sourceNote),
        escapeCSV(l.country),
        escapeCSV(l.state),
        escapeCSV(l.location),
        escapeCSV(l.assignedTo),
        escapeCSV(l.callCount || 0),
        escapeCSV(l.remark),
        escapeCSV(
          l.createdAt ? new Date(l.createdAt).toLocaleString("en-IN") : "",
        ),
      ].join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");

    // Send as CSV file
    const filename = `leads-${filter || "all"}-${Date.now()}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/leads/import - bulk import from CSV// POST /api/leads/import - bulk import from CSV or Excel
export const importLeads = async (req, res) => {
  try {
    const { csv, xlsxBase64 } = req.body;

    let rows = []; // Will be array of arrays

    // Parse XLSX (Excel) if provided
    if (xlsxBase64) {
      try {
        const buffer = Buffer.from(xlsxBase64, "base64");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert to array of arrays - header: 1 means first row is header
        rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "", // empty cells become ''
          raw: false, // dates etc converted to string
        });
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Failed to parse Excel file: " + err.message,
        });
      }
    }
    // Parse CSV if provided
    else if (csv && typeof csv === "string") {
      const lines = csv.split(/\r?\n/).filter((line) => line.trim());

      // CSV row parser (respects quotes)
      const parseRow = (row) => {
        const cells = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          const next = row[i + 1];
          if (char === '"') {
            if (inQuotes && next === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === "," && !inQuotes) {
            cells.push(current);
            current = "";
          } else {
            current += char;
          }
        }
        cells.push(current);
        return cells.map((c) => c.trim());
      };

      rows = lines.map(parseRow);
    } else {
      return res.status(400).json({
        success: false,
        message: "Either csv or xlsxBase64 is required",
      });
    }

    // Validation - must have header + at least one data row
    if (rows.length < 2) {
      return res.status(400).json({
        success: false,
        message: "File must have a header row and at least one data row",
      });
    }

    // Field mapping - VERY flexible alias support
    const fieldMap = {
      name: ["name", "full name", "lead name", "student name", "fullname"],
      contact: [
        "phone",
        "contact",
        "mobile",
        "phone number",
        "mobile number",
        "contact number",
      ],
      email: ["email", "email address", "email id"],
      inquiredFor: [
        "university",
        "inquired for",
        "department",
        "dept",
        "inquiry",
      ],
      program: ["category", "program"],
      category: ["course", "specialization", "specilization"],
      stage: ["stage", "lead stage"],
      stageNote: ["reason", "stage note"],
      source: ["source"],
      sourceNote: ["sub-source", "sub source", "subsource"],
      country: ["country"],
      state: ["state"],
      location: ["city", "location"],
      assignedTo: ["assigned to", "assigned", "owner"],
      callCount: ["call count", "total calls", "calls"],
      remark: ["notes", "remark", "comments", "last remark"],
    };

    // Map headers to field names
    const headerRow = rows[0].map((h) =>
      String(h || "")
        .toLowerCase()
        .trim(),
    );
    const columnIndex = {};
    headerRow.forEach((header, idx) => {
      for (const [field, aliases] of Object.entries(fieldMap)) {
        if (aliases.includes(header)) {
          columnIndex[field] = idx;
          break;
        }
      }
    });

    // Validate: name + contact must be detected
    if (columnIndex.name === undefined || columnIndex.contact === undefined) {
      return res.status(400).json({
        success: false,
        message:
          'File must contain "Name" (or "Full Name") and "Phone" (or "Mobile") columns. Found headers: ' +
          headerRow.join(", "),
      });
    }

    // Process data rows in batches for performance
    const results = {
      total: rows.length - 1,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    // First: collect all rows to import
    const toImport = [];
    const toCheckContacts = new Set();

    for (let i = 1; i < rows.length; i++) {
      const rowNum = i + 1;
      try {
        const cells = rows[i];

        // Build lead object
        const leadData = {};
        for (const [field, idx] of Object.entries(columnIndex)) {
          let value = cells[idx];
          if (value === undefined || value === null) continue;
          value = String(value).trim();
          if (value === "") continue;

          if (field === "callCount") {
            leadData[field] = parseInt(value) || 0;
          } else {
            leadData[field] = value;
          }
        }

        // Validate required
        if (!leadData.name || !leadData.contact) {
          results.failed++;
          if (results.errors.length < 10) {
            results.errors.push(`Row ${rowNum}: Missing Name or Phone`);
          }
          continue;
        }

        toImport.push({ rowNum, leadData });
        toCheckContacts.add(leadData.contact);
      } catch (err) {
        results.failed++;
        if (results.errors.length < 10) {
          results.errors.push(`Row ${rowNum}: ${err.message}`);
        }
      }
    }

    // Bulk check duplicates (much faster than per-row query)
    const existing = await Lead.find(
      { contact: { $in: Array.from(toCheckContacts) } },
      { contact: 1 },
    ).lean();
    const existingContacts = new Set(existing.map((e) => e.contact));

    // Batch insert non-duplicates
    const newLeads = [];
    for (const item of toImport) {
      if (existingContacts.has(item.leadData.contact)) {
        results.skipped++;
      } else {
        newLeads.push(item.leadData);
        // Add to set to handle duplicates within the same file
        existingContacts.add(item.leadData.contact);
      }
    }

    // Bulk insert in batches of 500
    if (newLeads.length > 0) {
      const BATCH_SIZE = 500;
      for (let i = 0; i < newLeads.length; i += BATCH_SIZE) {
        const batch = newLeads.slice(i, i + BATCH_SIZE);
        try {
          await Lead.insertMany(batch, { ordered: false });
          results.imported += batch.length;
        } catch (err) {
          // insertMany with ordered:false continues on errors
          // Count successful from result if available
          if (err.insertedDocs) {
            results.imported += err.insertedDocs.length;
            const failedCount = batch.length - err.insertedDocs.length;
            results.failed += failedCount;
          } else {
            results.failed += batch.length;
          }
          if (results.errors.length < 10) {
            results.errors.push(
              `Batch ${i / BATCH_SIZE + 1}: ${err.message.substring(0, 100)}`,
            );
          }
        }
      }
    }

    // Error truncation message
    if (results.errors.length === 10 && results.failed > 10) {
      results.errors.push(`... and ${results.failed - 10} more errors`);
    }

    res.json({
      success: true,
      message: `Imported ${results.imported}, skipped ${results.skipped}, failed ${results.failed}`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};





// =============================================================
// BULK OPERATIONS
// =============================================================

// POST /api/leads/bulk/delete - delete multiple leads
export const bulkDeleteLeads = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required'
      });
    }

    const result = await Lead.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} leads`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/leads/bulk/assign - assign multiple leads to a user
export const bulkAssignLeads = async (req, res) => {
  try {
    const { ids, assignedTo } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required'
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'assignedTo is required'
      });
    }

    const result = await Lead.updateMany(
      { _id: { $in: ids } },
      { $set: { assignedTo } }
    );

    res.json({
      success: true,
      message: `Assigned ${result.modifiedCount} leads to ${assignedTo}`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/leads/bulk/stage - change stage for multiple leads
export const bulkChangeStage = async (req, res) => {
  try {
    const { ids, stage, stageNote } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required'
      });
    }

    if (!stage) {
      return res.status(400).json({
        success: false,
        message: 'Stage is required'
      });
    }

    const updateData = { stage };
    if (stageNote !== undefined) {
      updateData.stageNote = stageNote;
    }

    const result = await Lead.updateMany(
      { _id: { $in: ids } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `Updated stage for ${result.modifiedCount} leads`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/leads/bulk/export - export specific leads as CSV
export const bulkExportLeads = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required'
      });
    }

    const leads = await Lead.find({ _id: { $in: ids } })
      .sort({ createdAt: -1 })
      .lean();

    // CSV headers
    const headers = [
      'Name',
      'Phone',
      'Email',
      'University',
      'Category',
      'Course',
      'Stage',
      'Reason',
      'Source',
      'Sub-Source',
      'Country',
      'State',
      'City',
      'Assigned To',
      'Call Count',
      'Remark',
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

    const rows = leads.map((l) =>
      [
        escapeCSV(l.name),
        escapeCSV(l.contact),
        escapeCSV(l.email),
        escapeCSV(l.inquiredFor),
        escapeCSV(l.program),
        escapeCSV(l.category),
        escapeCSV(l.stage),
        escapeCSV(l.stageNote),
        escapeCSV(l.source),
        escapeCSV(l.sourceNote),
        escapeCSV(l.country),
        escapeCSV(l.state),
        escapeCSV(l.location),
        escapeCSV(l.assignedTo),
        escapeCSV(l.callCount || 0),
        escapeCSV(l.remark),
        escapeCSV(
          l.createdAt ? new Date(l.createdAt).toLocaleString('en-IN') : ''
        )
      ].join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');

    const filename = `leads-selected-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};





// POST /api/leads/bulk/university - bulk change university
export const bulkChangeUniversity = async (req, res) => {
  try {
    const { ids, inquiredFor, assignedTo } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required'
      });
    }

    if (!inquiredFor) {
      return res.status(400).json({
        success: false,
        message: 'University is required'
      });
    }

    const updateData = { inquiredFor };
    if (assignedTo) updateData.assignedTo = assignedTo;

    const result = await Lead.updateMany(
      { _id: { $in: ids } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} leads`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};