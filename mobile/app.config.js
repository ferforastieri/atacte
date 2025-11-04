export default {
  expo: {
    name: "Atacte",
    slug: "atacte-mobile",
    version: "1.0.1",
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
    ios: {
      bundleIdentifier: "com.atacte.mobile",
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        },
        NSLocationWhenInUseUsageDescription: "Este app precisa da sua localização para compartilhar com sua família.",
        NSLocationAlwaysUsageDescription: "Este app precisa da sua localização em segundo plano para mantê-lo conectado com sua família.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Este app precisa da sua localização para compartilhar com sua família.",
        UIBackgroundModes: ["location", "remote-notification"]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#ffffff"
      },
      package: "atacte.seguranca",
      googleServicesFile: "./google-services.json",
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
        "SYSTEM_ALERT_WINDOW"
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
        projectId: "4ed359d6-b000-4308-84c0-18c93f60b0c6"
      }
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-notifications",
        {
          icon: "./assets/logo.png",
          color: "#16a34a",
          defaultChannel: "default"
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Este app precisa da sua localização para compartilhar com sua família.",
          locationAlwaysPermission: "Este app precisa da sua localização em segundo plano para mantê-lo conectado com sua família.",
          locationWhenInUsePermission: "Este app precisa da sua localização para compartilhar com sua família.",
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true
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