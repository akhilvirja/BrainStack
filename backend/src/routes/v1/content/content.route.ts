import { Router } from "express";
import { createContent, getContent, deleteContent } from "../../../controllers/content/content.controller.js";
import { protect } from "../../../middlewares/auth.middleware.js";

const router = Router();

router
    .route("/")
    .post(protect, createContent)
    .get(protect, getContent);

router
    .route("/:id")
    .delete(protect, deleteContent);

export default router;
