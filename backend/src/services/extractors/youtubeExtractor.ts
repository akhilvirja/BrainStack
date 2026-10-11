import { YoutubeTranscript } from "youtube-transcript";
import { safeFetch } from "../../utils/safeFetch.js";
import type { ExtractionResult } from "./types.js";

// Helper to extract canonical YouTube 11-character video ID
export const parseYouTubeVideoId = (rawUrl: string): string | null => {
  if (!rawUrl) return null;
  const match = rawUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i
  );
  return match && match[1] ? match[1] : null;
};

const formatSeconds = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const extractYouTubeVideo = async (rawUrl: string): Promise<ExtractionResult> => {
  const videoId = parseYouTubeVideoId(rawUrl);
  if (!videoId) {
    throw new Error(`Invalid YouTube URL: ${rawUrl}. Could not determine 11-character video ID.`);
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

  let videoTitle = `YouTube Video (${videoId})`;
  let channelTitle = "YouTube Creator";
  let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await safeFetch(oembedUrl, { timeoutMs: 6000 });
    const data = res.json<{ title?: string; author_name?: string; thumbnail_url?: string }>();
    if (data.title) videoTitle = data.title;
    if (data.author_name) channelTitle = data.author_name;
    if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
  } catch (oembedErr) {
    console.warn("YouTube oEmbed metadata fetch warning:", oembedErr);
  }

  // 2. Fetch transcript with timestamps
  let transcriptSegments: Array<{ text: string; start: number; duration: number }> = [];
  let formattedText = "";
  let hasTranscript = false;

  try {
    const rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
    if (Array.isArray(rawTranscript) && rawTranscript.length > 0) {
      transcriptSegments = rawTranscript.map((item) => ({
        text: item.text.replace(/&amp;#39;/g, "'").replace(/&quot;/g, '"').trim(),
        start: Math.round(item.offset / 1000),
        duration: Math.round(item.duration / 1000),
      }));

      // Build readable timestamped transcript lines
      formattedText = transcriptSegments
        .map((seg) => `[${formatSeconds(seg.start)}] ${seg.text}`)
        .join("\n");

      hasTranscript = true;
    }
  } catch (transcriptErr: any) {
    // Non-fatal: Not all YouTube videos have captions enabled
    console.info(`YouTube transcript note for video ${videoId}: ${transcriptErr.message || transcriptErr}`);
    hasTranscript = false;
  }

  if (!formattedText) {
    formattedText = `Transcript is unavailable for this video. The video player embed and link have been safely preserved.`;
  }

  const lastSegment = transcriptSegments[transcriptSegments.length - 1];
  const totalDuration = lastSegment ? lastSegment.start + lastSegment.duration : undefined;

  return {
    title: videoTitle,
    sourceType: "youtube",
    sourceUrl: rawUrl,
    canonicalUrl,
    description: `YouTube video by ${channelTitle}. ${hasTranscript ? "Transcript extracted with timestamps." : "Video saved without transcript."}`,
    text: formattedText,
    metadata: {
      videoId,
      channelTitle,
      duration: totalDuration,
      hasTranscript,
      thumbnailUrl,
      transcript: transcriptSegments.slice(0, 1000), // Cap at 1000 segments for clean storage
    },
  };
};
