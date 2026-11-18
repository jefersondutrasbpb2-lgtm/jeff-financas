-- Run this in the Supabase SQL Editor
-- Marca faturas de cartão como pagas. Apagar a transação de pagamento
-- remove o registro e a fatura volta a ficar pendente.
create table if not exists bill_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references credit_cards(id) on delete cascade,
  due_date date not null,
  transaction_id uuid not null references transactions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, card_id, due_date)
);

alter table bill_payments enable row level security;

create policy "users manage own bill_payments" on bill_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
