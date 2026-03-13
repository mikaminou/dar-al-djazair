import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Fetch recipient's preferred language from their user profile
async function getRecipientLang(base44, email) {
  const users = await base44.asServiceRole.entities.User.filter({ email }, null, 1).catch(() => []);
  return users[0]?.lang || "fr";
}

const T = {
  newMessage: { fr: "Nouveau message de", en: "New message from", ar: "رسالة جديدة من" },
};
const t = (key, lang) => T[key][lang] || T[key].fr;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    let recipient_email, sender_name, sender_email, message_preview, thread_id;

    if (body.data && body.event) {
      const msg = body.data;
      recipient_email = msg.recipient_email;
      sender_email = msg.sender_email;
      sender_name = sender_email;
      message_preview = msg.content ? msg.content.substring(0, 100) : '';
      thread_id = msg.thread_id;
    } else {
      ({ recipient_email, sender_name, message_preview, thread_id } = body);
      sender_name = sender_name || recipient_email;
    }

    if (!recipient_email) {
      return Response.json({ error: 'Missing recipient_email' }, { status: 400 });
    }

    if (sender_email && recipient_email === sender_email) {
      return Response.json({ success: true, skipped: 'sender == recipient' });
    }

    const lang = await getRecipientLang(base44, recipient_email);
    const title = `${t("newMessage", lang)} ${sender_name}`;
    const ref_id = `message_${thread_id}_${Date.now()}`;

    await base44.asServiceRole.entities.Notification.create({
      user_email: recipient_email,
      type: 'message',
      title,
      body: message_preview,
      url: `Messages?thread_id=${thread_id}`,
      is_read: false,
      ref_id,
    });

    try {
      await base44.asServiceRole.functions.invoke('sendPushNotification', {
        user_email: recipient_email,
        title,
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