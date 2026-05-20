import mongoose from 'mongoose';

// Call Log schema - har call ka record
const callLogSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    type: {
      type: String,
      enum: ['outgoing', 'missed', 'incoming', 'rejected'],
      required: true
    },
    duration: { type: Number, default: 0 }, // seconds
    notes: { type: String, default: '' },
    callDate: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: true
  }
);

callLogSchema.index({ type: 1, callDate: -1 });

export default mongoose.model('CallLog', callLogSchema);
