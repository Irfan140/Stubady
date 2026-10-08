import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP } from "better-auth/plugins";

import { env } from "../config/env";
import { logger } from "../config/logger";
import { sendOtpEmail } from "./email";
import { deleteAllUserData } from "../repositories/users.repositories";
import { prisma } from "./prisma";
import { deleteObjectsByPrefix, userStoragePrefix } from "./r2";

// Native clients (Expo) have no http(s) origin, so auth relies on Bearer
// tokens (bearer plugin) and deep-link redirects back to the app scheme.
const trustedOrigins = [
  env.betterAuthUrl,
  `http://localhost:${env.port}`,
  "mobile://",
];

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: env.betterAuthUrl,
  secret: env.betterAuthSecret,
  trustedOrigins: [...new Set(trustedOrigins)],
  emailAndPassword: {
    enabled: true,
    // Sign-up creates no session and sign-in is refused until the email
    // is verified — verification actually gates entry.
    requireEmailVerification: true,
  },
  emailVerification: {
    // Send an OTP (not a link) right after sign-up, matching the mobile
    // email-code UX. Delivered by Resend when configured, else logged.
    sendOnSignUp: true,
    // Verifying signs the user in, so the app can enter straight after
    // the code screen with no extra sign-in step.
    autoSignInAfterVerification: true,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  socialProviders: {
    google: {
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
    },
  },
  plugins: [
    expo(),
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail({ email, otp, type });
      },
    }),
  ],
  databaseHooks: {
    user: {
      delete: {
        // Replaces the old `user.deleted` webhook: purge R2 objects
        // and DB rows so no orphaned data remains after account deletion.
        after: async (user) => {
          await deleteObjectsByPrefix(userStoragePrefix(user.id));
          const deleted = await deleteAllUserData(user.id);
          logger.info(
            { userId: user.id, studySetsDeleted: deleted },
            "purged data for deleted user",
          );
        },
      },
    },
  },
});
