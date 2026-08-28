import { z } from "zod";

/**
 * Note, web, and PDF sources are supported. PDF bytes are uploaded through
 * the dedicated presigned R2 flow below.
 */
export const createSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("note"),
    studySetId: z.string().uuid(),
    content: z.string().trim().min(1, "content is required").max(100_000),
  }),
  z.object({
    type: z.literal("web"),
    studySetId: z.string().uuid(),
    url: z
      .string()
      .trim()
      .url()
      .refine((value) => {
        const protocol = new URL(value).protocol;
        return protocol === "http:" || protocol === "https:";
      }, "url must use http or https"),
  }),
]);

export type CreateSourceInput = z.infer<typeof createSourceSchema>;

export const createPdfUploadSchema = z.object({
  studySetId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(200),
  contentType: z.literal("application/pdf"),
  size: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024),
});

export type CreatePdfUploadInput = z.infer<typeof createPdfUploadSchema>;

export const listSourcesQuerySchema = z.object({
  studySetId: z.string().uuid(),
  limit: z.string().optional(),
  cursor: z.string().optional(),
});
