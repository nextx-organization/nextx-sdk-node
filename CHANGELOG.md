# Nhật ký thay đổi

Theo [Semantic Versioning](https://semver.org/lang/vi/). Chính sách phiên bản: [VERSIONING.md](VERSIONING.md).

## 0.2.1 (2026-10-31)

### Thêm mới

- `GET /api/v1/call/calls/{id}/transcript`: Transcript STT
- `GET /api/v1/call/calls/{id}/summary`: AI summary + sentiment
- `POST /api/v1/call/partner/calls`: Bấm gọi thay tổng đài viên (click-to-call)
- `GET /api/v1/call/partner/calls/{id}`: Chi tiết một cuộc gọi
- `POST /api/v1/call/partner/calls/{id}/hangup`: Gác máy
- `POST /api/v1/call/partner/calls/{id}/transfer`: Chuyển máy
- `GET /api/v1/call/partner/calls/{id}/recording`: Link tải ghi âm (15 phút)
- `GET /api/v1/call/partner/active-calls`: Cuộc gọi đang diễn ra
- `GET /api/v1/call/partner/agents/status`: Trạng thái tổng đài viên
- `PUT /api/v1/call/partner/agents/status`: Đặt trạng thái tổng đài viên
- `#/ContractSummaryDto`: Thêm trường autoRenewStatus
- `#/PartnerSetAgentStatusRequest`: Thêm kiểu
- `#/PartnerAgentStatusDto`: Thêm kiểu
- `#/PartnerAgentDto`: Thêm kiểu
- `#/PartnerRecordingLinkDto`: Thêm kiểu
- `#/PartnerTransferRequest`: Thêm kiểu
- `#/PartnerAgentRefRequest`: Thêm kiểu
- `#/PartnerCallDto`: Thêm kiểu
- `#/PartnerOriginateRequest`: Thêm kiểu
- `#/CallSummaryAiDto`: Thêm kiểu
- `#/ActionItemDto`: Thêm kiểu
- `#/CallTranscriptDto`: Thêm kiểu
- `#/TranscriptSegmentDto`: Thêm kiểu

## 0.2.0 (2026-10-30)

### Thêm mới

- `@nextxai/sdk/phone` (chỉ Node): `NextXPhone` — nhúng softphone NextX vào phần mềm của bạn trên trình duyệt (`init`, `call`, `hangup`, `logout`, `destroy`, sự kiện `ready` · `auth-required` · `status` · `incoming` · `answered` · `ended` · `error`). Cùng mã với bản `<script src="https://developers.nextx.vn/phone/v1/phone.js">`.

## 0.1.2 (2026-10-30)

### Thêm mới

- `#/MemberDetailDto`: Thêm trường tagIds
- `#/MemberDetailDto`: Thêm trường tagSyncWarning

## 0.1.1 (2026-10-28)

- Viết lại README, VERSIONING, CONTRIBUTING và SECURITY cho dễ đọc. Mã không đổi so với 0.1.0.

## 0.1.0 (2026-10-28)

- Bản đầu tiên. Hỗ trợ 10 nhóm API: CRM, Bán hàng, Chat đa kênh, Tổng đài, DMS, Nhân sự, Marketing, Office, Thanh toán, Hoá đơn điện tử.
