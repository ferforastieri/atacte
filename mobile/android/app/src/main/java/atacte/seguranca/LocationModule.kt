package sentro.seguranca

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.content.SharedPreferences
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import android.Manifest
import android.location.LocationManager
import org.json.JSONObject

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
        "sentro_auth_prefs",
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
        "sentro_auth_prefs",
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
    val activity = currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Activity não disponível", null)
      return
    }

    val permissions = arrayOf(
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION
    )

    val fineLocationGranted = ContextCompat.checkSelfPermission(
      appContext,
      Manifest.permission.ACCESS_FINE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED

    val coarseLocationGranted = ContextCompat.checkSelfPermission(
      appContext,
      Manifest.permission.ACCESS_COARSE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED

    if (fineLocationGranted && coarseLocationGranted) {
      promise.resolve(true)
      return
    }

    ActivityCompat.requestPermissions(activity, permissions, 1001)
    promise.resolve(true)
  }

  @ReactMethod
  fun checkLocationPermissions(promise: Promise) {
    val fineLocationGranted = ContextCompat.checkSelfPermission(
      appContext,
      Manifest.permission.ACCESS_FINE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED

    val coarseLocationGranted = ContextCompat.checkSelfPermission(
      appContext,
      Manifest.permission.ACCESS_COARSE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED

    promise.resolve(fineLocationGranted || coarseLocationGranted)
  }

  @ReactMethod
  fun saveCalendarEvents(eventsJson: String, promise: Promise) {
    try {
      val prefs: SharedPreferences = appContext.getSharedPreferences(
        "sentro_calendar_prefs",
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

  @ReactMethod
  fun sendInteractionLocation(promise: Promise) {
    try {
      val locationManager = appContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
      
      val fineLocationGranted = ContextCompat.checkSelfPermission(
        appContext,
        Manifest.permission.ACCESS_FINE_LOCATION
      ) == PackageManager.PERMISSION_GRANTED

      if (!fineLocationGranted) {
        promise.reject("NO_PERMISSION", "Permissão de localização não concedida", null)
        return
      }

      val lastKnownLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
        ?: locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)

      if (lastKnownLocation == null) {
        promise.reject("NO_LOCATION", "Localização não disponível", null)
        return
      }

      val prefs = appContext.getSharedPreferences("sentro_auth_prefs", Context.MODE_PRIVATE)
      val token = prefs.getString("auth_token", null)
      val apiUrl = prefs.getString("api_url", null) ?: "http://localhost:3000"

      if (token == null) {
        promise.reject("NO_TOKEN", "Token não encontrado", null)
        return
      }

      val payload = JSONObject().apply {
        put("latitude", lastKnownLocation.latitude)
        put("longitude", lastKnownLocation.longitude)
        put("accuracy", if (lastKnownLocation.hasAccuracy()) lastKnownLocation.accuracy else null)
        put("altitude", if (lastKnownLocation.hasAltitude()) lastKnownLocation.altitude else null)
        put("speed", if (lastKnownLocation.hasSpeed()) lastKnownLocation.speed else null)
        put("heading", if (lastKnownLocation.hasBearing()) lastKnownLocation.bearing else null)
        put("isMoving", false)
        put("triggerType", "INTERACTION")
      }

      LocationTrackingService.sendLocationToServerSync(apiUrl, token, payload)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("SEND_INTERACTION_ERROR", error)
    }
  }
}
