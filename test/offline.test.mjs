// Kiểm không mạng: gói nạp được cả ESM lẫn CJS, client gắn đúng header và đường dẫn.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createNextXClient, PROD_URL, SANDBOX_URL, VERSION } from "../dist/esm/index.js";

const json = (body, status = 200, type = "application/json") =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": type } });

test("ESM + CJS cùng xuất API", () => {
  const cjs = createRequire(import.meta.url)("../dist/cjs/index.js");
  assert.equal(typeof cjs.createNextXClient, "function");
  assert.equal(cjs.VERSION, VERSION);
  assert.equal(PROD_URL, "https://api.nextx.vn");
});

test("thiếu thông tin xác thực thì báo lỗi rõ", () => {
  assert.throws(() => createNextXClient({}), /apiKey hoặc accessToken/);
});

test("khoá API ⇒ X-Api-Key, ngôn ngữ, phiên bản, đúng URL", async () => {
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

test("access token dạng hàm ⇒ Bearer lấy mới mỗi lần gọi", async () => {
  const seen = []; let n = 0;
  const nx = createNextXClient({ accessToken: () => `t${++n}`, fetch: async (req) => { seen.push(req); return json({}); } });
  await nx.GET("/api/v1/crm/contacts"); await nx.GET("/api/v1/crm/contacts");
  assert.deepEqual(seen.map((r) => r.headers.get("authorization")), ["Bearer t1", "Bearer t2"]);
  assert.equal(seen[0].headers.get("x-api-key"), null);
});

test("lỗi RFC 7807 về qua error", async () => {
  const nx = createNextXClient({ apiKey: "nxk_test", fetch: async () => json({ title: "Không có quyền", status: 403 }, 403, "application/problem+json") });
  const { data, error, response } = await nx.GET("/api/v1/crm/contacts");
  assert.equal(data, undefined);
  assert.equal(response.status, 403);
  assert.equal(error.status, 403);
});
