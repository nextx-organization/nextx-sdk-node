/// <reference lib="dom" />
/**
 * NextX Phone — nhúng softphone NextX vào phần mềm của bạn (chạy trên trình duyệt).
 *
 *   import { NextXPhone } from "@nextxai/sdk/phone";
 *   const phone = NextXPhone.init({ clientId: "app_…" });
 *   phone.on("incoming", (c) => openCustomer(c.from));
 *   phone.call("0901234567");
 *
 * Hoặc thẻ script: <script src="https://developers.nextx.vn/phone/v1/phone.js"></script> ⇒ `window.NextXPhone`.
 *
 * Softphone chạy trong iframe do NextX phục vụ; tổng đài viên đăng nhập NextX trong cửa sổ bật lên. Trang của bạn chỉ
 * nhận sự kiện cuộc gọi — không bao giờ nhận token hay thông tin máy lẻ. Tên miền trang của bạn phải được khai trong
 * developers.nextx.vn › Ứng dụng của tôi › Cài đặt › Softphone nhúng.
 */

export const PHONE_PROTOCOL = "nxphone/1";

export interface NextXPhoneOptions {
  /** client_id của ứng dụng của bạn trên developers.nextx.vn. */
  clientId: string;
  /** Ngôn ngữ giao diện. Mặc định "vi". */
  lang?: "vi" | "en";
  /** Workspace NextX muốn đăng nhập (bỏ trống = workspace mặc định của tổng đài viên). */
  workspaceId?: string;
  /** Góc màn hình. Mặc định "bottom-right". */
  position?: "bottom-right" | "bottom-left";
  /** Khoảng cách tới mép (px). Mặc định 0. */
  offset?: number;
  /** Bắt số trong các phần tử có `data-nextx-call="<số>"` (bấm là gọi). Mặc định true. */
  clickToDial?: boolean;
  /** Ghi đè địa chỉ ứng dụng (vd sandbox: "https://app-dev.nextx.vn"). */
  appUrl?: string;
}

export interface PhoneCallEvent {
  callId: string;
  from?: string;
  to?: string;
  direction?: string;
  status?: string;
  talkSec?: number;
}

export interface PhoneEvents {
  ready: { loggedIn: boolean };
  "auth-required": Record<string, never>;
  status: { registered: boolean; extension?: string | null };
  incoming: PhoneCallEvent;
  answered: PhoneCallEvent;
  ended: PhoneCallEvent;
  error: { code: string; message?: string };
}

type Handler<K extends keyof PhoneEvents> = (payload: PhoneEvents[K]) => void;

const DEFAULT_APP_URL = "https://app.nextx.vn";
const INITIAL = { width: 96, height: 96 };

export class NextXPhone {
  private readonly iframe: HTMLIFrameElement;
  private readonly origin: string;
  private readonly handlers = new Map<keyof PhoneEvents, Set<(p: unknown) => void>>();
  private readonly queue: unknown[] = [];
  private ready = false;
  private readonly onMessage: (e: MessageEvent) => void;
  private readonly onClick: (e: MouseEvent) => void;

  private constructor(private readonly options: NextXPhoneOptions) {
    if (!options?.clientId) throw new Error("NextXPhone: thiếu clientId");
    const appUrl = (options.appUrl ?? DEFAULT_APP_URL).replace(/\/+$/, "");
    this.origin = new URL(appUrl).origin;
    const q = new URLSearchParams({ client_id: options.clientId });
    if (options.workspaceId) q.set("workspace_id", options.workspaceId);

    const f = document.createElement("iframe");
    f.src = `${appUrl}/${options.lang ?? "vi"}/phone/embed?${q}`;
    f.title = "NextX Phone";
    f.allow = "microphone; autoplay";
    f.setAttribute("allowtransparency", "true");
    const side = options.position === "bottom-left" ? "left" : "right";
    const off = `${options.offset ?? 0}px`;
    Object.assign(f.style, {
      position: "fixed",
      bottom: off,
      [side]: off,
      width: `${INITIAL.width}px`,
      height: `${INITIAL.height}px`,
      border: "0",
      background: "transparent",
      colorScheme: "normal",
      zIndex: "2147483000",
    } as Partial<CSSStyleDeclaration>);
    this.iframe = f;

    this.onMessage = (e: MessageEvent) => {
      if (e.origin !== this.origin || e.source !== f.contentWindow) return;
      const msg = e.data as { protocol?: string; event?: { type: string } & Record<string, unknown> } | null;
      if (!msg || msg.protocol !== PHONE_PROTOCOL || !msg.event) return;
      const { type, ...payload } = msg.event;
      if (type === "resize") {
        const w = Math.max(64, Math.min(Number(payload.width) || INITIAL.width, window.innerWidth));
        const h = Math.max(64, Math.min(Number(payload.height) || INITIAL.height, window.innerHeight));
        f.style.width = `${w}px`;
        f.style.height = `${h}px`;
        return;
      }
      if (type === "ready" && !this.ready) {
        this.ready = true;
        for (const c of this.queue.splice(0)) this.send(c);
      }
      this.handlers.get(type as keyof PhoneEvents)?.forEach((h) => h(payload));
    };

    this.onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-nextx-call]") as HTMLElement | null;
      const number = el?.getAttribute("data-nextx-call");
      if (!number) return;
      e.preventDefault();
      this.call(number, { contactRef: el?.getAttribute("data-nextx-contact-ref") ?? undefined });
    };

    window.addEventListener("message", this.onMessage);
    if (options.clickToDial !== false) document.addEventListener("click", this.onClick);
    (document.body ?? document.documentElement).appendChild(f);
  }

  /** Tạo và gắn NextX Phone vào trang. */
  static init(options: NextXPhoneOptions): NextXPhone {
    return new NextXPhone(options);
  }

  /** Nghe sự kiện. Trả hàm huỷ đăng ký. */
  on<K extends keyof PhoneEvents>(event: K, handler: Handler<K>): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as (p: unknown) => void);
    this.handlers.set(event, set);
    return () => set.delete(handler as (p: unknown) => void);
  }

  /** Gọi ra từ máy lẻ của tổng đài viên đang đăng nhập. */
  call(number: string, opts: { contactRef?: string } = {}): void {
    this.send({ type: "call", number: String(number), contactRef: opts.contactRef });
  }

  /** Nhấc cuộc đang đổ chuông (sự kiện `incoming`) — y như tổng đài viên bấm "Nghe" trong khung. */
  answer(): void {
    this.send({ type: "answer" });
  }

  /** Gác cuộc gọi đang diễn ra. */
  hangup(): void {
    this.send({ type: "hangup" });
  }

  /** Đăng xuất NextX trong khung softphone. */
  logout(): void {
    this.send({ type: "logout" });
  }

  /** Gỡ softphone khỏi trang. */
  destroy(): void {
    window.removeEventListener("message", this.onMessage);
    document.removeEventListener("click", this.onClick);
    this.iframe.remove();
    this.handlers.clear();
  }

  private send(command: unknown): void {
    if (!this.ready || !this.iframe.contentWindow) {
      this.queue.push(command);
      return;
    }
    this.iframe.contentWindow.postMessage({ protocol: PHONE_PROTOCOL, command }, this.origin);
  }
}

export default NextXPhone;
