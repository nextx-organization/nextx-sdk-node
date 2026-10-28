# Phiên bản và bỏ dần

## Đánh số

SDK đánh số theo [Semantic Versioning](https://semver.org/lang/vi/), **tách khỏi** phiên bản API (`/api/v1`).
Mức tăng do máy so bản OpenAPI cũ và mới quyết định, không chọn tay:

| Thay đổi | Từ 1.0 | Giai đoạn 0.x (beta) |
|---|---|---|
| Phá vỡ: gỡ tuyến/trường/kiểu, đổi kiểu, thêm tham số hoặc trường **bắt buộc** ở yêu cầu, trường phản hồi không còn chắc có | tăng số đầu `2.0.0` | tăng số giữa `0.2.0` |
| Thêm mới tương thích: tuyến, tham số tuỳ chọn, trường phản hồi, giá trị enum | tăng số giữa `1.1.0` | tăng số cuối `0.1.1` |
| Chỉ đổi mô tả, ví dụ | tăng số cuối `1.0.1` | tăng số cuối `0.1.1` |

Mọi thay đổi phá vỡ phải được người duyệt trước khi phát hành. CI chặn mọi bản không tăng đủ mức.

## Kênh phát hành

| Kênh | npm | PyPI | Ghi chú |
|---|---|---|---|
| Ổn định | `npm i @nextx/sdk` | `pip install nextx-sdk` | khớp API prod |
| Xem trước | `npm i @nextx/sdk@beta` | `pip install --pre nextx-sdk` | bản đang thử nghiệm trước khi lên ổn định — có thể đổi bất kỳ lúc nào |

## Bỏ dần

1. Tuyến hoặc trường sắp gỡ được đánh dấu `deprecated` trong OpenAPI. SDK hiện cảnh báo trong trình soạn thảo, và nhật ký thay đổi ghi rõ.
2. Giữ **ít nhất 90 ngày** sau khi đánh dấu rồi mới gỡ.
3. Việc gỡ đi kèm bản tăng mức phá vỡ. Gỡ tuyến chưa từng đánh dấu bỏ dần thì CI chặn.

## Xác thực gói

Mọi bản được dựng và đăng từ GitHub Actions bằng trusted publishing, không dùng khoá đăng dài hạn.
Kiểm nguồn gốc gói: `npm audit signatures` (npm), mục *Provenance* trên trang gói PyPI. Tệp `SHA256SUMS` đính trong mỗi GitHub Release.
