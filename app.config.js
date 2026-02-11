// app.config.js
export default ({ config }) => ({
  ...config,

  name: "DietBite Pro",
  slug: "dietbite-pro",
  version: "1.0.1",

  // âœ… Required for expo-router / Linking in production builds
  scheme: "dietbitepro",

  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",

  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },

  android: {
    ...(config.android || {}),
    package: "com.grantedsolutions.dietbitepro",
    versionCode: 4,
    softwareKeyboardLayoutMode: "resize",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#000000",
    },
  },

  ios: {
    ...(config.ios || {}),
    supportsTablet: false,
    bundleIdentifier: "com.grantedsolutions.dietbitepro",

    // âœ… MUST bump this every submission
    buildNumber: "14",

    infoPlist: {
      ...(config.ios?.infoPlist || {}),
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  extra: {
    ...(config.extra || {}),
    creator: "DietBite Pro was created by Kenneth Grant of Granted Solutions, LLC.",
    CHAT_API_URL_DEV: "https://dietbite-pro-mobile-1.onrender.com/chat",
    CHAT_API_URL_PROD: "https://dietbite-pro-mobile-1.onrender.com/chat",

    // keep your env-based public var if you use it
    apiUrl: process.env.EXPO_PUBLIC_API_URL || config.extra?.apiUrl,

    router: {},
    eas: {
      projectId: "fa700e40-799f-4a27-80ac-5007e0cba938",
    },
  },

  plugins: ["expo-router", "expo-asset"],
});






