import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const currentYear = new Date().getFullYear();
  const pros = await base44.asServiceRole.entities.User.filter({ role: 'professional' }, null, 500);

  let migrated = 0, skipped = 0, flagged = [];

  for (const pro of pros) {
    if (pro.founded_year) { skipped++; continue; } // already migrated
    const yoe = parseInt(pro.years_of_experience, 10);
    if (!yoe || yoe <= 0) { skipped++; continue; }

    const computedYear = currentYear - yoe;
    if (computedYear < 1950) {
      flagged.push({ email: pro.email, computed: computedYear });
      skipped++;
      continue;
    }

    await base44.asServiceRole.entities.User.update(pro.id, { founded_year: computedYear });
    migrated++;
  }

  return Response.json({ migrated, skipped, flagged });
});