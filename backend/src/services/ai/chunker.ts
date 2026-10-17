export interface TextChunk {
  chunkIndex: number;
  text: string;
  metadata: {
    title: string;
    sourceUrl: string;
    startTime?: number; // for YouTube seeking
    channelTitle?: string;
    author?: string;
    siteName?: string;
  };
}

/**
 * Splits plain text into overlapping chunks using paragraph and sentence boundaries.
 */
export const splitTextIntoChunks = (
  text: string,
  chunkSize: number = 700,
  chunkOverlap: number = 150
): string[] => {
  if (!text || text.trim().length === 0) return [];
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= chunkSize) {
    return [normalized];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < normalized.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < normalized.length) {
      // Look for natural breaking points (paragraph, period, or space)
      const paragraphBreak = normalized.lastIndexOf("\n\n", endIndex);
      const sentenceBreak = normalized.lastIndexOf(". ", endIndex);
      const lineBreak = normalized.lastIndexOf("\n", endIndex);
      const spaceBreak = normalized.lastIndexOf(" ", endIndex);

      if (paragraphBreak > startIndex + chunkSize / 2) {
        endIndex = paragraphBreak + 2;
      } else if (sentenceBreak > startIndex + chunkSize / 2) {
        endIndex = sentenceBreak + 2;
      } else if (lineBreak > startIndex + chunkSize / 2) {
        endIndex = lineBreak + 1;
      } else if (spaceBreak > startIndex + chunkSize / 2) {
        endIndex = spaceBreak + 1;
      }
    } else {
      endIndex = normalized.length;
    }

    const chunk = normalized.slice(startIndex, endIndex).trim();
    if (chunk.length >= 25) {
      chunks.push(chunk);
    }

    startIndex = endIndex - chunkOverlap;
    if (startIndex >= normalized.length || endIndex === normalized.length) {
      break;
    }
  }

  return chunks;
};

/**
 * Chunks YouTube transcripts while preserving timestamp synchronization.
 */
export const chunkYouTubeTranscript = (
  transcript: Array<{ text: string; start: number; duration: number }>,
  targetLength: number = 600
): Array<{ text: string; startTime: number }> => {
  if (!transcript || transcript.length === 0) return [];

  const chunks: Array<{ text: string; startTime: number }> = [];
  let currentText = "";
  let currentStartTime = transcript[0]?.start ?? 0;

  for (const item of transcript) {
    const itemText = item.text.trim();
    if (!itemText) continue;

    if (currentText.length === 0) {
      currentStartTime = Math.floor(item.start);
    }

    if (currentText.length + itemText.length + 1 > targetLength && currentText.length > 0) {
      chunks.push({
        text: currentText.trim(),
        startTime: currentStartTime,
      });
      // Start next chunk
      currentText = itemText;
      currentStartTime = Math.floor(item.start);
    } else {
      currentText = currentText ? `${currentText} ${itemText}` : itemText;
    }
  }

  if (currentText.trim().length >= 20) {
    chunks.push({
      text: currentText.trim(),
      startTime: currentStartTime,
    });
  }

  return chunks;
};

/**
 * Main chunking dispatcher for any saved source content.
 */
export const createChunksFromContent = (content: {
  title: string;
  sourceUrl: string;
  sourceType: string;
  extractedText?: string;
  description?: string;
  metadata?: any;
}): TextChunk[] => {
  const { title, sourceUrl, sourceType, extractedText = "", description = "", metadata = {} } = content;
  const chunks: TextChunk[] = [];

  // 1. YouTube Sources
  if (sourceType === "youtube") {
    const transcript = metadata.transcript;
    if (Array.isArray(transcript) && transcript.length > 0) {
      const transcriptChunks = chunkYouTubeTranscript(transcript, 650);
      transcriptChunks.forEach((tc, idx) => {
        chunks.push({
          chunkIndex: idx,
          text: `[Video: "${title}"]\n${tc.text}`,
          metadata: {
            title,
            sourceUrl,
            startTime: tc.startTime,
            channelTitle: metadata.channelTitle,
          },
        });
      });
    } else {
      // Fallback to title & description
      const fallbackText = `${title}\n\n${description || extractedText}`.trim();
      if (fallbackText) {
        chunks.push({
          chunkIndex: 0,
          text: fallbackText,
          metadata: {
            title,
            sourceUrl,
            channelTitle: metadata.channelTitle,
          },
        });
      }
    }
    return chunks;
  }

  // 2. Twitter Sources
  if (sourceType === "twitter") {
    const author = metadata.authorName
      ? `${metadata.authorName} (@${metadata.authorHandle || ""})`
      : "";
    const tweetText = extractedText || description || title;
    const formatted = `[Post by ${author || "Author"}]:\n${tweetText}`;
    chunks.push({
      chunkIndex: 0,
      text: formatted.trim(),
      metadata: {
        title,
        sourceUrl,
        author,
      },
    });
    return chunks;
  }

  // 3. Web Articles & Google Docs
  const fullText = extractedText || description || title;
  const rawChunks = splitTextIntoChunks(fullText, 750, 150);

  rawChunks.forEach((text, idx) => {
    chunks.push({
      chunkIndex: idx,
      text: `[Source: "${title}"]\n${text}`,
      metadata: {
        title,
        sourceUrl,
        author: metadata.author,
        siteName: metadata.siteName,
      },
    });
  });

  return chunks;
};
