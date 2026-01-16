package atacte.seguranca

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
      "${monthNames[currentMonth]} ${currentYear}"
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
          isToday && hasEvent -> sb.append("[${dayStr}]")
          isToday -> sb.append("(${dayStr})")
          hasEvent -> sb.append("[${dayStr}]")
          else -> sb.append(" ${dayStr} ")
        }
        
        if ((day + dayOffset) % 7 == 0 && day < daysInMonth) {
          sb.append("\n")
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
