-- Tabela de configuração global do app (chave-valor)
create table if not exists app_config (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- Somente o admin pode ler/escrever (via service role ou política específica)
alter table app_config enable row level security;

-- Qualquer usuário autenticado pode ler
create policy "authenticated users can read app_config"
  on app_config for select
  to authenticated
  using (true);

-- Somente o admin pode escrever (filtra pelo email via JWT)
create policy "admin can write app_config"
  on app_config for all
  to authenticated
  using (auth.jwt() ->> 'email' = 'jefersondutrasbpb2@gmail.com')
  with check (auth.jwt() ->> 'email' = 'jefersondutrasbpb2@gmail.com');

-- Valores padrão
insert into app_config (key, value) values
  ('welcome_headline', 'Organize. Planeje. Conquiste.'),
  ('welcome_body', 'Controle suas finanças, registre pelo Telegram e acompanhe cada centavo do seu dinheiro.'),
  ('welcome_tagline', 'SEU DINHEIRO EM ORDEM'),
  ('app_name', 'Jefin'),
  ('logo_url', '')
on conflict (key) do nothing;

-- Bucket para upload de logo
insert into storage.buckets (id, name, public) values ('brand', 'brand', true)
on conflict (id) do nothing;

-- Policy de leitura pública do bucket
create policy "brand assets are public"
  on storage.objects for select
  using (bucket_id = 'brand');

-- Policy de upload só para admin
create policy "admin can upload brand assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'brand'
    and (auth.jwt() ->> 'email') = 'jefersondutrasbpb2@gmail.com'
  );

create policy "admin can update brand assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'brand'
    and (auth.jwt() ->> 'email') = 'jefersondutrasbpb2@gmail.com'
  );
