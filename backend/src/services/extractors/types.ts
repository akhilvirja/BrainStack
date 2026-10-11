import type { SourceType, ISourceMetadata } from "../../models/content.model.js";

export interface ExtractionResult {
  title: string;
  sourceType: SourceType;
  sourceUrl: string;
  canonicalUrl: string;
  description: string;
  text: string;
  metadata: ISourceMetadata;
}
