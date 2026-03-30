import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * One-time migration: rename 'agency' role to 'professional', set plans.
 * Admin only. Run once from dashboard -> functions -> migrateUserRoles.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list(null, 1000);
    let migratedAgency = 0;
    let setFree = 0;

    for (const u of allUsers) {
      const updates = {};
      if (u.role === 'agency') {
        updates.role = 'professional';
        updates.plan = 'premium';
        migratedAgency++;
      } else if (!u.plan) {
        updates.plan = 'free';
        setFree++;
      }
      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.User.update(u.id, updates);
      }
    }

    // Also migrate VerificationRequest types
    const allReqs = await base44.asServiceRole.entities.VerificationRequest.list(null, 1000);
    let migratedReqs = 0;
    for (const r of allReqs) {
      if (r.type === 'agency') {
        await base44.asServiceRole.entities.VerificationRequest.update(r.id, { type: 'professional' });
        migratedReqs++;
      }
    }

    return Response.json({
      ok: true,
      migratedAgencyUsers: migratedAgency,
      setPlanFreeUsers: setFree,
      migratedVerificationRequests: migratedReqs,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});