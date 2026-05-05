package com.apurbo.emotions

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers

class SmsViewModel(application: Application) : AndroidViewModel(application) {
    private val localDb = AppDatabase.getDatabase(application)
    private val smsDao = localDb.smsDao()

    private val _remoteMessages = MutableStateFlow<List<SmsMessage>>(emptyList())
    
    val messages: StateFlow<List<SmsMessage>> = combine(
        smsDao.getAll(),
        _remoteMessages
    ) { local, remote ->
        // Combine and deduplicate if necessary, but here we just merge as local are unsynced
        (local + remote).sortedByDescending { it.timestamp }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        fetchRemoteMessages()
        checkAndScanLocal()
    }

    fun refreshManual() {
        val application = getApplication<Application>()
        viewModelScope.launch(Dispatchers.IO) {
            SmsRepository(application).scanExistingSms()
            SmsRepository(application).syncPendingMessages()
        }
        fetchRemoteMessages()
    }

    private fun checkAndScanLocal() {
        val application = getApplication<Application>()
        if (androidx.core.content.ContextCompat.checkSelfPermission(
                application, android.Manifest.permission.READ_SMS
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            viewModelScope.launch(Dispatchers.IO) {
                SmsRepository(application).scanExistingSms()
            }
        }
    }

    private fun fetchRemoteMessages() {
        try {
            val auth = FirebaseAuth.getInstance()
            val user = auth.currentUser ?: return
            val db = FirebaseFirestore.getInstance()
            
            db.collection("users")
                .document(user.uid)
                .collection("messages")
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .addSnapshotListener { snapshot, e ->
                    if (e != null) {
                        android.util.Log.e("SmsViewModel", "Firestore error", e)
                        return@addSnapshotListener
                    }
                    
                    if (snapshot != null) {
                        val list = snapshot.toObjects(SmsMessage::class.java)
                        _remoteMessages.value = list
                    }
                }
        } catch (e: Exception) {
            android.util.Log.e("SmsViewModel", "Firestore not initialized", e)
        }
    }
}
