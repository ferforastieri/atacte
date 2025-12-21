const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withPersistentLocation = (config) => {
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const permissions = manifest['uses-permission'];
    
    if (!permissions.find(p => p.$?.['android:name'] === 'android.permission.RECEIVE_BOOT_COMPLETED')) {
      permissions.push({
        $: {
          'android:name': 'android.permission.RECEIVE_BOOT_COMPLETED',
        },
      });
    }

    const requiredPermissions = [
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      'com.google.android.gms.permission.ACTIVITY_RECOGNITION',
      'android.permission.ACTIVITY_RECOGNITION',
      'android.permission.WAKE_LOCK',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
      'android.permission.ACCESS_WIFI_STATE',
      'android.permission.CHANGE_WIFI_STATE',
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.CHANGE_NETWORK_STATE',
      'android.permission.VIBRATE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ];

    requiredPermissions.forEach(permissionName => {
      if (!permissions.find(p => p.$?.['android:name'] === permissionName)) {
        permissions.push({
          $: {
            'android:name': permissionName,
          },
        });
      }
    });

    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];
    
    if (!application.service) {
      application.service = [];
    }

    const existingService = application.service.find(
      (service) => service.$?.['android:name'] === '.ForegroundTrackingService'
    );

    if (!existingService) {
      application.service.push({
        $: {
          'android:name': '.ForegroundTrackingService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'location',
          'android:stopWithTask': 'false',
        },
      });
    } else {
      existingService.$['android:stopWithTask'] = 'false';
      existingService.$['android:enabled'] = 'true';
    }

    if (!application.receiver) {
      application.receiver = [];
    }

        const existingReceiver = application.receiver.find(
          (receiver) => receiver.$?.['android:name'] === '.BootReceiver'
        );

        if (!existingReceiver) {
          application.receiver.push({
            $: {
              'android:name': '.BootReceiver',
              'android:enabled': 'true',
              'android:exported': 'true',
            },
            'intent-filter': [{
              action: [{
                $: {
                  'android:name': 'android.intent.action.BOOT_COMPLETED',
                },
              }],
            }],
          });
        }

        const existingUnlockReceiver = application.receiver.find(
          (receiver) => receiver.$?.['android:name'] === '.UnlockReceiver'
        );

        if (!existingUnlockReceiver) {
          application.receiver.push({
            $: {
              'android:name': '.UnlockReceiver',
              'android:enabled': 'true',
              'android:exported': 'false',
            },
            'intent-filter': [{
              action: [{
                $: {
                  'android:name': 'android.intent.action.USER_PRESENT',
                },
              }, {
                $: {
                  'android:name': 'android.intent.action.SCREEN_ON',
                },
              }],
            }],
          });
        }

        return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const serviceDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'atacte',
        'seguranca'
      );
      
      const servicePath = path.join(serviceDir, 'ForegroundTrackingService.kt');

      if (!fs.existsSync(serviceDir)) {
        fs.mkdirSync(serviceDir, { recursive: true });
      }

        const improvedService = `package atacte.seguranca

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

class ForegroundTrackingService : Service() {

  companion object {
    const val CHANNEL_ID = "atacte_tracking_channel"
    const val NOTIFICATION_ID = 4120
    const val ACTION_START = "atacte.seguranca.action.START"
    const val ACTION_STOP = "atacte.seguranca.action.STOP"
    const val ACTION_RESTART = "atacte.seguranca.action.RESTART"
    const val EXTRA_TITLE = "extra_title"
    const val EXTRA_BODY = "extra_body"

    @Volatile
    var isRunning: Boolean = false

    private var wakeLock: PowerManager.WakeLock? = null

    fun start(context: Context, title: String?, body: String?) {
      val serviceIntent = Intent(context, ForegroundTrackingService::class.java).apply {
        action = ACTION_START
        putExtra(EXTRA_TITLE, title)
        putExtra(EXTRA_BODY, body)
      }
      ContextCompat.startForegroundService(context, serviceIntent)
    }

    fun stop(context: Context) {
      val stopIntent = Intent(context, ForegroundTrackingService::class.java).apply {
        action = ACTION_STOP
      }
      context.startService(stopIntent)
    }

    fun restart(context: Context) {
      val restartIntent = Intent(context, ForegroundTrackingService::class.java).apply {
        action = ACTION_RESTART
      }
      ContextCompat.startForegroundService(context, restartIntent)
    }
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    acquireWakeLock()
    requestIgnoreBatteryOptimizations()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    try {
      when (intent?.action) {
        ACTION_START -> {
          val title = intent.getStringExtra(EXTRA_TITLE) ?: "Atacte"
          val body = intent.getStringExtra(EXTRA_BODY) ?: "Rastreamento de localização ativo"
          val notification = buildNotification(title, body)
          startForeground(NOTIFICATION_ID, notification)
          isRunning = true
          saveTrackingState(this, true, title, body)
          acquireWakeLock()
        }
        ACTION_STOP -> {
          releaseWakeLock()
          stopForeground(STOP_FOREGROUND_REMOVE)
          stopSelf()
          isRunning = false
          clearTrackingState(this)
        }
        ACTION_RESTART -> {
          val title = intent.getStringExtra(EXTRA_TITLE) ?: "Atacte"
          val body = intent.getStringExtra(EXTRA_BODY) ?: "Rastreamento de localização ativo"
          val notification = buildNotification(title, body)
          startForeground(NOTIFICATION_ID, notification)
          isRunning = true
          acquireWakeLock()
        }
        else -> {
          if (!isRunning) {
            val prefs = getSharedPreferences("atacte_tracking_prefs", Context.MODE_PRIVATE)
            val title = prefs.getString("notification_title", "Atacte") ?: "Atacte"
            val body = prefs.getString("notification_body", "Rastreamento de localização ativo") 
              ?: "Rastreamento de localização ativo"
            val notification = buildNotification(title, body)
            startForeground(NOTIFICATION_ID, notification)
            isRunning = true
            acquireWakeLock()
          }
        }
      }
    } catch (e: Exception) {
      try {
        val notification = buildNotification("Atacte", "Rastreamento de localização ativo")
        startForeground(NOTIFICATION_ID, notification)
        isRunning = true
        acquireWakeLock()
      } catch (ex: Exception) {
      }
    }

    return START_STICKY or START_REDELIVER_INTENT
  }

  override fun onDestroy() {
    super.onDestroy()
    isRunning = false
    
    try {
      val prefs = getSharedPreferences("atacte_tracking_prefs", Context.MODE_PRIVATE)
      val wasTrackingActive = prefs.getBoolean("tracking_active", false)
      
      if (wasTrackingActive) {
        val restartIntent = Intent(this, ForegroundTrackingService::class.java).apply {
          action = ACTION_RESTART
          val title = prefs.getString("notification_title", "Atacte")
          val body = prefs.getString("notification_body", "Rastreamento de localização ativo")
          putExtra(EXTRA_TITLE, title)
          putExtra(EXTRA_BODY, body)
        }
        ContextCompat.startForegroundService(this, restartIntent)
      } else {
        releaseWakeLock()
      }
    } catch (e: Exception) {
      releaseWakeLock()
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun acquireWakeLock() {
    try {
      releaseWakeLock()
      val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
      wakeLock = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        powerManager.newWakeLock(
          PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
          "Atacte::LocationWakeLock"
        )
      } else {
        powerManager.newWakeLock(
          PowerManager.PARTIAL_WAKE_LOCK,
          "Atacte::LocationWakeLock"
        )
      }
      wakeLock?.apply {
        acquire(10 * 60 * 60 * 1000L)
      }
    } catch (e: Exception) {
    }
  }

  private fun requestIgnoreBatteryOptimizations() {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        val packageName = packageName
        
        if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
          val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:$packageName")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
          }
          startActivity(intent)
        }
      }
    } catch (e: Exception) {
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
    }
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      
      val existingChannel = manager.getNotificationChannel(CHANNEL_ID)
      if (existingChannel != null) {
        return
      }

      val channel = NotificationChannel(
        CHANNEL_ID,
        "Rastreamento de Localização",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Notificação permanente para rastreamento de localização do Atacte"
        setShowBadge(false)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        enableVibration(false)
        enableLights(false)
        setSound(null, null)
        setBypassDnd(false)
      }

      manager.createNotificationChannel(channel)
    }
  }

  private fun buildNotification(title: String, body: String): Notification {
    val launchIntent = packageManager?.getLaunchIntentForPackage(packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }

    val pendingIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val restartIntent = Intent(this, ForegroundTrackingService::class.java).apply {
      action = ACTION_RESTART
      putExtra(EXTRA_TITLE, title)
      putExtra(EXTRA_BODY, body)
    }

    val restartPendingIntent = PendingIntent.getService(
      this,
      1,
      restartIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(body)
      .setSmallIcon(R.drawable.notification_icon)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setContentIntent(pendingIntent)
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setShowWhen(false)
      .setAutoCancel(false)
      .setSilent(true)
      .setDeleteIntent(restartPendingIntent)
      .build()
  }

  private fun saveTrackingState(context: Context, active: Boolean, title: String, body: String) {
    try {
      val prefs: SharedPreferences = context.getSharedPreferences(
        "atacte_tracking_prefs",
        Context.MODE_PRIVATE
      )
      prefs.edit().apply {
        putBoolean("tracking_active", active)
        putString("notification_title", title)
        putString("notification_body", body)
        apply()
      }
    } catch (e: Exception) {
    }
  }

  private fun clearTrackingState(context: Context) {
    try {
      val prefs: SharedPreferences = context.getSharedPreferences(
        "atacte_tracking_prefs",
        Context.MODE_PRIVATE
      )
      prefs.edit().apply {
        putBoolean("tracking_active", false)
        apply()
      }
    } catch (e: Exception) {
    }
  }
}
`;

      fs.writeFileSync(servicePath, improvedService, 'utf8');

      return config;
    },
  ]);

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const moduleDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'atacte',
        'seguranca'
      );
      
      const modulePath = path.join(moduleDir, 'ForegroundTrackingModule.kt');

      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
      }

          const moduleContent = `package atacte.seguranca

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.content.SharedPreferences
import androidx.core.content.ContextCompat
import androidx.core.app.ActivityCompat

class ForegroundTrackingModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val appContext = reactContext.applicationContext

  override fun getName(): String = "ForegroundTracking"

  @ReactMethod
  fun startTracking(title: String?, body: String?, promise: Promise) {
    try {
      ForegroundTrackingService.start(
        appContext,
        title ?: "Atacte",
        body ?: "Rastreamento de localização ativo"
      )
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("FOREGROUND_START_ERROR", error)
    }
  }

  @ReactMethod
  fun stopTracking(promise: Promise) {
    try {
      ForegroundTrackingService.stop(appContext)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("FOREGROUND_STOP_ERROR", error)
    }
  }

  @ReactMethod
  fun isTrackingActive(promise: Promise) {
    promise.resolve(ForegroundTrackingService.isRunning)
  }

  @ReactMethod
  fun restartTracking(title: String?, body: String?, promise: Promise) {
    try {
      ForegroundTrackingService.restart(appContext)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("FOREGROUND_RESTART_ERROR", error)
    }
  }

  @ReactMethod
  fun saveAuthToken(token: String, apiUrl: String, promise: Promise) {
    try {
      val prefs: SharedPreferences = appContext.getSharedPreferences(
        "atacte_auth_prefs",
        android.content.Context.MODE_PRIVATE
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
        android.content.Context.MODE_PRIVATE
      )
      prefs.edit().apply {
        remove("auth_token")
        apply()
      }
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("CLEAR_TOKEN_ERROR", error)
    }
  }

  @ReactMethod
  fun requestActivityRecognition(promise: Promise) {
    try {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
        val permission = "android.permission.ACTIVITY_RECOGNITION"
        val granted = ContextCompat.checkSelfPermission(
          appContext,
          permission
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        
        if (granted) {
          promise.resolve(true)
        } else {
          val activity = reactApplicationContext.currentActivity
          if (activity != null) {
            androidx.core.app.ActivityCompat.requestPermissions(
              activity,
              arrayOf(permission),
              1001
            )
            promise.resolve(false)
          } else {
            promise.resolve(false)
          }
        }
      } else {
        promise.resolve(true)
      }
    } catch (error: Exception) {
      promise.reject("ACTIVITY_RECOGNITION_ERROR", error)
    }
  }
}
`;

      fs.writeFileSync(modulePath, moduleContent, 'utf8');

      return config;
    },
  ]);

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
      
      const packagePath = path.join(packageDir, 'ForegroundTrackingPackage.kt');

      if (!fs.existsSync(packageDir)) {
        fs.mkdirSync(packageDir, { recursive: true });
      }

      const packageContent = `package atacte.seguranca

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ForegroundTrackingPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(ForegroundTrackingModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
`;

      fs.writeFileSync(packagePath, packageContent, 'utf8');

      return config;
    },
  ]);

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const receiverDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'atacte',
        'seguranca'
      );
      
      const receiverPath = path.join(receiverDir, 'BootReceiver.kt');

      if (!fs.existsSync(receiverDir)) {
        fs.mkdirSync(receiverDir, { recursive: true });
      }

      const receiverContent = `package atacte.seguranca

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import androidx.core.content.ContextCompat

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
        intent.action == "android.intent.action.QUICKBOOT_POWERON" ||
        intent.action == "com.htc.intent.action.QUICKBOOT_POWERON") {
      
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        NotificationChannelHelper.setupChannels(context)
      }
      
      val prefs: SharedPreferences = context.getSharedPreferences(
        "atacte_tracking_prefs",
        Context.MODE_PRIVATE
      )
      
      val wasTrackingActive = prefs.getBoolean("tracking_active", false)
      
      if (wasTrackingActive) {
        try {
          val title = prefs.getString("notification_title", "Atacte") ?: "Atacte"
          val body = prefs.getString("notification_body", "Rastreamento de localização ativo") 
            ?: "Rastreamento de localização ativo"
          
          ForegroundTrackingService.start(context, title, body)
        } catch (e: Exception) {
        }
      }
    }
  }
}
`;

      fs.writeFileSync(receiverPath, receiverContent, 'utf8');

      return config;
    },
  ]);

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const receiverDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'atacte',
        'seguranca'
      );
      
      const unlockReceiverPath = path.join(receiverDir, 'UnlockReceiver.kt');

      if (!fs.existsSync(receiverDir)) {
        fs.mkdirSync(receiverDir, { recursive: true });
      }

      const unlockReceiverContent = `package atacte.seguranca

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.location.LocationManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.net.HttpURLConnection
import java.net.URL
import java.io.OutputStream
import org.json.JSONObject
import android.util.Log

class UnlockReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    try {
      when (intent.action) {
        Intent.ACTION_USER_PRESENT -> {
          handleUnlock(context, "UNLOCK")
        }
        Intent.ACTION_SCREEN_ON -> {
          handleUnlock(context, "INTERACTION")
        }
      }
    } catch (e: Exception) {
      Log.e("UnlockReceiver", "Erro ao processar evento", e)
    }
  }

  private fun handleUnlock(context: Context, triggerType: String) {
    try {
      val prefs: SharedPreferences = context.getSharedPreferences(
        "atacte_tracking_prefs",
        Context.MODE_PRIVATE
      )
      
      val isTrackingActive = prefs.getBoolean("tracking_active", false)
      
      if (!isTrackingActive) {
        return
      }

      val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
      if (locationManager == null) {
        return
      }

      val isGpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
      val isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
      
      if (!isGpsEnabled && !isNetworkEnabled) {
        return
      }

      val lastKnownLocation = if (isGpsEnabled) {
        locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
      } else {
        locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
      }

      if (lastKnownLocation != null) {
        sendLocationToBackend(context, lastKnownLocation, triggerType)
      } else {
        requestLocationUpdate(context, triggerType)
      }
    } catch (e: Exception) {
      Log.e("UnlockReceiver", "Erro ao lidar com desbloqueio", e)
    }
  }

  private fun requestLocationUpdate(context: Context, triggerType: String) {
    try {
      val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
      if (locationManager == null) {
        return
      }

      val locationListener = object : android.location.LocationListener {
        override fun onLocationChanged(location: android.location.Location) {
          sendLocationToBackend(context, location, triggerType)
          locationManager.removeUpdates(this)
        }

        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) {}
        override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) {}
      }

      if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
        locationManager.requestLocationUpdates(
          LocationManager.GPS_PROVIDER,
          0L,
          0f,
          locationListener
        )
      } else if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
        locationManager.requestLocationUpdates(
          LocationManager.NETWORK_PROVIDER,
          0L,
          0f,
          locationListener
        )
      }
    } catch (e: Exception) {
      Log.e("UnlockReceiver", "Erro ao solicitar atualização de localização", e)
    }
  }

  private fun sendLocationToBackend(context: Context, location: android.location.Location, triggerType: String) {
    try {
      val prefs: SharedPreferences = context.getSharedPreferences(
        "atacte_auth_prefs",
        Context.MODE_PRIVATE
      )
      
      val token = prefs.getString("auth_token", null)
      if (token == null) {
        return
      }

      val apiUrl = prefs.getString("api_url", null) ?: "http://localhost:3000"
      val endpoint = "\$apiUrl/api/location"

      val payload = JSONObject().apply {
        put("latitude", location.latitude)
        put("longitude", location.longitude)
        put("accuracy", if (location.hasAccuracy()) location.accuracy else null)
        put("altitude", if (location.hasAltitude()) location.altitude else null)
        put("speed", if (location.hasSpeed()) location.speed else null)
        put("heading", if (location.hasBearing()) location.bearing else null)
        put("isMoving", false)
        put("triggerType", triggerType)
      }

      Thread {
        try {
          val url = URL(endpoint)
          val connection = url.openConnection() as HttpURLConnection
          connection.requestMethod = "POST"
          connection.setRequestProperty("Content-Type", "application/json")
          connection.setRequestProperty("Authorization", "Bearer \$token")
          connection.doOutput = true

          val outputStream: OutputStream = connection.outputStream
          outputStream.write(payload.toString().toByteArray())
          outputStream.flush()
          outputStream.close()

          val responseCode = connection.responseCode
          if (responseCode != HttpURLConnection.HTTP_CREATED && responseCode != HttpURLConnection.HTTP_OK) {
            Log.e("UnlockReceiver", "Erro ao enviar localização: \$responseCode")
          }
        } catch (e: Exception) {
          Log.e("UnlockReceiver", "Erro ao enviar localização para backend", e)
        }
      }.start()
    } catch (e: Exception) {
      Log.e("UnlockReceiver", "Erro ao preparar envio de localização", e)
    }
  }
}
`;

      fs.writeFileSync(unlockReceiverPath, unlockReceiverContent, 'utf8');

      return config;
    },
  ]);

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const notificationHelperPath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'atacte',
        'seguranca',
        'NotificationChannelHelper.kt'
      );

      const notificationHelperDir = path.dirname(notificationHelperPath);
      if (!fs.existsSync(notificationHelperDir)) {
        fs.mkdirSync(notificationHelperDir, { recursive: true });
      }

      const notificationHelperCode = `package atacte.seguranca

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi

object NotificationChannelHelper {
  @RequiresApi(Build.VERSION_CODES.O)
  fun setupChannels(context: Context) {
    val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    
    val channels = listOf(
      "atacte_tracking_channel" to NotificationChannel(
        "atacte_tracking_channel",
        "Rastreamento de Localização",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Notificação permanente para rastreamento de localização do Atacte"
        setShowBadge(false)
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
        enableVibration(false)
        enableLights(false)
        setSound(null, null)
        setBypassDnd(false)
      },
      "default" to NotificationChannel(
        "default",
        "Atacte",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Notificações gerais do Atacte"
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 250, 250, 250)
        setShowBadge(true)
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      },
      "family" to NotificationChannel(
        "family",
        "Família",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Notificações da sua família"
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 250, 250, 250)
        setShowBadge(true)
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      },
      "sos" to NotificationChannel(
        "sos",
        "Emergência",
        NotificationManager.IMPORTANCE_MAX
      ).apply {
        description = "Alertas de emergência da família"
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 250, 250, 250)
        setShowBadge(true)
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      },
      "location" to NotificationChannel(
        "location",
        "Localização",
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Rastreamento de localização em andamento"
        enableVibration(false)
        setShowBadge(false)
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
        setSound(null, null)
      }
    )

    channels.forEach { (_, channel) ->
      val existingChannel = notificationManager.getNotificationChannel(channel.id)
      if (existingChannel == null) {
        notificationManager.createNotificationChannel(channel)
      } else {
        try {
          notificationManager.deleteNotificationChannel(channel.id)
        } catch (e: Exception) {
        }
        notificationManager.createNotificationChannel(channel)
      }
    }
  }
}
`;

      fs.writeFileSync(notificationHelperPath, notificationHelperCode, 'utf8');

      const mainAppPath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'atacte',
        'seguranca',
        'MainApplication.kt'
      );

      if (fs.existsSync(mainAppPath)) {
        let mainAppContent = fs.readFileSync(mainAppPath, 'utf8');
        
        if (!mainAppContent.includes('import atacte.seguranca.ForegroundTrackingPackage')) {
          const importIndex = mainAppContent.indexOf('import expo.modules.ApplicationLifecycleDispatcher');
          if (importIndex !== -1) {
            mainAppContent = mainAppContent.slice(0, importIndex) +
              'import atacte.seguranca.ForegroundTrackingPackage\n' +
              'import atacte.seguranca.NotificationChannelHelper\n' +
              'import android.os.Build\n' +
              mainAppContent.slice(importIndex);
          }
        }

        if (!mainAppContent.includes('ForegroundTrackingPackage()')) {
          const packagesIndex = mainAppContent.indexOf('PackageList(this).packages.apply');
          if (packagesIndex !== -1) {
            const addIndex = mainAppContent.indexOf('// Packages that cannot be autolinked', packagesIndex);
            if (addIndex !== -1) {
              const insertIndex = mainAppContent.indexOf('\n', addIndex) + 1;
              mainAppContent = mainAppContent.slice(0, insertIndex) +
                '              add(ForegroundTrackingPackage())\n' +
                mainAppContent.slice(insertIndex);
            } else {
              const applyIndex = mainAppContent.indexOf('apply {', packagesIndex);
              if (applyIndex !== -1) {
                const insertIndex = mainAppContent.indexOf('\n', applyIndex) + 1;
                mainAppContent = mainAppContent.slice(0, insertIndex) +
                  '              add(ForegroundTrackingPackage())\n' +
                  mainAppContent.slice(insertIndex);
              }
            }
          }
        }

        if (!mainAppContent.includes('NotificationChannelHelper.setupChannels')) {
          const onCreateIndex = mainAppContent.indexOf('override fun onCreate()');
          if (onCreateIndex !== -1) {
            const onCreateStart = mainAppContent.indexOf('{', onCreateIndex) + 1;
            const superCallIndex = mainAppContent.indexOf('super.onCreate()', onCreateStart);
            if (superCallIndex !== -1) {
              const insertIndex = mainAppContent.indexOf('\n', superCallIndex) + 1;
              mainAppContent = mainAppContent.slice(0, insertIndex) +
                '      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {\n' +
                '        NotificationChannelHelper.setupChannels(this)\n' +
                '      }\n' +
                mainAppContent.slice(insertIndex);
            }
          }
        }

        fs.writeFileSync(mainAppPath, mainAppContent, 'utf8');
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withPersistentLocation;
