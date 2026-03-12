import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Example of how to integrate push notifications into existing trigger
// This extends the existing notifyMessage function with push delivery

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { recipient_email, sender_name, message_preview, thread_id } = await req.json();

    if (!recipient_email) {
      return Response.json({ error: 'Missing recipient_email' }, { status: 400 });
    }

    const ref_id = `message_${thread_id}`;

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: recipient_email,
      type: 'message',
      title: `Message from ${sender_name}`,
      body: message_preview || 'You have a new message',
      url: `Messages?thread_id=${thread_id}`,
      is_read: false,
      ref_id,
    });

    // Send push notification
    try {
      await base44.asServiceRole.functions.invoke('sendPushNotification', {
        user_email: recipient_email,
        title: `Message from ${sender_name}`,
        body: message_preview || 'You have a new message',
        url: `Messages?thread_id=${thread_id}`,
        ref_id,
        sound_enabled: true,
      });
    } catch (pushError) {
      console.warn('Push notification failed:', pushError);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('notifyMessage error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});