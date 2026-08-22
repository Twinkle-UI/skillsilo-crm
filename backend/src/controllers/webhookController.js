import Lead from "../models/Lead.js";
import { getNextAssignee } from "../services/leadAssignmentService.js";

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