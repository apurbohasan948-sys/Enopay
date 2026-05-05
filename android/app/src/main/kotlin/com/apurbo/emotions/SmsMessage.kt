package com.apurbo.emotions

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.firebase.firestore.Exclude

@Entity(
    tableName = "pending_messages",
    indices = [androidx.room.Index(value = ["sender", "body", "timestamp"], unique = true)]
)
data class SmsMessage(
    @get:Exclude @PrimaryKey(autoGenerate = true) val localId: Int = 0,
    val sender: String = "",
    val body: String = "",
    val category: String = "Others",
    val trxId: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)
