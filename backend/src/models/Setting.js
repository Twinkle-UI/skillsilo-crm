import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "university",
        "category",
        "course",
        "stage",
        "reason",
        "source",
        "subsource",
        "city",
        "state",
        "country",
        "email_template",
        "sms_template",
         'whatsapp_template',
      ],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    description: { type: String, default: "" },

    // Email template specific fields
    subject: { type: String, default: "" },
    body: { type: String, default: "" },

    // SMS template specific field - DLT/MSG91/Twilio template ID
    templateId: { type: String, default: "" },

    // Parent reference
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Setting",
      default: null,
    },

    // Stage-specific flags
    isInitial: { type: Boolean, default: false },
    isFinal: { type: Boolean, default: false },
    isReEnquired: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

settingSchema.index({ type: 1, name: 1 });
settingSchema.index({ parentId: 1 });

export default mongoose.model("Setting", settingSchema);
