-- Jeff Finanças — schema + row-level security (per-user data isolation)
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).

create extension if not exists "pgcrypto";

-- Profiles -------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Categories (user-customizable) ---------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text check (type in ('expense', 'income')) not null,
  label text not null,
  icon text not null,
  color text not null,
  monthly_limit numeric(14,2) default 0,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table categories enable row level security;
create policy "categories_owner" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Transactions -----------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  type text check (type in ('income', 'expense')) not null,
  title text not null,
  amount numeric(14,2) not null,
  date date not null,
  created_at timestamptz default now()
);

alter table transactions enable row level security;
create policy "transactions_owner" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Monthly opening balance overrides --------------------------------------
create table if not exists opening_balances (
  user_id uuid references profiles(id) on delete cascade not null,
  month_key text not null, -- 'YYYY-MM'
  amount numeric(14,2) not null,
  primary key (user_id, month_key)
);

alter table opening_balances enable row level security;
create policy "opening_balances_owner" on opening_balances
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Holdings (investments) --------------------------------------------------
create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  ticker text not null,
  name text not null,
  type text check (type in ('stocks', 'fiis', 'fixed_income', 'crypto', 'other')) not null,
  quantity numeric(18,8) not null,
  avg_price numeric(14,4) not null,
  current_price numeric(14,4) not null,
  created_at timestamptz default now()
);

alter table holdings enable row level security;
create policy "holdings_owner" on holdings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed default categories for a new user (called from the app after signup)
create or replace function public.seed_default_categories(p_user_id uuid)
returns void as $$
begin
  insert into categories (user_id, type, label, icon, color, monthly_limit, sort_order) values
    (p_user_id, 'expense', 'Moradia', 'home', '#7c6ff7', 2000, 1),
    (p_user_id, 'expense', 'Alimentação', 'utensils', '#00d4b4', 1000, 2),
    (p_user_id, 'expense', 'Transporte', 'car', '#f5a623', 600, 3),
    (p_user_id, 'expense', 'Lazer', 'film', '#ff6b8a', 400, 4),
    (p_user_id, 'expense', 'Assinaturas', 'devicePhone', '#9088f5', 200, 5),
    (p_user_id, 'expense', 'Saúde', 'heartPulse', '#00d4b4', 500, 6),
    (p_user_id, 'expense', 'Compras', 'bag', '#5a5a88', 300, 7),
    (p_user_id, 'expense', 'Outros', 'sparkles', '#2e2e52', 300, 8),
    (p_user_id, 'income', 'Salário', 'briefcase', '#00d4b4', 0, 1),
    (p_user_id, 'income', 'Freelance', 'laptop', '#7c6ff7', 0, 2),
    (p_user_id, 'income', 'Investimentos', 'trendUp', '#f5a623', 0, 3),
    (p_user_id, 'income', 'Outros', 'sparkles', '#2e2e52', 0, 4)
  on conflict do nothing;
end;
$$ language plpgsql security definer;
