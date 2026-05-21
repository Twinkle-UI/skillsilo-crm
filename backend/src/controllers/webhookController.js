import Lead from "../models/Lead.js";
import { getNextAssignee } from "../services/leadAssignmentService.js";

// =============================================================
// GET /api/webhooks/meta-leads
// Meta webhook verification challenge
// =============================================================
export const verifyWebhook = (req, res) => {
  const VERIFY_TOKEN =
    process.env.META_WEBHOOK_VERIFY_TOKEN || "skillsilo_meta_verify_token";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("🔐 Webhook verification request received");
  console.log("Mode:", mode);
  console.log("Token match:", token === VERIFY_TOKEN);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.error("❌ Webhook verification failed");
  return res.status(403).json({ error: "Verification failed" });
};

// =============================================================
// POST /api/webhooks/meta-leads
// Receive new leads from Meta (Facebook/Instagram Lead Ads)
// =============================================================
export const receiveWebhook = async (req, res) => {
  try {
    console.log("\n========================================");
    console.log("📥 META WEBHOOK RECEIVED");
    console.log("========================================");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("========================================\n");

    const { entry } = req.body;

    if (!entry || !Array.isArray(entry)) {
      return res.status(200).json({ success: true, message: "No entry data" });
    }

    const results = [];

    // Meta sends array of entries (one entry = one Page event)
    for (const pageEntry of entry) {
      const pageId = pageEntry.id;
      const changes = pageEntry.changes || [];

      for (const change of changes) {
        // Only process leadgen events
        if (change.field !== "leadgen") continue;

        const leadgenData = change.value;
        const lead = await processMetaLead(leadgenData, pageId, req.body);
        results.push(lead);
      }
    }

    // Always return 200 OK to Meta (otherwise they retry)
    res.status(200).json({
      success: true,
      message: "Webhook processed",
      processed: results.length,
      leads: results,
    });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    // Still return 200 - log error but don't tell Meta to retry
    res.status(200).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================================================
// Helper: Process individual Meta lead
// =============================================================
async function processMetaLead(leadgenData, pageId, rawData) {
  const {
    leadgen_id,
    page_id,
    form_id,
    ad_id,
    campaign_id,
    field_data, // For test webhooks - actual leads need Graph API call
  } = leadgenData;

  // Check duplicate
  const existing = await Lead.findOne({ metaLeadgenId: leadgen_id });
  if (existing) {
    console.log(`⚠️ Duplicate lead skipped: ${leadgen_id}`);
    return { skipped: true, reason: "duplicate", leadgenId: leadgen_id };
  }

  // Parse lead fields
  // Note: In production, you'd fetch from Meta Graph API using leadgen_id
  // For now, we'll use field_data if available (test mode)
  const leadFields = parseLeadFields(field_data || []);

  // Auto-assign to user (round-robin)
  const assignedTo = await getNextAssignee();

  // Create lead
  const newLead = await Lead.create({
    name: leadFields.name || "Unknown",
    contact: leadFields.phone || leadFields.phone_number || "",
    email: leadFields.email || "",

    // Inquiry info from form fields
    inquiredFor: leadFields.university || leadFields.university_interest || "",
    program: leadFields.program || leadFields.course || "",
    category: leadFields.category || "",

    // Default stage
    stage: "New Leads",

    // Source
    source: "Meta Ads",
    sourceNote: leadFields.source_note || `Form: ${form_id || "Unknown"}`,

    // Location
    country: leadFields.country || "India",
    state: leadFields.state || "",
    location: leadFields.city || leadFields.location || "",

    // Auto-assigned
    assignedTo,

    // Remark
    remark: "Auto-created from Meta Ads",

    // Meta tracking
    metaAdId: ad_id || null,
    metaFormId: form_id || null,
    metaCampaignId: campaign_id || null,
    metaLeadgenId: leadgen_id,
    metaPageId: page_id || pageId,
    metaRawData: rawData,
  });

  console.log(`✅ Lead created: ${newLead.name} → ${assignedTo}`);

  return {
    success: true,
    leadId: newLead._id,
    name: newLead.name,
    assignedTo,
    leadgenId: leadgen_id,
  };
}

// =============================================================
// Helper: Parse Meta field_data array to object
// Meta sends fields like: [{name: 'full_name', values: ['John']}, ...]
// =============================================================
function parseLeadFields(fieldData) {
  const fields = {};

  for (const item of fieldData) {
    if (!item.name || !item.values) continue;
    const value = Array.isArray(item.values) ? item.values[0] : item.values;

    // Normalize common field names
    const normalizedName = item.name.toLowerCase().replace(/[^a-z_]/g, "");

    // Common field mappings
    const fieldMap = {
      full_name: "name",
      fullname: "name",
      first_name: "name",
      firstname: "name",
      phone_number: "phone",
      phonenumber: "phone",
      mobile: "phone",
      mobilenumber: "phone",
      email_address: "email",
      emailaddress: "email",
      university_interest: "university",
      universityinterest: "university",
      course_interest: "course",
      courseinterest: "course",
    };

    const mappedKey = fieldMap[normalizedName] || normalizedName;
    fields[mappedKey] = value;
  }

  return fields;
}
