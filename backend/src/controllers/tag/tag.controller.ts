import type { Response } from "express";
import { Tag } from "../../models/tags.model.js";
import { Content } from "../../models/content.model.js";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/response.js";

export const getTags = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user._id;

        // Get all user's content to find tags in use
        const userContents = await Content.find({ userId }).select("tags");
        const contentTagIds = userContents.flatMap((c) => c.tags || []);

        // Find tags created by user or attached to user's contents
        const tags = await Tag.find({
            $or: [
                { userId },
                { _id: { $in: contentTagIds } }
            ]
        }).sort({ createdAt: -1 });

        // Calculate usage count for each tag
        const tagsWithCount = tags.map((t) => {
            const count = userContents.filter((c) => 
                (c.tags || []).some((tagId: any) => tagId.toString() === t._id.toString())
            ).length;
            return {
                _id: t._id,
                title: t.title,
                count,
                createdAt: t.createdAt,
            };
        });

        return sendSuccessResponse(res, 200, { tags: tagsWithCount }, "Tags fetched successfully");
    } catch (error: any) {
        console.error("Error fetching tags:", error);
        return sendErrorResponse(res, 500, null, error.message || "Server Error");
    }
};

export const createTag = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { title } = req.body;
        if (!title || typeof title !== "string" || !title.trim()) {
            return sendErrorResponse(res, 400, null, "Tag title is required");
        }

        const cleanTitle = title.replace(/^#/, "").trim().toLowerCase();
        const userId = req.user._id;

        let tag = await Tag.findOne({ title: cleanTitle, userId });
        if (!tag) {
            tag = await Tag.create({ title: cleanTitle, userId });
        }

        return sendSuccessResponse(res, 201, tag, "Tag created successfully");
    } catch (error: any) {
        console.error("Error creating tag:", error);
        return sendErrorResponse(res, 500, null, error.message || "Server Error");
    }
};

export const deleteTag = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        await Tag.findOneAndDelete({ _id: id, userId });
        // Remove reference from user's content
        await Content.updateMany({ userId }, { $pull: { tags: id } });

        return sendSuccessResponse(res, 200, null, "Tag deleted successfully");
    } catch (error: any) {
        console.error("Error deleting tag:", error);
        return sendErrorResponse(res, 500, null, error.message || "Server Error");
    }
};
