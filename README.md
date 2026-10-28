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
