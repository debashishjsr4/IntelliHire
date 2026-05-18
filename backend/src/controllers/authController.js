import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createPasswordHash, verifyPassword } from "../utils/password.js";

const ADMIN_USER_ID = "SmartAdmin";
const ADMIN_PASSWORD = "Nlite";

export const login = asyncHandler(async (req, res) => {
  const { password, userId } = req.body || {};
  const normalizedUserId = typeof userId === "string" ? userId.trim() : "";

  if (!normalizedUserId || typeof password !== "string") {
    return res.status(400).json({ message: "Login ID and password are required." });
  }

  if (normalizedUserId === ADMIN_USER_ID && password === ADMIN_PASSWORD) {
    return res.status(200).json({
      user: {
        userId: ADMIN_USER_ID,
        role: "admin"
      }
    });
  }

  const user = await User.findOne({ userId: normalizedUserId }).lean();

  if (user?.isLocked) {
    return res.status(403).json({ message: "This account is temporarily locked." });
  }

  if (
    !user ||
    !verifyPassword({
      password,
      passwordHash: user.passwordHash,
      salt: user.salt
    })
  ) {
    return res.status(401).json({ message: "Invalid login ID or password." });
  }

  res.status(200).json({
    user: {
      userId: user.userId,
      role: user.role,
      isLocked: Boolean(user.isLocked)
    }
  });
});

export const getSession = asyncHandler(async (req, res) => {
  const requesterId = req.header("x-user-id");
  const normalizedUserId = typeof requesterId === "string" ? requesterId.trim() : "";

  if (!normalizedUserId) {
    return res.status(401).json({ message: "No active user session." });
  }

  if (normalizedUserId === ADMIN_USER_ID) {
    return res.status(200).json({
      user: {
        userId: ADMIN_USER_ID,
        role: "admin"
      }
    });
  }

  const user = await User.findOne({ userId: normalizedUserId }).lean();

  if (!user) {
    return res.status(401).json({ message: "User account no longer exists." });
  }

  if (user.isLocked) {
    return res.status(403).json({ message: "This account is temporarily locked." });
  }

  return res.status(200).json({
    user: {
      userId: user.userId,
      role: user.role,
      isLocked: Boolean(user.isLocked)
    }
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const requesterId = req.header("x-user-id");
  const normalizedUserId = typeof requesterId === "string" ? requesterId.trim() : "";
  const { currentPassword, newPassword } = req.body || {};

  if (!normalizedUserId) {
    return res.status(401).json({ message: "No active user session." });
  }

  if (normalizedUserId === ADMIN_USER_ID) {
    return res.status(403).json({ message: "SmartAdmin password is managed in code." });
  }

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return res.status(400).json({ message: "Current password and new password are required." });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ message: "New password must be at least 4 characters." });
  }

  const user = await User.findOne({ userId: normalizedUserId });

  if (!user) {
    return res.status(401).json({ message: "User account no longer exists." });
  }

  if (user.isLocked) {
    return res.status(403).json({ message: "This account is temporarily locked." });
  }

  const isCurrentPasswordValid = verifyPassword({
    password: currentPassword,
    passwordHash: user.passwordHash,
    salt: user.salt
  });

  if (!isCurrentPasswordValid) {
    return res.status(401).json({ message: "Current password is incorrect." });
  }

  const { passwordHash, salt } = createPasswordHash(newPassword);
  user.passwordHash = passwordHash;
  user.salt = salt;
  await user.save();

  return res.status(200).json({ message: "Password updated successfully." });
});
