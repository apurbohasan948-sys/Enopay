package com.apurbo.emotions

import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.activity.ComponentActivity

/**
 * Required broadcast receiver for default SMS app.
 * It receives SMS when the app is the default SMS app.
 */
class SmsDeliverReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        android.util.Log.d("SmsDeliverReceiver", "Received SMS_DELIVER")
        // Delegate to our main SmsReceiver logic
        val smsReceiver = SmsReceiver()
        smsReceiver.onReceive(context, intent)
    }
}

/**
 * Required broadcast receiver for default SMS app.
 * It receives WAP push messages.
 */
class WapPushDeliverReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        // No-op for now
    }
}

/**
 * Required service for default SMS app.
 * It's used by the system to send messages in the background.
 */
class HeadlessSmsSendService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null
}

/**
 * Required activity for default SMS app.
 * It's the entry point for composing a new message.
 */
class ComposeSmsActivity : ComponentActivity() {
    override fun onCreate(saved: android.os.Bundle?) {
        super.onCreate(saved)
        // Redirect to main activity
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
        finish()
    }
}
