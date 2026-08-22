import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    // Mobile number - optional
    mobile: { type: String, default: "", trim: true },

    // Profile photo URL/path - optional
    profilePhoto: { type: String, default: "" },

    role: {
      type: String,
      enum: [
        "admin",
        "manager",
        "asst_manager",
        "team_lead",
        "counsellor",
        "publisher",
        "employee",
      ],
      default: "employee",
    },

    // Multi-select departments (Universities)
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Setting",
      },
    ],

    isActive: { type: Boolean, default: true },

    // Password reset fields (NEW)
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Pre-save hook - password hash karega
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method - password match karne ke liye
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);