package atacte.seguranca

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.content.SharedPreferences
import android.content.Context

class LocationModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val appContext = reactContext.applicationContext

  override fun getName(): String = "NativeLocation"

  @ReactMethod
  fun startTracking(promise: Promise) {
    try {
      LocationTrackingService.start(appContext)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("START_TRACKING_ERROR", error)
    }
  }

  @ReactMethod
  fun stopTracking(promise: Promise) {
    try {
      LocationTrackingService.stop(appContext)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("STOP_TRACKING_ERROR", error)
    }
  }

  @ReactMethod
  fun isTrackingActive(promise: Promise) {
    promise.resolve(LocationTrackingService.isRunning)
  }

  @ReactMethod
  fun saveAuthToken(token: String, apiUrl: String, promise: Promise) {
    try {
      val prefs: SharedPreferences = appContext.getSharedPreferences(
        "atacte_auth_prefs",
        Context.MODE_PRIVATE
      )
      prefs.edit().apply {
        putString("auth_token", token)
        putString("api_url", apiUrl)
        apply()
      }
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("SAVE_TOKEN_ERROR", error)
    }
  }

  @ReactMethod
  fun clearAuthToken(promise: Promise) {
    try {
      val prefs: SharedPreferences = appContext.getSharedPreferences(
        "atacte_auth_prefs",
        Context.MODE_PRIVATE
      )
      prefs.edit().apply {
        remove("auth_token")
        remove("api_url")
        apply()
      }
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("CLEAR_TOKEN_ERROR", error)
    }
  }

  @ReactMethod
  fun requestLocationPermissions(promise: Promise) {
    promise.resolve(true)
  }

  @ReactMethod
  fun checkLocationPermissions(promise: Promise) {
    promise.resolve(true)
  }

  @ReactMethod
  fun saveCalendarEvents(eventsJson: String, promise: Promise) {
    try {
      val prefs: SharedPreferences = appContext.getSharedPreferences(
        "atacte_calendar_prefs",
        Context.MODE_PRIVATE
      )
      prefs.edit().apply {
        putString("calendar_events", eventsJson)
        apply()
      }
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("SAVE_CALENDAR_EVENTS_ERROR", error)
    }
  }
}
