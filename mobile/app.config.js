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
        NSLocationWhenInUseUsageDescription: "Este app precisa da sua localização para compartilhar com sua família.",
        NSLocationAlwaysUsageDescription: "Este app precisa da sua localização em segundo plano para mantê-lo conectado com sua família.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Este app precisa da sua localização para compartilhar com sua família.",
        NSContactsUsageDescription: "Este app precisa acessar seus contatos para que você possa importá-los e gerenciá-los.",
        UIBackgroundModes: ["location", "remote-notification"]
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
      googleServicesFile: "./android/app/google-services.json",
      permissions: [
        "INTERNET",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "POST_NOTIFICATIONS",
        "VIBRATE",
        "WAKE_LOCK",
        "RECEIVE_BOOT_COMPLETED",
        "SYSTEM_ALERT_WINDOW",
        "ACTIVITY_RECOGNITION",
        "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
        "ACCESS_WIFI_STATE",
        "CHANGE_WIFI_STATE",
        "BLUETOOTH",
        "BLUETOOTH_ADMIN",
        "ACCESS_NETWORK_STATE",
        "CHANGE_NETWORK_STATE",
        "READ_CONTACTS",
        "WRITE_CONTACTS"
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
        "expo-notifications",
        {
          icon: "./assets/logo.png",
          color: "#16a34a",
          defaultChannel: "default"
        }
      ],
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