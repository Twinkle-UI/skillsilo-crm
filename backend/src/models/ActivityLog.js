import mongoose from 'mongoose';

// Activity Log - Lead Details page ke "Journey" tab ke liye. Har baar jab
// lead create/update ho ya usme follow-up add ho, ek entry yahan bhi ban
// jati hai (leadController.js aur followUpController.js se).
const activityLogSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    type: {
      type: String,
      enum: ['created', 'updated', 'followup_added'],
      required: true
    },
    // 'updated' ke liye: [{ field, label, oldValue, newValue }]
    changes: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // Extra context (jaise follow-up ka remark/status, ya assignment)
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    // "Ankit (SKILLO30)" format - assignedTo jaisa hi
    performedBy: { type: String, default: '' }
  },
  { timestamps: true }
);

activityLogSchema.index({ leadId: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);