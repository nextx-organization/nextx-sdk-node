// Offline tests: ESM and CJS entry points, headers and URL building.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createNextXClient, PROD_URL, SANDBOX_URL, VERSION } from "../dist/esm/index.js";

const json = (body, status = 200, type = "application/json") =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": type } });

test("ESM and CJS export the same API", () => {
  const cjs = createRequire(import.meta.url)("../dist/cjs/index.js");
  assert.equal(typeof cjs.createNextXClient, "function");
  assert.equal(cjs.VERSION, VERSION);
  assert.equal(PROD_URL, "https://api.nextx.vn");
});

test("throws without credentials", () => {
  assert.throws(() => createNextXClient({}), /apiKey or accessToken is required/);
});

test("API key is sent as X-Api-Key with language and User-Agent", async () => {
  let seen;
  const nx = createNextXClient({ apiKey: "nxk_test", baseUrl: SANDBOX_URL + "/", language: "en", fetch: async (req) => { seen = req; return json({ items: [], totalCount: 0 }); } });
  const { data, error } = await nx.GET("/api/v1/crm/contacts", { params: { query: { pageNumber: 2 } } });
  assert.equal(error, undefined);
  assert.deepEqual(data, { items: [], totalCount: 0 });
  assert.equal(seen.url, `${SANDBOX_URL}/api/v1/crm/contacts?pageNumber=2`);
  assert.equal(seen.headers.get("x-api-key"), "nxk_test");
  assert.equal(seen.headers.get("authorization"), null);
  assert.equal(seen.headers.get("accept-language"), "en");
  assert.match(seen.headers.get("user-agent"), /^nextx-sdk-node\//);
});

test("access token function is resolved per request as Bearer", async () => {
  const seen = []; let n = 0;
  const nx = createNextXClient({ accessToken: () => `t${++n}`, fetch: async (req) => { seen.push(req); return json({}); } });
  await nx.GET("/api/v1/crm/contacts"); await nx.GET("/api/v1/crm/contacts");
  assert.deepEqual(seen.map((r) => r.headers.get("authorization")), ["Bearer t1", "Bearer t2"]);
  assert.equal(seen[0].headers.get("x-api-key"), null);
});

test("returns RFC 7807 errors in error", async () => {
  const nx = createNextXClient({ apiKey: "nxk_test", fetch: async () => json({ title: "Forbidden", status: 403 }, 403, "application/problem+json") });
  const { data, error, response } = await nx.GET("/api/v1/crm/contacts");
  assert.equal(data, undefined);
  assert.equal(response.status, 403);
  assert.equal(error.status, 403);
});

// Bộ mẫu chính thức của Standard Webhooks (standard-webhooks/standard-webhooks, thư mục test) — kiểm độc lập với mã ký của NextX.
const SW = {
  secret: "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw",
  id: "msg_p5jXN8AQM9LWM0D4loKWxJek",
  ts: 1614265330,
  body: '{"test": 2432232314}',
  sig: "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
};

test("webhooks: khớp bộ mẫu chuẩn Standard Webhooks, ESM + CJS", async () => {
  const { verifyWebhook, signWebhook } = await import("../dist/esm/webhooks.js");
  const cjs = createRequire(import.meta.url)("../dist/cjs/webhooks.js");
  assert.equal(signWebhook(SW.secret, SW.id, SW.ts, SW.body), SW.sig);
  const headers = { "Webhook-Id": SW.id, "webhook-timestamp": String(SW.ts), "webhook-signature": `v1,khoá-cũ ${SW.sig}` };
  for (const verify of [verifyWebhook, cjs.verifyWebhook])
    assert.deepEqual(verify(Buffer.from(SW.body), headers, SW.secret, { now: new Date(SW.ts * 1000) }), { test: 2432232314 });
});

test("webhooks: chữ ký sai, thân bị sửa, lệch giờ, thiếu header ⇒ ném lỗi", async () => {
  const { verifyWebhook, WebhookVerificationError } = await import("../dist/esm/webhooks.js");
  const h = { "webhook-id": SW.id, "webhook-timestamp": String(SW.ts), "webhook-signature": SW.sig };
  const at = { now: new Date(SW.ts * 1000) };
  assert.throws(() => verifyWebhook('{"test": 1}', h, SW.secret, at), WebhookVerificationError);
  assert.throws(() => verifyWebhook(SW.body, { ...h, "webhook-signature": "v1,AAAA" }, SW.secret, at), /không khớp/);
  assert.throws(() => verifyWebhook(SW.body, h, SW.secret, { now: new Date((SW.ts + 301) * 1000) }), /lệch/);
  assert.throws(() => verifyWebhook(SW.body, { "webhook-id": SW.id }, SW.secret, at), /thiếu header/);
  assert.throws(() => verifyWebhook(SW.body, h, "khong-phai-whsec", at), /whsec_/);
  // Headers của fetch / Request (Next.js route handler, Workers…)
  assert.deepEqual(verifyWebhook(SW.body, new Headers(h), SW.secret, at), { test: 2432232314 });
});
