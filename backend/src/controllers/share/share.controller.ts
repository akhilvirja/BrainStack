import type { Request, Response } from "express";
import { linkModel } from "../../models/link.model.js";
import { Content } from "../../models/content.model.js";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import crypto from "crypto";

export const toggleShare = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { share } = req.body;
        const userId = req.user._id;

        if (share) {
            const existingLink = await linkModel.findOne({ userId });
            if (existingLink) {
                res.status(200).json({ hash: existingLink.hash });
                return;
            }

            const hash = crypto.randomBytes(10).toString("hex");
            await linkModel.create({
                hash,
                userId
            });

            res.status(200).json({ hash });
            return;
        } else {
            await linkModel.deleteOne({ userId });
            res.status(200).json({ message: "Link removed" });
            return;
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

export const getSharedBrain = async (req: Request, res: Response): Promise<void> => {
    try {
        const { shareLink } = req.params;

        if (typeof shareLink !== "string") {
            res.status(400).json({ message: "Invalid share link format" });
            return;
        }

        const link = await linkModel.findOne({ hash: shareLink }).populate("userId", "username");
        if (!link) {
            res.status(404).json({ message: "Invalid share link" });
            return;
        }

        const contents = await Content.find({ userId: link.userId }).populate("tags");
        
        res.status(200).json({ 
            username: (link.userId as any).username,
            contents 
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};
