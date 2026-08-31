import ActivityLog from '../models/ActivityLog.js';

// req.user se "Name (EmployeeId)" format banata hai - assignedTo jaisa hi
export function formatActor(user) {
  if (!user) return 'System';
  return user.employeeId ? `${user.name} (${user.employeeId})` : user.name || 'System';
}

// Fire-and-forget - activity log fail hone se main operation (lead create/
// update) fail nahi hona chahiye, isliye yahin try/catch kar liya
export async function logActivity({ leadId, type, changes = [], details = {}, performedBy = 'System' }) {
  try {
    await ActivityLog.create({ leadId, type, changes, details, performedBy });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
}