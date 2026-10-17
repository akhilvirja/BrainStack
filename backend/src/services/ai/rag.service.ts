import mongoose from "mongoose";
import { Chunk, type IChunk } from "../../models/chunk.model.js";
import { Content } from "../../models/content.model.js";
import { createChunksFromContent } from "./chunker.js";
import { generateEmbedding, generateGroundedAnswer } from "./gemini.service.js";

/**
 * Calculates cosine similarity between two equal-length vectors.
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);

  for (let i = 0; i < len; i++) {
    const a = vecA[i] ?? 0;
    const b = vecB[i] ?? 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Vectorizes a source and stores its chunks in MongoDB.
 */
export const vectorizeContent = async (contentId: string, userId: string): Promise<number> => {
  const content = await Content.findOne({ _id: contentId, userId });
  if (!content) return 0;

  // Remove existing chunks for this source if re-vectorizing
  await Chunk.deleteMany({ contentId: content._id, userId });

  // Generate semantic chunks
  const rawChunks = createChunksFromContent({
    title: content.title,
    sourceUrl: content.sourceUrl || content.link,
    sourceType: content.sourceType || content.type || "web",
    extractedText: content.extractedText,
    description: content.description,
    metadata: content.metadata,
  });

  if (rawChunks.length === 0) return 0;

  // Generate embeddings for each chunk
  const chunkDocs = [];
  for (const rc of rawChunks) {
    try {
      const embedding = await generateEmbedding(rc.text);
      chunkDocs.push({
        contentId: content._id,
        userId: new mongoose.Types.ObjectId(userId),
        sourceType: content.sourceType || content.type || "web",
        chunkIndex: rc.chunkIndex,
        text: rc.text,
        embedding,
        metadata: rc.metadata,
      });
    } catch (err: any) {
      console.warn(`Vectorizing chunk ${rc.chunkIndex} for content ${contentId} failed:`, err?.message);
    }
  }

  if (chunkDocs.length > 0) {
    await Chunk.insertMany(chunkDocs);
  }

  return chunkDocs.length;
};

export interface RetrievedChunk {
  text: string;
  sourceType: string;
  metadata: {
    title: string;
    sourceUrl: string;
    startTime?: number;
    channelTitle?: string;
    author?: string;
    siteName?: string;
  };
  score?: number;
}

/**
 * Semantic retrieval: Searches user chunks using Atlas Vector Search with Cosine fallback.
 */
export const searchRelevantChunks = async (
  userId: string,
  query: string,
  limit: number = 5
): Promise<RetrievedChunk[]> => {
  const queryEmbedding = await generateEmbedding(query);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Attempt Atlas Vector Search
  try {
    const vectorResults = await Chunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit,
          filter: { userId: userObjectId },
        },
      },
      {
        $project: {
          text: 1,
          sourceType: 1,
          metadata: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    if (vectorResults && vectorResults.length > 0) {
      return vectorResults.map((doc) => ({
        text: doc.text,
        sourceType: doc.sourceType,
        metadata: doc.metadata || {},
        score: doc.score,
      }));
    }
  } catch (err: any) {
    // Atlas Vector Search index might not be configured yet, fall back gracefully
    console.info("Atlas Vector Search unavailable, using in-memory cosine similarity fallback:", err?.message);
  }

  // 2. In-Memory Cosine Similarity Fallback
  const allUserChunks = await Chunk.find({ userId: userObjectId }).lean();
  if (!allUserChunks || allUserChunks.length === 0) {
    return [];
  }

  const scoredChunks = allUserChunks.map((chunk) => ({
    text: chunk.text,
    sourceType: chunk.sourceType,
    metadata: chunk.metadata || {},
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort descending by similarity
  scoredChunks.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return scoredChunks.slice(0, limit);
};

export interface AskBrainResponse {
  answer: string;
  citations: Array<{
    title: string;
    sourceUrl: string;
    sourceType: string;
    startTime?: number | undefined;
    author?: string | undefined;
  }>;
  chunksFound: number;
}

/**
 * Executes full RAG pipeline: Query -> Vector Search -> Grounded Synthesis.
 */
export const askSecondBrain = async (userId: string, question: string): Promise<AskBrainResponse> => {
  let chunks: RetrievedChunk[] = [];
  try {
    chunks = await searchRelevantChunks(userId, question, 5);
  } catch (err: any) {
    return {
      answer:
        err?.message ||
        "Our AI service is experiencing heavy traffic right now. Please try again in a few moments.",
      citations: [],
      chunksFound: 0,
    };
  }

  // Check if any content for this user is still actively processing
  const processingSources = await Content.find({ userId, status: "processing" })
    .select("title sourceType")
    .lean();

  if (chunks.length === 0) {
    if (processingSources.length > 0) {
      const titles = processingSources.map((s) => `"${s.title}"`).join(", ");
      return {
        answer: `⏳ You have ${processingSources.length} source(s) (${titles}) currently being processed and indexed in your workspace. Please allow a moment for transcription and AI indexing to complete, then ask again!`,
        citations: [],
        chunksFound: 0,
      };
    }

    return {
      answer:
        "Your Second Brain does not have relevant notes for this question yet. Try saving a YouTube video, web article, or tweet first!",
      citations: [],
      chunksFound: 0,
    };
  }

  let answer = await generateGroundedAnswer(question, chunks);
  if (processingSources.length > 0) {
    const titles = processingSources.map((s) => `"${s.title}"`).join(", ");
    answer += `\n\n*(Note: ${processingSources.length} source(s) [${titles}] are currently being indexed in the background and will be ready for questions shortly.)*`;
  }

  // Extract unique citations from top chunks
  const seenUrls = new Set<string>();
  const citations: AskBrainResponse["citations"] = [];

  for (const c of chunks) {
    const url = c.metadata?.sourceUrl;
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      citations.push({
        title: c.metadata.title || "Source",
        sourceUrl: url,
        sourceType: c.sourceType,
        startTime: c.metadata.startTime,
        author: c.metadata.author,
      });
    }
  }

  return {
    answer,
    citations,
    chunksFound: chunks.length,
  };
};
