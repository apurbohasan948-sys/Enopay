package com.apurbo.emotions

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel as composeViewModel
import com.apurbo.emotions.ui.theme.SmsOrganizerTheme
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.activity.result.contract.ActivityResultContracts
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat

import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private var onPermissionResult: ((Boolean) -> Unit)? = null

    fun requestSmsPermissions(callback: (Boolean) -> Unit) {
        onPermissionResult = callback
        requestPermissionLauncher.launch(
            arrayOf(
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.READ_SMS
            )
        )
    }

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.entries.all { it.value }
        onPermissionResult?.invoke(allGranted)
        if (allGranted) {
            // Permissions granted, sync messages
            lifecycleScope.launch(Dispatchers.IO) {
                SmsRepository(this@MainActivity).syncPendingMessages()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        checkPermissions()
        
        setContent {
            SmsOrganizerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    SmsApp()
                }
            }
        }
    }

    private fun checkPermissions() {
        val permissions = arrayOf(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS
        )
        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            requestPermissionLauncher.launch(missing.toTypedArray())
        }
    }
}

@Composable
fun SmsApp(smsViewModel: SmsViewModel = composeViewModel()) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("bKash", "Nagad", "Others")
    
    val messages by smsViewModel.messages.collectAsState()
    
    Column {
        TabRow(selectedTabIndex = selectedTab) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = { Text(title) }
                )
            }
        }
        
        val filteredMessages = messages.filter { 
            it.category.equals(tabs[selectedTab], ignoreCase = true) 
        }

        // Permission status check
        val context = androidx.compose.ui.platform.LocalContext.current
        var hasSmsPermissions by remember {
            mutableStateOf(
                androidx.core.content.ContextCompat.checkSelfPermission(
                    context, android.Manifest.permission.RECEIVE_SMS
                ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            )
        }

        if (!hasSmsPermissions) {
            Card(
                modifier = Modifier.padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("SMS Permissions Required", style = MaterialTheme.typography.titleSmall)
                    Text("The app needs SMS permissions to organice your transaction messages.", style = MaterialTheme.typography.bodySmall)
                    Button(
                        onClick = { 
                            (context as? MainActivity)?.requestSmsPermissions { granted ->
                                hasSmsPermissions = granted
                            }
                        },
                        modifier = Modifier.padding(top = 8.dp)
                    ) {
                        Text("Grant Permissions")
                    }
                }
            }
        }
        
        LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(filteredMessages) { msg ->
                SmsItem(msg)
                HorizontalDivider()
            }
        }
    }
}

@Composable
fun SmsItem(sms: SmsMessage) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text(text = "From: ${sms.sender}", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = sms.body, maxLines = 2, style = MaterialTheme.typography.bodyMedium)
        if (sms.trxId != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Surface(
                color = MaterialTheme.colorScheme.secondaryContainer,
                shape = MaterialTheme.shapes.small
            ) {
                Text(
                    text = "TrxID: ${sms.trxId}",
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelMedium
                )
            }
        }
    }
}
