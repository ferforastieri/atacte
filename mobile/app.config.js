export default {
  expo: {
    name: "Atacte",
    slug: "atacte-mobile",
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
      url: "https://u.expo.dev/cc7a6220-07d6-4d4c-bacd-ae79706d8de5"
    },
    runtimeVersion: "3.0.0",
    ios: {
      bundleIdentifier: "com.atacte.mobile",
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
          "group.com.atacte.mobile"
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#ffffff"
      },
      package: "atacte.seguranca",
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
        projectId: "cc7a6220-07d6-4d4c-bacd-ae79706d8de5",
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