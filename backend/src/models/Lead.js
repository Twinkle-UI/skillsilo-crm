import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    // Contact details
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    // Inquiry info
    inquiredFor: { type: String, default: "" }, // University name
    program: { type: String, default: "" },
    category: { type: String, default: "" },

    // Stage info
    stage: { type: String, default: "New Leads" },
    stageNote: { type: String, default: "" }, // Reason

    // Source info
    source: { type: String, default: "" },
    sourceNote: { type: String, default: "" }, // Sub-source

    // Location info
    country: { type: String, default: "India" },
    state: { type: String, default: "" },
    location: { type: String, default: "" }, // City

    // Extra
    assignedTo: { type: String, default: "" }, // User name (display)
    callCount: { type: Number, default: 0 },
    remark: { type: String, default: "" },
    isOwn: { type: Boolean, default: false },

    // ===== Meta Ads Tracking (NEW) =====
    metaAdId: { type: String, default: null, index: true }, // Facebook ad ID
    metaFormId: { type: String, default: null }, // Lead form ID
    metaCampaignId: { type: String, default: null }, // Campaign ID
    metaLeadgenId: { type: String, default: null, sparse: true, index: true },
    metaPageId: { type: String, default: null }, // Facebook Page ID
    metaRawData: { type: mongoose.Schema.Types.Mixed, default: null }, // Full raw payload (for debugging)
  },
  { timestamps: true },
);

leadSchema.index({ name: "text", email: "text", contact: "text" });
leadSchema.index({ stage: 1 });
leadSchema.index({ createdAt: -1 });

export default mongoose.model("Lead", leadSchema);
