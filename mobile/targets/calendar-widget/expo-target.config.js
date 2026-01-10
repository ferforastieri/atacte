module.exports = config => ({
  type: "widget",
  icon: '../../assets/logo.png',
  name: "Calendário Atacte",
  bundleIdentifier: "com.atacte.mobile.calendarwidget",
  deploymentTarget: "16.0",
  entitlements: {
    'com.apple.security.application-groups': ['group.com.atacte.mobile']
  },
  colors: {
    accent: "#16a34a",
    background: "#ffffff",
    text: "#111827"
  },
  frameworks: ["WidgetKit", "SwiftUI"]
});

