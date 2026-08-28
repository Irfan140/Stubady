import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export const verificationSchema = z.object({
  code: z.string().trim().min(4, "Enter the verification code"),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
