import { Router } from "express";
import {
  createContent,
  getContent,
  getContentById,
  updateContent,
  deleteContent,
  retryExtraction,
} from "../../../controllers/content/content.controller.js";
import { protect } from "../../../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(protect, createContent)
  .get(protect, getContent);

router
  .route("/:id")
  .get(protect, getContentById)
  .patch(protect, updateContent)
  .delete(protect, deleteContent);

router
  .route("/:id/retry")
  .post(protect, retryExtraction);

export default router;
