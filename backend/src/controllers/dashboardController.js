import Lead from "../models/Lead.js";
import FollowUp from "../models/FollowUp.js";
import CallLog from "../models/CallLog.js";

// GET /api/dashboard/stats - real-time dashboard data
// Admin: poori company ka data. Non-admin: sirf apni assigned leads/follow-ups/calls ka data.
export const getDashboardStats = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    // Lead.assignedTo format hamesha "Name (EmployeeId)" hota hai
    const myName = req.user?.employeeId
      ? `${req.user.name} (${req.user.employeeId})`
      : req.user?.name;

    const leadMatch = isAdmin ? {} : { assignedTo: myName };
    const followUpMatch = isAdmin ? {} : { assignedTo: myName };

    // Non-admin ke calls sirf unki apni leads ke honge (CallLog mein direct
    // assignedTo nahi hai, Lead se lookup karke match karna padta hai)
    const callLeadLookupStages = isAdmin
      ? []
      : [
          {
            $lookup: {
              from: "leads",
              localField: "leadId",
              foreignField: "_id",
              as: "lead",
            },
          },
          { $unwind: "$lead" },
          { $match: { "lead.assignedTo": myName } },
        ];

    // ========== Date helpers ==========
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // ========== Run all queries in parallel for speed ==========
    const [
      totalLeads,
      totalFollowUps,
      todayFollowUps,
      doneFollowUps,
      missedFollowUps,
      plannedFollowUps,
      admissionPrevMonth,
      admissionThisMonth,
      attemptsTodayAgg,
      newLeadsToday,
      leadsAssignedToday,
      leadsOverviewPrevMonth,
      leadsOverviewThisMonth,
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
      Lead.countDocuments(leadMatch),
      FollowUp.countDocuments(followUpMatch),
      FollowUp.countDocuments({
        ...followUpMatch,
        dueAt: { $gte: today, $lt: tomorrow },
      }),
      FollowUp.countDocuments({ ...followUpMatch, status: "completed" }),
      FollowUp.countDocuments({ ...followUpMatch, status: "missed" }),
      FollowUp.countDocuments({ ...followUpMatch, status: "planned" }),

      // Admission Done - previous month / this month
      // (updatedAt use kiya hai kyunki stage-change ki alag date track nahi hoti;
      //  jab lead "Admission Done" pe move hoti hai, updatedAt wahi reflect karta hai)
      Lead.countDocuments({
        ...leadMatch,
        stage: "Admission Done",
        updatedAt: { $gte: prevMonthStart, $lt: thisMonthStart },
      }),
      Lead.countDocuments({
        ...leadMatch,
        stage: "Admission Done",
        updatedAt: { $gte: thisMonthStart, $lt: nextMonthStart },
      }),

      // Today's Record - Attempts Done (call attempts aaj)
      CallLog.aggregate([
        ...callLeadLookupStages,
        { $match: { callDate: { $gte: today, $lt: tomorrow } } },
        { $count: "count" },
      ]),

      // Today's Record - Leads in New Leads (aaj aayi aur abhi New Leads stage mein)
      Lead.countDocuments({
        ...leadMatch,
        stage: "New Leads",
        createdAt: { $gte: today, $lt: tomorrow },
      }),

      // Today's Record - Lead Assigned (aaj assign hui - assignedAt field se)
      Lead.countDocuments({
        ...leadMatch,
        assignedAt: { $gte: today, $lt: tomorrow },
      }),

      // Leads Overview - previous month / this month (total leads aayi)
      Lead.countDocuments({
        ...leadMatch,
        createdAt: { $gte: prevMonthStart, $lt: thisMonthStart },
      }),
      Lead.countDocuments({
        ...leadMatch,
        createdAt: { $gte: thisMonthStart, $lt: nextMonthStart },
      }),

      // Total Calls breakdown
      CallLog.aggregate([
        ...callLeadLookupStages,
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),

      // Source v/s Leads
      Lead.aggregate([
        { $match: leadMatch },
        { $group: { _id: "$source", leads: { $sum: 1 } } },
        { $project: { _id: 0, source: "$_id", leads: 1 } },
        { $sort: { leads: -1 } },
      ]),

      // Location v/s Leads
      Lead.aggregate([
        { $match: leadMatch },
        { $group: { _id: "$state", leads: { $sum: 1 } } },
        { $project: { _id: 0, state: "$_id", leads: 1 } },
        { $sort: { leads: -1 } },
      ]),

      // Categories
      Lead.aggregate([
        { $match: leadMatch },
        { $group: { _id: "$category", leads: { $sum: 1 } } },
        { $project: { _id: 0, category: "$_id", leads: 1 } },
        { $sort: { leads: -1 } },
      ]),

      // University
      Lead.aggregate([
        { $match: leadMatch },
        { $group: { _id: "$inquiredFor", leads: { $sum: 1 } } },
        { $project: { _id: 0, university: "$_id", leads: 1 } },
        { $sort: { leads: -1 } },
      ]),

      // Stage v/s Leads
      Lead.aggregate([
        { $match: leadMatch },
        { $group: { _id: "$stage", leads: { $sum: 1 } } },
        { $project: { _id: 0, stage: "$_id", leads: 1 } },
        { $sort: { leads: -1 } },
      ]),

      // Month v/s Leads (last 6 months)
      Lead.aggregate([
        { $match: leadMatch },
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
        ...callLeadLookupStages,
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

      // Users v/s Leads - leadMatch already lagi hai, toh non-admin ko
      // automatically sirf apna hi naam (har university ke against) dikhega
      Lead.aggregate([
        { $match: { ...leadMatch, assignedTo: { $ne: "" } } },
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
      isAdmin,
      data: {
        // Row 1 - top summary
        topStats: [
          { icon: "👥", number: totalLeads, label: "Total Leads" },
          { icon: "✉️", number: 0, label: "Total Emails Sent" }, // tracking abhi implement nahi hua
          { icon: "💬", number: 0, label: "Total SMS Sent" }, // tracking abhi implement nahi hua
        ],
        // Row 2 - follow-up breakdown
        followUpStats: [
          { icon: "📅", number: todayFollowUps, label: "Today Follow-ups" },
          { icon: "📅", number: doneFollowUps, label: "Done Follow-ups" },
          { icon: "📅", number: missedFollowUps, label: "Missed Follow-ups" },
          { icon: "📅", number: plannedFollowUps, label: "Planned Follow-ups" },
        ],
        totalFollowUps,
        // Middle row - 3 summary cards
        admissionDone: {
          title: "Admission Done",
          metrics: [
            { icon: "👍", number: admissionPrevMonth, label: "Previous Month" },
            { icon: "🙂", number: admissionThisMonth, label: "This Month" },
          ],
        },
        todaysRecord: {
          title: "Today's Record",
          metrics: [
            {
              icon: "✅",
              number: attemptsTodayAgg[0]?.count || 0,
              label: "Attempts Done",
            },
            { icon: "📊", number: newLeadsToday, label: "Leads in New Leads" },
            { icon: "🧑‍💼", number: leadsAssignedToday, label: "Lead Assigned" },
          ],
        },
        leadsOverview: {
          title: "Leads Overview",
          metrics: [
            {
              icon: "👥",
              number: leadsOverviewPrevMonth,
              label: "Previous Month",
            },
            { icon: "📊", number: leadsOverviewThisMonth, label: "This Month" },
          ],
        },
        // Existing charts/tables
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
