package com.apurbo.emotions

import android.content.Context
import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

class SmsRepository(private val context: Context) {
    private val localDb = AppDatabase.getDatabase(context)
    private val smsDao = localDb.smsDao()

    suspend fun uploadToFirestore(sms: SmsMessage): Boolean {
        return try {
            val user = FirebaseAuth.getInstance().currentUser ?: return false
            val db = FirebaseFirestore.getInstance()
            db.collection("users")
                .document(user.uid)
                .collection("messages")
                .add(sms)
                .await()
            Log.d("SmsRepository", "Firestore upload successful")
            true
        } catch (e: Exception) {
            Log.e("SmsRepository", "Firestore upload failed", e)
            false
        }
    }

    suspend fun saveLocally(sms: SmsMessage) {
        smsDao.insert(sms)
        Log.d("SmsRepository", "Saved message locally")
    }

    suspend fun scanExistingSms() {
        try {
            val cursor = context.contentResolver.query(
                android.provider.Telephony.Sms.Inbox.CONTENT_URI,
                arrayOf(
                    android.provider.Telephony.Sms.Inbox.ADDRESS,
                    android.provider.Telephony.Sms.Inbox.BODY,
                    android.provider.Telephony.Sms.Inbox.DATE
                ),
                null, null,
                "${android.provider.Telephony.Sms.Inbox.DATE} DESC LIMIT 50"
            )

            cursor?.use {
                val addressIdx = it.getColumnIndex(android.provider.Telephony.Sms.Inbox.ADDRESS)
                val bodyIdx = it.getColumnIndex(android.provider.Telephony.Sms.Inbox.BODY)
                val dateIdx = it.getColumnIndex(android.provider.Telephony.Sms.Inbox.DATE)

                var count = 0
                while (it.moveToNext()) {
                    val sender = it.getString(addressIdx)
                    val body = it.getString(bodyIdx)
                    val timestamp = it.getLong(dateIdx)
                    
                    val category = when {
                        body.contains("bKash", ignoreCase = true) -> "bKash"
                        body.contains("Nagad", ignoreCase = true) -> "Nagad"
                        else -> "Others"
                    }

                    val sms = SmsMessage(
                        sender = sender,
                        body = body,
                        category = category,
                        timestamp = timestamp
                    )
                    saveLocally(sms)
                    count++
                }
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    android.widget.Toast.makeText(context, "Synced $count historical messages", android.widget.Toast.LENGTH_LONG).show()
                }
            }
        } catch (e: Exception) {
            Log.e("SmsRepository", "Error scanning existing SMS", e)
        }
    }

    suspend fun syncPendingMessages() {
        val pending = smsDao.getAllPending()
        if (pending.isEmpty()) return

        Log.d("SmsRepository", "Syncing ${pending.size} pending messages")
        for (sms in pending) {
            if (uploadToFirestore(sms)) {
                smsDao.delete(sms)
                Log.d("SmsRepository", "Synced and removed local message: ${sms.localId}")
            } else {
                break
            }
        }
    }
}
