import CallLog from '../models/CallLog.js';

// DELETE /api/calls/clear-all - saare call logs permanently delete karta hai
// Admin-only, kyunki ye poore CRM ke Total Calls stats ko zero kar deta hai.
export const clearAllCallLogs = async (req, res) => {
  try {
    const result = await CallLog.deleteMany({});
    console.log(
      `⚠️ ALL call logs cleared by ${req.user?.name || 'unknown'} (${result.deletedCount} deleted)`,
    );
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};