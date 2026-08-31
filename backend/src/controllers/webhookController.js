import Lead from "../models/Lead.js";
import User from "../models/User.js";
import CallLog from "../models/CallLog.js";
import { getNextAssignee } from "../services/leadAssignmentService.js";
import { logActivity } from "../services/activityLogService.js";

function buildNormalizedMap(obj) {
  const map = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === null || v === undefined || v === "") continue;
    const nk = String(k).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!(nk in map)) map[nk] = v;
  }
  return map;
}

function pick(normMap, candidates) {
  for (const c of candidates) {
    const nc = c.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normMap[nc] !== undefined) {
      const val = normMap[nc];
      return String(Array.isArray(val) ? val[0] : val).trim();
    }
  }
  return "";
}

function cleanPhone(raw) {
  if (!raw) return "";
  return String(raw).trim().replace(/^p:/i, "").replace(/[^\d+]/g, "");
}

function isAuthorized(req) {
  const secret = process.env.PABBLY_WEBHOOK_SECRET;
  if (!secret) return true;
  const provided =
    req.headers["x-webhook-secret"] ||
    req.query.secret ||
    (req.body && req.body.secret);
  return provided === secret;
}

export const verifyWebhook = (req, res) => {
  const VERIFY_TOKEN =
    process.env.META_WEBHOOK_VERIFY_TOKEN || "skillsilo_meta_verify_token";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Meta webhook verified");
    return res.status(200).send(challenge);
  }

  console.error("❌ Meta webhook verification failed");
  return res.status(403).json({ error: "Verification failed" });
};

export const receiveWebhook = async (req, res) => {
  try {
    console.log("\n📥 META WEBHOOK RECEIVED");
    console.log(JSON.stringify(req.body, null, 2));

    const { entry } = req.body;
    if (!entry || !Array.isArray(entry)) {
      return res.status(200).json({ success: true, message: "No entry data" });
    }

    const results = [];
    for (const pageEntry of entry) {
      const pageId = pageEntry.id;
      for (const change of pageEntry.changes || []) {
        if (change.field !== "leadgen") continue;
        const lead = await processMetaLead(change.value, pageId, req.body);
        results.push(lead);
      }
    }

    res.status(200).json({
      success: true,
      message: "Webhook processed",
      processed: results.length,
      leads: results,
    });
  } catch (error) {
    console.error("❌ Meta webhook error:", error);
    res.status(200).json({ success: false, message: error.message });
  }
};

async function processMetaLead(leadgenData, pageId, rawData) {
  const { leadgen_id, page_id, form_id, ad_id, campaign_id, field_data } =
    leadgenData;

  const existing = await Lead.findOne({ metaLeadgenId: leadgen_id });
  if (existing) {
    console.log(`⚠️ Duplicate lead skipped: ${leadgen_id}`);
    return { skipped: true, reason: "duplicate", leadgenId: leadgen_id };
  }

  const normMap = buildNormalizedMap(flattenFieldData(field_data || []));
  const leadData = mapLeadFields(normMap);
  const assignedTo = await getNextAssignee();

  const newLead = await Lead.create({
    name: leadData.name || "Unknown",
    contact: cleanPhone(leadData.contact),
    email: leadData.email || "",
    inquiredFor: leadData.university || "",
    program: leadData.program || "",
    category: leadData.course || "",
    stage: "New Leads",
    source: "Meta Ads",
    sourceNote: `Form: ${form_id || "Unknown"}`,
    country: leadData.country || "India",
    state: leadData.state || "",
    location: leadData.city || "",
    assignedTo,
    remark: "Auto-created from Meta Ads (direct)",
    metaAdId: ad_id || null,
    metaFormId: form_id || null,
    metaCampaignId: campaign_id || null,
    metaLeadgenId: leadgen_id,
    metaPageId: page_id || pageId,
    metaRawData: rawData,
  });

  console.log(`✅ Meta lead created: ${newLead.name} → ${assignedTo}`);
  logActivity({
    leadId: newLead._id,
    type: "created",
    details: { assignedTo, source: "Meta Ads" },
    performedBy: "System (Meta Ads)",
  });
  return { success: true, leadId: newLead._id, assignedTo };
}

function flattenFieldData(fieldData) {
  const flat = {};
  for (const item of fieldData || []) {
    if (!item || !item.name) continue;
    const value = Array.isArray(item.values) ? item.values[0] : item.values;
    flat[item.name] = value;
  }
  return flat;
}

export const receivePabblyWebhook = async (req, res) => {
  try {
    console.log("\n========================================");
    console.log("📥 PABBLY WEBHOOK RECEIVED");
    console.log("========================================");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("========================================\n");

    if (!isAuthorized(req)) {
      console.warn("⛔ Unauthorized Pabbly webhook hit");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = { ...(req.query || {}), ...(req.body || {}) };
    if (!payload || typeof payload !== "object") {
      return res.status(200).json({ success: false, message: "Invalid payload" });
    }

    const merged = { ...payload };
    if (Array.isArray(payload.field_data)) {
      Object.assign(merged, flattenFieldData(payload.field_data));
    }

    const normMap = buildNormalizedMap(merged);
    const leadData = mapLeadFields(normMap);
    leadData.contact = cleanPhone(leadData.contact);

    if (!leadData.name || (!leadData.contact && !leadData.email)) {
      console.warn("⚠️ Missing required fields (name + phone/email)");
      return res.status(200).json({
        success: false,
        message: "Missing required fields: name and (phone or email)",
        received: payload,
      });
    }

    if (leadData.leadId) {
      const existing = await Lead.findOne({ metaLeadgenId: leadData.leadId });
      if (existing) {
        console.log(`⚠️ Duplicate lead skipped: ${leadData.leadId}`);
        return res.status(200).json({
          success: true,
          skipped: true,
          reason: "duplicate",
          leadgenId: leadData.leadId,
        });
      }
    } else if (leadData.contact) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recent = await Lead.findOne({
        contact: leadData.contact,
        createdAt: { $gte: fiveMinAgo },
      });
      if (recent) {
        console.log(`⚠️ Recent duplicate skipped: ${leadData.contact}`);
        return res.status(200).json({
          success: true,
          skipped: true,
          reason: "recent-duplicate",
        });
      }
    }

    const assignedTo = await getNextAssignee();

    const newLead = await Lead.create({
      name: leadData.name,
      contact: leadData.contact,
      email: leadData.email || "",
      inquiredFor: leadData.university || "",
      program: leadData.program || "",
      category: leadData.course || "",
      stage: "New Leads",
      source: "Meta Ads",
      sourceNote: leadData.formName || "Pabbly - Facebook Lead Ads",
      country: leadData.country || "India",
      state: leadData.state || "",
      location: leadData.city || "",
      assignedTo,
      remark: "Auto-created from Pabbly (Facebook Lead Ads)",
      metaAdId: leadData.adId || null,
      metaFormId: leadData.formId || null,
      metaCampaignId: leadData.campaignId || null,
      metaLeadgenId: leadData.leadId || null,
      metaPageId: leadData.pageId || null,
      metaRawData: payload,
    });

    console.log(`✅ Pabbly lead created: ${newLead.name} → ${assignedTo}`);
    logActivity({
      leadId: newLead._id,
      type: "created",
      details: { assignedTo, source: "Meta Ads" },
      performedBy: "System (Pabbly)",
    });

    return res.status(200).json({
      success: true,
      message: "Lead created successfully",
      leadId: newLead._id,
      name: newLead.name,
      assignedTo,
      leadgenId: leadData.leadId || null,
    });
  } catch (error) {
    console.error("❌ Pabbly webhook error:", error);
    return res.status(200).json({ success: false, message: error.message });
  }
};

function mapLeadFields(normMap) {
  return {
    name: pick(normMap, ["full_name", "fullname", "name", "first_name", "firstname", "lead_name"]),
    contact: pick(normMap, ["phone_number", "phone", "mobile", "mobile_number", "phone_no", "contact", "contact_number", "whatsapp_number"]),
    email: pick(normMap, ["email", "email_address", "emailaddress", "email_id", "work_email"]),
    university: pick(normMap, ["university", "university_interest", "university_name", "institute", "institution", "college", "department"]),
    program: pick(normMap, ["program", "program_type", "category", "degree"]),
    course: pick(normMap, ["course", "course_interest", "course_name", "specialization", "stream"]),
    city: pick(normMap, ["city", "location"]),
    state: pick(normMap, ["state", "region"]),
    country: pick(normMap, ["country"]),
    leadId: pick(normMap, ["lead_id", "leadgen_id", "leadid", "id"]),
    formId: pick(normMap, ["form_id", "formid"]),
    formName: pick(normMap, ["form_name", "formname"]),
    pageId: pick(normMap, ["page_id", "pageid"]),
    adId: pick(normMap, ["ad_id", "adid"]),
    campaignId: pick(normMap, ["campaign_id", "campaignid"]),
  };
}

// ========== Callyzer (Call Tracking) ==========
//
// Ye field-names Callyzer ke apne "Webhook Config > Request" panel se
// confirm kiye gaye hain (exact match, guesswork nahi):
//
// [{ emp_name, emp_code, emp_country_code, emp_number, emp_tags: [...],
//    call_logs: [{ id, client_name, client_country_code, client_number,
//                   duration, call_type, call_date, call_time, note,
//                   call_recording_url, crm_status, reminder_date,
//                   reminder_time, synced_at, modified_at }] }]

function last10Digits(raw) {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  return digits.slice(-10);
}

function isCallyzerAuthorized(req) {
  const secret = process.env.CALLYZER_WEBHOOK_SECRET;
  if (!secret) return true;

  const provided =
    req.headers["x-webhook-secret"] ||
    req.headers["secret"] ||
    req.headers["x-secret"] ||
    req.headers["authorization"]?.replace(/^Bearer\s+/i, "") ||
    req.query.secret;

  if (provided !== secret) {
    console.log("Callyzer auth debug - headers:", JSON.stringify(req.headers));
    console.log("Callyzer auth debug - query:", JSON.stringify(req.query));
  }

  return provided === secret;
}

// Callyzer 'call_type': "Incoming" | "Outgoing" | "Missed" | "Rejected"
function mapCallType(callType) {
  const t = String(callType || "").toLowerCase();
  if (t === "incoming") return "incoming";
  if (t === "outgoing") return "outgoing";
  if (t === "missed") return "missed";
  if (t === "rejected") return "rejected";
  return "outgoing"; // fallback, jab Callyzer koi naya/anjaan type bheje
}

// call_date ("2023-09-13") aur call_time ("17:49:41") alag-alag fields
// hain - combine karke ek Date banate hain
function parseCallyzerDateTime(dateStr, timeStr) {
  if (!dateStr) return new Date();
  const combined = timeStr ? `${dateStr}T${timeStr}` : dateStr;
  const parsed = new Date(combined);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// POST /api/webhooks/callyzer
// Callyzer app me: Connectors > API & Webhook > Webhook Config me:
//   Webhook URL: https://<backend>/api/webhooks/callyzer  (query param nahi)
//   Secret: <CALLYZER_WEBHOOK_SECRET wahi value jo .env me hai>
export const receiveCallyzerWebhook = async (req, res) => {
  try {
    if (!isCallyzerAuthorized(req)) {
      console.error("❌ Callyzer webhook: invalid secret");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const employees = Array.isArray(req.body) ? req.body : [];
    let created = 0;
    let skipped = 0;
    let unmatched = 0;

    for (const emp of employees) {
      const empNumber = last10Digits(emp.emp_number);
      const empName = emp.emp_name || "";
      const logs = Array.isArray(emp.call_logs) ? emp.call_logs : [];
      if (logs.length === 0) continue;

      // Employee (agent) match - notes me reference ke liye. Role-based
      // call filtering CallLog.leadId -> Lead.assignedTo se hoti hai.
      let agentUser = null;
      if (empNumber) {
        agentUser = await User.findOne({ mobile: { $regex: `${empNumber}$` } });
      }

      for (const log of logs) {
        const clientNumber = last10Digits(log.client_number);
        let matchedLead = null;
        if (clientNumber) {
          matchedLead = await Lead.findOne({ contact: { $regex: `${clientNumber}$` } });
        }
        if (!matchedLead) unmatched++;

        const callDate = parseCallyzerDateTime(log.call_date, log.call_time);

        // Note + CRM status dono save kar lete hain, useful context hai
        const noteParts = [];
        if (log.note) noteParts.push(log.note);
        if (log.crm_status) noteParts.push(`Status: ${log.crm_status}`);
        const notes = noteParts.join(" | ") || (empName ? `Agent: ${empName}` : "");

        try {
          const result = await CallLog.updateOne(
            { externalId: log.id },
            {
              $setOnInsert: {
                externalId: log.id,
                leadId: matchedLead?._id,
                type: mapCallType(log.call_type),
                duration: Number(log.duration) || 0,
                notes,
                callDate,
              },
            },
            { upsert: true },
          );
          if (result.upsertedCount > 0) created++;
          else skipped++;
        } catch (err) {
          console.error("Callyzer call-log upsert failed:", err.message);
        }
      }
    }

    console.log(
      `✅ Callyzer webhook processed: ${created} new, ${skipped} duplicate, ${unmatched} unmatched-lead`,
    );
    return res.status(200).json({ success: true, created, skipped, unmatched });
  } catch (error) {
    console.error("❌ Callyzer webhook error:", error);
    // 200 taaki Callyzer retry-storm na kare hamari taraf ki galti pe bhi
    return res.status(200).json({ success: false, message: error.message });
  }
};