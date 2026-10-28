# Phiên bản

SDK đánh số theo [Semantic Versioning](https://semver.org/lang/vi/), độc lập với phiên bản API (`/api/v1`).

| Loại thay đổi | Từ 1.0 | Giai đoạn 0.x |
|---|---|---|
| Không tương thích ngược: bỏ endpoint, bỏ trường, đổi kiểu dữ liệu, thêm tham số bắt buộc | 2.0.0 | 0.2.0 |
| Tương thích ngược: thêm endpoint, tham số tuỳ chọn, trường mới trong phản hồi | 1.1.0 | 0.1.1 |
| Chỉ sửa mô tả | 1.0.1 | 0.1.1 |

## Kênh phát hành

| Kênh | npm | PyPI |
|---|---|---|
| Ổn định | `npm i @nextxai/sdk` | `pip install nextx-sdk` |
| Thử nghiệm (có thể thay đổi) | `npm i @nextxai/sdk@beta` | `pip install --pre nextx-sdk` |

## Ngừng hỗ trợ

Endpoint hoặc trường sắp bị bỏ sẽ được đánh dấu `deprecated` ít nhất 90 ngày trước khi gỡ. Thay đổi này được ghi trong nhật ký thay đổi và đi kèm một bản tăng số không tương thích.

## Kiểm tra nguồn gốc gói

Các gói được dựng và phát hành từ GitHub Actions của kho này, có chứng nhận nguồn gốc (provenance). Bạn có thể kiểm tra bằng `npm audit signatures` với npm, hoặc xem mục Provenance trên trang PyPI. Mỗi GitHub Release có kèm tệp `SHA256SUMS`.
