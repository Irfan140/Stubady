import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP } from "better-auth/plugins";

import { env } from "../config/env";
import { logger } from "../config/logger";
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
  },
  emailVerification: {
    // Send an OTP (not a link) right after sign-up, matching the mobile
    // email-code UX. Delivery is logged until a real email provider exists.
    sendOnSignUp: true,
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
        // No email provider is wired yet: log the code so local dev and API
        // clients can complete verification. Never log OTPs in production.
        if (process.env.NODE_ENV === "production") {
          logger.info({ email, type }, "issued email verification OTP");
        } else {
          logger.info({ email, type, otp }, "issued email verification OTP");
        }
      },
    }),
  ],
  databaseHooks: {
    user: {
      delete: {
        // Replaces the old Clerk `user.deleted` webhook: purge R2 objects
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
