/**
 * Admin-only migration: reclassifies "new_development" → "building"
 * for all existing listings. Idempotent — safe to run multiple times.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all new_development listings (up to 500 per batch)
  const listings = await base44.asServiceRole.entities.Listing.filter(
    { property_type: 'new_development' },
    null,
    500
  );

  let migrated = 0;
  for (const listing of listings) {
    await base44.asServiceRole.entities.Listing.update(listing.id, {
      property_type: 'building',
      audit_log: [
        ...(listing.audit_log || []),
        `[${new Date().toISOString()}] Migrated property_type: new_development → building (Batch W)`
      ]
    });
    migrated++;
  }

  return Response.json({
    migrated,
    message: `Successfully reclassified ${migrated} listings from new_development to building.`
  });
});