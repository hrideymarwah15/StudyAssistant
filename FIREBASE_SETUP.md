# Firebase Setup Guide

## Fixing "auth/configuration-not-found" Error

This error occurs when Firebase Authentication is not properly configured in your Firebase project. Follow these steps to fix it:

### Step 1: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **construct-36728**
3. In the left sidebar, click on **Authentication**
4. Click **Get Started** (if you haven't enabled it yet)
5. Go to the **Sign-in method** tab
6. Click on **Email/Password**
7. Enable the **Email/Password** provider
8. Click **Save**

### Step 1b: Enable Google Sign-In

1. Still under **Authentication > Sign-in method**
2. Click the **Google** provider
3. Enable it
4. Provide an appropriate support email (usually your Gmail)
5. Click **Save**
6. Optional but recommended: add your app’s domain (e.g. `http://localhost:3000`) in the authorized domains list

### Step 2: Verify Your Configuration

Make sure your Firebase configuration matches your project:

- **Project ID**: `construct-36728`
- **Auth Domain**: `construct-36728.firebaseapp.com`
- **API Key**: Check in Firebase Console > Project Settings > General

### Step 3: Check Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings**
2. Scroll to **Authorized domains**
3. Make sure `localhost` is listed (it should be by default)
4. If deploying, add your production domain

### Step 4: Verify Firestore Rules (Optional)

If you're also using Firestore, make sure your security rules allow user creation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 5: Restart Your Development Server

After making changes in Firebase Console:

```bash
npm run dev
```

### Using Environment Variables (Recommended)

For better security, create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=construct-36728.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=construct-36728
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=construct-36728.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=233523505673
NEXT_PUBLIC_FIREBASE_APP_ID=1:233523505673:web:e33d871b87d3b248dae6d8
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-QGW8V4Q93E
```

The application will automatically use these environment variables if they're set.

### Troubleshooting

If you still see the error after following these steps:

1. **Clear browser cache** and try again
2. **Check browser console** for more detailed error messages
3. **Verify your Firebase project** is active and not deleted
4. **Check network tab** to see if Firebase API calls are being blocked
5. **Try in incognito mode** to rule out browser extensions interfering

### Common Issues

- **"auth/operation-not-allowed"**: Email/Password provider is not enabled
- **"auth/configuration-not-found"**: Authentication is not set up in Firebase Console
- **"auth/network-request-failed"**: Network connectivity issue or CORS problem
- **"auth/api-key-not-valid"**: API key is incorrect or restricted

For more help, visit: https://firebase.google.com/docs/auth/web/start

