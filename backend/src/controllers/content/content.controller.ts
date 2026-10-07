import type { Response } from "express";
import { Content } from "../../models/content.model.js";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";

export const createContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { link, type, title, description, tags } = req.body;
        const userId = req.user._id;

        const content = await Content.create({
            link,
            type,
            title,
            description,
            tags,
            userId
        });

        res.status(201).json({ message: "Content created successfully", content });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

export const getContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const contents = await Content.find({ userId }).populate("tags");
        res.status(200).json({ contents });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

export const deleteContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const content = await Content.findOneAndDelete({ _id: id, userId });
        if (!content) {
            res.status(404).json({ message: "Content not found or unauthorized" });
            return;
        }

        res.status(200).json({ message: "Content deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};
