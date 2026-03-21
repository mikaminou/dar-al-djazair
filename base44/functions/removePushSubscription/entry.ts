import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_email, endpoint } = await req.json();

    if (user_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find and delete subscription
    const subscriptions = await base44.entities.PushSubscription.filter({
      user_email,
      endpoint,
    });

    if (subscriptions.length > 0) {
      await base44.entities.PushSubscription.delete(subscriptions[0].id);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});