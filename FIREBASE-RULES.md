# Firebase Security Rules Setup

## ⚠️ IMPORTANT: Set Security Rules

Your Firebase Realtime Database needs security rules to work properly.

## Steps:

1. Go to **Firebase Console**: https://console.firebase.google.com/
2. Click on your project: **aior-abb56**
3. Click **Realtime Database** (left menu)
4. Click the **Rules** tab (at the top)
5. You'll see the current rules. **Replace them** with:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

6. Click **Publish**

## What These Rules Mean:

- `.read: true` - Anyone can read your data
- `.write: true` - Anyone can write to your data

⚠️ **Note:** These are PUBLIC rules! Anyone with your database URL can read/write data.

## For Production (Later):

You should add Firebase Authentication and use these rules instead:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

This requires users to log in before accessing data.

## For Now:

The public rules are fine for testing. Just don't store sensitive information!

---

After publishing the rules, your Firebase sync will work! ✅
