// Exercise CORS preflights only: no application or Telegram message is sent.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = await readFile(new URL('../api/partner.js', import.meta.url), 'utf8');
const {default: handler} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
for (const origin of ['https://vladimirdonskov.github.io', 'https://grabyou.ru']) {
  const headers = {};
  const response = {
    setHeader(name, value) { headers[name] = value; },
    status(code) { assert.equal(code, 204); return this; },
    end() {},
  };
  await handler({method: 'OPTIONS', headers: {origin}}, response);
  assert.equal(headers['Access-Control-Allow-Origin'], origin);
}
const headers = {};
await handler({method: 'OPTIONS', headers: {origin: 'https://unrelated.example.test'}}, {
  setHeader(name, value) { headers[name] = value; },
  status() { return this; }, end() {},
});
assert.equal(headers['Access-Control-Allow-Origin'], undefined);
console.log('PASS: current Pages/custom-domain CORS; unrelated origins excluded. No lead sent.');
