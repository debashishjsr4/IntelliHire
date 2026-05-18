import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createPasswordHash } from "../utils/password.js";

const ADMIN_USER_ID = "SmartAdmin";

const getRequester = async (req) => {
  const requesterId = req.header("x-user-id");

  if (requesterId === ADMIN_USER_ID) {
    return {
      isAdmin: true,
      isSuperAdmin: true,
      userId: ADMIN_USER_ID
    };
  }

  if (!requesterId) {
    return {
      isAdmin: false,
      isSuperAdmin: false,
      userId: ""
    };
  }

  const requester = await User.findOne({ userId: requesterId }).lean();

  return {
    isAdmin: requester?.role === "admin" && !requester?.isLocked,
    isSuperAdmin: false,
    userId: requester?.userId || requesterId
  };
};

const requireAdmin = async (req, res) => {
  const requester = await getRequester(req);

  if (!requester.isAdmin) {
    res.status(403).json({ message: "Only admins can manage users." });
    return null;
  }

  return requester;
};

const serializeUser = (user) => ({
  _id: user._id,
  userId: user.userId,
  role: user.role,
  isLocked: Boolean(user.isLocked),
  createdBy: user.createdBy,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const getUsers = asyncHandler(async (req, res) => {
  const requester = await requireAdmin(req, res);

  if (!requester) {
    return;
  }

  const users = await User.find({}).sort({ createdAt: -1 }).lean();

  res.status(200).json({
    users: users
      .filter((user) => user.userId !== ADMIN_USER_ID)
      .map(serializeUser)
  });
});

export const createUser = asyncHandler(async (req, res) => {
  const requester = await requireAdmin(req, res);

  if (!requester) {
    return;
  }

  const { password, role = "recruiter", userId } = req.body || {};
  const normalizedUserId = typeof userId === "string" ? userId.trim() : "";

  if (!normalizedUserId || typeof password !== "string" || password.length < 4) {
    return res.status(400).json({
      message: "User ID and a password of at least 4 characters are required."
    });
  }

  if (normalizedUserId === ADMIN_USER_ID) {
    return res.status(409).json({ message: "SmartAdmin is protected and already exists." });
  }

  if (!["admin", "recruiter"].includes(role)) {
    return res.status(400).json({ message: "Role must be admin or recruiter." });
  }

  const existingUser = await User.findOne({ userId: normalizedUserId }).lean();

  if (existingUser) {
    return res.status(409).json({ message: "A user with this ID already exists." });
  }

  const { passwordHash, salt } = createPasswordHash(password);
  const user = await User.create({
    userId: normalizedUserId,
    passwordHash,
    salt,
    role,
    createdBy: requester.userId
  });

  res.status(201).json({ user: serializeUser(user) });
});

export const updateUser = asyncHandler(async (req, res) => {
  const requester = await requireAdmin(req, res);

  if (!requester) {
    return;
  }

  const { userId: targetUserId } = req.params;

  if (targetUserId === ADMIN_USER_ID) {
    return res.status(403).json({ message: "SmartAdmin is protected and cannot be modified." });
  }

  const user = await User.findOne({ userId: targetUserId });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const { isLocked, newUserId, password, role } = req.body || {};

  if (typeof newUserId === "string" && newUserId.trim() && newUserId.trim() !== user.userId) {
    const normalizedNewUserId = newUserId.trim();

    if (normalizedNewUserId === ADMIN_USER_ID) {
      return res.status(409).json({ message: "SmartAdmin is protected and already exists." });
    }

    const existingUser = await User.findOne({ userId: normalizedNewUserId }).lean();

    if (existingUser) {
      return res.status(409).json({ message: "A user with this ID already exists." });
    }

    user.userId = normalizedNewUserId;
  }

  if (typeof role === "string") {
    if (!["admin", "recruiter"].includes(role)) {
      return res.status(400).json({ message: "Role must be admin or recruiter." });
    }

    user.role = role;
  }

  if (typeof isLocked === "boolean") {
    user.isLocked = isLocked;
  }

  if (typeof password === "string" && password.length) {
    if (password.length < 4) {
      return res.status(400).json({ message: "Password must be at least 4 characters." });
    }

    const { passwordHash, salt } = createPasswordHash(password);
    user.passwordHash = passwordHash;
    user.salt = salt;
  }

  await user.save();

  res.status(200).json({ user: serializeUser(user) });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const requester = await requireAdmin(req, res);

  if (!requester) {
    return;
  }

  const { userId } = req.params;

  if (userId === ADMIN_USER_ID) {
    return res.status(403).json({ message: "SmartAdmin is protected and cannot be deleted." });
  }

  const user = await User.findOneAndDelete({ userId }).lean();

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  res.status(200).json({
    message: "User deleted successfully.",
    userId
  });
});
