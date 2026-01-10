const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { createLocationTrackingService } = require('./LocationTrackingService');
const { createLocationModule } = require('./LocationModule');
const { createLocationPackage } = require('./LocationPackage');
const { updateMainApplication } = require('./MainApplication');

const withAndroidLocationTracking = (config) => {
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const permissions = manifest['uses-permission'];
    
    const requiredPermissions = [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.VIBRATE',
      'android.permission.WAKE_LOCK',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
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
      (service) => service.$?.['android:name'] === '.LocationTrackingService'
    );

    if (!existingService) {
      application.service.push({
        $: {
          'android:name': '.LocationTrackingService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'location',
          'android:stopWithTask': 'false',
        },
      });
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

      const servicePath = path.join(packageDir, 'LocationTrackingService.kt');
      fs.writeFileSync(servicePath, createLocationTrackingService(), 'utf8');

      const modulePath = path.join(packageDir, 'LocationModule.kt');
      fs.writeFileSync(modulePath, createLocationModule(), 'utf8');

      const packagePath = path.join(packageDir, 'LocationPackage.kt');
      fs.writeFileSync(packagePath, createLocationPackage(), 'utf8');

      const mainAppPath = path.join(packageDir, 'MainApplication.kt');
      if (fs.existsSync(mainAppPath)) {
        const updatedContent = updateMainApplication(fs.readFileSync(mainAppPath, 'utf8'));
        fs.writeFileSync(mainAppPath, updatedContent, 'utf8');
      }

      const receiverPath = path.join(packageDir, 'BootReceiver.kt');
      fs.writeFileSync(receiverPath, createBootReceiver(), 'utf8');

      return config;
    },
  ]);

  return config;
};

function createBootReceiver() {
  return `package atacte.seguranca

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import androidx.core.content.ContextCompat

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
      val prefs: SharedPreferences = context.getSharedPreferences(
        "atacte_tracking_prefs",
        Context.MODE_PRIVATE
      )
      
      val wasTrackingActive = prefs.getBoolean("tracking_active", false)
      
      if (wasTrackingActive) {
        LocationTrackingService.start(context)
      }
    }
  }
}
`;
}

module.exports = { withAndroidLocationTracking };

