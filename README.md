# 📱 SMS TX Organizer: Android + Web Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Android](https://img.shields.io/badge/Platform-Android-green.svg)]()
[![React](https://img.shields.io/badge/Frontend-React-61DAFB.svg)]()
[![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28.svg)]()

A full-stack solution to automatically read, categorize, and archive SMS-based financial transactions (specifically bKash and Nagad in Bangladesh) from an Android device into a centralized Firebase-powered web dashboard.

---

## 🚀 Overview

This project consists of two main components:
1.  **Android App**: A background service that listens for specific sender IDs (bKash, Nagad), parses the transaction data (TrxID, Amount, Type), and syncs it to Firestore.
2.  **Web Dashboard**: A real-time React application that allows you to monitor and organize these transactions from any browser.

### Key Features
-   **Automated Parsing**: Extracts TrxID and message body automatically.
-   **Real-time Sync**: Uses Firestore snapshots for instant updates on the dashboard.
-   **Anonymized Auth**: Simple, secure access using Firebase Anonymous Authentication.
-   **Category Filtering**: Quickly switch between bKash, Nagad, and other transaction types.
-   **Dark Mode UI**: Professional, high-density interface optimized for financial tracking.

---

## 🛠️ Tech Stack

### Android App
-   **Language**: Kotlin
-   **UI**: Jetpack Compose
-   **Storage**: Room (Local Cache) + Firestore (Remote Sync)
-   **Infrastructure**: BroadcastReceivers for SMS listening.

### Web Dashboard
-   **Framework**: React 19 (Vite)
-   **Styling**: Tailwind CSS 4.0
-   **Animations**: Framer Motion
-   **Icons**: Lucide React
-   **Database**: Firebase Firestore

---

## 📦 Getting Started

### Prerequisites
-   Android Studio (Ladybug or newer)
-   Node.js (v18+) & npm
-   A Firebase Project

### 1. Firebase Setup
Check our detailed [Firebase Setup Guide](./docs/FIREBASE_SETUP.md) for step-by-step instructions on:
-   Creating the Firebase project.
-   Downloading `google-services.json` for Android.
-   Configuring `firebase-applet-config.json` for the Web Dashboard.

### 2. Android App Installation
1.  Open the `/android` folder in Android Studio.
2.  Place your `google-services.json` in `app/`.
3.  Build and run on your physical device or emulator.
4.  **Note**: Grant SMS permissions when prompted!

### 3. Web Dashboard Run
1.  In the project root:
    ```bash
    npm install
    npm run dev
    ```
2.  Open `http://localhost:3000` to view your transactions.

---

## 🔒 Security & Privacy

This application is designed for personal use. 
-   **Permissions**: The Android app requires `RECEIVE_SMS` and `READ_SMS`.
-   **Security Rules**: Firestore rules are configured to ensure users can only read/write their own data (scoped by `UID`).
-   **Check `firestore.rules`** in the repository for more details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Made with ❤️ for efficient finance tracking.*
