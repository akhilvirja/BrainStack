import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/response.js";
import { askSecondBrain, vectorizeContent } from "../../services/ai/rag.service.js";
import { Content } from "../../models/content.model.js";
import { Chunk } from "../../models/chunk.model.js";

/**
 * Handles RAG Q&A query from the frontend.
 */
export const askAI = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { question } = req.body;

    if (!question || typeof question !== "string" || question.trim().length < 2) {
      return sendErrorResponse(res, 400, null, "Question must be at least 2 characters long.");
    }

    const result = await askSecondBrain(userId, question.trim());
    return sendSuccessResponse(res, 200, result, "Answer generated successfully");
  } catch (error: any) {
    console.error("Error in askAI controller:", error);
    return sendErrorResponse(res, 500, null, error?.message || "Failed to generate answer");
  }
};

/**
 * Re-indexes / vectorizes all user sources in the library.
 */
export const syncLibrary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const contents = await Content.find({ userId, status: "completed" });

    let totalChunks = 0;
    for (const c of contents) {
      const chunksCount = await vectorizeContent(c._id.toString(), userId);
      totalChunks += chunksCount;
    }

    const chunkCount = await Chunk.countDocuments({ userId });

    return sendSuccessResponse(
      res,
      200,
      { sourcesIndexed: contents.length, totalChunks: chunkCount },
      "Library vectorized and synchronized successfully"
    );
  } catch (error: any) {
    console.error("Error in syncLibrary controller:", error);
    return sendErrorResponse(res, 500, null, error?.message || "Failed to synchronize library vectors");
  }
};
