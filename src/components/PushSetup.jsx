// Setup helper for push notifications
// This file contains helper functions for integrating push with existing trigger functions

export async function ensureServiceWorkerRegistered() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

// Usage example for notification trigger functions:
// When creating/updating notification in your trigger functions:
//
// import { notifyUserWithPush } from '@/functions/notificationWithPush';
// 
// await base44.asServiceRole.functions.invoke('notifyUserWithPush', {
//   user_email: 'user@example.com',
//   notification_type: 'message',
//   title: 'New message from John',
//   body: 'Hey, how are you?',
//   url: 'Messages?thread_id=123',
//   sound_enabled: true,
// });

export const NOTIFICATION_TYPES = {
  message: 'message',
  lead_new: 'lead_new',
  lead_high_priority: 'lead_high_priority',
  appointment_proposal: 'appointment_proposal',
  appointment_accepted: 'appointment_accepted',
  appointment_declined: 'appointment_declined',
  appointment_reminder: 'appointment_reminder',
  listing_match: 'listing_match',
  tenant_renewal: 'tenant_renewal',
};

export default { ensureServiceWorkerRegistered, NOTIFICATION_TYPES };