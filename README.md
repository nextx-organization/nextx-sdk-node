# @nextxai/sdk

Thư viện chính thức để gọi NextX API từ Node.js và TypeScript.

Mã trong kho này được sinh tự động từ [OpenAPI của NextX](https://developers.nextx.vn/openapi.json). Vui lòng không sửa trực tiếp, xem [CONTRIBUTING.md](CONTRIBUTING.md).

## Cài đặt

```sh
npm i @nextxai/sdk
```

Yêu cầu Node.js 18 trở lên. Gói hỗ trợ cả `import` và `require`, chạy được trên Deno, Bun và trình duyệt.

## Bắt đầu

```ts
import { createNextXClient, SANDBOX_URL } from "@nextxai/sdk";

// Khoá API của workspace, tạo trong phần mềm NextX, gửi ở header X-Api-Key
const nx = createNextXClient({ apiKey: process.env.NEXTX_API_KEY!, baseUrl: SANDBOX_URL });

const { data, error } = await nx.GET("/api/v1/crm/contacts", { params: { query: { pageSize: 20 } } });
if (error) throw new Error(`${error.status} ${error.title}`);
for (const c of data.items ?? []) console.log(c.fullName);
```

Ứng dụng đối tác dùng OAuth 2.0 thì truyền access token. Có thể truyền một hàm để lấy token mới cho mỗi lần gọi:

```ts
const nx = createNextXClient({ accessToken: () => tokenStore.current() });
```

## Nhận webhook

Kiểm chữ ký theo chuẩn [Standard Webhooks](https://www.standardwebhooks.com) (chỉ chạy trên máy chủ). Truyền thân gốc, không phải JSON đã parse:

```ts
import { verifyWebhook } from "@nextxai/sdk/webhooks";

app.post("/nextx/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const event = verifyWebhook(req.body, req.headers, process.env.NEXTX_WEBHOOK_SECRET!);
  if (event.type === "call.completed") console.log(event.data.object.talkSec, event.data.object.contactRef);
  res.sendStatus(204);
});
```

Sai chữ ký hoặc lệch giờ quá 5 phút thì ném `WebhookVerificationError`. Dùng `event.id` để bỏ qua lần giao trùng.

## Softphone nhúng (trình duyệt)

```ts
import { NextXPhone } from "@nextxai/sdk/phone";

const phone = NextXPhone.init({ clientId: "nxa_…" });
phone.on("incoming", (c) => openCustomer(c.from));
phone.call("0901234567");   // phone.answer() · phone.hangup()
```

## Ghi chú

- Mặc định client gọi môi trường production. Khi thử nghiệm, dùng `SANDBOX_URL` với khoá sandbox.
- Lỗi trả về theo chuẩn RFC 7807 trong `error` (`status`, `title`, `detail`), không ném ngoại lệ.
- Với các lệnh ghi (POST, PUT, PATCH), nên gửi `Idempotency-Key` để thử lại an toàn:
  `nx.POST(path, { body, headers: { "Idempotency-Key": crypto.randomUUID() } })`.
- Không đưa khoá API vào mã chạy trên trình duyệt của người dùng cuối. Ứng dụng phía máy khách nên dùng access token OAuth.

## Tài liệu

- Hướng dẫn: https://developers.nextx.vn/docs/sdk
- Phiên bản và chính sách ngừng hỗ trợ: [VERSIONING.md](VERSIONING.md)
- Nhật ký thay đổi: [CHANGELOG.md](CHANGELOG.md)

Giấy phép MIT.
