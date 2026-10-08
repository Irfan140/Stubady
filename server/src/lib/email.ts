import { Resend } from "resend";

import { env } from "../config/env";
import { logger } from "../config/logger";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

const DEFAULT_FROM = "Stubady <onboarding@resend.dev>";

const subjectFor = (type: string): string => {
  if (type === "forget-password") return "Reset your Stubady password";
  if (type === "sign-in") return "Your Stubady sign-in code";
  return "Verify your Stubady email";
};

const textFor = (otp: string, type: string): string => {
  const action =
    type === "forget-password"
      ? "reset your password"
      : type === "sign-in"
        ? "sign in"
        : "verify your email address";
  return `Your Stubady verification code is: ${otp}\n\nUse it to ${action}. It expires in 5 minutes. If you didn't request this, ignore this email.`;
};

export const sendOtpEmail = async (input: {
  email: string;
  otp: string;
  type: string;
}): Promise<void> => {
  const { email, otp, type } = input;
  if (!resend) {
    // No provider configured (local dev): log the code so testing works.
    // Never log OTPs in production.
    if (process.env.NODE_ENV === "production") {
      logger.info({ email, type }, "issued email verification OTP");
    } else {
      logger.info({ email, type, otp }, "issued email verification OTP");
    }
    return;
  }
  const { error } = await resend.emails.send({
    from: env.resendFrom || DEFAULT_FROM,
    to: email,
    subject: subjectFor(type),
    text: textFor(otp, type),
  });
  if (error) {
    logger.error({ err: error, email, type }, "failed to send OTP email");
    throw new Error("Could not send the verification email. Try again.");
  }
  // Keep the terminal-readable code in non-production for device testing.
  if (process.env.NODE_ENV !== "production") {
    logger.info({ email, type, otp }, "sent email verification OTP");
  }
};
