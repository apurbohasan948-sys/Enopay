# Firebase & Android Setup Guide

To integrate the SMS Organizer Android app with your Firebase project, follow these steps:

## 1. Firebase Console Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **taka-income-korbo**.
3. Click "Add App" and select the **Android** icon.
4. Use the following details:
   - **Android Package Name:** `com.example.smsorganizer`
   - **App Nickname:** SMS Organizer
5. Download the `google-services.json` file.
6. Move the `google-services.json` file into the `android/app/` directory of this project.

## 2. Authentication
1. In the Firebase Console, go to **Authentication**.
2. Click **Get Started**.
3. Enable **Anonymous** sign-in (or Google Sign-In if you prefer to implement the full flow later). 
   *Note: The current app uses `signInAnonymously` in the Dashboard for ease of use, but you must enable it in the console.*

## 3. Firestore Database
1. Go to **Firestore Database**.
2. Ensure you have created a database in the **asia-southeast1** region (as requested).
3. The security rules have already been deployed by this assistant.

## 4. Import to Android Studio
1. Open Android Studio.
2. Select **File > Open**.
3. Navigate to the `/android` directory of this project.
4. Allow Gradle to sync and download dependencies.

## 5. Enable SMS Permissions on Virtual Device
1. Run the app on an emulator.
2. Accept the runtime permissions when prompted.
3. To test, you can send an SMS to the emulator using the "Extended Controls" menu (the three dots in the emulator sidebar):
   - Navigate to **Phone**.
   - Enter a Sender number (e.g., `bKash`).
   - Enter a Body (e.g., `Cash In Tk 500 from 017... TrxID 8K29L0P1`).
   - Click **Send Message**.
4. Check both the Android app UI and the web dashboard for real-time updates!

## Troubleshooting
- **Gradle Sync Fails:** Ensure you have the `google-services.json` in the correct path.
- **Messages not appearing:** Ensure the Android device has an active internet connection to sync with Firestore.
- **Permission Denied:** Check if you granted both `RECEIVE_SMS` and `READ_SMS` permissions.
