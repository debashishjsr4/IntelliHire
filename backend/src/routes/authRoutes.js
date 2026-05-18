import { Router } from "express";
import { changePassword, getSession, login } from "../controllers/authController.js";

const router = Router();

router.get("/session", getSession);
router.patch("/password", changePassword);
router.post("/login", login);

export default router;
