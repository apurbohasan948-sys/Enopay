package com.apurbo.emotions

import androidx.room.*

@Dao
interface SmsDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(sms: SmsMessage)

    @Query("SELECT * FROM pending_messages ORDER BY timestamp DESC")
    fun getAll(): kotlinx.coroutines.flow.Flow<List<SmsMessage>>

    @Query("SELECT * FROM pending_messages")
    suspend fun getAllPending(): List<SmsMessage>

    @Delete
    suspend fun delete(sms: SmsMessage)
}

@Database(entities = [SmsMessage::class], version = 2, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun smsDao(): SmsDao
 
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
 
        fun getDatabase(context: android.content.Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "sms_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
