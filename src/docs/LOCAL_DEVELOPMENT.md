# Local development

## One-time setup

```bash
# Install Supabase CLI
brew install supabase/tap/supabase    # macOS
# or: scoop install supabase           # Windows
# or: npm i -g supabase                # cross-platform

# In the repo root
supabase login
supabase link --project-ref <your-project-ref>
```

## Day-to-day

Start a local stack (Postgres + Auth + Storage + Functions) in
Docker:

```bash
supabase start
```

That prints the local API URL and anon key. Put them in `.env.local`
of the Base44 frontend if you want to point it at local instead of
prod.

## Apply migrations

```bash
# Reset the local DB and reapply every migration from scratch
supabase db reset

# Push pending migrations to the linked remote project
supabase db push
```

## Serve functions locally

```bash
supabase functions serve

# Or a single one with hot reload
supabase functions serve send-push-notification --no-verify-jwt
```

## Set secrets on the remote project

```bash
supabase secrets set \
  MAKE_WEBHOOK_URL="https://hook.make.com/..." \
  SOCIAL_POST_CALLBACK_SECRET="..." \
  VAPID_PUBLIC_KEY="..." \
  VAPID_PRIVATE_KEY="..." \
  VAPID_MAILTO="mailto:contact@dar-el-djazair.app"
```

## Configure DB GUC for the approval trigger and cron

Run once in the SQL editor on the remote project:

```sql
alter database postgres set app.settings.functions_url =
  'https://<project-ref>.supabase.co/functions/v1';

alter database postgres set app.settings.service_role_key =
  '<SERVICE_ROLE_KEY>';
```

Then apply `supabase/cron.sql` to schedule the cron jobs.