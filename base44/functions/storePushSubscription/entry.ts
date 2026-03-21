import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_email, subscription } = await req.json();

    if (user_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if subscription already exists
    const existing = await base44.entities.PushSubscription.filter({
      user_email,
      endpoint: subscription.endpoint,
    });

    if (existing.length > 0) {
      // Update existing
      await base44.entities.PushSubscription.update(existing[0].id, {
        keys_p256dh: subscription.keys.p256dh,
        keys_auth: subscription.keys.auth,
        is_active: true,
      });
    } else {
      // Create new
      await base44.entities.PushSubscription.create({
        user_email,
        endpoint: subscription.endpoint,
        keys_p256dh: subscription.keys.p256dh,
        keys_auth: subscription.keys.auth,
        is_active: true,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});