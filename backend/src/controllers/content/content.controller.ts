import type { Response } from "express";
import mongoose from "mongoose";
import { Content, sourceTypes, type SourceType, type ProcessingStatus } from "../../models/content.model.js";
import { Tag } from "../../models/tags.model.js";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/response.js";
import { extractSource, detectSourceTypeFromUrl } from "../../services/extractors/index.js";
import { Chunk } from "../../models/chunk.model.js";
import { vectorizeContent } from "../../services/ai/rag.service.js";

// Helper to normalize canonical URL
const normalizeUrl = (rawUrl: string): string => {
  if (!rawUrl) return "";
  try {
    const url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    // Strip common tracking parameters
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "s"].forEach((param) => {
      url.searchParams.delete(param);
    });
    return url.toString().replace(/\/$/, "");
  } catch {
    return rawUrl.trim();
  }
};

// Normalize input type to one of the 4 strict V1 source types
const resolveSourceType = (type?: string, url?: string): SourceType => {
  const normalized = (type || "").toLowerCase().trim();
  if (sourceTypes.includes(normalized as SourceType)) {
    return normalized as SourceType;
  }
  // Support migration aliases
  if (normalized === "video") return "youtube";
  if (normalized === "tweet") return "twitter";
  if (normalized === "document") return "google_docs";
  if (normalized === "article" || normalized === "link" || normalized === "bookmark") return "web";

  // If not explicitly provided, detect from URL
  if (url) {
    return detectSourceTypeFromUrl(url);
  }

  return "web";
};

/**
 * Asynchronously extracts content and generates vector embeddings in the background
 * so users never have to wait on a blocking modal spinner.
 */
const processContentInBackground = async (
  contentId: string,
  userId: string,
  url: string,
  sourceType: SourceType
) => {
  try {
    const result = await extractSource(url, sourceType);
    const content = await Content.findById(contentId);
    if (!content) return;

    if (
      !content.title ||
      content.title.startsWith("Source:") ||
      content.title === "YouTube Video" ||
      content.title === "X / Twitter Post" ||
      content.title === "Published Google Doc" ||
      content.title.startsWith("Web Source:")
    ) {
      content.title = result.title || content.title;
    }

    if (!content.description) {
      content.description = result.description || "";
    }

    content.extractedText = result.text || "";
    content.metadata = { ...(content.metadata || {}), ...result.metadata };
    content.status = "completed";
    content.errorMessage = null;
    await content.save();

    // Trigger AI vectorization
    vectorizeContent(contentId, userId).catch((err) => {
      console.warn(`Background vectorization for ${contentId} failed:`, err?.message);
    });
  } catch (err: any) {
    console.warn(`Background extraction failed for content ${contentId}:`, err?.message);
    await Content.findByIdAndUpdate(contentId, {
      status: "failed",
      errorMessage: err?.message || "Failed to extract content from source.",
    });
  }
};

export const createContent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { link, sourceUrl, type, sourceType, title, description, tags, metadata, extractedText } = req.body;
    const userId = req.user._id;

    const effectiveUrl = (sourceUrl || link || "").trim();
    if (!effectiveUrl) {
      return sendErrorResponse(res, 400, null, "Source URL is required");
    }

    const canonical = normalizeUrl(effectiveUrl);

    // Duplicate submission guard per user
    if (canonical) {
      const existing = await Content.findOne({ userId, canonicalUrl: canonical }).populate("tags");
      if (existing) {
        return sendErrorResponse(
          res,
          409,
          existing,
          "You have already saved this source to your stack."
        );
      }
    }

    // Resolve tag IDs
    let tagIds: any[] = [];
    if (Array.isArray(tags) && tags.length > 0) {
      const resolvedTags = await Promise.all(
        tags.map(async (t: any) => {
          if (typeof t === "string") {
            const cleanTitle = t.replace(/^#/, "").trim().toLowerCase();
            if (!cleanTitle) return null;
            let tagDoc = await Tag.findOne({
              title: cleanTitle,
              $or: [{ userId }, { userId: { $exists: false } }],
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

    // Resolve to one of the 4 strict source types
    const resolvedSourceType = resolveSourceType(sourceType || type, effectiveUrl);

    // Initial placeholder title while processing in background
    let initialTitle = (title || "").trim();
    if (!initialTitle) {
      if (resolvedSourceType === "youtube") initialTitle = "YouTube Video";
      else if (resolvedSourceType === "twitter") initialTitle = "X / Twitter Post";
      else if (resolvedSourceType === "google_docs") initialTitle = "Published Google Doc";
      else initialTitle = `Web Source: ${effectiveUrl.slice(0, 50)}`;
    }

    const content = await Content.create({
      userId,
      sourceType: resolvedSourceType,
      sourceUrl: effectiveUrl,
      canonicalUrl: canonical,
      title: initialTitle,
      description: (description || "").trim(),
      extractedText: (extractedText || "").trim(),
      metadata: metadata || {},
      status: "processing",
      errorMessage: null,
      tags: tagIds,
      link: effectiveUrl,
      type: resolvedSourceType,
    });

    const populatedContent = await Content.findById(content._id).populate("tags");

    // Launch background worker without keeping client waiting
    processContentInBackground(content._id.toString(), userId.toString(), effectiveUrl, resolvedSourceType).catch((err) => {
      console.warn("Background processContent job failed:", err?.message);
    });

    return sendSuccessResponse(
      res,
      201,
      populatedContent,
      "Source added to workspace. Extraction and AI indexing in progress..."
    );
  } catch (error: any) {
    console.error("Error creating content:", error);
    if (error.code === 11000) {
      return sendErrorResponse(res, 409, null, "You have already saved this source to your stack.");
    }
    return sendErrorResponse(res, 500, null, error.message || "Server Error");
  }
};

export const getContent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { sourceType, type, q, tag } = req.query;

    const filter: Record<string, any> = { userId };

    // Filter strictly by source type
    const queryType = (sourceType || type) as string | undefined;
    if (queryType) {
      const resolved = resolveSourceType(queryType);
      filter.sourceType = resolved;
    }

    // Filter by tag if requested
    if (tag && typeof tag === "string") {
      const tagDoc = await Tag.findOne({ title: tag.toLowerCase().replace(/^#/, "") });
      if (tagDoc) {
        filter.tags = tagDoc._id;
      }
    }

    // Search query on title, description, and extractedText
    if (q && typeof q === "string" && q.trim()) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: "i" } },
        { description: { $regex: q.trim(), $options: "i" } },
        { extractedText: { $regex: q.trim(), $options: "i" } },
      ];
    }

    const contents = await Content.find(filter).populate("tags").sort({ createdAt: -1 });

    return sendSuccessResponse(res, 200, { contents }, "Sources fetched successfully");
  } catch (error: any) {
    console.error("Error fetching content:", error);
    return sendErrorResponse(res, 500, null, error.message || "Server Error");
  }
};

export const getContentById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const content = await Content.findOne({ _id: id, userId }).populate("tags");
    if (!content) {
      return sendErrorResponse(res, 404, null, "Source not found or unauthorized");
    }

    return sendSuccessResponse(res, 200, content, "Source fetched successfully");
  } catch (error: any) {
    console.error("Error fetching content by ID:", error);
    return sendErrorResponse(res, 500, null, error.message || "Server Error");
  }
};

export const updateContent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { title, description, tags, sourceType } = req.body;

    const content = await Content.findOne({ _id: id, userId });
    if (!content) {
      return sendErrorResponse(res, 404, null, "Source not found or unauthorized");
    }

    if (typeof title === "string" && title.trim()) {
      content.title = title.trim();
    }
    if (typeof description === "string") {
      content.description = description;
    }
    if (sourceType && sourceTypes.includes(sourceType as SourceType)) {
      content.sourceType = sourceType as SourceType;
      content.type = sourceType;
    }

    if (Array.isArray(tags)) {
      const resolvedTags = await Promise.all(
        tags.map(async (t: any) => {
          if (typeof t === "string") {
            const cleanTitle = t.replace(/^#/, "").trim().toLowerCase();
            if (!cleanTitle) return null;
            let tagDoc = await Tag.findOne({
              title: cleanTitle,
              $or: [{ userId }, { userId: { $exists: false } }],
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
      content.tags = resolvedTags.filter(Boolean);
    }

    await content.save();
    const updated = await Content.findById(content._id).populate("tags");

    return sendSuccessResponse(res, 200, updated, "Source updated successfully");
  } catch (error: any) {
    console.error("Error updating content:", error);
    return sendErrorResponse(res, 500, null, error.message || "Server Error");
  }
};

export const deleteContent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const content = await Content.findOneAndDelete({ _id: id, userId });
    if (!content) {
      return sendErrorResponse(res, 404, null, "Source not found or unauthorized");
    }

    // Cascade delete associated chunks
    await Chunk.deleteMany({
      contentId: new mongoose.Types.ObjectId(String(id)),
      userId: new mongoose.Types.ObjectId(String(userId)),
    });

    return sendSuccessResponse(res, 200, null, "Source deleted successfully");
  } catch (error: any) {
    console.error("Error deleting content:", error);
    return sendErrorResponse(res, 500, null, error.message || "Server Error");
  }
};

export const retryExtraction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const content = await Content.findOne({ _id: id, userId });
    if (!content) {
      return sendErrorResponse(res, 404, null, "Source not found or unauthorized");
    }

    content.status = "processing";
    content.errorMessage = null;
    await content.save();

    // Run in background without blocking HTTP response
    processContentInBackground(content._id.toString(), userId.toString(), content.sourceUrl, content.sourceType).catch((err) => {
      console.warn("Retry background job error:", err?.message);
    });

    const updated = await Content.findById(content._id).populate("tags");
    return sendSuccessResponse(res, 200, updated, "Extraction retry started in background.");
  } catch (error: any) {
    console.error("Error retrying extraction:", error);
    return sendErrorResponse(res, 500, null, error.message || "Server Error");
  }
};
