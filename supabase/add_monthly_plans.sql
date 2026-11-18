-- Run this in the Supabase SQL Editor
-- Renda prevista por mês, usada na aba Planejamento.
create table if not exists monthly_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null, -- 'YYYY-MM'
  expected_income numeric(14,2) not null default 0,
  primary key (user_id, month_key)
);

alter table monthly_plans enable row level security;

create policy "users manage own monthly_plans" on monthly_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
