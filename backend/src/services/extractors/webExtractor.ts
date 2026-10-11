import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { safeFetch } from "../../utils/safeFetch.js";
import type { ExtractionResult } from "./types.js";

// Helper to normalize multi-line extracted text
const cleanExtractedText = (raw: string): string => {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
};

export const extractWebArticle = async (rawUrl: string): Promise<ExtractionResult> => {
  const urlObj = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  const canonicalUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`.replace(/\/$/, "");

  // 1. Fetch public HTML using SSRF-safe client
  const response = await safeFetch(rawUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  const html = response.text;
  if (!html || !html.trim()) {
    throw new Error("Target webpage returned an empty body.");
  }

  // 2. Parse DOM with JSDOM
  const dom = new JSDOM(html, { url: rawUrl });
  const doc = dom.window.document;

  // Extract meta tags as baseline
  const getMeta = (name: string): string => {
    const el =
      doc.querySelector(`meta[name="${name}"]`) ||
      doc.querySelector(`meta[property="${name}"]`) ||
      doc.querySelector(`meta[property="og:${name}"]`);
    return el?.getAttribute("content")?.trim() || "";
  };

  const ogTitle = getMeta("title") || getMeta("og:title") || doc.title || urlObj.hostname;
  const ogDescription = getMeta("description") || getMeta("og:description") || "";
  const siteName = getMeta("site_name") || getMeta("og:site_name") || urlObj.hostname.replace(/^www\./, "");
  const author = getMeta("author") || getMeta("article:author") || "";
  const publishedTime = getMeta("article:published_time") || "";
  const leadImageUrl = getMeta("image") || getMeta("og:image") || "";

  // 3. Extract core content using Readability
  let title = ogTitle;
  let text = "";
  let excerpt = ogDescription;

  try {
    const reader = new Readability(doc, {
      charThreshold: 60,
    });
    const article = reader.parse();

    if (article) {
      if (article.title) title = article.title.trim();
      if (article.excerpt) excerpt = article.excerpt.trim();
      if (article.textContent) text = cleanExtractedText(article.textContent);
    }
  } catch (parseErr) {
    console.warn("Readability parse warning:", parseErr);
  }

  // 4. Fallback if Readability returned empty text
  if (!text) {
    const paragraphs = Array.from(doc.querySelectorAll("p, article, main, h1, h2, h3"))
      .map((p) => p.textContent?.trim())
      .filter((t): t is string => Boolean(t && t.length > 20));
    text = cleanExtractedText(paragraphs.join("\n\n"));
  }

  if (!text) {
    text = excerpt || "No readable article text could be extracted from this page.";
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    title: title || urlObj.hostname,
    sourceType: "web",
    sourceUrl: rawUrl,
    canonicalUrl: canonicalUrl || rawUrl,
    description: excerpt || text.slice(0, 280),
    text,
    metadata: {
      siteName,
      author,
      publishedTime,
      excerpt: excerpt || text.slice(0, 280),
      wordCount,
      leadImageUrl: leadImageUrl || undefined,
      favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`,
    },
  };
};
