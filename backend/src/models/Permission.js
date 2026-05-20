import mongoose from 'mongoose';

// Har role ke liye ek document hota hai
// permissions field: { "Page Name": { view, create, update, delete, upload, download } }
const permissionSchema = new mongoose.Schema(
  {
    // Role identifier (admin, manager, asst_manager, team_lead, counsellor)
    role: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'admin',
        'manager',
        'asst_manager',
        'team_lead',
        'counsellor',
        'publisher',
        'employee'
      ]
    },

    // Flexible object - har page ke liye actions
    // Mongoose Mixed type kyunki structure dynamic hai
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model('Permission', permissionSchema);