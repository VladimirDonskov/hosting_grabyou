// Vercel Serverless Function: приём заявок партнёров → сообщение в Telegram
// Требует env-переменные в Vercel: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
//
// Сайт может жить не на Vercel (например, на GitHub Pages — в России Vercel
// режется), тогда форма шлёт заявку сюда с другого домена. Для этого — CORS.
// Дополнительные адреса сайта можно задать в env ALLOWED_ORIGINS через запятую.

const consentDocument = require('../src/data/partner-consent.json');

const DEFAULT_ORIGINS = [
  'https://grabyou.ru',
  'https://www.grabyou.ru',
  'https://justtip-ceo.github.io',
  'https://vladimirdonskov.github.io',
];

function allowedOrigins() {
  const extra = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...DEFAULT_ORIGINS, ...extra];
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = allowedOrigins();
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // браузер перед кросс-доменным POST с JSON шлёт предварительный OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  // браузер всегда шлёт Origin при кросс-доменном POST: чужие сайты отсекаем
  if (origin && !allowed.includes(origin)) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  const { name, address, phone, email, consent, policyRead, documentVersion } = req.body || {};
  if (consent !== true || policyRead !== true) {
    return res.status(400).json({ ok: false, error: 'Подтвердите согласие и ознакомление с политикой.' });
  }
  if (documentVersion !== consentDocument.version) {
    return res.status(409).json({ ok: false, error: 'Обновите страницу и прочитайте актуальные документы.' });
  }

  // Валидация
  const clean = (v) => (typeof v === 'string' && v.length <= 300 ? v.trim() : '');
  const data = {
    name: clean(name),
    address: clean(address),
    phone: clean(phone),
    email: clean(email),
  };

  if (!data.name || !data.address || !data.phone || !data.email) {
    return res.status(400).json({ ok: false, error: 'Проверьте поля заявки.' });
  }
  const digits = data.phone.replace(/\D/g, '');
  if (!/^[+\d\s().-]+$/.test(data.phone) || digits.length < 7 || digits.length > 15 ||
      !/^[^\s@]+@[^\s@]+$/.test(data.email)) {
    return res.status(400).json({ ok: false, error: 'Проверьте номер телефона и email.' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'Server is not configured' });
  }

  const text =
    '🟢 Новая заявка на партнёрство GrabYou\n\n' +
    `🏪 Заведение: ${data.name}\n` +
    `📍 Адрес: ${data.address}\n` +
    `📞 Телефон: ${data.phone}\n` +
    `✉️ Email: ${data.email}\n\n` +
    `Согласие дано. Ознакомление с политикой подтверждено.\n` +
    `Редакция документов: ${consentDocument.version}\n` +
    `Получено (UTC): ${new Date().toISOString()}`;

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, link_preview_options: {is_disabled: true} }),
    });

    const result = await tg.json();
    if (!result.ok) {
      return res.status(502).json({ ok: false, error: 'Telegram error' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Delivery failed' });
  }
};
