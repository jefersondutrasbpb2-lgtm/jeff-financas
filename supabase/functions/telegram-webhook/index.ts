// Supabase Edge Function: Telegram bot webhook for Jefin.
// Receives text/voice messages, classifies with Gemini, inserts transactions.
// Also handles deletion via inline buttons, /desfazer and /lista commands.
//
// Deploy with: supabase functions deploy telegram-webhook --no-verify-jwt
// Secrets: TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// ── Telegram helpers ─────────────────────────────────────────────────────────

async function sendMessage(chatId: number, text: string, replyMarkup?: object) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  });
}

async function editMessage(chatId: number, messageId: number, text: string) {
  await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'Markdown' }),
  });
}

async function answerCallback(callbackQueryId: string, text?: string) {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

async function getTelegramFile(fileId: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const fileInfoRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const fileInfo = await fileInfoRes.json();
  const filePath = fileInfo.result.file_path;
  const fileRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`);
  const buf = await fileRes.arrayBuffer();
  return { bytes: new Uint8Array(buf), mimeType: 'audio/ogg' };
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function formatBRL(amount: number): string {
  return `R$ ${amount.toFixed(2).replace('.', ',')}`;
}

function typeLabel(type: string): string {
  if (type === 'income') return 'Receita';
  if (type === 'investment') return 'Investimento';
  return 'Despesa';
}

function typeEmoji(type: string): string {
  if (type === 'income') return '📈';
  if (type === 'investment') return '📊';
  return '📉';
}

// ── Gemini classification ────────────────────────────────────────────────────

interface Category {
  id: string;
  type: string;
  label: string;
  group_label: string | null;
}

interface CreditCard {
  id: string;
  name: string;
  last_digits: string | null;
}

interface Classification {
  type: 'expense' | 'income' | 'investment';
  title: string;
  amount: number;
  category_id: string;
  card_id: string | null;
  installments: number;
}

async function classifyWithGemini(
  categories: Category[],
  cards: CreditCard[],
  text: string | null,
  audio: { bytes: Uint8Array; mimeType: string } | null
): Promise<Classification | null> {
  const categoryList = categories
    .map((c) => `- id="${c.id}" tipo=${c.type} categoria="${c.label}"${c.group_label ? ` grupo="${c.group_label}"` : ''}`)
    .join('\n');

  const cardList = cards.length > 0
    ? cards.map((c) => `- id="${c.id}" nome="${c.name}"${c.last_digits ? ` final=${c.last_digits}` : ''}`).join('\n')
    : '(nenhum cartão cadastrado)';

  const prompt = `Você é um assistente financeiro. O usuário vai descrever um lançamento financeiro (em texto ou áudio, em português do Brasil).
Extraia os dados e responda APENAS com um JSON válido, sem markdown, no formato exato:
{"type":"expense"|"income"|"investment","title":"string curta","amount":number,"category_id":"id","card_id":"id ou null","installments":1}

Categorias disponíveis (escolha o id mais adequado, NUNCA invente um id):
${categoryList}

Cartões cadastrados (use o id se o usuário mencionar cartão de crédito, senão use null):
${cardList}

Regras:
- "amount" é sempre o valor TOTAL em reais (número positivo, sem "R$"). Se parcelado, é o total, não a parcela.
- "title" é uma descrição curta (ex: "Uber", "Mercado", "Salário").
- "card_id" deve ser o id do cartão se o usuário mencionar cartão de crédito, crédito, ou nome de algum cartão da lista. Caso contrário null.
- "installments" é o número de parcelas (ex: "3x", "em 3 vezes" → 3). Se não mencionar parcelamento, use 1.
- Se não conseguir identificar categoria, use a do tipo certo com label contendo "Outros".
${text ? `\nMensagem do usuário: "${text}"` : '\nA mensagem do usuário está no áudio anexado.'}`;

  const parts: Record<string, unknown>[] = [{ text: prompt }];
  if (audio) {
    parts.push({ inlineData: { mimeType: audio.mimeType, data: toBase64(audio.bytes) } });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    }
  );

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  try {
    const parsed = JSON.parse(rawText) as Classification;
    if (!parsed.category_id || !parsed.amount || !parsed.type) return null;
    parsed.installments = Math.max(1, Math.round(parsed.installments ?? 1));
    return parsed;
  } catch {
    return null;
  }
}

// ── Helpers de transação ─────────────────────────────────────────────────────

async function getRecentTransactions(userId: string, limit = 5) {
  const { data } = await supabase
    .from('transactions')
    .select('id, type, title, amount, date, category_id, card_id, installment_group_id, installment_number, installment_total')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

async function deleteTransaction(id: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  return !error;
}

async function deleteInstallmentGroup(groupId: string, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('transactions')
    .delete()
    .eq('installment_group_id', groupId)
    .eq('user_id', userId)
    .select('id');
  if (error) return 0;
  return data?.length ?? 0;
}

async function insertInstallments(
  userId: string,
  base: { title: string; amount: number; type: string; category_id: string; card_id: string },
  count: number
): Promise<string> {
  const groupId = crypto.randomUUID();
  const installmentAmount = Math.round((base.amount / count) * 100) / 100;
  const today = new Date().toISOString().slice(0, 10);

  const rows = Array.from({ length: count }, (_, i) => {
    const d = new Date(today + 'T12:00:00');
    d.setMonth(d.getMonth() + i);
    return {
      user_id: userId,
      category_id: base.category_id,
      type: base.type,
      title: count > 1 ? `${base.title} (${i + 1}/${count})` : base.title,
      amount: installmentAmount,
      date: d.toISOString().slice(0, 10),
      card_id: base.card_id,
      installment_group_id: groupId,
      installment_number: i + 1,
      installment_total: count,
    };
  });

  await supabase.from('transactions').insert(rows);
  return groupId;
}

// ── Webhook principal ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const update = await req.json();

    // ── Callback de botão inline ───────────────────────────────────────────
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId: number = cq.message.chat.id;
      const messageId: number = cq.message.message_id;
      const data: string = cq.data ?? '';

      const { data: link } = await supabase
        .from('telegram_links')
        .select('user_id')
        .eq('chat_id', chatId)
        .maybeSingle();

      if (!link) {
        await answerCallback(cq.id, 'Conta não vinculada.');
        return new Response('ok');
      }

      if (data.startsWith('del:')) {
        const txId = data.replace('del:', '');
        const ok = await deleteTransaction(txId, link.user_id);
        await answerCallback(cq.id, ok ? '✅ Apagado!' : '❌ Não foi possível apagar.');
        await editMessage(chatId, messageId, ok ? '🗑️ *Lançamento apagado.*' : '❌ Não foi possível apagar esse lançamento.');
      } else if (data.startsWith('delgroup:')) {
        const groupId = data.replace('delgroup:', '');
        const count = await deleteInstallmentGroup(groupId, link.user_id);
        await answerCallback(cq.id, count > 0 ? `✅ ${count} parcelas apagadas!` : '❌ Erro ao apagar.');
        await editMessage(chatId, messageId, count > 0 ? `🗑️ *${count} parcelas apagadas.*` : '❌ Não foi possível apagar.');
      } else if (data === 'noop') {
        await answerCallback(cq.id, 'Ok, mantido.');
      }

      return new Response('ok');
    }

    // ── Mensagem normal ────────────────────────────────────────────────────
    const message = update.message;
    if (!message) return new Response('ok');

    const chatId: number = message.chat.id;
    const text: string | undefined = message.text;

    // /start — vinculação de conta
    if (text?.startsWith('/start')) {
      const code = text.replace('/start', '').trim();
      if (!code) {
        await sendMessage(chatId,
          'Olá! 👋 Para vincular sua conta Jefin, gere um código no app em *Configurações → Conectar Telegram* e envie aqui como:\n`/start CODIGO`'
        );
        return new Response('ok');
      }
      const { data: link } = await supabase.from('telegram_links').select('*').eq('link_code', code).maybeSingle();
      if (!link) {
        await sendMessage(chatId, '❌ Código inválido ou expirado. Gere um novo no app.');
        return new Response('ok');
      }
      await supabase.from('telegram_links').update({ chat_id: chatId, linked_at: new Date().toISOString() }).eq('user_id', link.user_id);
      await sendMessage(chatId,
        '✅ *Conta vinculada com sucesso!*\n\nAgora você pode:\n• Mandar texto ou áudio para registrar lançamentos\n• `/lista` — ver e apagar lançamentos recentes\n• `/desfazer` — apagar o último lançamento\n• `/ajuda` — ver todos os comandos'
      );
      return new Response('ok');
    }

    // Resolve usuário pelo chat_id
    const { data: link } = await supabase.from('telegram_links').select('user_id').eq('chat_id', chatId).maybeSingle();
    if (!link) {
      await sendMessage(chatId, 'Sua conta ainda não está vinculada. Gere um código no app em *Configurações → Conectar Telegram* e envie: `/start CODIGO`');
      return new Response('ok');
    }
    const userId = link.user_id;

    const isCmd = (t: string | undefined, cmd: string) =>
      !!t && (t === cmd || t.startsWith(cmd + '@') || t.startsWith(cmd + ' '));

    // /ajuda
    if (isCmd(text, '/ajuda') || isCmd(text, '/help')) {
      await sendMessage(chatId,
        '*Comandos do Jefin Bot* 🤖\n\n' +
        '📝 *Registrar lançamento*\nMande um texto ou áudio, ex:\n_"Gastei 45 reais no mercado"_\n_"Comprei tênis no cartão Nubank em 3x por 300 reais"_\n\n' +
        '💳 *Cartão de crédito*\nMencione o cartão e parcelas:\n_"300 reais no Nubank em 6x"_\n_"Comprei no crédito 150 reais"_\n\n' +
        '📋 */lista* — Ver e apagar os 5 últimos lançamentos\n\n' +
        '↩️ */desfazer* — Apagar o último lançamento registrado\n\n' +
        '❓ */ajuda* — Mostrar esta mensagem'
      );
      return new Response('ok');
    }

    // /lista
    if (isCmd(text, '/lista')) {
      const txs = await getRecentTransactions(userId, 5);
      if (txs.length === 0) {
        await sendMessage(chatId, 'Nenhum lançamento encontrado.');
        return new Response('ok');
      }

      for (const tx of txs) {
        const emoji = typeEmoji(tx.type);
        const label = typeLabel(tx.type);
        const installBadge = tx.installment_number && tx.installment_total
          ? ` · 💳 ${tx.installment_number}/${tx.installment_total}`
          : tx.card_id ? ' · 💳' : '';
        const msg = `${emoji} *${tx.title}*\n${label} · ${formatBRL(tx.amount)}${installBadge}\n📅 ${tx.date}`;

        // Se é parcela, botão apaga o grupo inteiro
        const deleteButton = tx.installment_group_id
          ? { text: '🗑️ Apagar todas as parcelas', callback_data: `delgroup:${tx.installment_group_id}` }
          : { text: '🗑️ Apagar este lançamento', callback_data: `del:${tx.id}` };

        await sendMessage(chatId, msg, { inline_keyboard: [[deleteButton]] });
      }
      return new Response('ok');
    }

    // /desfazer
    if (isCmd(text, '/desfazer')) {
      const txs = await getRecentTransactions(userId, 1);
      if (txs.length === 0) {
        await sendMessage(chatId, 'Nenhum lançamento encontrado para desfazer.');
        return new Response('ok');
      }
      const tx = txs[0];
      const emoji = typeEmoji(tx.type);
      const installBadge = tx.installment_number && tx.installment_total
        ? ` (parcela ${tx.installment_number}/${tx.installment_total})`
        : '';

      const deleteButton = tx.installment_group_id
        ? { text: '✅ Sim, apagar todas as parcelas', callback_data: `delgroup:${tx.installment_group_id}` }
        : { text: '✅ Sim, apagar', callback_data: `del:${tx.id}` };

      await sendMessage(chatId,
        `${emoji} *${tx.title}*${installBadge} — ${formatBRL(tx.amount)}\nDeseja apagar esse lançamento?`,
        { inline_keyboard: [[deleteButton, { text: '❌ Não', callback_data: 'noop' }]] }
      );
      return new Response('ok');
    }

    // Registro de lançamento (texto ou áudio)
    const [{ data: categories }, { data: cards }] = await Promise.all([
      supabase.from('categories').select('id, type, label, group_label').eq('user_id', userId),
      supabase.from('credit_cards').select('id, name, last_digits').eq('user_id', userId),
    ]);

    if (!categories || categories.length === 0) {
      await sendMessage(chatId, 'Você ainda não tem categorias cadastradas no app.');
      return new Response('ok');
    }

    let audio: { bytes: Uint8Array; mimeType: string } | null = null;
    if (message.voice) {
      audio = await getTelegramFile(message.voice.file_id);
    } else if (message.audio) {
      audio = await getTelegramFile(message.audio.file_id);
    }

    if (!text && !audio) {
      await sendMessage(chatId, 'Manda um texto ou áudio descrevendo o lançamento.\nEx: _"Gastei 50 reais de combustível"_');
      return new Response('ok');
    }

    const classification = await classifyWithGemini(categories, cards ?? [], text ?? null, audio);
    if (!classification) {
      await sendMessage(chatId, '😕 Não consegui entender esse lançamento. Tenta descrever de outro jeito?\nEx: _"Gastei 30 reais no mercado"_');
      return new Response('ok');
    }

    const category = categories.find((c) => c.id === classification.category_id);
    if (!category) {
      await sendMessage(chatId, '😕 Não encontrei uma categoria correspondente. Tenta de novo descrevendo melhor.');
      return new Response('ok');
    }

    const card = classification.card_id ? (cards ?? []).find((c) => c.id === classification.card_id) : null;
    const isInstallment = !!card && classification.installments > 1;
    const isCard = !!card;

    let insertedId: string | null = null;
    let groupId: string | null = null;

    if (isCard) {
      // Parcelas no cartão (mesmo com installments=1 cria com card_id)
      groupId = await insertInstallments(
        userId,
        {
          title: classification.title,
          amount: classification.amount,
          type: classification.type,
          category_id: classification.category_id,
          card_id: card!.id,
        },
        classification.installments
      );
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          category_id: category.id,
          type: classification.type,
          title: classification.title,
          amount: classification.amount,
          date: new Date().toISOString().slice(0, 10),
          card_id: null,
          installment_group_id: null,
          installment_number: null,
          installment_total: null,
        })
        .select('id')
        .single();

      if (insertError || !inserted) {
        await sendMessage(chatId, '❌ Deu um erro ao salvar. Tenta de novo em alguns segundos.');
        return new Response('ok');
      }
      insertedId = inserted.id;
    }

    const emoji = typeEmoji(classification.type);
    const label = typeLabel(classification.type);

    let confirmMsg = `${emoji} *${label} registrada*\n${classification.title} — ${formatBRL(classification.amount)}\nCategoria: ${category.label}`;
    if (isCard) {
      const installmentValue = classification.amount / classification.installments;
      confirmMsg += `\n💳 ${card!.name}`;
      if (isInstallment) {
        confirmMsg += ` · ${classification.installments}x de ${formatBRL(installmentValue)}`;
      }
    }

    const deleteButton = groupId
      ? { text: '↩️ Desfazer (todas as parcelas)', callback_data: `delgroup:${groupId}` }
      : { text: '↩️ Desfazer', callback_data: `del:${insertedId}` };

    await sendMessage(chatId, confirmMsg, { inline_keyboard: [[deleteButton]] });

    return new Response('ok');
  } catch (err) {
    console.error(err);
    return new Response('ok');
  }
});
