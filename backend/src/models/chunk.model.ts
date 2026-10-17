import mongoose from "mongoose";

export interface IChunk {
  _id: mongoose.Types.ObjectId;
  contentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sourceType: "youtube" | "web" | "twitter" | "google_docs";
  chunkIndex: number;
  text: string;
  embedding: number[];
  metadata: {
    title: string;
    sourceUrl: string;
    startTime?: number;
    channelTitle?: string;
    author?: string;
    siteName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const chunkSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sourceType: {
      type: String,
      enum: ["youtube", "web", "twitter", "google_docs"],
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    metadata: {
      title: { type: String, default: "" },
      sourceUrl: { type: String, default: "" },
      startTime: { type: Number },
      channelTitle: { type: String },
      author: { type: String },
      siteName: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Tenancy compound indexes for query efficiency
chunkSchema.index({ userId: 1, contentId: 1 });
chunkSchema.index({ userId: 1, sourceType: 1 });

export const Chunk = mongoose.model<IChunk>("Chunk", chunkSchema);
