/// <reference types="node" />
/**
 * Kiểm chữ ký webhook NextX theo chuẩn mở Standard Webhooks (https://www.standardwebhooks.com) — chỉ chạy trên máy chủ.
 *
 *   import { verifyWebhook } from "@nextxai/sdk/webhooks";
 *
 *   app.post("/nextx/webhook", express.raw({ type: "application/json" }), (req, res) => {
 *     const event = verifyWebhook(req.body, req.headers, process.env.NEXTX_WEBHOOK_SECRET!);
 *     if (event.type === "call.completed") saveCall(event.data.object);
 *     res.sendStatus(204);
 *   });
 *
 * Phải truyền THÂN GỐC (Buffer/chuỗi đúng từng byte) — JSON đã parse rồi stringify lại sẽ lệch chữ ký.
 * Bí mật dạng `whsec_…` lấy ở developers.nextx.vn › Webhooks (xoay khoá ⇒ header có nhiều chữ ký, khớp một là đủ).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** Hai lần giao cách nhau quá ngưỡng này (giây) bị coi là phát lại. */
export const DEFAULT_TOLERANCE_SEC = 300;

/** Tổng đài viên trong dữ liệu công khai. */
export interface WebhookAgent {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  extension: string;
}

/** `data.object` của các sự kiện `call.*` — cùng hình dạng với `GET /api/v1/call/partner/calls/{id}`. */
export interface WebhookCall {
  callId: string;
  /** 1 = ringing · 2 = answered · 3 = completed/missed · 4 = recording_ready · 5 = summary_ready — sắp xếp khi tới lệch thứ tự. */
  sequence: number;
  /** queued · initiated · ringing · in-progress · completed · busy · no-answer · failed · canceled · abandoned */
  status: string;
  direction: "inbound" | "outbound";
  /** E.164 khi chuẩn hoá được. */
  from: string;
  to: string;
  agent: WebhookAgent | null;
  queueId: string | null;
  queueName: string | null;
  startedAt: string | null;
  answeredAt: string | null;
  endedAt: string | null;
  durationSec: number | null;
  talkSec: number | null;
  waitSec: number | null;
  /** Mã Q.850 (16 = gác bình thường, 17 = bận, 19 = không trả lời, 41 = lỗi tạm thời…). */
  hangupCause: number | null;
  hangupCauseName: string | null;
  /** `contactRef` bạn gửi lúc gọi ra — trả lại nguyên văn. */
  contactRef: string | null;
  /** `metadata` bạn gửi lúc gọi ra — trả lại nguyên văn. */
  metadata: Record<string, string> | null;
  crmContactId: string | null;
  hasRecording: boolean;
  hasSummary: boolean;
  /** Tóm tắt AI — có từ sự kiện `call.summary_ready` (null trước đó). */
  summary: string | null;
}

/** `data.object` của `agent.status_changed`. */
export interface WebhookAgentStatus {
  agent: WebhookAgent;
  from: string;
  to: string;
  reason: string | null;
  changedAt: string;
}

export interface WebhookObjectMap {
  "call.ringing": WebhookCall;
  "call.answered": WebhookCall;
  "call.completed": WebhookCall;
  "call.missed": WebhookCall;
  "call.recording_ready": WebhookCall;
  "call.summary_ready": WebhookCall;
  "agent.status_changed": WebhookAgentStatus;
}

interface Envelope<K extends string, T> {
  id: string;
  type: K;
  api_version: string;
  created_at: string;
  workspace_id: string;
  livemode: boolean;
  data: { object: T };
  metadata?: Record<string, unknown>;
}

/** Sự kiện đã kiểm chữ ký. Thu hẹp kiểu bằng `event.type`. Loại sự kiện khác (CRM, Bán hàng…) có `data.object` là `unknown`. */
export type WebhookEvent =
  | { [K in keyof WebhookObjectMap]: Envelope<K, WebhookObjectMap[K]> }[keyof WebhookObjectMap]
  | Envelope<string & {}, unknown>;

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookVerificationError";
  }
}

type HeaderBag = Headers | Record<string, string | string[] | undefined>;

function header(headers: HeaderBag, name: string): string | undefined {
  if (typeof (headers as Headers).get === "function") return (headers as Headers).get(name) ?? undefined;
  const bag = headers as Record<string, string | string[] | undefined>;
  const hit = Object.keys(bag).find((k) => k.toLowerCase() === name);
  const v = hit === undefined ? undefined : bag[hit];
  return Array.isArray(v) ? v[0] : v;
}

function keyOf(secret: string): Buffer {
  if (!secret?.startsWith("whsec_")) throw new WebhookVerificationError("secret phải có dạng whsec_…");
  const key = Buffer.from(secret.slice(6), "base64");
  if (key.length < 24 || key.length > 64) throw new WebhookVerificationError("secret không hợp lệ");
  return key;
}

/** Ký một thân webhook — dùng để viết test cho phần nhận webhook của bạn. */
export function signWebhook(secret: string, id: string, timestamp: number, body: string | Buffer): string {
  const mac = createHmac("sha256", keyOf(secret));
  mac.update(`${id}.${timestamp}.`);
  mac.update(body);
  return `v1,${mac.digest("base64")}`;
}

/**
 * Kiểm `webhook-id` / `webhook-timestamp` / `webhook-signature` rồi trả sự kiện đã parse.
 * Ném {@link WebhookVerificationError} khi thiếu header, chữ ký sai, hoặc lệch giờ quá `toleranceSec`.
 * Dùng `webhook-id` (cũng là `event.id`) để bỏ qua lần giao trùng — NextX giao lại khi bạn không trả 2xx.
 */
export function verifyWebhook(
  body: string | Buffer | Uint8Array,
  headers: HeaderBag,
  secret: string,
  options: { toleranceSec?: number; now?: Date } = {},
): WebhookEvent {
  const id = header(headers, "webhook-id");
  const ts = header(headers, "webhook-timestamp");
  const sig = header(headers, "webhook-signature");
  if (!id || !ts || !sig) throw new WebhookVerificationError("thiếu header webhook-id / webhook-timestamp / webhook-signature");

  const timestamp = Number(ts);
  const now = Math.floor((options.now ?? new Date()).getTime() / 1000);
  if (!Number.isInteger(timestamp) || Math.abs(now - timestamp) > (options.toleranceSec ?? DEFAULT_TOLERANCE_SEC))
    throw new WebhookVerificationError("webhook-timestamp lệch quá ngưỡng");

  const raw = typeof body === "string" ? Buffer.from(body, "utf8") : Buffer.from(body);
  const expected = Buffer.from(signWebhook(secret, id, timestamp, raw));
  const ok = sig
    .split(" ")
    .filter(Boolean)
    .some((s) => {
      const candidate = Buffer.from(s);
      return candidate.length === expected.length && timingSafeEqual(candidate, expected);
    });
  if (!ok) throw new WebhookVerificationError("chữ ký không khớp");

  return JSON.parse(raw.toString("utf8")) as WebhookEvent;
}
