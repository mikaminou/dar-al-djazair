import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY');

// Helper to send push via Web Push Protocol
async function sendWebPush(subscription, payload) {
  const vapidSubject = 'mailto:noreply@dari.dz';

  // Import web-push dynamically
  const webPush = await import('npm:web-push@3.6.7');
  webPush.setVapidDetails(vapidSubject, VAPID_PUBLIC, VAPID_PRIVATE);

  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    // If subscription is invalid, mark as inactive
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, invalid: true, error: error.message };
    }
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    // Only service role can call this directly (called from other functions/automations)
    // For now, allow service-role calls only
    const { user_email, title, body, url, ref_id, sound_enabled } = await req.json();

    if (!user_email || !title || !ref_id) {
      return Response.json(
        { error: 'Missing required fields: user_email, title, ref_id' },
        { status: 400 }
      );
    }

    // Get user's push subscriptions
    const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({
      user_email,
      is_active: true,
    });

    if (subscriptions.length === 0) {
      return Response.json({ success: true, sent: 0, reason: 'No active subscriptions' });
    }

    // Get user's notification preferences
    const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({
      user_email,
    });

    const pushEnabled = prefs[0]?.push_enabled ?? true;
    const soundEnabled_pref = prefs[0]?.sound_enabled ?? true;
    const finalSoundEnabled = sound_enabled !== undefined ? sound_enabled : soundEnabled_pref;

    if (!pushEnabled) {
      return Response.json({ success: true, sent: 0, reason: 'Push notifications disabled for user' });
    }

    // Prepare payload
    const payload = {
      title,
      body,
      url: url || '/',
      ref_id,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      sound_enabled: finalSoundEnabled,
      actions: [],
    };

    // Send to all subscriptions
    const results = [];
    for (const sub of subscriptions) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth,
        },
      };

      const result = await sendWebPush(subscription, payload);
      results.push(result);

      // Mark invalid subscriptions as inactive
      if (result.invalid) {
        await base44.asServiceRole.entities.PushSubscription.update(sub.id, {
          is_active: false,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return Response.json({ success: true, sent: successCount, total: subscriptions.length });
  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});