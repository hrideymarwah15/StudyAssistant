# Firebase Setup Instructions

## Problem: Login Not Working

The most common reasons accounts aren't logging in:

### 1. **Email/Password Authentication Not Enabled in Firebase**

Go to [Firebase Console](https://console.firebase.google.com/):
1. Select your project: **cnostruct**
2. Go to **Authentication** → **Sign-in method**
3. Enable **Email/Password** provider
4. Click **Save**

### 2. **No Users Created Yet**

You need to either:
- Sign up a new user at `/signup`
- Or manually create users in Firebase Console → Authentication → Users

### 3. **Environment Variables**

The app now reads from `.env.local`. Your credentials are:
```
Project: cnostruct
Auth Domain: cnostruct.firebaseapp.com
```

### Quick Test Steps

1. **Restart the dev server** (environment variables only load on start):
   ```bash
   npm run dev
   ```

2. **Create a test account**:
   - Go to `/signup`
   - Create an account with any email/password
   
3. **Try logging in**:
   - Go to `/login`
   - Use the credentials you just created

### Debugging

Open browser console (F12) and check for errors:
- `auth/configuration-not-found` = Email/Password auth not enabled in Firebase
- `auth/user-not-found` = No user with that email exists
- `auth/wrong-password` = Incorrect password

### Firebase Console Quick Links

- **Authentication**: https://console.firebase.google.com/project/cnostruct/authentication
- **Users List**: https://console.firebase.google.com/project/cnostruct/authentication/users
- **Project Settings**: https://console.firebase.google.com/project/cnostruct/settings/general
