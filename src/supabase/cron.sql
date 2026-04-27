-- Schedule cron jobs. Apply AFTER setting:
--   alter database postgres set app.settings.functions_url =
--     'https://<project-ref>.supabase.co/functions/v1';
--   alter database postgres set app.settings.service_role_key =
--     '<SERVICE_ROLE_KEY>';

select cron.schedule(
  'digest-emails-every-4h',
  '0 */4 * * *',
  $$ select extensions.http_post(
       current_setting('app.settings.functions_url') || '/scheduled-digest-emails',
       '{}', 'application/json',
       array[ extensions.http_header('Authorization',
              'Bearer ' || current_setting('app.settings.service_role_key')) ]
     ); $$
);

select cron.schedule(
  'renewal-reminders-daily',
  '0 8 * * *',
  $$ select extensions.http_post(
       current_setting('app.settings.functions_url') || '/scheduled-renewal-reminders',
       '{}', 'application/json',
       array[ extensions.http_header('Authorization',
              'Bearer ' || current_setting('app.settings.service_role_key')) ]
     ); $$
);

select cron.schedule(
  'archive-social-posts-hourly',
  '5 * * * *',
  $$ select extensions.http_post(
       current_setting('app.settings.functions_url') || '/scheduled-archive-social-posts',
       '{}', 'application/json',
       array[ extensions.http_header('Authorization',
              'Bearer ' || current_setting('app.settings.service_role_key')) ]
     ); $$
);

select cron.schedule(
  'token-refresh-daily',
  '30 3 * * *',
  $$ select extensions.http_post(
       current_setting('app.settings.functions_url') || '/scheduled-token-refresh',
       '{}', 'application/json',
       array[ extensions.http_header('Authorization',
              'Bearer ' || current_setting('app.settings.service_role_key')) ]
     ); $$
);