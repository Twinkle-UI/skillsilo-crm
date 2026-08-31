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
    callDate: { type: Date, default: Date.now, index: true },
    // Callyzer ke call-log 'id' se aata hai - webhook retry pe duplicate
    // entry na bane isliye. Sirf Callyzer-synced calls me hoga, manual
    // entries me nahi (isliye sparse).
    externalId: { type: String, unique: true, sparse: true }
  },
  {
    timestamps: true
  }
);

callLogSchema.index({ type: 1, callDate: -1 });

export default mongoose.model('CallLog', callLogSchema);