# Fixing "Client is Offline" Firestore Error

## Problem
When trying to sign in with Google, you see:
- Button shows "Connecting to Google..." indefinitely
- Error: "Failed to get document because the client is offline"

## Root Causes & Solutions

### 1. **Environment Variables Not Loaded** ✅ FIXED
- **Cause**: `.env.local` changes require server restart
- **Solution**: Development server has been restarted
- **Verify**: Server should show "Environments: .env.local" on startup

### 2. **Google Sign-In Not Enabled in Firebase Console**
- **Status**: ⚠️ NEEDS VERIFICATION
- **Steps to Fix**:
  1. Go to [Firebase Console Authentication](https://console.firebase.google.com/project/cnostruct/authentication/providers)
  2. Click on "Sign-in method" tab
  3. Find "Google" provider
  4. Click "Enable" if it's disabled
  5. Add your email as a test user if needed
  6. Save changes

### 3. **Firestore Security Rules Too Restrictive**
- **Status**: ⚠️ NEEDS VERIFICATION
- **Steps to Fix**:
  1. Go to [Firebase Console Firestore Rules](https://console.firebase.google.com/project/cnostruct/firestore/rules)
  2. Check current rules. For development, use:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         // Allow authenticated users to read/write their own user document
         match /users/{userId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
         
         // Allow all authenticated users to read other collections (adjust as needed)
         match /{document=**} {
           allow read, write: if request.auth != null;
         }
       }
     }
     ```
  3. Click "Publish" to save

### 4. **Firestore Database Not Created**
- **Status**: ⚠️ NEEDS VERIFICATION
- **Steps to Fix**:
  1. Go to [Firebase Console Firestore](https://console.firebase.google.com/project/cnostruct/firestore)
  2. If you see "Get started" button, click it to create the database
  3. Choose "Start in production mode" (we'll adjust rules after)
  4. Select a location (us-central1 recommended)
  5. Click "Enable"

### 5. **Network/Firewall Issues**
- **Status**: UNLIKELY but possible
- **Steps to Check**:
  1. Open browser DevTools (F12)
  2. Go to Network tab
  3. Try signing in with Google
  4. Look for failed requests to `firestore.googleapis.com`
  5. If you see CORS errors or blocked requests, check:
     - Browser extensions (ad blockers, privacy tools)
     - Corporate firewall/proxy settings
     - Antivirus software blocking connections

## Testing Steps

After completing the fixes above:

1. **Restart browser** (to clear any cached Firebase state)
2. Go to `http://localhost:3000/signup`
3. Click "Continue with Google"
4. **Expected behavior**:
   - Google sign-in popup opens
   - You select your Google account
   - Popup closes automatically
   - You're redirected to `/materials` page
5. **If it still fails**:
   - Open browser DevTools Console (F12)
   - Try signing in again
   - Share the exact error messages from the Console

## Quick Verification Commands

Run these in the browser Console (F12) after loading the signup page:

```javascript
// Check if Firebase is configured
console.log('Firebase Config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
})

// Check Firestore connection (should not show offline)
import { db } from '@/lib/firebase'
console.log('Firestore instance:', db)
```

## Firebase Console Quick Links

- [Authentication Providers](https://console.firebase.google.com/project/cnostruct/authentication/providers)
- [Firestore Database](https://console.firebase.google.com/project/cnostruct/firestore)
- [Firestore Rules](https://console.firebase.google.com/project/cnostruct/firestore/rules)
- [Project Settings](https://console.firebase.google.com/project/cnostruct/settings/general)

## Next Steps

1. ✅ Server restarted with new environment variables
2. ⚠️ **YOU NEED TO**: Enable Google Sign-In in Firebase Console
3. ⚠️ **YOU NEED TO**: Verify Firestore database exists
4. ⚠️ **YOU NEED TO**: Update Firestore security rules
5. 🧪 Test signup with Google again

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Client is offline" | Firestore can't connect | Check Firestore database exists + rules |
| "popup-blocked" | Browser blocked popup | Allow popups for localhost |
| "auth/configuration-not-found" | Google provider disabled | Enable in Firebase Console |
| "permission-denied" | Firestore rules too strict | Update security rules |
| "network-request-failed" | No internet or firewall | Check network connection |

---

**Last Updated**: After restarting dev server with environment variables
**Status**: Waiting for Firebase Console verification
