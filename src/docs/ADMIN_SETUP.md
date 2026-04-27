# Admin setup

Admins are identified via the JWT claim `role = 'admin'`. RLS
policies use `public.is_admin()` (defined in `0001`) which reads
`auth.jwt() ->> 'role'`.

## 1. Create the admin profile

1. Sign up your admin email through the normal signup flow (in the
   running app).
2. In the Supabase SQL editor:
   ```sql
   update public.profiles
      set account_type = 'admin'
    where email = 'you@example.com';
   ```

## 2. Add the custom claims hook

Auth → Hooks → "Custom Access Token" hook. Create a Postgres
function:

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_account_type text;
begin
  claims := event -> 'claims';
  select account_type into user_account_type
    from public.profiles
   where id = (event ->> 'user_id')::uuid;

  if user_account_type is not null then
    claims := jsonb_set(claims, '{role}', to_jsonb(user_account_type));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
```

Then register the hook in **Auth → Hooks** pointing to
`public.custom_access_token_hook`.

## 3. Verify

After signing in again, decode the JWT (e.g. via jwt.io or
`supabase.auth.getSession()`) and confirm `role: "admin"` is
present. RLS policies that check `public.is_admin()` will now pass.

## 4. Promoting more admins later

```sql
update public.profiles set account_type = 'admin' where email = '...';
```
The hook reads `account_type` on every token issuance, so the user
just needs to sign out and back in.