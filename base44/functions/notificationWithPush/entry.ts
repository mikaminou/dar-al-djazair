import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Helper function to send both in-app and push notifications
// Call this from other notification trigger functions
export async function notifyUserWithPush(base44, {
  user_email,
  notification_type,
  title,
  body,
  url,
  icon_data,
  sound_enabled = true,
}) {
  // Check for duplicate notifications (same ref_id within last minute)
  const ref_id = `${notification_type}_${Date.now()}`;

  try {
    // 1. Create in-app notification
    const inAppRef = `${notification_type}_${user_email}`;
    
    const existingNotif = await base44.asServiceRole.entities.Notification.filter({
      ref_id: inAppRef,
      is_read: false,
      user_email,
    });

    if (existingNotif.length === 0) {
      await base44.asServiceRole.entities.Notification.create({
        user_email,
        type: notification_type,
        title,
        body,
        url: url || '/',
        is_read: false,
        ref_id: inAppRef,
      });
    }

    // 2. Send push notification via sendPushNotification function
    try {
      await base44.asServiceRole.functions.invoke('sendPushNotification', {
        user_email,
        title,
        body,
        url: url || '/',
        ref_id: inAppRef,
        sound_enabled,
      });
    } catch (pushError) {
      // Push failure doesn't block in-app notification
      console.warn('Push notification failed:', pushError.message);
    }

    return { success: true, ref_id: inAppRef };
  } catch (error) {
    console.error('Notification error:', error);
    return { success: false, error: error.message };
  }
}

// Example: Call this function from any trigger
Deno.serve(async (req) => {
  // This is a helper function, not directly called
  return Response.json({ error: 'Use notifyUserWithPush helper from other functions' }, { status: 400 });
});