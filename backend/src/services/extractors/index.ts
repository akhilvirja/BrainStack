import type { SourceType } from "../../models/content.model.js";
import { extractWebArticle } from "./webExtractor.js";
import { extractYouTubeVideo } from "./youtubeExtractor.js";
import { extractTwitterPost } from "./twitterExtractor.js";
import { extractGoogleDoc } from "./googleDocsExtractor.js";
import type { ExtractionResult } from "./types.js";

export * from "./types.js";
export * from "./webExtractor.js";
export * from "./youtubeExtractor.js";
export * from "./twitterExtractor.js";
export * from "./googleDocsExtractor.js";

// Auto-detect source type from destination URL
export const detectSourceTypeFromUrl = (url: string): SourceType => {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("twitter.com") || host.includes("x.com")) return "twitter";
    if (host.includes("docs.google.com")) return "google_docs";
    return "web";
  } catch {
    return "web";
  }
};

export const extractSource = async (
  rawUrl: string,
  preferredType?: SourceType
): Promise<ExtractionResult> => {
  const url = (rawUrl || "").trim();
  if (!url) {
    throw new Error("URL is required for source extraction.");
  }

  // Determine source type from preferred type or URL destination
  const targetType: SourceType = preferredType || detectSourceTypeFromUrl(url);

  switch (targetType) {
    case "youtube":
      return await extractYouTubeVideo(url);
    case "twitter":
      return await extractTwitterPost(url);
    case "google_docs":
      return await extractGoogleDoc(url);
    case "web":
    default:
      return await extractWebArticle(url);
  }
};
