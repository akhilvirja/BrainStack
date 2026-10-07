import { Router } from "express";
import { toggleShare, getSharedBrain } from "../../../controllers/share/share.controller.js";
import { protect } from "../../../middlewares/auth.middleware.js";

const router = Router();

router.post("/share", protect, toggleShare);
router.get("/brain/:shareLink", getSharedBrain);

export default router;
