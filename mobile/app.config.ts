import type { ExpoConfig } from "@expo/config-types";

// type Variant = 'development' | 'preview' | 'production';

// const variant = (process.env.EAS_BUILD_PROFILE ?? 'development') as Variant;

// const variants: Record<
//   Variant,
//   {
//     name: string;
//     androidPackage: string;
//   }
// > = {
//   development: {
//     name: 'Studbady (Dev)',
//     androidPackage: 'com.irfan140.studbady.dev',
//   },

//   preview: {
//     name: 'Studbady (Preview)',
//     androidPackage: 'com.irfan140.studbady.preview',
//   },

//   production: {
//     name: 'Studbady',
//     androidPackage: 'com.irfan140.studbady',
//   },
// };

// const v = variants[variant];

const config: ExpoConfig = {
  name: "Stubady", // use v.name for production or preview build
  slug: "studbady",
  version: "1.0.0",
  orientation: "portrait",

  icon: "./assets/images/icon.png",

  scheme: "mobile",

  userInterfaceStyle: "automatic",

  // EAS Update — OTA JS updates (expo-updates SDK 55) and  `url` must be https://u.expo.dev/<projectId> for EAS Update service
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/3c58fbcc-ede2-4ea9-b211-fbba65c39cb9",
    fallbackToCacheTimeout: 0,
  },

  ios: {
    icon: "./assets/expo.icon",
  },

  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },

    predictiveBackGestureEnabled: false,

    package: "com.irfan140.studbady",
  },

  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",

    [
      "expo-splash-screen",
      {
        backgroundColor: "#208AEF",

        android: {
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      },
    ],
    ["@clerk/expo"],
    "@clerk/expo-google-signin",

    "expo-secure-store",
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    router: {},

    eas: {
     "projectId": "337168a4-5446-4f92-a8c7-e364f1e732a9"
    },

    EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID:
      process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID,

    EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID:
      process.env.EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID,
  },

  owner: "irfan140",
};

export default config;
