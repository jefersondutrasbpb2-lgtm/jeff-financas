-- Migration: category groups + business flag + 'investment' transaction type
-- Run this whole file once in the Supabase SQL editor.

-- 1) Add new columns to categories
alter table categories add column if not exists group_label text;
alter table categories add column if not exists is_business boolean default false;

-- 2) Allow 'investment' as a category/transaction type
alter table categories drop constraint if exists categories_type_check;
alter table categories add constraint categories_type_check
  check (type in ('expense', 'income', 'investment'));

alter table transactions drop constraint if exists transactions_type_check;
alter table transactions add constraint transactions_type_check
  check (type in ('expense', 'income', 'investment'));

-- 3) Replace a user's categories with the real, analyzed category set.
-- Call with: select seed_jeff_categories('YOUR_USER_ID');
create or replace function public.seed_jeff_categories(p_user_id uuid)
returns void as $$
begin
  delete from categories where user_id = p_user_id;

  insert into categories (user_id, type, group_label, label, icon, color, monthly_limit, is_business, sort_order) values
  -- RECEITAS
  (p_user_id, 'income', 'Receitas', 'Moisés Ramos (cliente âncora)', 'briefcase', '#00d4b4', 0, false, 1),
  (p_user_id, 'income', 'Receitas', 'Clientes de Tráfego', 'laptop', '#00d4b4', 0, false, 2),
  (p_user_id, 'income', 'Receitas', 'SEDAP / Governo', 'briefcase', '#00d4b4', 0, false, 3),
  (p_user_id, 'income', 'Receitas', 'Produtos Digitais', 'laptop', '#00d4b4', 0, false, 4),
  (p_user_id, 'income', 'Receitas', 'Outros / Eventual', 'sparkles', '#00d4b4', 0, false, 5),

  -- DESPESAS: Moradia e Casa
  (p_user_id, 'expense', 'Moradia e Casa', 'Aluguel', 'home', '#7c6ff7', 0, false, 10),
  (p_user_id, 'expense', 'Moradia e Casa', 'Energia Elétrica', 'boltBadge', '#7c6ff7', 0, false, 11),
  (p_user_id, 'expense', 'Moradia e Casa', 'Água', 'home', '#7c6ff7', 0, false, 12),
  (p_user_id, 'expense', 'Moradia e Casa', 'Gás', 'home', '#7c6ff7', 0, false, 13),
  (p_user_id, 'expense', 'Moradia e Casa', 'Internet', 'devicePhone', '#7c6ff7', 0, false, 14),
  (p_user_id, 'expense', 'Moradia e Casa', 'Diarista', 'home', '#7c6ff7', 0, false, 15),

  -- DESPESAS: Alimentação
  (p_user_id, 'expense', 'Alimentação', 'Mercado e Feira', 'bag', '#00d4b4', 0, false, 20),
  (p_user_id, 'expense', 'Alimentação', 'Padaria', 'utensils', '#00d4b4', 0, false, 21),
  (p_user_id, 'expense', 'Alimentação', 'Alimentação Fora', 'utensils', '#00d4b4', 0, false, 22),

  -- DESPESAS: Transporte
  (p_user_id, 'expense', 'Transporte', 'Combustível', 'car', '#f5a623', 0, false, 30),
  (p_user_id, 'expense', 'Transporte', 'Manutenção do Carro', 'car', '#f5a623', 0, false, 31),
  (p_user_id, 'expense', 'Transporte', 'IPVA e Seguro', 'car', '#f5a623', 0, false, 32),

  -- DESPESAS: Saúde
  (p_user_id, 'expense', 'Saúde', 'Farmácia', 'heartPulse', '#00d4b4', 0, false, 40),
  (p_user_id, 'expense', 'Saúde', 'Consultas e Clínica', 'heartPulse', '#00d4b4', 0, false, 41),
  (p_user_id, 'expense', 'Saúde', 'Plano de Saúde', 'heartPulse', '#00d4b4', 0, false, 42),

  -- DESPESAS: Igreja
  (p_user_id, 'expense', 'Igreja', 'Dízimo', 'sparkles', '#9088f5', 0, false, 50),
  (p_user_id, 'expense', 'Igreja', 'Oferta', 'sparkles', '#9088f5', 0, false, 51),

  -- DESPESAS: Assinaturas Digitais
  (p_user_id, 'expense', 'Assinaturas Digitais', 'Netflix', 'devicePhone', '#ff6b8a', 0, false, 60),
  (p_user_id, 'expense', 'Assinaturas Digitais', 'Hotmart e Ticto', 'devicePhone', '#ff6b8a', 0, false, 61),
  (p_user_id, 'expense', 'Assinaturas Digitais', 'Ferramentas de IA', 'devicePhone', '#ff6b8a', 0, false, 62),
  (p_user_id, 'expense', 'Assinaturas Digitais', 'Amazon Prime', 'devicePhone', '#ff6b8a', 0, false, 63),
  (p_user_id, 'expense', 'Assinaturas Digitais', 'Outros SaaS', 'devicePhone', '#ff6b8a', 0, false, 64),

  -- DESPESAS: Educação e Desenvolvimento
  (p_user_id, 'expense', 'Educação e Desenvolvimento', 'Cursos', 'laptop', '#4fc3f7', 0, false, 70),
  (p_user_id, 'expense', 'Educação e Desenvolvimento', 'Plataformas de Aprendizado', 'laptop', '#4fc3f7', 0, false, 71),
  (p_user_id, 'expense', 'Educação e Desenvolvimento', 'Livros', 'laptop', '#4fc3f7', 0, false, 72),

  -- DESPESAS: Trabalho e Negócios (is_business = true — separado do orçamento pessoal)
  (p_user_id, 'expense', 'Trabalho e Negócios', 'Tráfego Pago (Facebook Ads)', 'trendUp', '#5a5a88', 0, true, 80),
  (p_user_id, 'expense', 'Trabalho e Negócios', 'Ferramentas', 'gear', '#5a5a88', 0, true, 81),
  (p_user_id, 'expense', 'Trabalho e Negócios', 'Equipamentos', 'laptop', '#5a5a88', 0, true, 82),

  -- DESPESAS: Lazer e Família
  (p_user_id, 'expense', 'Lazer e Família', 'Passeios', 'film', '#ff6b8a', 0, false, 90),
  (p_user_id, 'expense', 'Lazer e Família', 'Viagens e Hotel', 'film', '#ff6b8a', 0, false, 91),
  (p_user_id, 'expense', 'Lazer e Família', 'Presentes', 'bag', '#ff6b8a', 0, false, 92),
  (p_user_id, 'expense', 'Lazer e Família', 'Entretenimento', 'film', '#ff6b8a', 0, false, 93),

  -- DESPESAS: Vestuário
  (p_user_id, 'expense', 'Vestuário', 'Roupas', 'bag', '#9088f5', 0, false, 100),
  (p_user_id, 'expense', 'Vestuário', 'Calçados', 'bag', '#9088f5', 0, false, 101),
  (p_user_id, 'expense', 'Vestuário', 'Acessórios', 'bag', '#9088f5', 0, false, 102),

  -- DESPESAS: Outros
  (p_user_id, 'expense', 'Outros', 'Imprevistos', 'sparkles', '#2e2e52', 0, false, 110),
  (p_user_id, 'expense', 'Outros', 'Taxas e Boletos', 'wallet', '#2e2e52', 0, false, 111),
  (p_user_id, 'expense', 'Outros', 'Transferências Familiares', 'wallet', '#2e2e52', 0, false, 112),

  -- INVESTIMENTOS (tipo separado de despesa)
  (p_user_id, 'investment', 'Investimentos', 'Reserva de Emergência', 'wallet', '#f5a623', 0, false, 120),
  (p_user_id, 'investment', 'Investimentos', 'Previdência', 'wallet', '#f5a623', 0, false, 121),
  (p_user_id, 'investment', 'Investimentos', 'FIIs', 'trendUp', '#f5a623', 0, false, 122),
  (p_user_id, 'investment', 'Investimentos', 'Educação do Filho', 'laptop', '#f5a623', 0, false, 123),
  (p_user_id, 'investment', 'Investimentos', 'Outros Investimentos', 'sparkles', '#f5a623', 0, false, 124);
end;
$$ language plpgsql security definer;

-- After running this whole file once, call (with your own user id):
-- select seed_jeff_categories('YOUR_USER_ID');
