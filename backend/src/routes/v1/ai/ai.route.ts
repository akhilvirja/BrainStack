import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import { askAI, syncLibrary } from "../../../controllers/ai/ai.controller.js";

const router = Router();

router.use(protect);

router.post("/ask", askAI);
router.post("/sync", syncLibrary);

export default router;
