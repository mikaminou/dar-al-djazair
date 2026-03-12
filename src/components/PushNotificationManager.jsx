import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function PushNotificationManager() {
  useEffect(() => {
    const initPush = async () => {
      try {
        // Check if service workers are supported
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          console.warn('Push notifications not supported');
          return;
        }

        // Get current user
        const user = await base44.auth.me();
        if (!user) return;

        // Register service worker (load from public)
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Get or create subscription
        let subscription = await registration.pushManager.getSubscription();

        // Get user preference
        const prefs = await base44.entities.NotificationPreference.filter({
          user_email: user.email,
        });
        const pushEnabled = prefs[0]?.push_enabled ?? true;

        if (pushEnabled && !subscription) {
          // Subscribe if enabled but not yet subscribed
          try {
            const vapidResponse = await fetch('/api/functions/getVapidPublic');
            const vapidText = await vapidResponse.text();
            
            // Convert base64 to Uint8Array for applicationServerKey
            const binaryString = atob(vapidText);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: bytes,
            });

            // Store subscription server-side
            await base44.functions.invoke('storePushSubscription', {
              user_email: user.email,
              subscription: subscription.toJSON(),
            });
          } catch (subError) {
            console.error('Failed to subscribe to push:', subError);
          }
        } else if (!pushEnabled && subscription) {
          // Unsubscribe if disabled
          await subscription.unsubscribe();
          await base44.functions.invoke('removePushSubscription', {
            user_email: user.email,
            endpoint: subscription.endpoint,
          });
        }
      } catch (error) {
        console.error('Push notification init error:', error);
      }
    };

    initPush();
  }, []);

  // No visible UI — this is a background manager
  return null;
}

export default PushNotificationManager;