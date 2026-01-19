export default {
  expo: {
    name: "Sentro",
    slug: "sentro-mobile",
    version: "3.0.0",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#f9fafb"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    updates: {
      url: "https://u.expo.dev/63c2797a-2ec3-4383-b11a-949145aad6f0"
    },
    runtimeVersion: "3.0.0",
    ios: {
      bundleIdentifier: "com.sentro.mobile",
      supportsTablet: true,
      buildNumber: "1",
      usesAppleSignIn: false,
      usesIcloudStorage: false,
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        },
        UIBackgroundModes: []
      },
      entitlements: {
        "com.apple.security.application-groups": [
          "group.com.sentro.mobile"
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#ffffff"
      },
      package: "sentro.seguranca",
      permissions: [
        "INTERNET",
        "VIBRATE",
        "ACCESS_NETWORK_STATE",
        "CHANGE_NETWORK_STATE"
      ],
      usesCleartextTraffic: true,
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      minSdkVersion: 23
    },
    web: {
      favicon: "./assets/logo.png"
    },
    extra: {
      eas: {
        projectId: "63c2797a-2ec3-4383-b11a-949145aad6f0",
        owner: "fernandoexpodev"
      }
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      "expo-updates",
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true
          }
        }
      ]
    ]
  }
};