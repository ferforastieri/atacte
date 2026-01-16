package atacte.seguranca

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
