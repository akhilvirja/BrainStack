import mongoose from "mongoose";

// Strictly allow only the four V1 approved source types
export const sourceTypes = ["youtube", "web", "twitter", "google_docs"] as const;
export type SourceType = (typeof sourceTypes)[number];

export const processingStatuses = ["pending", "processing", "completed", "failed"] as const;
export type ProcessingStatus = (typeof processingStatuses)[number];

export interface ISourceMetadata {
  // YouTube metadata
  videoId?: string;
  duration?: number | undefined;
  channelTitle?: string;
  thumbnailUrl?: string | undefined;
  transcript?: Array<{ text: string; start: number; duration: number }>;
  hasTranscript?: boolean;

  // Web article metadata
  siteName?: string;
  author?: string;
  publishedTime?: string;
  excerpt?: string;
  wordCount?: number;
  favicon?: string;
  leadImageUrl?: string | undefined;

  // Twitter metadata
  tweetId?: string;
  authorName?: string;
  authorHandle?: string;
  profileImageUrl?: string | undefined;
  photos?: string[] | undefined;
  likes?: number;
  retweets?: number;
  replies?: number;
  createdAt?: string;

  // Google Docs metadata
  docId?: string;
  publishedVersion?: string;

  [key: string]: any;
}

const contentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // V1 source type: strictly youtube, web, twitter, or google_docs
    sourceType: {
      type: String,
      enum: sourceTypes,
      required: true,
      default: "web",
      index: true,
    },
    // Raw user input URL
    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
    // Normalized canonical URL for deduplication
    canonicalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    extractedText: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: processingStatuses,
      default: "completed",
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    // Backward-compatible alias fields for legacy queries
    link: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "web",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate sources per user when canonicalUrl is present
contentSchema.index(
  { userId: 1, canonicalUrl: 1 },
  {
    unique: true,
    partialFilterExpression: { canonicalUrl: { $type: "string", $gt: "" } },
  }
);

// Optimization indexes for dashboard queries
contentSchema.index({ userId: 1, createdAt: -1 });
contentSchema.index({ userId: 1, sourceType: 1, createdAt: -1 });

export const Content = mongoose.model("Content", contentSchema);