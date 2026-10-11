import type { Response } from "express";
import { Content } from "../../models/content.model.js";
import { Tag } from "../../models/tags.model.js"; // Import Tag model so populate doesn't crash
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/response.js";

export const createContent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { link, type, title, description, tags } = req.body;
        const userId = req.user._id;

        let tagIds: any[] = [];
        if (Array.isArray(tags) && tags.length > 0) {
            const resolvedTags = await Promise.all(
                tags.map(async (t: any) => {
                    if (typeof t === "string") {
                        const cleanTitle = t.replace(/^#/, "").trim().toLowerCase();
                        if (!cleanTitle) return null;
                        let tagDoc = await Tag.findOne({ 
                            title: cleanTitle,
                            $or: [{ userId }, { userId: { $exists: false } }]
                        });
                        if (!tagDoc) {
                            tagDoc = await Tag.create({ title: cleanTitle, userId });
                        }
                        return tagDoc._id;
                    } else if (t?._id) {
                        return t._id;
                    }
                    return t;
                })
            );
            tagIds = resolvedTags.filter(Boolean);
        }

        const content = await Content.create({
            link: link || "",
            type: type || "note",
            title,
            description: description || "",
            tags: tagIds,
            userId
        });

        const populatedContent = await Content.findById(content._id).populate("tags");

        return sendSuccessResponse(res, 201, populatedContent, "Content created successfully");
    } catch (error: any) {
        console.error("Error creating content:", error);
        return sendErrorResponse(res, 500, null, error.message || "Server Error");
    }
};

export const getContent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const contents = await Content.find({ userId }).populate("tags");
        
        return sendSuccessResponse(res, 200, { contents }, "Content fetched successfully");
    } catch (error: any) {
        console.error("Error fetching content:", error);
        return sendErrorResponse(res, 500, null, error.message || "Server Error");
    }
};

export const deleteContent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const content = await Content.findOneAndDelete({ _id: id, userId });
        if (!content) {
            return sendErrorResponse(res, 404, null, "Content not found or unauthorized");
        }

        return sendSuccessResponse(res, 200, null, "Content deleted successfully");
    } catch (error: any) {
        console.error("Error deleting content:", error);
        return sendErrorResponse(res, 500, null, error.message || "Server Error");
    }
};
