package com.apurbo.emotions

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await
import java.util.regex.Pattern

class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        Log.d("SmsReceiver", "Received intent: ${intent?.action}")
        if (intent?.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION && context != null) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            Log.d("SmsReceiver", "Extracted ${messages.size} messages")
            val pendingResult = goAsync()
            val repository = SmsRepository(context)
            
            @OptIn(DelicateCoroutinesApi::class)
            GlobalScope.launch(Dispatchers.IO) {
                try {
                    for (msg in messages) {
                        val body = msg.messageBody
                        val sender = msg.originatingAddress ?: "Unknown"
                        withContext(Dispatchers.Main) {
                            android.widget.Toast.makeText(context, "New message from $sender", android.widget.Toast.LENGTH_SHORT).show()
                        }
                        processMessage(repository, body, sender)
                    }
                    repository.syncPendingMessages()
                } catch (e: Exception) {
                    Log.e("SmsReceiver", "Error processing SMS", e)
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }

    private suspend fun processMessage(repository: SmsRepository, body: String, sender: String) {
        val category = when {
            body.contains("bKash", ignoreCase = true) -> "bKash"
            body.contains("Nagad", ignoreCase = true) -> "Nagad"
            else -> "Others"
        }

        val trxId = extractTrxId(body)
        val sms = SmsMessage(
            sender = sender,
            body = body,
            category = category,
            trxId = trxId,
            timestamp = System.currentTimeMillis()
        )

        if (!repository.uploadToFirestore(sms)) {
            repository.saveLocally(sms)
        }
    }

    private fun extractTrxId(body: String): String? {
        val pattern = Pattern.compile("(?:TrxID|TxnID|Ref|txnRef)[:\\s]*([A-Z0-9]+)", Pattern.CASE_INSENSITIVE)
        val matcher = pattern.matcher(body)
        return if (matcher.find()) {
            matcher.group(1)
        } else {
            null
        }
    }
}
