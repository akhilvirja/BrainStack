import { Router } from "express";
import { getTags, createTag, deleteTag } from "../../../controllers/tag/tag.controller.js";
import { protect } from "../../../middlewares/auth.middleware.js";

const router = Router();

router
    .route("/")
    .get(protect, getTags)
    .post(protect, createTag);

router
    .route("/:id")
    .delete(protect, deleteTag);

export default router;
