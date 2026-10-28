/**
 * NextX SDK for Node.js and TypeScript. Types are generated from https://developers.nextx.vn/openapi.json.
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
  /** Defaults to production. Use `SANDBOX_URL` with a sandbox key for testing. */
  baseUrl?: string;
  /** Language of error messages: `vi` (default) or `en`. */
  language?: "vi" | "en";
  /** Custom fetch implementation. */
  fetch?: typeof globalThis.fetch;
} & (
  /** Workspace API key (`nxk_...`), sent as the `X-Api-Key` header. */
  | { apiKey: string; accessToken?: never }
  /** OAuth 2.0 access token, sent as `Authorization: Bearer`. May be a function that returns a fresh token per request. */
  | { accessToken: string | (() => string | Promise<string>); apiKey?: never }
);

export type NextXClient = Client<paths>;

/** RFC 7807 problem details returned in `error`. */
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
  if (!opts.apiKey && !opts.accessToken) throw new Error("NextX SDK: apiKey or accessToken is required");
  const client = createClient<paths>({
    baseUrl: baseUrl.replace(/\/+$/, ""),
    fetch,
    headers: {
      "Accept-Language": language,
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
