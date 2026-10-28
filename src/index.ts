/**
 * NextX SDK cho Node.js/TypeScript. Kiểu `paths` sinh từ https://developers.nextx.vn/openapi.json — chỉ gồm các tuyến
 * đối tác gọi được — nên trình soạn thảo gợi đúng đường, tham số và hình dạng phản hồi.
 *
 *   const nx = createNextXClient({ apiKey: process.env.NEXTX_API_KEY! });
 *   const { data, error } = await nx.GET("/api/v1/crm/contacts", { params: { query: { pageSize: 20 } } });
 */
import createClient, { type Client, type Middleware } from "openapi-fetch";
import type { paths } from "./schema.js";
import { VERSION } from "./version.js";

export type { paths, components, operations } from "./schema.js";
export { VERSION };

export const PROD_URL = "https://api.nextx.vn";
export const SANDBOX_URL = "https://api-dev.nextx.vn";

export type NextXOptions = {
  /** Mặc định prod; thử nghiệm dùng `SANDBOX_URL` (khoá sandbox không gọi được prod và ngược lại). */
  baseUrl?: string;
  /** Ngôn ngữ thông báo lỗi: `vi` (mặc định) hoặc `en`. */
  language?: "vi" | "en";
  /** Thay fetch (proxy, đo đạc, kiểm thử). */
  fetch?: typeof globalThis.fetch;
} & (
  /** Khoá API của workspace (`nxk_…`) — gửi ở header `X-Api-Key`. */
  | { apiKey: string; accessToken?: never }
  /** Access token OAuth 2.0 của ứng dụng đối tác — gửi `Authorization: Bearer`; có thể là hàm để lấy token mới mỗi lần gọi. */
  | { accessToken: string | (() => string | Promise<string>); apiKey?: never }
);

export type NextXClient = Client<paths>;

/** Lỗi theo RFC 7807 mà API trả về khi `error` khác rỗng. */
export interface NextXProblem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
  errors?: Record<string, string[]> | string[] | null;
}

export function createNextXClient(opts: NextXOptions): NextXClient {
  const { baseUrl = PROD_URL, language = "vi", fetch } = opts;
  if (!opts.apiKey && !opts.accessToken) throw new Error("NextX SDK: cần apiKey hoặc accessToken");
  const client = createClient<paths>({
    baseUrl: baseUrl.replace(/\/+$/, ""),
    fetch,
    headers: {
      "Accept-Language": language,
      // Trình duyệt tự bỏ User-Agent nên chỉ có tác dụng phía máy chủ.
      "User-Agent": `nextx-sdk-node/${VERSION}`,
      ...(opts.apiKey ? { "X-Api-Key": opts.apiKey } : {}),
    },
  });
  const token = opts.accessToken;
  if (token) {
    const auth: Middleware = {
      async onRequest({ request }) {
        request.headers.set("Authorization", `Bearer ${typeof token === "function" ? await token() : token}`);
        return request;
      },
    };
    client.use(auth);
  }
  return client;
}
