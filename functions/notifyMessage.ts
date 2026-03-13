import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both: entity automation payload { event, data } and direct call { recipient_email, ... }
    let recipient_email, sender_name, sender_email, message_preview, thread_id;

    if (body.data && body.event) {
      // Called from entity automation (Message create)
      const msg = body.data;
      recipient_email = msg.recipient_email;
      sender_email = msg.sender_email;
      sender_name = sender_email; // fallback — no name in Message entity
      message_preview = msg.content ? msg.content.substring(0, 100) : 'You have a new message';
      thread_id = msg.thread_id;
    } else {
      // Called directly
      ({ recipient_email, sender_name, message_preview, thread_id } = body);
      sender_name = sender_name || recipient_email;
    }

    if (!recipient_email) {
      return Response.json({ error: 'Missing recipient_email' }, { status: 400 });
    }

    // Don't notify sender themselves
    if (sender_email && recipient_email === sender_email) {
      return Response.json({ success: true, skipped: 'sender == recipient' });
    }

    const ref_id = `message_${thread_id}_${Date.now()}`;

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: recipient_email,
      type: 'message',
      title: `رسالة جديدة من ${sender_name}`,
      body: message_preview,
      url: `Messages?thread_id=${thread_id}`,
      is_read: false,
      ref_id,
    });

    // Send push notification
    try {
      await base44.asServiceRole.functions.invoke('sendPushNotification', {
        user_email: recipient_email,
        title: `رسالة جديدة من ${sender_name}`,
        body: message_preview,
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