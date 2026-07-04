-- Telegram bot integration: links a Telegram chat to an app user account.
-- Run this whole file once in the Supabase SQL editor.

create table if not exists telegram_links (
  user_id uuid primary key references profiles(id) on delete cascade,
  chat_id bigint unique,
  link_code text unique,
  linked_at timestamptz,
  created_at timestamptz default now()
);

alter table telegram_links enable row level security;

create policy "telegram_links_owner" on telegram_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Generates (or returns the existing) one-time link code for the logged-in user.
-- The app calls this when the user taps "Conectar Telegram".
create or replace function public.get_or_create_telegram_link_code(p_user_id uuid)
returns text as $$
declare
  v_code text;
begin
  select link_code into v_code from telegram_links where user_id = p_user_id;

  if v_code is null then
    v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    insert into telegram_links (user_id, link_code) values (p_user_id, v_code)
    on conflict (user_id) do update set link_code = excluded.link_code;
  end if;

  return v_code;
end;
$$ language plpgsql security definer;
