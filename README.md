# @nextxai/sdk

> Mã trong kho này được sinh tự động từ [OpenAPI công khai](https://developers.nextx.vn/openapi.json). Đừng sửa tay — xem [CONTRIBUTING.md](CONTRIBUTING.md).

Gọi NextX API từ Node.js và TypeScript, có kiểu đầy đủ. Kiểu sinh từ [`/openapi.json`](https://developers.nextx.vn/openapi.json)
và chỉ gồm các tuyến đối tác gọi được, nên trình soạn thảo gợi đúng đường dẫn, tham số và hình dạng phản hồi.

```sh
npm i @nextxai/sdk
```

```ts
import { createNextXClient, SANDBOX_URL } from "@nextxai/sdk";

// Khoá API của workspace (tạo trong phần mềm NextX) — gửi ở header X-Api-Key
const nx = createNextXClient({ apiKey: process.env.NEXTX_API_KEY!, baseUrl: SANDBOX_URL });

const { data, error } = await nx.GET("/api/v1/crm/contacts", { params: { query: { pageSize: 20 } } });
if (error) throw new Error(`${error.status} ${error.title}`);
for (const c of data.items ?? []) console.log(c.fullName);
```

Ứng dụng đối tác dùng OAuth 2.0 thì truyền access token (có thể là hàm để lấy token mới mỗi lần gọi):
`createNextXClient({ accessToken: () => tokenStore.current() })`.

- Node.js ≥ 18, Deno, Bun và trình duyệt (dùng `fetch` chuẩn). Hỗ trợ cả ESM (`import`) và CommonJS (`require`).
- Mặc định gọi prod (`PROD_URL`). Thử nghiệm thì dùng `SANDBOX_URL` với khoá sandbox.
- Lỗi theo RFC 7807, trả trong `error` (`status`, `title`, `detail`), không ném ngoại lệ.
- Gọi ghi (POST/PUT/PATCH) nên gửi kèm `Idempotency-Key` để thử lại an toàn:
  `nx.POST(path, { body, headers: { "Idempotency-Key": crypto.randomUUID() } })`.
- Không đưa khoá API ra trình duyệt của người dùng cuối. Phía máy khách, dùng access token OAuth của ứng dụng.

Tài liệu: https://developers.nextx.vn/docs/sdk · Phiên bản và bỏ dần: [VERSIONING.md](https://github.com/nextx-organization/nextx-sdk-node/blob/main/VERSIONING.md) · Giấy phép MIT
