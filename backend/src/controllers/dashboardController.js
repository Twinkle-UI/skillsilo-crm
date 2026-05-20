import Lead from "../models/Lead.js";
import FollowUp from "../models/FollowUp.js";
import CallLog from "../models/CallLog.js";

// GET /api/dashboard/stats - real-time dashboard data
export const getDashboardStats = async (req, res) => {
  try {
    // Date helpers
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Workstation - last 24 hour mein active users (assignedTo unique count)
    const workstationDate = new Date();
    workstationDate.setHours(workstationDate.getHours() - 24);

    // ========== Run all queries in parallel for speed ==========
    const [
      totalLeads,
      totalFollowUps,
      todayFollowUps,
      activeUsers,
      callStatsAgg,
      sourceData,
      locationData,
      categoryData,
      universityData,
      stageData,
      monthData,
      callLogsByDay,
      usersData,
    ] = await Promise.all([
      // Top stats
      Lead.countDocuments(),
      FollowUp.countDocuments(),
      FollowUp.countDocuments({ dueAt: { $gte: today, $lt: tomorrow } }),
      Lead.distinct("assignedTo", {
        updatedAt: { $gte: workstationDate },
      }).then((arr) => arr.filter(Boolean).length),

      // Total Calls breakdown
      CallLog.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),

      // Source v/s Leads
      Lead.aggregate([
        { $group: { _id: "$source", leads: { $sum: 1 } } },
        { $project: { _id: 0, source: "$_id", leads: 1 } },
        { $sort: { leads: -1 } },
      ]),

      // Location v/s Leads
      Lead.aggregate([
        { $group: { _id: "$state", leads: { $sum: 1 } } },
        { $project: { _id: 0, state: "$_id", leads: 1 } },
        { $sort: { leads: -1 } },
      ]),

      // Categories
      Lead.aggregate([
        { $group: { _id: "$category", leads: { $sum: 1 } } },
        { $project: { _id: 0, category: "$_id", leads: 1 } },
        { $sort: { leads: -1 } },
      ]),

      // University
      Lead.aggregate([
        { $group: { _id: "$inquiredFor", leads: { $sum: 1 } } },
        { $project: { _id: 0, university: "$_id", leads: 1 } },
        { $sort: { leads: -1 } },
      ]),

      // Stage v/s Leads
      Lead.aggregate([
        { $group: { _id: "$stage", leads: { $sum: 1 } } },
        { $project: { _id: 0, stage: "$_id", leads: 1 } },
        { $sort: { leads: -1 } },
      ]),

      // Month v/s Leads (last 6 months)
      Lead.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            leads: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 6 },
      ]),

      // Call Logs grouped by month + type
      CallLog.aggregate([
        {
          $group: {
            _id: {
              month: { $dateToString: { format: "%m-%Y", date: "$callDate" } },
              type: "$type",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]),

      // Users v/s Leads
      Lead.aggregate([
        { $match: { assignedTo: { $ne: "" } } },
        {
          $group: {
            _id: { user: "$assignedTo", university: "$inquiredFor" },
            leads: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            user: "$_id.user",
            university: "$_id.university",
            leads: 1,
          },
        },
        { $sort: { leads: -1 } },
        { $limit: 50 },
      ]),
    ]);

    // ========== Format Call Stats ==========
    const callMap = { outgoing: 0, missed: 0, incoming: 0, rejected: 0 };
    callStatsAgg.forEach((c) => {
      callMap[c._id] = c.count;
    });
    const callTotal =
      callMap.outgoing + callMap.missed + callMap.incoming + callMap.rejected;

    // ========== Format Month Chart ==========
    const monthChartData = {
      labels: monthData.map(
        (m) => `${String(m._id.month).padStart(2, "0")}-${m._id.year}`,
      ),
      data: monthData.map((m) => m.leads),
    };

    // ========== Format Call Logs Chart ==========
    const callMonths = [
      ...new Set(callLogsByDay.map((c) => c._id.month)),
    ].sort();
    const callTypes = ["outgoing", "missed", "incoming", "rejected"];
    const callLogsChartData = {
      labels: callMonths,
      datasets: callTypes.map((t) => ({
        label: t.charAt(0).toUpperCase() + t.slice(1),
        data: callMonths.map((m) => {
          const found = callLogsByDay.find(
            (c) => c._id.month === m && c._id.type === t,
          );
          return found ? found.count : 0;
        }),
      })),
    };

    // ========== Final Response ==========
    res.json({
      success: true,
      data: {
        statCards: [
          { number: totalLeads, label: "Total Leads" },
          { number: totalFollowUps, label: "Total Follow-Ups" },
          { number: todayFollowUps, label: "Today Follow-Ups" },
          { number: activeUsers, label: "Workstation Occupancy" },
        ],
        callStats: { ...callMap, total: callTotal },
        sourceData,
        locationData,
        categoryData,
        universityData,
        stageData,
        monthChartData,
        callLogsChartData,
        usersData,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
