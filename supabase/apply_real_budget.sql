-- Aplica o orçamento mensal real (base R$5.800) às categorias existentes,
-- reagrupando-as em Compromissos Fixos / Despesas Variáveis / Reservas e Objetivos,
-- e cria as categorias que ainda não existiam (Parcela do carro, Energia solar, TIM, Fundo de lazer e viagem).
-- Rode no SQL Editor e depois chame: select apply_real_budget('SEU_USER_ID');

create or replace function public.apply_real_budget(p_user_id uuid)
returns void as $$
begin
  -- Compromissos fixos inegociáveis (R$3.138)
  update categories set group_label = 'Compromissos Fixos', monthly_limit = 1000 where user_id = p_user_id and label = 'Diarista';
  update categories set group_label = 'Compromissos Fixos', monthly_limit = 80   where user_id = p_user_id and label = 'Água';
  update categories set group_label = 'Compromissos Fixos', monthly_limit = 75   where user_id = p_user_id and label = 'Energia Elétrica';
  update categories set group_label = 'Compromissos Fixos', monthly_limit = 400  where user_id = p_user_id and label = 'Combustível';
  update categories set group_label = 'Compromissos Fixos', monthly_limit = 400  where user_id = p_user_id and label = 'Dízimo';
  update categories set group_label = 'Compromissos Fixos', monthly_limit = 0    where user_id = p_user_id and label = 'Oferta';

  insert into categories (user_id, type, group_label, label, icon, color, monthly_limit, is_business, sort_order)
  select p_user_id, 'expense', 'Compromissos Fixos', 'Parcela do Carro', 'car', '#f5a623', 1121.98, false, 200
  where not exists (select 1 from categories where user_id = p_user_id and label = 'Parcela do Carro');

  insert into categories (user_id, type, group_label, label, icon, color, monthly_limit, is_business, sort_order)
  select p_user_id, 'expense', 'Compromissos Fixos', 'Projeto Energia Solar', 'boltBadge', '#7c6ff7', 316, false, 201
  where not exists (select 1 from categories where user_id = p_user_id and label = 'Projeto Energia Solar');

  insert into categories (user_id, type, group_label, label, icon, color, monthly_limit, is_business, sort_order)
  select p_user_id, 'expense', 'Compromissos Fixos', 'TIM (Linha Telefônica)', 'devicePhone', '#7c6ff7', 100, false, 202
  where not exists (select 1 from categories where user_id = p_user_id and label = 'TIM (Linha Telefônica)');

  -- Despesas variáveis (R$900)
  update categories set group_label = 'Despesas Variáveis', monthly_limit = 450 where user_id = p_user_id and label = 'Mercado e Feira';
  update categories set group_label = 'Despesas Variáveis', monthly_limit = 80  where user_id = p_user_id and label = 'Padaria';
  update categories set group_label = 'Despesas Variáveis', monthly_limit = 150 where user_id = p_user_id and label = 'Alimentação Fora';
  update categories set group_label = 'Despesas Variáveis', monthly_limit = 100 where user_id = p_user_id and label = 'Farmácia';
  -- "Assinaturas digitais — R$120" dividido entre as 3 categorias existentes (ajuste depois em Categorias se quiser outra divisão)
  update categories set group_label = 'Despesas Variáveis', monthly_limit = 40  where user_id = p_user_id and label = 'Netflix';
  update categories set group_label = 'Despesas Variáveis', monthly_limit = 40  where user_id = p_user_id and label = 'Hotmart e Ticto';
  update categories set group_label = 'Despesas Variáveis', monthly_limit = 40  where user_id = p_user_id and label = 'Ferramentas de IA';
  update categories set group_label = 'Despesas Variáveis', monthly_limit = 0   where user_id = p_user_id and label = 'Amazon Prime';
  update categories set group_label = 'Despesas Variáveis', monthly_limit = 0   where user_id = p_user_id and label = 'Outros SaaS';

  -- Reserva de emergência + reservas para objetivos (tipo investimento, fora do orçamento de despesas)
  update categories set group_label = 'Reservas e Objetivos', monthly_limit = 500 where user_id = p_user_id and label = 'Reserva de Emergência';
  update categories set group_label = 'Reservas e Objetivos', monthly_limit = 50  where user_id = p_user_id and label = 'Educação do Filho';

  insert into categories (user_id, type, group_label, label, icon, color, monthly_limit, is_business, sort_order)
  select p_user_id, 'investment', 'Reservas e Objetivos', 'Fundo de Lazer e Viagem', 'film', '#f5a623', 100, false, 210
  where not exists (select 1 from categories where user_id = p_user_id and label = 'Fundo de Lazer e Viagem');
end;
$$ language plpgsql security definer;

-- Depois de rodar a função acima, execute (com seu user id):
-- select apply_real_budget('541bbc7f-bbc2-4252-97fa-2aaa3ceac8fa');
