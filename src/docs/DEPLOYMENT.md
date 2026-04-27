# Deployment

Two surfaces, two deploy flows.

## Frontend (Base44)

- Edit in Base44 → click **Publish** in the Base44 dashboard.
- Base44 also pushes a copy to the connected GitHub repo.
- No build step on your side; Base44 handles Vite build & hosting.

## Backend (Supabase)

```bash
# DB migrations
supabase db push

# Edge functions (deploy all)
for fn in supabase/functions/*/; do
  supabase functions deploy "$(basename "$fn")"
done

# Or one at a time
supabase functions deploy social-media-post
```

## Smoke test after deploy

1. Sign up a fresh user → confirm a `profiles` row is created.
2. Insert a listing with `status = 'pending'` → admin updates to
   `'active'` → check that:
   - `notifications` has a row for the owner.
   - `social_posts` rows are created.
   - `listings.watermark_status = 'done'` after the function runs.
3. Realtime: open two browser tabs in the same conversation, send a
   message, confirm the second tab sees it without refresh.

## Rollback

- DB: write a new migration that reverses the change. Never edit a
  shipped migration.
- Functions: `supabase functions deploy <name>` from the previous
  commit.