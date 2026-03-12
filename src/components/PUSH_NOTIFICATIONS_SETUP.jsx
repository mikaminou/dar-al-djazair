# Push Notifications Integration Guide

## Overview
This system extends your existing in-app notifications to also deliver OS-level push notifications with sound. It works when the app is open, backgrounded, or fully closed.

## Architecture

### 1. Frontend Components
- **PushNotificationManager.jsx**: Initializes service worker and manages subscriptions
- **NotificationSettings.jsx**: UI for users to opt in/out of push and sound
- **PushSetup.jsx**: Helper utilities and setup functions

### 2. Backend Functions
- **sendPushNotification.js**: Main function to send Web Push Protocol messages
- **storePushSubscription.js**: Stores user push subscriptions
- **removePushSubscription.js**: Removes/deactivates subscriptions
- **notifyMessage.js**: Example of how to integrate push into existing triggers

### 3. Service Worker
- Registers via `/sw.js` (note: you must create this in your public folder)
- Listens for push events and displays OS notifications
- Handles notification clicks to navigate to the correct URL
- Plays system notification sound when sound is enabled

### 4. Entities
- **PushSubscription**: Stores endpoint and encryption keys for each user
- **NotificationPreference**: User opt-in preferences for push and sound

## Setup Steps

### Step 1: Set VAPID Keys (✓ Already Done)
VAPID keys are required for Web Push Protocol and are already set in your environment.

### Step 2: Create Service Worker File
Create `/public/sw.js` — see code below or use the lib/service-worker.js template.

### Step 3: Add Notification Settings UI
Add NotificationSettings component to Profile page:
```jsx
import NotificationSettings from '@/components/NotificationSettings';
<NotificationSettings />
```

### Step 4: Create VAPID Public Key Endpoint
Create a simple function to serve the public VAPID key to the frontend.

### Step 5: Update Notification Triggers
For each notification trigger (message, lead, appointment), add:
```javascript
await base44.asServiceRole.functions.invoke('sendPushNotification', {
  user_email,
  title,
  body,
  url,
  ref_id,
  sound_enabled: true,
});
```

## Delivery States Supported

✓ App open in foreground
✓ App backgrounded
✓ App fully closed
✓ PWA on Android/iOS
✓ Browser push notifications

## Key Features

- **Web Push Protocol**: Reliable delivery even when app is closed
- **Service Worker**: Persistent background listener
- **Sound Control**: Users can enable/disable notification sound
- **Deduplication**: Same event doesn't trigger duplicate notifications
- **Auto-cleanup**: Invalid subscriptions removed automatically
- **Opt-in**: Users control push preferences anytime

## Testing

Test with the sendPushNotification function in your dashboard function tester.