import { z } from "zod";

export const createStudySetSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(200),
});

export type CreateStudySetInput = z.infer<typeof createStudySetSchema>;

export const updateStudySetSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(200),
});

export type UpdateStudySetInput = z.infer<typeof updateStudySetSchema>;
