-- =====================================================================
-- 0021_wire_messages_to_conversations.sql
--
-- Wire the existing `conversations` table to the live `messages` table.
--
-- Current state:
--   • conversations: relational shape (seeker_id, owner_id, listing_id FKs to
--     profiles/listings) — exists but orphaned, no app code reads/writes it.
--   • messages: flat shape (sender_email, recipient_email, listing_id,
--     thread_id text) — what the app uses today.
--
-- This migration:
--   1. Adds messages.conversation_id (nullable FK to conversations).
--   2. Backfills conversations from existing messages, resolving emails to
--      profile UUIDs and inferring seeker/owner direction from
--      listings.created_by.
--   3. Sets conversation_id on every existing message.
--   4. Installs a trigger that on every message insert/update:
--        - resolves or creates the matching conversation row
--        - sets messages.conversation_id
--        - updates conversations.last_message_at
--
-- The flat columns (sender_email, recipient_email, thread_id) are KEPT.
-- All existing app code keeps working unchanged. The conversation row is
-- maintained transparently and is ready for any future feature that wants
-- to read it directly.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Add conversation_id column on messages.
-- ---------------------------------------------------------------------
alter table public.messages
  add column if not exists conversation_id uuid
    references public.conversations(id) on delete set null;

create index if not exists idx_messages_conversation
  on public.messages(conversation_id);

-- ---------------------------------------------------------------------
-- 2. Helper: resolve (listing_id, sender_email, recipient_email) into a
--    conversation row, creating it if missing. Returns the conversation id.
--
--    Direction rule:
--      • If listings.created_by matches one of the two emails → that side
--        is the owner, the other is the seeker.
--      • Otherwise → fall back to alphabetical: lower email = seeker,
--        higher email = owner. Deterministic so we never duplicate.
--
--    Email-to-profile resolution uses public.profiles.email (case-insensitive).
--    If a profile is missing for either side, we skip and return NULL —
--    the caller leaves messages.conversation_id NULL (no FK violation).
-- ---------------------------------------------------------------------
create or replace function public.resolve_or_create_conversation(
  p_listing_id    uuid,
  p_sender_email  text,
  p_recipient_email text
) returns uuid
language plpgsql
as $$
declare
  v_a_email      text;
  v_b_email      text;
  v_a_id         uuid;
  v_b_id         uuid;
  v_owner_email  text;
  v_seeker_id    uuid;
  v_owner_id     uuid;
  v_conv_id      uuid;
begin
  if p_sender_email is null or p_recipient_email is null then
    return null;
  end if;

  -- normalise: a = lower email, b = higher email (deterministic)
  if lower(p_sender_email) < lower(p_recipient_email) then
    v_a_email := p_sender_email;
    v_b_email := p_recipient_email;
  else
    v_a_email := p_recipient_email;
    v_b_email := p_sender_email;
  end if;

  -- look up profile UUIDs
  select id into v_a_id from public.profiles
    where lower(email) = lower(v_a_email) limit 1;
  select id into v_b_id from public.profiles
    where lower(email) = lower(v_b_email) limit 1;

  if v_a_id is null or v_b_id is null then
    return null;  -- can't link without both profiles
  end if;

  -- determine owner via listings.created_by
  if p_listing_id is not null then
    select created_by into v_owner_email from public.listings
      where id = p_listing_id limit 1;
  end if;

  if v_owner_email is not null and lower(v_owner_email) = lower(v_a_email) then
    v_owner_id  := v_a_id;
    v_seeker_id := v_b_id;
  elsif v_owner_email is not null and lower(v_owner_email) = lower(v_b_email) then
    v_owner_id  := v_b_id;
    v_seeker_id := v_a_id;
  else
    -- fallback: alphabetical — a is seeker, b is owner
    v_seeker_id := v_a_id;
    v_owner_id  := v_b_id;
  end if;

  -- find existing conversation
  select id into v_conv_id from public.conversations
    where listing_id is not distinct from p_listing_id
      and seeker_id = v_seeker_id
      and owner_id  = v_owner_id
    limit 1;

  if v_conv_id is null then
    insert into public.conversations (listing_id, seeker_id, owner_id, last_message_at)
      values (p_listing_id, v_seeker_id, v_owner_id, now())
      returning id into v_conv_id;
  end if;

  return v_conv_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Backfill conversations and set conversation_id on existing messages.
-- ---------------------------------------------------------------------
do $$
declare
  m record;
  v_conv_id uuid;
begin
  for m in
    select id, listing_id, sender_email, recipient_email, created_at
    from public.messages
    where conversation_id is null
    order by created_at asc
  loop
    v_conv_id := public.resolve_or_create_conversation(
      m.listing_id, m.sender_email, m.recipient_email
    );
    if v_conv_id is not null then
      update public.messages set conversation_id = v_conv_id where id = m.id;
      update public.conversations
        set last_message_at = greatest(coalesce(last_message_at, m.created_at), m.created_at)
        where id = v_conv_id;
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Trigger: maintain conversation_id and last_message_at on insert/update.
--
--    On INSERT: if conversation_id is null, resolve/create one and set it.
--               Always bump conversations.last_message_at to NEW.created_at.
--    On UPDATE: only re-resolve if (listing_id, sender, recipient) changed
--               and conversation_id is still null.
-- ---------------------------------------------------------------------
create or replace function public.message_sync_conversation()
returns trigger
language plpgsql
as $$
declare
  v_conv_id uuid;
begin
  if new.conversation_id is null then
    v_conv_id := public.resolve_or_create_conversation(
      new.listing_id, new.sender_email, new.recipient_email
    );
    new.conversation_id := v_conv_id;
  end if;

  if new.conversation_id is not null then
    update public.conversations
      set last_message_at = greatest(coalesce(last_message_at, new.created_at), new.created_at)
      where id = new.conversation_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_message_sync_conversation on public.messages;
create trigger trg_message_sync_conversation
  before insert on public.messages
  for each row
  execute function public.message_sync_conversation();