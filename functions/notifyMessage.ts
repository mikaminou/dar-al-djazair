import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Triggered on: Message CREATE
 * Notifies the message recipient with a link to the conversation thread.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event?.type !== "create") return Response.json({ ok: true, skipped: "not_create" });

    const message = data;
    if (!message?.recipient_email || !message?.sender_email) {
      return Response.json({ ok: true, skipped: "missing_fields" });
    }
    if (message.sender_email === message.recipient_email) {
      return Response.json({ ok: true, skipped: "self_message" });
    }

    const refId = `msg_${message.id}`;
    const existing = await base44.asServiceRole.entities.Notification.filter({ ref_id: refId }, null, 1);
    if (existing.length > 0) return Response.json({ ok: true, skipped: "duplicate" });

    const senderName = message.sender_email.split("@")[0];

    await base44.asServiceRole.entities.Notification.create({
      user_email: message.recipient_email,
      type: "message",
      title: `Nouveau message de ${senderName}`,
      body: message.content?.slice(0, 120) || "",
      url: `Messages?thread=${message.listing_id}&contact=${encodeURIComponent(message.sender_email)}`,
      is_read: false,
      ref_id: refId,
    });

    return Response.json({ ok: true, action: "notification_created" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});