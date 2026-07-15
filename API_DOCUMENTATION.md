# API Documentation & Hướng Dẫn Sử Dụng

The full OpenAPI/Swagger documentation is hosted live at:
`/api-docs`

It covers all request schemas, required query parameters, authentication instructions, and expected response payloads (including Error formats and Pagination schemas).

## Frontend Integration

For a comprehensive guide on how the frontend team should utilize these endpoints to power the LoraFilm Admin movie-import workflow (specifically the `bundle` endpoint), please refer to:
[docs/FRONTEND_INTEGRATION.md](./docs/FRONTEND_INTEGRATION.md)

---

# Hướng Dẫn Sử Dụng TMDB-API

Đây là tài liệu hướng dẫn sử dụng và cài đặt cho dự án **TMDB-API** (TMDB Integration API). Dịch vụ này đóng vai trò là một API trung gian kết nối hệ thống LoraFilm với API của TMDB, giúp đồng bộ và chuẩn hóa dữ liệu phim theo yêu cầu cụ thể của LoraFilm.

## 1. Yêu Cầu Hệ Thống
Trước khi bắt đầu, đảm bảo máy tính/máy chủ của bạn đã cài đặt các phần mềm sau:
- **Node.js** (Khuyến nghị phiên bản LTS mới nhất - ví dụ v18 hoặc v20)
- **NPM** (Đi kèm với Node.js)
- **PM2** (Sử dụng để quản lý tiến trình chạy trên môi trường Production) - Cài đặt qua lệnh: `npm install -g pm2`

## 2. Cài Đặt Dự Án
**Bước 1:** Clone (Tải) mã nguồn về máy hoặc di chuyển vào thư mục dự án `TMDB-API`.

**Bước 2:** Cài đặt các thư viện phụ thuộc bằng lệnh:
```bash
npm install
```

**Bước 3:** Cấu hình biến môi trường
- Sao chép file `.env.example` và đổi tên thành `.env`
- Mở file `.env` lên và điền các thông số cấu hình. 
*(Lưu ý: Không bao giờ commit file `.env` lên Git).*

## 3. Khởi Chạy Ứng Dụng

**Môi trường phát triển (Development):**
```bash
npm run dev
```

**Môi trường sản xuất (Production) với PM2:**
```bash
pm2 start ecosystem.config.js --env production
```

## 4. Xác Thực (Authentication)
Tất cả các endpoint API (ngoại trừ `/health` và trang tài liệu Swagger) đều yêu cầu phải gửi kèm API Key trong Header của request:
```http
x-api-key: your-internal-api-key
```

> [!WARNING]
> **CẢNH BÁO BẢO MẬT:** Tuyệt đối không được để lộ `x-api-key` trên mã nguồn Frontend (React/Vite). Frontend chỉ nên gọi đến API Gateway hoặc backend chính của LoraFilm.

## 5. Cơ Chế Hoạt Động Bổ Sung
- **Cache Dữ Liệu:** Dịch vụ sử dụng bộ nhớ cache tạm thời trên RAM (`node-cache`) để tăng tốc độ phản hồi.
- **Tự Động Xử Lý Ngôn Ngữ:** Dịch vụ ưu tiên trả về dữ liệu phim bằng tiếng Việt (`vi-VN`). Nếu thiếu, hệ thống tự động điền phần thiếu bằng thông tin tiếng Anh (`en-US`).

## 6. Mã Lỗi (Error Codes)
Dưới đây là các mã lỗi chuẩn mà API có thể trả về:
- `VALIDATION_ERROR`
- `INVALID_API_KEY`
- `TMDB_MOVIE_NOT_FOUND`
- `TMDB_RESOURCE_NOT_FOUND`
- `TMDB_UNAUTHORIZED`
- `TMDB_FORBIDDEN`
- `TMDB_RATE_LIMITED`
- `TMDB_UNAVAILABLE`
- `TMDB_TIMEOUT`
- `TMDB_BAD_RESPONSE`
- `INTERNAL_SERVER_ERROR`

---

## 7. Danh Sách Các API Endpoints (Chi Tiết)

Dưới đây là danh sách tổng hợp toàn bộ các API Endpoints hiện có trong hệ thống (để xem schema JSON chi tiết của từng endpoint, vui lòng tham khảo Swagger tại `/api-docs`):

### Health
- **`GET /health`**
  - **Chức năng:** Kiểm tra trạng thái hoạt động của API.
  - **Yêu cầu API Key:** Không.

### Search
- **`GET /api/import/search`**
  - **Chức năng:** Tìm kiếm phim theo từ khóa.
  - **Tham số Query:** `keyword` (bắt buộc), `page` (mặc định: 1), `language`, `region`, `includeAdult` (mặc định: false).
- **`GET /api/import/search/suggestions`**
  - **Chức năng:** Gợi ý tìm kiếm phim (thích hợp cho tính năng Autocomplete).
  - **Tham số Query:** `keyword` (bắt buộc), `page` (mặc định: 1).

### Movie Import
- **`GET /api/import/movies/{tmdbId}/bundle`**
  - **Chức năng:** Tải về toàn bộ dữ liệu gói (bundle) của một bộ phim phục vụ cho quá trình Import vào hệ thống nội bộ.
  - **Tham số Path:** `tmdbId` (bắt buộc).
  - **Tham số Query:** `language`.

### Reference Data
- **`GET /api/import/genres`**
  - **Chức năng:** Lấy danh sách thể loại phim để tham chiếu.
  - **Tham số Query:** `language`.

### Movie Resources
Tất cả đều yêu cầu tham số Path `tmdbId`:
- **`GET /api/import/movies/{tmdbId}/release-dates`**: Lấy thông tin ngày phát hành của phim.
- **`GET /api/import/movies/{tmdbId}/translations`**: Lấy các bản dịch ngôn ngữ của phim.
- **`GET /api/import/movies/{tmdbId}/external-ids`**: Lấy các ID liên kết bên ngoài (như IMDB, Facebook, v.v.).

### Movie Discovery
- **`GET /api/import/discover/movies`**
  - **Chức năng:** Khám phá phim dựa trên các tiêu chí lọc.
  - **Tham số Query:** `page` (mặc định: 1), `sortBy` (mặc định: `popularity.desc`).

### Movie Lists
- **`GET /api/tmdb/movies/latest-top10`**
  - **Chức năng:** Lấy danh sách 10 phim mới nhất (dữ liệu được cache bởi một tiến trình (job) chạy ngầm để tăng tốc độ phản hồi).
  - **Tham số Query:** `limit` (tối đa 10).
