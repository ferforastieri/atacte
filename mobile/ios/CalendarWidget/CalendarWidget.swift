import WidgetKit
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

        guard let url = URL(string: "\(apiUrl)/api/calendar?startDate=\(startDateStr)&endDate=\(endDateStr)") else {
            completion([])
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
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
                    ForEach(["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], id: .self) { day in
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
