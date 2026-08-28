const required = (name: string, value: string | undefined): string => {
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

export const env = {
  clerkPublishableKey: required(
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  ),
  apiUrl: process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "",
  googleAndroidClientId: process.env.EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID,
  googleWebClientId: process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID,
} as const;
