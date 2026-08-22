import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";

// JWT token generate karne ka helper
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // 7 din baad expire
  });
};

// =============================================================
// POST /api/auth/login
// =============================================================
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Employee ID and password required",
      });
    }

    // Username can be email OR employeeId
    const user = await User.findOne({
      $or: [{ email: username.toLowerCase() }, { employeeId: username }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is disabled",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          employeeId: user.employeeId,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================
// GET /api/auth/me - current user info
// =============================================================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================
// PUT /api/auth/change-password (logged-in user)
// =============================================================
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old and new password required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from old password",
      });
    }

    // User fetch karo with password
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Old password verify
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // New password set (pre-save hook automatically hash karega)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================
// POST /api/auth/forgot-password - generate reset token
// =============================================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Security: Don't reveal if email exists
    if (!user) {
      return res.json({
        success: true,
        message: "If the email exists, a reset link has been sent",
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetExpiry;
    await user.save();

    // For now: Print reset link in console (no email service)
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    console.log("\n========================================");
    console.log("🔐 PASSWORD RESET REQUEST");
    console.log("========================================");
    console.log("Email:", user.email);
    console.log("Name:", user.name);
    console.log("Reset Link:", resetLink);
    console.log("Expires in: 15 minutes");
    console.log("========================================\n");

    res.json({
      success: true,
      message:
        "Reset link generated. Check backend console (in production: email will be sent)",
      // In development: include link in response for easy testing
      ...(process.env.NODE_ENV !== "production" && { resetLink }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================
// POST /api/auth/reset-password - reset using token
// =============================================================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Find user with matching token and not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Set new password (pre-save hook will auto-hash)
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};