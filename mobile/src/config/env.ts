export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "",
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
} as const;
