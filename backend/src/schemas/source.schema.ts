import { z } from "zod";
import { sourceTypes } from "../models/content.model.js";

export const createSourceSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(300, "Title cannot exceed 300 characters"),
    sourceUrl: z.string().optional(),
    link: z.string().optional(),
    sourceType: z.enum(sourceTypes).optional(),
    type: z.string().optional(),
    description: z.string().max(2000, "Description cannot exceed 2000 characters").optional(),
    tags: z.array(z.any()).optional(),
  }).refine((data) => data.sourceUrl || data.link, {
    message: "A valid source URL must be provided",
    path: ["sourceUrl"],
  }),
});

export const updateSourceSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title must be at least 1 character").max(300).optional(),
    description: z.string().max(2000).optional(),
    tags: z.array(z.any()).optional(),
    sourceType: z.enum(sourceTypes).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid content ID"),
  }),
});

export const getSourceByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid content ID"),
  }),
});
