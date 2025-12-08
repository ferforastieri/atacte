const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo para implementar localização persistente com notificação permanente
 * Similar ao Life360 - garante que o serviço nunca seja morto pelo sistema
 * 
 * Este plugin modifica os arquivos Kotlin durante o build, não diretamente
 */
const withPersistentLocation = (config) => {
  // 1. Modificar AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];
    
    if (!application.service) {
      application.service = [];
    }

    // Verificar se o serviço já existe
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
      // Atualizar serviço existente
      existingService.$['android:stopWithTask'] = 'false';
      existingService.$['android:enabled'] = 'true';
    }

    return config;
  });

  // 2. Criar/Modificar ForegroundTrackingService.kt durante o build
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

      // Criar diretório se não existir
      if (!fs.existsSync(serviceDir)) {
        fs.mkdirSync(serviceDir, { recursive: true });
      }

      // Criar ou substituir o arquivo completamente
        const improvedService = `package atacte.seguranca

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/**
 * Serviço de localização persistente com notificação permanente
 * Similar ao Life360 - garante que o serviço nunca seja morto pelo sistema
 */
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
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_START -> {
        val title = intent.getStringExtra(EXTRA_TITLE) ?: "Atacte"
        val body = intent.getStringExtra(EXTRA_BODY) ?: "Rastreamento de localização ativo"
        val notification = buildNotification(title, body)
        startForeground(NOTIFICATION_ID, notification)
        isRunning = true
      }
      ACTION_STOP -> {
        releaseWakeLock()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        isRunning = false
      }
      ACTION_RESTART -> {
        // Reiniciar o serviço se foi morto
        val title = intent.getStringExtra(EXTRA_TITLE) ?: "Atacte"
        val body = intent.getStringExtra(EXTRA_BODY) ?: "Rastreamento de localização ativo"
        val notification = buildNotification(title, body)
        startForeground(NOTIFICATION_ID, notification)
        isRunning = true
      }
      else -> {
        // Se o serviço foi reiniciado pelo sistema, manter rodando
        if (!isRunning) {
          val notification = buildNotification(
            "Atacte",
            "Rastreamento de localização ativo"
          )
          startForeground(NOTIFICATION_ID, notification)
          isRunning = true
        }
      }
    }

    // START_STICKY garante que o serviço seja reiniciado se morto pelo sistema
    // START_REDELIVER_INTENT garante que intents sejam redeliverados
    // Isso garante que mesmo se o Android matar o serviço, ele será reiniciado automaticamente
    return START_STICKY or START_REDELIVER_INTENT
  }

  override fun onDestroy() {
    super.onDestroy()
    releaseWakeLock()
    isRunning = false
    
    // Tentar reiniciar o serviço se foi morto inesperadamente
    try {
      val restartIntent = Intent(this, ForegroundTrackingService::class.java).apply {
        action = ACTION_RESTART
      }
      ContextCompat.startForegroundService(this, restartIntent)
    } catch (e: Exception) {
      // Ignorar erros ao tentar reiniciar
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun acquireWakeLock() {
    try {
      val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
      wakeLock = powerManager.newWakeLock(
        PowerManager.PARTIAL_WAKE_LOCK,
        "Atacte::LocationWakeLock"
      ).apply {
        acquire(10 * 60 * 60 * 1000L) // 10 horas
      }
    } catch (e: Exception) {
      // Ignorar se não conseguir adquirir wake lock
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
      // Ignorar erros
    }
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      
      // Verificar se o canal já existe
      val existingChannel = manager.getNotificationChannel(CHANNEL_ID)
      if (existingChannel != null) {
        return
      }

      val channel = NotificationChannel(
        CHANNEL_ID,
        "Rastreamento de Localização",
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Notificação permanente para rastreamento de localização do Atacte"
        setShowBadge(false)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        enableVibration(false)
        enableLights(false)
        setSound(null, null)
        setBypassDnd(false) // Não ignorar modo não perturbe
        // IMPORTANCE_LOW garante que a notificação não seja removida automaticamente
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

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(body)
      .setSmallIcon(R.drawable.notification_icon)
      .setOngoing(true) // NOTIFICAÇÃO PERSISTENTE - não pode ser removida pelo usuário
      .setOnlyAlertOnce(true)
      .setContentIntent(pendingIntent)
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setShowWhen(false)
      .setAutoCancel(false) // Não remove automaticamente
      .setDeleteIntent(null) // Não permite remoção
      .build()
  }
}
`;

      // Sempre escrever o arquivo (criar ou substituir)
      fs.writeFileSync(servicePath, improvedService, 'utf8');

      return config;
    },
  ]);

  // 3. Criar ForegroundTrackingModule.kt
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

      // Criar diretório se não existir
      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
      }

      const moduleContent = `package atacte.seguranca

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

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
}
`;

      fs.writeFileSync(modulePath, moduleContent, 'utf8');

      return config;
    },
  ]);

  // 4. Criar ForegroundTrackingPackage.kt
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

      // Criar diretório se não existir
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

  // 5. Modificar MainApplication.kt para registrar o package
  config = withDangerousMod(config, [
    'android',
    async (config) => {
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
        
        // Adicionar import se não existir
        if (!mainAppContent.includes('import atacte.seguranca.ForegroundTrackingPackage')) {
          const importIndex = mainAppContent.indexOf('import expo.modules.ApplicationLifecycleDispatcher');
          if (importIndex !== -1) {
            mainAppContent = mainAppContent.slice(0, importIndex) +
              'import atacte.seguranca.ForegroundTrackingPackage\n' +
              mainAppContent.slice(importIndex);
          }
        }

        // Adicionar package se não existir
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
              // Se não encontrar o comentário, adicionar após apply {
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

        fs.writeFileSync(mainAppPath, mainAppContent, 'utf8');
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withPersistentLocation;
