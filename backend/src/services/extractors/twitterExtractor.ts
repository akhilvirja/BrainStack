import { safeFetch } from "../../utils/safeFetch.js";
import type { ExtractionResult } from "./types.js";

// Helper to extract username and numeric tweet ID
export const parseTwitterUrl = (rawUrl: string): { username: string; tweetId: string } | null => {
  if (!rawUrl) return null;
  const match = rawUrl.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/([0-9]+)/i);
  if (!match || !match[1] || !match[2]) return null;
  return {
    username: match[1],
    tweetId: match[2],
  };
};

export const extractTwitterPost = async (rawUrl: string): Promise<ExtractionResult> => {
  const parsed = parseTwitterUrl(rawUrl);
  if (!parsed) {
    throw new Error(`Invalid X/Twitter URL: ${rawUrl}. Supported format: https://x.com/username/status/123456789`);
  }

  const { username, tweetId } = parsed;
  const canonicalUrl = `https://x.com/${username}/status/${tweetId}`;

  let tweetText = "";
  let authorName = username;
  let authorHandle = username;
  let profileImageUrl = "";
  let photos: string[] = [];
  let likes = 0;
  let retweets = 0;
  let replies = 0;
  let createdAt = new Date().toISOString();

  // 1. Fetch via Twitter public syndication API (used by official web embeds, free and keyless)
  try {
    const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=x`;
    const res = await safeFetch(syndicationUrl, { timeoutMs: 7000 });
    const data = res.json<any>();

    if (data?.text) {
      tweetText = data.text;
    }
    if (data?.user?.name) {
      authorName = data.user.name;
    }
    if (data?.user?.screen_name) {
      authorHandle = data.user.screen_name;
    }
    if (data?.user?.profile_image_url_https) {
      profileImageUrl = data.user.profile_image_url_https;
    }
    if (typeof data?.favorite_count === "number") {
      likes = data.favorite_count;
    }
    if (typeof data?.retweet_count === "number") {
      retweets = data.retweet_count;
    }
    if (typeof data?.conversation_count === "number") {
      replies = data.conversation_count;
    }
    if (Array.isArray(data?.photos)) {
      photos = data.photos.map((p: any) => p.url).filter(Boolean);
    }
    if (data?.created_at) {
      createdAt = data.created_at;
    }
  } catch (syndicationErr: any) {
    console.warn(`Twitter syndication extraction notice for tweet ${tweetId}:`, syndicationErr.message);

    // 2. Fallback to Twitter oEmbed
    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(canonicalUrl)}&omit_script=true`;
      const res = await safeFetch(oembedUrl, { timeoutMs: 5000 });
      const oembedData = res.json<any>();

      if (oembedData?.author_name) authorName = oembedData.author_name;
      if (oembedData?.html) {
        // Strip blockquote HTML tags from oEmbed HTML to extract raw text
        const plain = oembedData.html
          .replace(/<p[^>]*>/gi, "")
          .replace(/<\/p>/gi, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (plain) tweetText = plain;
      }
    } catch (oembedErr: any) {
      console.warn("Twitter oEmbed fallback note:", oembedErr.message);
    }
  }

  const title = `Post by @${authorHandle}: "${(tweetText || `Tweet #${tweetId}`).slice(0, 80)}"`;
  const description = tweetText ? tweetText.slice(0, 280) : `Post by @${authorHandle} on X`;

  return {
    title,
    sourceType: "twitter",
    sourceUrl: rawUrl,
    canonicalUrl,
    description,
    text: tweetText || `Content could not be retrieved from X. The post link and embed have been preserved.`,
    metadata: {
      tweetId,
      authorName,
      authorHandle,
      profileImageUrl: profileImageUrl || undefined,
      photos: photos.length > 0 ? photos : undefined,
      likes,
      retweets,
      replies,
      createdAt,
    },
  };
};
