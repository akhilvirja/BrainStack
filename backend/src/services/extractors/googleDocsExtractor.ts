import { JSDOM } from "jsdom";
import { safeFetch } from "../../utils/safeFetch.js";
import type { ExtractionResult } from "./types.js";

// Helper to validate and extract document ID from Google Docs URLs
export const parseGoogleDocsUrl = (
  rawUrl: string
): { isPublished: boolean; docId: string; canonicalUrl: string } => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  if (!parsed.hostname.includes("docs.google.com")) {
    throw new Error("URL is not a Google Docs document.");
  }

  // Check if user submitted an unpublished /edit or /view link
  if (parsed.pathname.includes("/edit") || parsed.pathname.includes("/view")) {
    throw new Error(
      "Private or draft Google Docs are not supported. Please publish your document to the web first (in Google Docs, go to File > Share > Publish to web) and paste the published link."
    );
  }

  // Check published URL patterns
  // Pattern 1: https://docs.google.com/document/d/e/2PACX-.../pub
  // Pattern 2: https://docs.google.com/document/d/DOC_ID/pub
  const isPublished = parsed.pathname.endsWith("/pub") || parsed.pathname.includes("/pub");
  if (!isPublished) {
    throw new Error(
      "Unsupported Google Docs URL format. Please provide a document published to the web (ending in /pub)."
    );
  }

  // Extract ID
  const parts = parsed.pathname.split("/").filter(Boolean);
  const docIdx = parts.indexOf("d");
  const nextPart = parts[docIdx + 1];
  const secondNextPart = parts[docIdx + 2];
  let docId = "published-doc";
  if (docIdx !== -1 && nextPart) {
    // If it's /d/e/PUB_ID/pub
    if (nextPart === "e" && secondNextPart) {
      docId = secondNextPart;
    } else {
      docId = nextPart;
    }
  }

  const canonicalUrl = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;

  return { isPublished: true, docId, canonicalUrl };
};

export const extractGoogleDoc = async (rawUrl: string): Promise<ExtractionResult> => {
  const { docId, canonicalUrl } = parseGoogleDocsUrl(rawUrl);

  // 1. Fetch public published document HTML
  const response = await safeFetch(canonicalUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  const html = response.text;
  if (!html || !html.trim()) {
    throw new Error("Published Google Doc returned an empty page.");
  }

  // 2. Parse HTML using JSDOM
  const dom = new JSDOM(html, { url: canonicalUrl });
  const doc = dom.window.document;

  // 3. Remove inline styles, scripts, and hidden headers
  const toRemove = doc.querySelectorAll("style, script, meta, link, noscript");
  toRemove.forEach((el) => el.remove());

  // 4. Extract title
  let title = doc.title || "Published Google Doc";
  // Strip Google Docs suffix e.g. "My Document Title - Google Docs"
  title = title.replace(/\s*-\s*Google Docs\s*$/i, "").trim();

  // Also check top-level headings if title is generic
  const firstHeader = doc.querySelector("h1, #header")?.textContent?.trim();
  if (firstHeader && (!title || title.toLowerCase() === "google docs")) {
    title = firstHeader;
  }

  // 5. Extract readable text from #contents or main container
  const contentContainer =
    doc.querySelector("#contents") ||
    doc.querySelector(".doc-content") ||
    doc.querySelector("body");

  let extractedParagraphs: string[] = [];
  if (contentContainer) {
    const textElements = contentContainer.querySelectorAll("h1, h2, h3, h4, p, li");
    textElements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text) {
        // Tag headings cleanly
        if (["H1", "H2", "H3", "H4"].includes(el.tagName)) {
          extractedParagraphs.push(`\n## ${text}\n`);
        } else {
          extractedParagraphs.push(text);
        }
      }
    });
  }

  let fullText = extractedParagraphs.join("\n\n").trim();
  if (!fullText) {
    fullText = contentContainer?.textContent?.replace(/\s+/g, " ").trim() || "";
  }

  if (!fullText) {
    fullText = "No readable content found in the published document.";
  }

  const wordCount = fullText.split(/\s+/).filter(Boolean).length;
  const description = fullText.slice(0, 280).replace(/\n/g, " ").trim();

  return {
    title: title || "Published Google Doc",
    sourceType: "google_docs",
    sourceUrl: rawUrl,
    canonicalUrl,
    description: description || "Published Google Docs document",
    text: fullText,
    metadata: {
      docId,
      wordCount,
      publishedVersion: "web",
    },
  };
};
