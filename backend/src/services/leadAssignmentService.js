import User from '../models/User.js';
import Lead from '../models/Lead.js';

// Roles to exclude from auto-assignment
const EXCLUDED_ROLES = ['admin', 'Admin', 'administrator', 'Administrator'];

/**
 * Auto-assign a lead to next available user using Round-Robin strategy
 *
 * Rules:
 * - Only active users
 * - Skip admin role (admins manage, don't handle leads)
 * - Round-robin based on last assigned user
 * - Fallback: 'Unassigned' if no eligible users found
 *
 * @returns {Promise<string>} Display name like "Khushi (SKILL046)" or 'Unassigned'
 */
export async function getNextAssignee() {
  try {
    // 1. Fetch all eligible users (active, non-admin)
    const eligibleUsers = await User.find({
      isActive: true,
      role: { $nin: EXCLUDED_ROLES }
    })
      .select('name employeeId role')
      .sort({ createdAt: 1 })
      .lean();

    // 2. Fallback if no users found
    if (eligibleUsers.length === 0) {
      console.warn('⚠️ No eligible users for auto-assignment. Using Unassigned.');
      return 'Unassigned';
    }

    // 3. Format display names
    const userDisplayNames = eligibleUsers.map((u) =>
      u.employeeId ? `${u.name} (${u.employeeId})` : u.name
    );

    // 4. Find the LAST assigned user
    const lastAssignedLead = await Lead.findOne({
      source: 'Meta Ads',
      assignedTo: { $in: userDisplayNames }
    })
      .sort({ createdAt: -1 })
      .select('assignedTo')
      .lean();

    let nextIndex = 0;

    if (lastAssignedLead && lastAssignedLead.assignedTo) {
      const lastIndex = userDisplayNames.indexOf(lastAssignedLead.assignedTo);
      if (lastIndex !== -1) {
        nextIndex = (lastIndex + 1) % userDisplayNames.length;
      }
    }

    const nextAssignee = userDisplayNames[nextIndex];

    console.log(`🎯 Auto-assigned to: ${nextAssignee}`);
    return nextAssignee;
  } catch (error) {
    console.error('❌ Auto-assignment error:', error.message);
    return 'Unassigned';
  }
}

/**
 * Get round-robin assignee for any source
 */
export async function getNextAssigneeForSource(source = 'Meta Ads') {
  try {
    const eligibleUsers = await User.find({
      isActive: true,
      role: { $nin: EXCLUDED_ROLES }
    })
      .select('name employeeId role')
      .sort({ createdAt: 1 })
      .lean();

    if (eligibleUsers.length === 0) return 'Unassigned';

    const userDisplayNames = eligibleUsers.map((u) =>
      u.employeeId ? `${u.name} (${u.employeeId})` : u.name
    );

    const lastAssignedLead = await Lead.findOne({
      source,
      assignedTo: { $in: userDisplayNames }
    })
      .sort({ createdAt: -1 })
      .select('assignedTo')
      .lean();

    let nextIndex = 0;
    if (lastAssignedLead?.assignedTo) {
      const lastIndex = userDisplayNames.indexOf(lastAssignedLead.assignedTo);
      if (lastIndex !== -1) {
        nextIndex = (lastIndex + 1) % userDisplayNames.length;
      }
    }

    return userDisplayNames[nextIndex];
  } catch (error) {
    console.error('❌ Auto-assignment error:', error.message);
    return 'Unassigned';
  }
}