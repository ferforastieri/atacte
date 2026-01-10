const {
  withAndroidManifest,
  withDangerousMod,
  withInfoPlist,
  withEntitlementsPlist
} = require('@expo/config-plugins');

const fs = require('fs');
const path = require('path');

const withCalendarWidget = (config) => {
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];

    if (!application.receiver) {
      application.receiver = [];
    }

    const existingWidgetReceiver = application.receiver.find(
      (receiver) => receiver.$?.['android:name'] === '.CalendarWidgetProvider'
    );

    if (!existingWidgetReceiver) {
      application.receiver.push({
        $: {
          'android:name': '.CalendarWidgetProvider',
          'android:exported': 'false',
        },
        'intent-filter': [{
          action: [{
            $: {
              'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
            },
          }],
        }],
        'meta-data': [{
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/calendar_widget_info',
          },
        }],
      });
    }

    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const packageDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'atacte',
        'seguranca'
      );

      if (!fs.existsSync(packageDir)) {
        fs.mkdirSync(packageDir, { recursive: true });
      }

      const widgetProviderPath = path.join(packageDir, 'CalendarWidgetProvider.kt');
      const widgetProviderContent = `package atacte.seguranca

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONArray
import java.text.SimpleDateFormat
import java.util.*

class CalendarWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    for (id in appWidgetIds) {
      updateAppWidget(context, appWidgetManager, id)
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action == AppWidgetManager.ACTION_APPWIDGET_UPDATE) {
      val appWidgetManager = AppWidgetManager.getInstance(context)
      val appWidgetIds = appWidgetManager.getAppWidgetIds(
        android.content.ComponentName(context, CalendarWidgetProvider::class.java)
      )
      onUpdate(context, appWidgetManager, appWidgetIds)
    }
  }

  private fun updateAppWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int
  ) {
    val views = RemoteViews(context.packageName, R.layout.calendar_widget)
    
    val events = loadEventsFromStorage(context)
    
    val calendar = Calendar.getInstance()
    val currentMonth = calendar.get(Calendar.MONTH)
    val currentYear = calendar.get(Calendar.YEAR)
    
    val monthNames = arrayOf("Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro")
    
    views.setTextViewText(
      context.resources.getIdentifier("widget_month", "id", context.packageName),
      "\${monthNames[currentMonth]} \${currentYear}"
    )

    val calendarText = buildCalendarView(calendar, events)
    views.setTextViewText(
      context.resources.getIdentifier("widget_calendar", "id", context.packageName),
      calendarText
    )

    appWidgetManager.updateAppWidget(appWidgetId, views)
  }
  
  private fun loadEventsFromStorage(context: Context): List<CalendarEvent> {
    try {
      val prefs = context.getSharedPreferences("atacte_calendar_prefs", Context.MODE_PRIVATE)
      val eventsJson = prefs.getString("calendar_events", null) ?: return emptyList()
      
      val eventsArray = JSONArray(eventsJson)
      val events = mutableListOf<CalendarEvent>()
      
      for (i in 0 until eventsArray.length()) {
        val eventObj = eventsArray.getJSONObject(i)
        events.add(CalendarEvent(
          id = eventObj.getString("id"),
          title = eventObj.getString("title"),
          startDate = eventObj.getString("startDate"),
          color = eventObj.optString("color", "#3b82f6")
        ))
      }
      
      return events
    } catch (e: Exception) {
      return emptyList()
    }
  }

  private fun buildCalendarView(calendar: Calendar, events: List<CalendarEvent>): String {
      val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
      dateFormat.timeZone = TimeZone.getTimeZone("UTC")
      
      val eventDates = events.mapNotNull { event ->
        try {
          val eventDate = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
          }.parse(event.startDate)
          dateFormat.format(eventDate)
        } catch (e: Exception) {
          null
        }
      }.toSet()

      val firstDay = calendar.clone() as Calendar
      firstDay.set(Calendar.DAY_OF_MONTH, 1)
      val firstDayOfWeek = firstDay.get(Calendar.DAY_OF_WEEK)
      val daysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH)
      
      val today = Calendar.getInstance()
      val todayDay = today.get(Calendar.DAY_OF_MONTH)
      val todayMonth = today.get(Calendar.MONTH)
      val todayYear = today.get(Calendar.YEAR)

      val sb = StringBuilder()
      val dayOffset = if (firstDayOfWeek == Calendar.SUNDAY) 0 else firstDayOfWeek - Calendar.SUNDAY

      for (i in 0 until dayOffset) {
        sb.append("   ")
      }

      for (day in 1..daysInMonth) {
        val isToday = day == todayDay && 
                      calendar.get(Calendar.MONTH) == todayMonth && 
                      calendar.get(Calendar.YEAR) == todayYear
        
        val dayStr = String.format("%02d", day)
        val dateKey = String.format("%d-%02d-%02d", 
          calendar.get(Calendar.YEAR), 
          calendar.get(Calendar.MONTH) + 1, 
          day)
        
        val hasEvent = eventDates.contains(dateKey)
        
        when {
          isToday && hasEvent -> sb.append("[\${dayStr}]")
          isToday -> sb.append("(\${dayStr})")
          hasEvent -> sb.append("[\${dayStr}]")
          else -> sb.append(" \${dayStr} ")
        }
        
        if ((day + dayOffset) % 7 == 0 && day < daysInMonth) {
          sb.append("\\n")
        } else if (day < daysInMonth) {
          sb.append(" ")
        }
      }

      return sb.toString()
    }
  }

  data class CalendarEvent(
    val id: String,
    val title: String,
    val startDate: String,
    val color: String
  )
}
`;

      fs.writeFileSync(widgetProviderPath, widgetProviderContent, 'utf8');

      const resDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );

      if (!fs.existsSync(resDir)) {
        fs.mkdirSync(resDir, { recursive: true });
      }

      const widgetInfoPath = path.join(resDir, 'calendar_widget_info.xml');
      const widgetInfoContent = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/calendar_widget"
    android:description="@string/calendar_widget_description"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
`;

      fs.writeFileSync(widgetInfoPath, widgetInfoContent, 'utf8');

      const layoutDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'layout'
      );

      if (!fs.existsSync(layoutDir)) {
        fs.mkdirSync(layoutDir, { recursive: true });
      }

      const widgetLayoutPath = path.join(layoutDir, 'calendar_widget.xml');
      const widgetLayoutContent = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="8dp"
    android:background="@android:color/white">

    <TextView
        android:id="@+id/widget_month"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text=""
        android:textSize="16sp"
        android:textStyle="bold"
        android:textColor="#111827"
        android:gravity="center"
        android:layout_marginBottom="8dp" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center">
        <TextView android:text="Dom" android:textSize="10sp" android:textColor="#6b7280" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:gravity="center" />
        <TextView android:text="Seg" android:textSize="10sp" android:textColor="#6b7280" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:gravity="center" />
        <TextView android:text="Ter" android:textSize="10sp" android:textColor="#6b7280" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:gravity="center" />
        <TextView android:text="Qua" android:textSize="10sp" android:textColor="#6b7280" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:gravity="center" />
        <TextView android:text="Qui" android:textSize="10sp" android:textColor="#6b7280" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:gravity="center" />
        <TextView android:text="Sex" android:textSize="10sp" android:textColor="#6b7280" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:gravity="center" />
        <TextView android:text="Sáb" android:textSize="10sp" android:textColor="#6b7280" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:gravity="center" />
    </LinearLayout>

    <TextView
        android:id="@+id/widget_calendar"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text=""
        android:textSize="11sp"
        android:textColor="#374151"
        android:fontFamily="monospace"
        android:gravity="center"
        android:layout_marginTop="4dp"
        android:lineSpacingExtra="2dp" />

</LinearLayout>
`;

      fs.writeFileSync(widgetLayoutPath, widgetLayoutContent, 'utf8');

      const valuesDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'values'
      );

      if (!fs.existsSync(valuesDir)) {
        fs.mkdirSync(valuesDir, { recursive: true });
      }

      const stringsPath = path.join(valuesDir, 'strings.xml');
      let stringsContent = '';
      
      if (fs.existsSync(stringsPath)) {
        stringsContent = fs.readFileSync(stringsPath, 'utf8');
        if (!stringsContent.includes('calendar_widget_description')) {
          stringsContent = stringsContent.replace(
            '</resources>',
            '    <string name="calendar_widget_description">Calendário Atacte</string>\n</resources>'
          );
          fs.writeFileSync(stringsPath, stringsContent, 'utf8');
        }
      } else {
        stringsContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="calendar_widget_description">Calendário Atacte</string>
</resources>
`;
        fs.writeFileSync(stringsPath, stringsContent, 'utf8');
      }

      return config;
    },
  ]);

  config = withEntitlementsPlist(config, (config) => {
    if (!config.modResults['com.apple.security.application-groups']) {
      config.modResults['com.apple.security.application-groups'] = [];
    }
  
    const appGroups = config.modResults['com.apple.security.application-groups'];
  
    if (!appGroups.includes('group.com.atacte.mobile')) {
      appGroups.push('group.com.atacte.mobile');
    }
  
    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosProjectRoot = config.modRequest.platformProjectRoot;
      const atacteDir = path.join(iosProjectRoot, 'Atacte');
      
      const widgetDir = path.join(
        iosProjectRoot,
        'CalendarWidget'
      );

      if (!fs.existsSync(widgetDir)) {
        fs.mkdirSync(widgetDir, { recursive: true });
      }
      
      const widgetModulePath = path.join(atacteDir, 'CalendarWidgetModule.swift');
      const widgetModuleContent = `import Foundation
import React

@objc(CalendarWidgetModule)
class CalendarWidgetModule: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func saveAuthToken(_ token: String, apiUrl: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.atacte.mobile")
    sharedDefaults?.set(token, forKey: "auth_token")
    sharedDefaults?.set(apiUrl, forKey: "api_url")
    sharedDefaults?.synchronize()
    resolver(true)
  }
  
  @objc
  func clearAuthToken(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.atacte.mobile")
    sharedDefaults?.removeObject(forKey: "auth_token")
    sharedDefaults?.removeObject(forKey: "api_url")
    sharedDefaults?.synchronize()
    resolver(true)
  }
}
`;

      if (!fs.existsSync(atacteDir)) {
        fs.mkdirSync(atacteDir, { recursive: true });
      }
      fs.writeFileSync(widgetModulePath, widgetModuleContent, 'utf8');
      
      const widgetBridgePath = path.join(atacteDir, 'CalendarWidgetModule.m');
      const widgetBridgeContent = `#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CalendarWidgetModule, NSObject)

RCT_EXTERN_METHOD(saveAuthToken:(NSString *)token apiUrl:(NSString *)apiUrl resolver:(RCTPromiseResolveBlock)resolver rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(clearAuthToken:(RCTPromiseResolveBlock)resolver rejecter:(RCTPromiseRejectBlock)rejecter)

@end
`;

      fs.writeFileSync(widgetBridgePath, widgetBridgeContent, 'utf8');

      const widgetContentPath = path.join(widgetDir, 'CalendarWidget.swift');
      const widgetContent = `import WidgetKit
import SwiftUI

struct CalendarWidget: Widget {
    let kind: String = "CalendarWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalendarProvider()) { entry in
            CalendarWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Calendário Atacte")
        .description("Visualize seus eventos do calendário")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct CalendarProvider: TimelineProvider {
    func placeholder(in context: Context) -> CalendarEntry {
        CalendarEntry(date: Date(), events: [])
    }

    func getSnapshot(in context: Context, completion: @escaping (CalendarEntry) -> ()) {
        let entry = CalendarEntry(date: Date(), events: [])
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CalendarEntry>) -> ()) {
        fetchCalendarEvents { events in
            let currentDate = Date()
            let entry = CalendarEntry(date: currentDate, events: events)
            
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate) ?? currentDate
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }

    private func fetchCalendarEvents(completion: @escaping ([CalendarEvent]) -> Void) {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.atacte.mobile"),
              let token = sharedDefaults.string(forKey: "auth_token"),
              let apiUrl = sharedDefaults.string(forKey: "api_url") else {
            completion([])
            return
        }

        let calendar = Calendar.current
        let today = Date()
        let components = calendar.dateComponents([.year, .month], from: today)
        guard let firstDay = calendar.date(from: components),
              let endDate = calendar.date(byAdding: .month, value: 1, to: firstDay) else {
            completion([])
            return
        }

        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        let startDateStr = dateFormatter.string(from: today)
        let endDateStr = dateFormatter.string(from: endDate)

        guard let url = URL(string: "\\(apiUrl)/api/calendar?startDate=\\(startDateStr)&endDate=\\(endDateStr)") else {
            completion([])
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \\(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data,
                  let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let success = json["success"] as? Bool,
                  success,
                  let eventsData = json["data"] as? [[String: Any]] else {
                completion([])
                return
            }

            let events = eventsData.compactMap { eventData -> CalendarEvent? in
                guard let id = eventData["id"] as? String,
                      let title = eventData["title"] as? String,
                      let startDateStr = eventData["startDate"] as? String,
                      let startDate = dateFormatter.date(from: startDateStr) else {
                    return nil
                }

                return CalendarEvent(
                    id: id,
                    title: title,
                    startDate: startDate,
                    endDate: (eventData["endDate"] as? String).flatMap { dateFormatter.date(from: $0) },
                    color: eventData["color"] as? String ?? "#3b82f6",
                    isAllDay: eventData["isAllDay"] as? Bool ?? false
                )
            }

            completion(events.sorted { $0.startDate < $1.startDate })
        }.resume()
    }
}

struct CalendarEntry: TimelineEntry {
    let date: Date
    let events: [CalendarEvent]
}

struct CalendarEvent {
    let id: String
    let title: String
    let startDate: Date
    let endDate: Date?
    let color: String
    let isAllDay: Bool
}

struct CalendarWidgetEntryView: View {
    var entry: CalendarProvider.Entry

    var body: some View {
        VStack(spacing: 6) {
            Text(getMonthYear(entry.date))
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 2) {
                HStack(spacing: 4) {
                    ForEach(["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], id: \.self) { day in
                        Text(day)
                            .font(.system(size: 9))
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity)
                    }
                }
                
                calendarGrid(events: entry.events, date: entry.date)
            }
        }
        .padding(8)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private func getMonthYear(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter.string(from: date).capitalized
    }
    
    private func calendarGrid(events: [CalendarEvent], date: Date) -> some View {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: date)
        guard let firstDay = calendar.date(from: components),
              let range = calendar.range(of: .day, in: .month, for: date) else {
            return AnyView(Text("Erro"))
        }
        
        let firstWeekday = calendar.component(.weekday, from: firstDay)
        let daysInMonth = range.count
        let offset = firstWeekday == 1 ? 0 : firstWeekday - 1
        
        let eventDates = Set(events.map { event in
            calendar.startOfDay(for: event.startDate)
        })
        
        let today = calendar.startOfDay(for: Date())
        
        return AnyView(
            VStack(spacing: 2) {
                ForEach(0..<6) { week in
                    HStack(spacing: 4) {
                        ForEach(0..<7) { dayIndex in
                            let day = week * 7 + dayIndex - offset + 1
                            if day > 0 && day <= daysInMonth {
                                let dayDate = calendar.date(byAdding: .day, value: day - 1, to: firstDay)!
                                let dayStart = calendar.startOfDay(for: dayDate)
                                let isToday = dayStart == today
                                let hasEvent = eventDates.contains(dayStart)
                                
                                Text("\(day)")
                                    .font(.system(size: 10, design: .monospaced))
                                    .foregroundColor(isToday ? .white : .primary)
                                    .frame(width: 20, height: 20)
                                    .background(
                                        Group {
                                            if isToday {
                                                Circle().fill(Color.blue)
                                            } else if hasEvent {
                                                Circle().fill(Color.blue.opacity(0.2))
                                            } else {
                                                Circle().fill(Color.clear)
                                            }
                                        }
                                    )
                                    .frame(maxWidth: .infinity)
                            } else {
                                Text("")
                                    .frame(maxWidth: .infinity)
                            }
                        }
                    }
                }
            }
        )
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

@main
struct CalendarWidgetBundle: WidgetBundle {
    var body: some Widget {
        CalendarWidget()
    }
}
`;

      fs.writeFileSync(widgetContentPath, widgetContent, 'utf8');

      const infoPlistPath = path.join(widgetDir, 'Info.plist');
      const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>CalendarWidget</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.widgetkit-extension</string>
    </dict>
</dict>
</plist>
`;

      fs.writeFileSync(infoPlistPath, infoPlistContent, 'utf8');

      return config;
    },
  ]);

  return config;
};

module.exports = withCalendarWidget;

