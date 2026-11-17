// Isolated handler test. All Telegram calls are intercepted in this process.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../api/partner.js';

const {version} = JSON.parse(await readFile(new URL('../src/data/partner-consent.json', import.meta.url)));
process.env.TELEGRAM_BOT_TOKEN = 'test-only';
process.env.TELEGRAM_CHAT_ID = 'test-only';
const messages = [];
globalThis.fetch = async (_url, options) => {
  messages.push(JSON.parse(options.body));
  return {json: async () => ({ok: true})};
};

async function request(method, body, origin = 'https://grabyou.ru') {
  const response = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.code = code; return this; },
    json(data) { this.body = data; },
    end() {},
  };
  await handler({method, body, headers: {origin}}, response);
  return response;
}

for (const origin of ['https://vladimirdonskov.github.io', 'https://grabyou.ru']) {
  const response = await request('OPTIONS', undefined, origin);
  assert.equal(response.code, 204);
  assert.equal(response.headers['Access-Control-Allow-Origin'], origin);
}
assert.equal((await request('OPTIONS', undefined, 'https://unrelated.example.test')).headers['Access-Control-Allow-Origin'], undefined);

const fields = {name: 'Кафе', address: 'Тестовый адрес', phone: '+7 (000) 000-00-00', email: 'test@example.test'};
const application = {...fields, consent: true, policyRead: true, documentVersion: version};
assert.equal((await request('POST', fields)).code, 400);
for (const invalid of [{consent: false}, {consent: 'true'}, {policyRead: false}, {phone: '+7'}, {email: 'invalid'}, {name: ' '.repeat(4)}, {address: 'x'.repeat(301)}]) {
  assert.equal((await request('POST', {...application, ...invalid})).code, 400);
}
assert.equal((await request('POST', {...application, documentVersion: 'stale'})).code, 409);
assert.equal((await request('POST', application, 'https://unrelated.example.test')).code, 403);
assert.equal(messages.length, 0);

const response = await request('POST', application);
assert.equal(response.code, 200);
assert.deepEqual(response.body, {ok: true});
assert.equal(messages.length, 1);
for (const value of [...Object.values(fields), version, 'Согласие дано', 'Ознакомление с политикой подтверждено']) {
  assert.ok(messages[0].text.includes(value));
}
assert.match(messages[0].text, /Получено \(UTC\): \d{4}-\d{2}-\d{2}T[\d:.]+Z/);
assert.equal(messages[0].link_preview_options.is_disabled, true);
console.log('PASS: CORS, field validation, two explicit confirmations, current document revision, receipt metadata and Telegram payload. No live requests.');
