# How to add a new table

1. **Create a new migration file** in `supabase/migrations/` with a
   timestamp prefix higher than the highest existing one, e.g.
   `0012_my_feature.sql`. Never edit migrations that have already
   been applied — always add a new one.

2. **Use the conventions:**
   - `id uuid primary key default gen_random_uuid()`
   - `created_at timestamptz not null default now()`
   - `updated_at timestamptz not null default now()` (the trigger in
     `0010_triggers.sql` will auto-bump it because the loop keys off
     the column name).
   - Foreign keys to `profiles(id)` use `on delete cascade` when the
     row is owned by the user, `on delete set null` when it
     references the user but should outlive them.
   - Snake_case column names.
   - Plain `text` + `CHECK` for enums; only use `create type` if the
     value set is truly fixed.
   - JSONB for sparse / per-type data; add a GIN index if you filter
     on it.

3. **Add indexes** in a `... _indexes.sql` companion or at the bottom
   of the same migration. Always add an index for any FK you join on.

4. **Enable RLS and add policies.** RLS without policies = nothing
   readable. At minimum:
   ```sql
   alter table public.my_table enable row level security;

   create policy my_table_owner_all on public.my_table
     for all using (owner_id = auth.uid() or public.is_admin())
     with check (owner_id = auth.uid() or public.is_admin());
   ```
   For public-readable tables, add a separate `for select using (...)`
   policy.

5. **Update `docs/DATABASE_SCHEMA.md`.**

6. **Apply locally first:** `supabase db reset` (wipes + reruns all
   migrations). Then `supabase db push` to deploy.

7. **If the frontend needs it,** expose it via `supabase.from('my_table')`
   and respect the same RLS contract there.