import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await req.json();
    const allowedRoles = ['user', 'professional'];
    if (!allowedRoles.includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    try {
      await base44.asServiceRole.entities.User.update(user.id, { role });
    } catch (updateErr) {
      // Platform may block role changes for the app owner — treat as non-fatal
      if (updateErr.message && updateErr.message.includes('owner')) {
        return Response.json({ success: true, skipped: 'owner' });
      }
      throw updateErr;
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});