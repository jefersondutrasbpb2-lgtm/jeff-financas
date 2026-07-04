-- Run this in the Supabase SQL Editor
create table if not exists savings_pots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

alter table savings_pots enable row level security;

create policy "users manage own savings_pots" on savings_pots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
