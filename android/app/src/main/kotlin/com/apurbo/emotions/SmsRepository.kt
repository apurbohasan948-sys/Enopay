package com.apurbo.emotions

import android.content.Context
import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

class SmsRepository(private val context: Context) {
    private val db = FirebaseFirestore.getInstance()
    private val localDb = AppDatabase.getDatabase(context)
    private val smsDao = localDb.smsDao()

    suspend fun uploadToFirestore(sms: SmsMessage): Boolean {
        val user = FirebaseAuth.getInstance().currentUser ?: return false
        return try {
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
