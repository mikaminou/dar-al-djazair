# Edge Functions

All functions live under `supabase/functions/`. Deploy with:

```bash
supabase functions deploy <name>
```

Set their environment variables with:

```bash
supabase secrets set KEY=value
```

## watermark-listing-media

- **Trigger:** called by the `on_listing_approved` DB trigger; can
  also be invoked manually.
- **Input:** `{ listing_id }`
- **Reads:** `listing_photos`, `listing_videos`
- **Writes:** `listing_photos.watermarked_url`,
  `listing_videos.watermarked_url`, `listings.watermark_status`
- **Notes:** current implementation is a stub that mirrors the URL.
  Replace with real watermarking using the `watermarked-photos` /
  `watermarked-videos` storage buckets.

## social-media-post

- **Trigger:** called by `on_listing_approved`; also invoked from the
  frontend by agencies who manage their own posts.
- **Input:** `{ listing_id, manual_caption?, scheduled_at?, selected_platforms? }`
- **Env:** `MAKE_WEBHOOK_URL`, `SOCIAL_POST_CALLBACK_SECRET`,
  `SUPABASE_URL`
- **Writes:** inserts a `pending` row in `social_posts` per platform.

## social-post-status-callback

- **Trigger:** Make.com → POST with `x-callback-secret` header.
- **Input:** `{ listing_id, platform, status, post_url, error_message,
  facebook_post_id, instagram_media_id }`
- **Writes:** updates the matching pending `social_posts` row.

## send-push-notification

- **Input:** `{ user_email, title, body, url, type }`
- **Env:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_MAILTO`
- **Reads:** `profiles.push_subscription`,
  `profiles.notification_preferences` (respects `prefs[type] = false`).

## generate-pdf-receipt

- **Input:** `{ tenant_payment_id }`
- **Env:** uses storage bucket `receipts` (private)
- **Writes:** `tenant_payments.receipt_url` (signed URL, 1h expiry).

## list-property-types / list-quick-chips

- **Input:** `?lang=fr|ar|en`
- Cached via `Cache-Control: public, max-age=86400`. Frontend fetches
  once at app boot. Mirror of the static config files in the Base44
  frontend — keep both copies in sync.

## scheduled-digest-emails (every 4h)
## scheduled-renewal-reminders (daily)
## scheduled-archive-social-posts (hourly)
## scheduled-token-refresh (daily)

Scheduled via `supabase/cron.sql`. Each one is a thin Deno handler
that loops the relevant table and inserts notifications / cleans up.