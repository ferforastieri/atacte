package atacte.seguranca

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.*
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.*
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

class LocationTrackingService : Service() {

  companion object {
    const val CHANNEL_ID = "location_tracking_channel"
    const val NOTIFICATION_ID = 12345
    const val ACTION_START = "atacte.seguranca.action.START_TRACKING"
    const val ACTION_STOP = "atacte.seguranca.action.STOP_TRACKING"

    @Volatile
    var isRunning: Boolean = false

    fun start(context: Context) {
      val serviceIntent = Intent(context, LocationTrackingService::class.java).apply {
        action = ACTION_START
      }
      ContextCompat.startForegroundService(context, serviceIntent)
    }

    fun stop(context: Context) {
      val stopIntent = Intent(context, LocationTrackingService::class.java).apply {
        action = ACTION_STOP
      }
      context.startService(stopIntent)
    }
  }

  private var locationManager: LocationManager? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

  private val locationListener = object : LocationListener {
    override fun onLocationChanged(location: Location) {
      handleLocationUpdate(location)
    }
    override fun onProviderEnabled(provider: String) {}
    override fun onProviderDisabled(provider: String) {}
    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    acquireWakeLock()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_START -> {
        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification)
        startLocationUpdates()
        isRunning = true
        saveTrackingState(true)
      }
      ACTION_STOP -> {
        stopLocationUpdates()
        releaseWakeLock()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        isRunning = false
        saveTrackingState(false)
      }
    }

    return START_STICKY
  }

  override fun onDestroy() {
    super.onDestroy()
    stopLocationUpdates()
    releaseWakeLock()
    serviceScope.cancel()
    isRunning = false
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun startLocationUpdates() {
    try {
      locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
      
      val providers = locationManager?.allProviders ?: emptyList()
      
      if (providers.contains(LocationManager.GPS_PROVIDER)) {
        locationManager?.requestLocationUpdates(
          LocationManager.GPS_PROVIDER,
          30000L,
          10f,
          locationListener,
          Looper.getMainLooper()
        )
      }
      
      if (providers.contains(LocationManager.NETWORK_PROVIDER)) {
        locationManager?.requestLocationUpdates(
          LocationManager.NETWORK_PROVIDER,
          30000L,
          10f,
          locationListener,
          Looper.getMainLooper()
        )
      }
    } catch (e: SecurityException) {
      android.util.Log.e("LocationTracking", "Erro de permissão ao solicitar atualizações", e)
    } catch (e: Exception) {
      android.util.Log.e("LocationTracking", "Erro ao iniciar atualizações de localização", e)
    }
  }

  private fun stopLocationUpdates() {
    try {
      locationManager?.removeUpdates(locationListener)
      locationManager = null
    } catch (e: Exception) {
      android.util.Log.e("LocationTracking", "Erro ao parar atualizações", e)
    }
  }

  private fun handleLocationUpdate(location: Location) {
    serviceScope.launch {
      try {
        val prefs = getSharedPreferences("atacte_auth_prefs", Context.MODE_PRIVATE)
        val token = prefs.getString("auth_token", null)
        val apiUrl = prefs.getString("api_url", null) ?: "http://localhost:3000"

        if (token == null) {
          android.util.Log.w("LocationTracking", "Token não encontrado")
          return@launch
        }

        val payload = JSONObject().apply {
          put("latitude", location.latitude)
          put("longitude", location.longitude)
          put("accuracy", if (location.hasAccuracy()) location.accuracy else null)
          put("altitude", if (location.hasAltitude()) location.altitude else null)
          put("speed", if (location.hasSpeed()) location.speed else null)
          put("heading", if (location.hasBearing()) location.bearing else null)
          put("isMoving", location.hasSpeed() && location.speed > 0.5)
          put("triggerType", "MOVEMENT")
        }

        sendLocationToServer(apiUrl, token, payload)
      } catch (e: Exception) {
        android.util.Log.e("LocationTracking", "Erro ao processar localização", e)
      }
    }
  }

  private suspend fun sendLocationToServer(apiUrl: String, token: String, payload: JSONObject) {
    withContext(Dispatchers.IO) {
      sendLocationToServerSync(apiUrl, token, payload)
    }
  }

  companion object {
    fun sendLocationToServerSync(apiUrl: String, token: String, payload: JSONObject) {
      try {
        val url = URL("$apiUrl/api/location")
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = "POST"
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.doOutput = true

        connection.outputStream.use { os ->
          os.write(payload.toString().toByteArray())
          os.flush()
        }

        val responseCode = connection.responseCode
        if (responseCode != HttpURLConnection.HTTP_CREATED && responseCode != HttpURLConnection.HTTP_OK) {
          android.util.Log.e("LocationTracking", "Erro ao enviar localização: $responseCode")
        }
      } catch (e: Exception) {
        android.util.Log.e("LocationTracking", "Erro ao enviar localização", e)
      }
    }
  }

  private fun acquireWakeLock() {
    try {
      val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
      wakeLock = powerManager.newWakeLock(
        PowerManager.PARTIAL_WAKE_LOCK,
        "Atacte::LocationWakeLock"
      )
      wakeLock?.acquire(10 * 60 * 60 * 1000L)
    } catch (e: Exception) {
      android.util.Log.e("LocationTracking", "Erro ao adquirir wake lock", e)
    }
  }

  private fun releaseWakeLock() {
    try {
      wakeLock?.let {
        if (it.isHeld) {
          it.release()
        }
      }
      wakeLock = null
    } catch (e: Exception) {
      android.util.Log.e("LocationTracking", "Erro ao liberar wake lock", e)
    }
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Rastreamento de Localização",
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Rastreamento de localização em segundo plano"
        setShowBadge(false)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        enableVibration(false)
        setSound(null, null)
      }

      manager.createNotificationChannel(channel)
    }
  }

  private fun buildNotification(): Notification {
    val launchIntent = packageManager?.getLaunchIntentForPackage(packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }

    val pendingIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Atacte")
      .setContentText("Rastreando localização")
      .setSmallIcon(android.R.drawable.ic_menu_mylocation)
      .setOngoing(true)
      .setContentIntent(pendingIntent)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setSilent(true)
      .build()
  }

  private fun saveTrackingState(active: Boolean) {
    try {
      val prefs = getSharedPreferences("atacte_tracking_prefs", Context.MODE_PRIVATE)
      prefs.edit().putBoolean("tracking_active", active).apply()
    } catch (e: Exception) {
      android.util.Log.e("LocationTracking", "Erro ao salvar estado", e)
    }
  }
}
