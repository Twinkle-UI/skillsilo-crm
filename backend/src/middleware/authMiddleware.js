import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect routes - JWT verify karke req.user set karega
export const protect = async (req, res, next) => {
  try {
    let token;

    // Token "Authorization: Bearer xyz" header se aata hai
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    // Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User ko req mein attach karo
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token invalid or expired",
    });
  }
};

// Sirf admin role allow karega - delete jaisi sensitive actions ke liye
// IMPORTANT: hamesha 'protect' ke baad use karo (req.user chahiye hota hai)
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no user",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can perform this action",
    });
  }

  next();
};