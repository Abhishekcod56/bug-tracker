
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();

function createToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const name =
      typeof req.body?.name === "string" ? req.body.name.trim() : "";

    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password = req.body?.password;

    if (!name || !email || typeof password !== "string") {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (name.length > 80 || email.length > 254) {
      return res.status(400).json({
        message: "Name or email is too long"
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message: "Password is too long"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const token = createToken(user._id);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed. Please try again."
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password = req.body?.password;

    if (!email || typeof password !== "string") {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = createToken(user._id);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed. Please try again."
    });
  }
});

// CURRENT USER
router.get("/me", auth, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

// UPDATE PROFILE
router.patch("/profile", auth, async (req, res) => {
  try {
    const { name, currentPassword, newPassword, ...otherFields } =
      req.body || {};

    // Do not allow unexpected fields such as email or role
    if (Object.keys(otherFields).length > 0) {
      return res.status(400).json({
        message: "Invalid profile fields"
      });
    }

    const changingName = name !== undefined;
    const changingPassword =
      currentPassword !== undefined || newPassword !== undefined;

    if (!changingName && !changingPassword) {
      return res.status(400).json({
        message: "No profile changes provided"
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Update name
    if (changingName) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Please enter a valid name"
        });
      }

      if (name.trim().length > 80) {
        return res.status(400).json({
          message: "Name cannot exceed 80 characters"
        });
      }

      user.name = name.trim();
    }

    // Update password
    if (changingPassword) {
      if (
        typeof currentPassword !== "string" ||
        typeof newPassword !== "string"
      ) {
        return res.status(400).json({
          message: "Current password and new password are required"
        });
      }

      if (!(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(401).json({
          message: "Current password is incorrect"
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          message: "New password must contain at least 8 characters"
        });
      }

      if (Buffer.byteLength(newPassword, "utf8") > 72) {
        return res.status(400).json({
          message: "New password is too long"
        });
      }

      user.password = await bcrypt.hash(newPassword, 12);
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      message: "Profile update failed. Please try again."
    });
  }
});

export default router;
