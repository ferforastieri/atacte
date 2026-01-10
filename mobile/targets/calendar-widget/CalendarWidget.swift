import WidgetKit
import SwiftUI

struct CalendarWidget: Widget {
    let kind: String = "CalendarWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalendarProvider()) { entry in
            CalendarWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Calendário Atacte")
        .description("Visualize seus eventos do mês")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
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
        let events = loadEvents()
        let currentDate = Date()
        let entry = CalendarEntry(date: currentDate, events: events)
        
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate) ?? currentDate
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func loadEvents() -> [CalendarEvent] {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.atacte.mobile"),
              let eventsData = sharedDefaults.data(forKey: "calendar_events"),
              let eventsJson = try? JSONSerialization.jsonObject(with: eventsData) as? [[String: Any]] else {
            return []
        }
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        return eventsJson.compactMap { eventData -> CalendarEvent? in
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
                color: eventData["color"] as? String ?? "#3b82f6"
            )
        }
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
    let color: String
}

struct CalendarWidgetEntryView: View {
    var entry: CalendarProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallCalendarView(entry: entry)
        case .systemMedium:
            MediumCalendarView(entry: entry)
        case .systemLarge:
            LargeCalendarView(entry: entry)
        default:
            SmallCalendarView(entry: entry)
        }
    }
}

struct SmallCalendarView: View {
    var entry: CalendarProvider.Entry
    
    var body: some View {
        VStack(spacing: 8) {
            Text(getMonthYear(entry.date))
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(Color(hex: "#111827"))
            
            MonthGridView(date: entry.date, events: entry.events, compact: true)
        }
        .padding(12)
        .background(Color.white)
    }
}

struct MediumCalendarView: View {
    var entry: CalendarProvider.Entry
    
    var body: some View {
        HStack(spacing: 12) {
            VStack(spacing: 8) {
                Text(getMonthYear(entry.date))
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Color(hex: "#111827"))
                
                MonthGridView(date: entry.date, events: entry.events, compact: false)
            }
            .frame(maxWidth: .infinity)
            
            if !entry.events.isEmpty {
                Divider()
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("Próximos")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color(hex: "#6b7280"))
                    
                    ForEach(getUpcomingEvents(entry.events).prefix(3), id: \.id) { event in
                        EventRow(event: event)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(12)
        .background(Color.white)
    }
}

struct LargeCalendarView: View {
    var entry: CalendarProvider.Entry
    
    var body: some View {
        VStack(spacing: 12) {
            Text(getMonthYear(entry.date))
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(Color(hex: "#111827"))
            
            MonthGridView(date: entry.date, events: entry.events, compact: false)
            
            if !entry.events.isEmpty {
                Divider()
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Próximos Eventos")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(hex: "#111827"))
                    
                    ForEach(getUpcomingEvents(entry.events).prefix(5), id: \.id) { event in
                        EventRow(event: event, showDate: true)
                    }
                }
            }
        }
        .padding(16)
        .background(Color.white)
    }
}

struct MonthGridView: View {
    let date: Date
    let events: [CalendarEvent]
    let compact: Bool
    
    var body: some View {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: date)
        
        guard let firstDay = calendar.date(from: components),
              let range = calendar.range(of: .day, in: .month, for: date) else {
            return AnyView(Text("Erro"))
        }
        
        let firstWeekday = calendar.component(.weekday, from: firstDay)
        let daysInMonth = range.count
        let offset = firstWeekday - 1
        
        let eventDates = Set(events.map { event in
            calendar.startOfDay(for: event.startDate)
        })
        
        let today = calendar.startOfDay(for: Date())
        
        return AnyView(
            VStack(spacing: compact ? 4 : 6) {
                HStack(spacing: compact ? 2 : 4) {
                    ForEach(["D", "S", "T", "Q", "Q", "S", "S"], id: \.self) { day in
                        Text(day)
                            .font(.system(size: compact ? 9 : 10, weight: .medium))
                            .foregroundColor(Color(hex: "#6b7280"))
                            .frame(maxWidth: .infinity)
                    }
                }
                
                ForEach(0..<6) { week in
                    HStack(spacing: compact ? 2 : 4) {
                        ForEach(0..<7) { dayIndex in
                            let day = week * 7 + dayIndex - offset + 1
                            if day > 0 && day <= daysInMonth {
                                let dayDate = calendar.date(byAdding: .day, value: day - 1, to: firstDay)!
                                let dayStart = calendar.startOfDay(for: dayDate)
                                let isToday = dayStart == today
                                let hasEvent = eventDates.contains(dayStart)
                                
                                DayCell(day: day, isToday: isToday, hasEvent: hasEvent, compact: compact)
                            } else {
                                Text("")
                                    .frame(maxWidth: .infinity, maxHeight: compact ? 20 : 24)
                            }
                        }
                    }
                }
            }
        )
    }
}

struct DayCell: View {
    let day: Int
    let isToday: Bool
    let hasEvent: Bool
    let compact: Bool
    
    var body: some View {
        VStack(spacing: 2) {
            Text("\(day)")
                .font(.system(size: compact ? 10 : 12, weight: isToday ? .bold : .regular))
                .foregroundColor(isToday ? .white : Color(hex: "#111827"))
                .frame(maxWidth: .infinity, maxHeight: compact ? 18 : 20)
                .background(
                    isToday ? Color(hex: "#16a34a") : Color.clear
                )
                .cornerRadius(compact ? 9 : 10)
            
            if hasEvent {
                Circle()
                    .fill(Color(hex: "#3b82f6"))
                    .frame(width: compact ? 3 : 4, height: compact ? 3 : 4)
            }
        }
    }
}

struct EventRow: View {
    let event: CalendarEvent
    var showDate: Bool = false
    
    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(Color(hex: event.color))
                .frame(width: 6, height: 6)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(event.title)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color(hex: "#111827"))
                    .lineLimit(1)
                
                if showDate {
                    Text(formatEventDate(event.startDate))
                        .font(.system(size: 9))
                        .foregroundColor(Color(hex: "#6b7280"))
                }
            }
        }
    }
}

func getMonthYear(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "MMMM yyyy"
    formatter.locale = Locale(identifier: "pt_BR")
    return formatter.string(from: date).capitalized
}

func getUpcomingEvents(_ events: [CalendarEvent]) -> [CalendarEvent] {
    let now = Date()
    return events
        .filter { $0.startDate >= now }
        .sorted { $0.startDate < $1.startDate }
}

func formatEventDate(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "dd/MM HH:mm"
    formatter.locale = Locale(identifier: "pt_BR")
    return formatter.string(from: date)
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

