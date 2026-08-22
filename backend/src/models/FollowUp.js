import mongoose from 'mongoose';

// Follow-Up schema
const followUpSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead' // Reference to Lead document
    },
    name: { type: String, required: true, uppercase: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true },
    inquiredFor: { type: String, required: true },
    program: { type: String, default: 'Regular Program' },
    stage: { type: String, default: 'Follow-Ups' },
    stageNote: { type: String, default: '' },
    source: { type: String, default: 'Unknown' },
    sourceNote: { type: String, default: '' }, // e.g. "Department of Engineering"
    location: { type: String, default: 'India' },
    locationSub: { type: String, default: '' }, // e.g. "Haryana"
    assignedTo: { type: String, default: '' },
    dueAt: {
      type: Date,
      required: [true, 'Follow-up due date is required'],
      index: true // index for fast time-based queries
    },
    status: {
      type: String,
      enum: ['planned', 'completed', 'missed'],
      default: 'planned'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for filter queries
followUpSchema.index({ status: 1, dueAt: 1 });

export default mongoose.model('FollowUp', followUpSchema);
