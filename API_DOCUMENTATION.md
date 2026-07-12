# Tài Liệu Tích Hợp API Dữ Liệu Phim (External Movie Metadata API)

## 1. Tổng Quan Dự Án

**Mục Đích:**
API Tích Hợp Dữ Liệu Phim là một microservice độc lập được thiết kế để giúp quản trị viên (Admin) nhanh chóng import thông tin phim chính xác từ các nhà cung cấp bên ngoài. Nó đóng vai trò là cầu nối dữ liệu giữa cơ sở dữ liệu phim bên ngoài (chủ yếu là The Movie Database - TMDB) và Hệ Thống Đặt Vé Xem Phim nội bộ.

**Kiến Trúc:**
API này hoạt động như một tầng trung gian để tổng hợp và chuẩn hóa dữ liệu. Nó **KHÔNG** thuộc về Hệ Thống Đặt Vé Xem Phim cốt lõi. Nó hoạt động độc lập, giao tiếp với các bên thứ ba, chuẩn hóa định dạng dữ liệu trả về, và cung cấp dữ liệu sạch cho các client nội bộ (như Frontend của Admin hoặc Backend nội bộ).

**Trách Nhiệm:**
- Kéo metadata thô từ các nhà cung cấp bên ngoài.
- Chuẩn hóa và làm sạch dữ liệu theo định dạng mà hệ thống nội bộ yêu cầu.
- Quản lý giới hạn request (rate-limiting) và API key của nhà cung cấp.
- Cung cấp cơ chế bộ nhớ đệm (Caching) để giảm bớt số lần gọi ra ngoài không cần thiết.

**Giới Hạn:**
- API này không thay đổi bất kỳ dữ liệu nào trong Database của Hệ Thống Đặt Vé. Nó hoàn toàn là một service tích hợp chỉ-đọc (read-only).
- Hoạt động của hệ thống phụ thuộc vào trạng thái "sống" của các nhà cung cấp bên ngoài (TMDB).

**Trường Hợp Sử Dụng Phổ Biến:**
- Một quản trị viên muốn thêm một bộ phim mới vào rạp. Thay vì tự gõ tay toàn bộ diễn viên, đạo diễn, tóm tắt, và link trailer, họ chỉ cần tìm tên phim qua API này, xem trước dữ liệu được tự động điền, và ấn "Import".

---

## 2. Luồng Nghiệp Vụ (Business Workflow)

Luồng đi tiêu chuẩn để import một bộ phim vào hệ thống nội bộ:

```text
[ Giao diện Admin ] 
    │
    ├─► 1. Tìm Kiếm Phim (Gọi API GET /api/import/search)
    │
    ├─► 2. Chọn Phim từ danh sách gợi ý
    │
    ├─► 3. Xem Trước Thông Tin (Gọi API GET /api/import/preview/:id)
    │      ↳ API lấy toàn bộ thông tin chi tiết: diễn viên, đạo diễn, trailer, ảnh.
    │
    ├─► 4. Import / Xác Nhận
    │
[ Backend Quản Lý Phim ] (Hệ thống cốt lõi)
    │
    └─► 5. Lưu xuống Database nội bộ
```

---

## 3. Đường Dẫn API (Base URL)

**Môi Trường Development:**
`http://localhost:9001/api/import`

**Môi Trường Production:**
`https://api-integration.yourdomain.com/api/import`

**Phiên Bản (Versioning):**
API hiện tại chưa đánh số phiên bản trực tiếp trên URL nhưng đóng vai trò là `v1`. Bất kỳ thay đổi lớn (breaking changes) nào trong tương lai sẽ được nâng cấp thành `/api/v2/import`.

---

## 4. Bảo Mật & Xác Thực (Authentication)

**Yêu cầu BẮT BUỘC phải Xác thực.** 
Mặc dù service này không thay đổi Database nội bộ, nó lại tiêu tốn hạn ngạch gọi API của bên thứ 3 (Token của TMDB). Do đó, nó phải được khóa kỹ để tránh người lạ gọi bừa bãi.

Mọi Client khi gọi API đều phải truyền API Key:
- **Truyền qua Header:** `x-api-key: <API_KEY_CỦA_BẠN>`
- **Truyền qua Query URL:** `?api_key=<API_KEY_CỦA_BẠN>`

*Lưu ý: API này được thiết kế để chỉ gọi từ các service nội bộ đã được cấp quyền (như Frontend Admin hoặc Backend Service).*

---

## 5. Định Dạng Trả Về (Response Format)

Toàn bộ API đều trả về một bộ khung JSON chuẩn mực.

**Khi Thành Công (HTTP 2xx):**
```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

**Khi Thất Bại (HTTP 4xx, 5xx):**
```json
{
  "success": false,
  "errorCode": 404,
  "message": "Movie not found",
  "timestamp": "2026-07-12T15:00:00.000Z"
}
```

---

## 6. Danh Sách Endpoint

### 6.1 Tìm Kiếm Phim (Search Movies)
- **Mục Đích:** Tìm kiếm phim theo từ khóa.
- **URL:** `/search`
- **Method:** `GET`
- **Query Parameters:**
  - `keyword` (string, bắt buộc): Từ khóa tìm kiếm.
  - `page` (integer, tùy chọn): Số trang (mặc định: 1).
- **Ví Dụ Gọi:** `GET /search?keyword=avengers&page=1`
- **Ví Dụ Trả Về:**
```json
{
  "success": true,
  "data": {
    "page": 1,
    "results": [
      {
        "tmdbId": 299534,
        "title": "Avengers: Endgame",
        "releaseDate": "2019-04-24",
        "poster": "https://image.tmdb.org/t/p/original/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
        "popularity": 145.2
      }
    ],
    "total_pages": 1,
    "total_results": 1
  }
}
```

### 6.2 Lấy Thông Tin Tổng Hợp Để Điền Form (Preview Metadata)
- **Mục Đích:** Kéo trọn gói thông tin chi tiết đã chuẩn hóa (diễn viên, trailer, thể loại...) chỉ trong 1 lần gọi duy nhất.
- **URL:** `/preview/{id}`
- **Method:** `GET`
- **Path Parameters:**
  - `id` (integer, bắt buộc): Mã ID của phim trên TMDB.
- **Ví Dụ Gọi:** `GET /preview/299534`

### 6.3 Các API Nhỏ Lẻ (Standalone)
- **Lấy Danh Sách Diễn Viên/Đoàn Phim:** `GET /movie/{id}/credits`
- **Lấy Danh Sách Video/Trailer:** `GET /movie/{id}/videos`
- **Lấy Hình Ảnh:** `GET /movie/{id}/images`
- **Lấy Danh Sách Thể Loại (Genres):** `GET /genres`
- **Gợi Ý Tìm Kiếm Từ Khóa (Tags Autocomplete):** `GET /search/keyword?keyword=hero`
- **Lấy Phim Đang Hot:** `GET /popular`

---

## 7. Luồng Tìm Kiếm (Search Flow)

1. Người dùng gõ tên phim vào ô tìm kiếm.
2. Frontend áp dụng cơ chế **Debounce** (tầm 300ms) để chống spam khi người dùng chưa gõ xong.
3. Frontend gọi API `GET /search?keyword=...`.
4. Integration API kiểm tra RAM Cache (NodeCache).
   - Nếu có sẵn: Trả về lập tức.
   - Nếu chưa có: Gọi API `/search/movie` của TMDB, chuẩn hóa kết quả, lưu Cache, và trả về.
5. Frontend hiển thị danh sách gợi ý rơi xuống (Dropdown).

---

## 8. Luồng Trích Xuất Dữ Liệu Chi Tiết (Preview Flow)

API `/preview/:id` được thiết kế cực kỳ tối ưu để giảm tải cho Frontend.
Thay vì Frontend phải gọi 5 lần API khác nhau để lấy thông tin chung, dàn diễn viên, ekip đạo diễn, trailer, và hình ảnh; API này tận dụng tham số `append_to_response` của TMDB.

Hệ thống chỉ gọi ra mạng **DUY NHẤT MỘT LẦN**:
`GET /movie/{id}?append_to_response=credits,videos,images,keywords`

Sau đó Integration API sẽ đọc cục JSON khổng lồ trả về, cắt tỉa đi những trường rác, ép kiểu tên biến thành chuẩn `camelCase`, và gom gọn lại thành một Object cực kỳ dễ dùng.

---

## 9. Cấu Trúc Dữ Liệu Chi Tiết (Metadata Structure)

Cục dữ liệu chuẩn hóa trả về từ `/preview/:id` bao gồm:

- **`movie`**: Thông tin cơ bản (`tmdbId`, `title`, `overview`, `poster`, `backdrop`, `releaseDate`, `runtime`, `voteAverage`, `status`, `originalLanguage`).
- **`genres`**: Mảng các thể loại `{ id, genreName }`.
- **`casts`**: Mảng những diễn viên nổi bật nhất `{ id, name, character, profileImage }`.
- **`directors`**: Mảng các đạo diễn được lọc ra từ tổ hậu kỳ `{ id, name, profileImage }`.
- **`trailers`**: Mảng các video trên YouTube có loại là "Trailer" hoặc "Teaser" `{ name, key, site, type }`.

*(Lưu ý: Các trường không cần thiết như recommendations, external_ids đã bị lược bỏ để tối ưu dung lượng gói tin).*

---

## 10. Chiến Lược Nguồn Dữ Liệu (Provider Strategy)

- **Nguồn Chính (Primary):** The Movie Database (TMDB). Chứa thông tin phim đầy đủ và đa ngôn ngữ nhất thế giới.
- **Nguồn Dự Phòng (Fallback):** Hiện tại chưa cấu hình tự động chuyển nguồn. Tuy nhiên, kiến trúc Service Layer cho phép dễ dàng "cắm" thêm các nguồn khác (như OMDB, IMDB) vào thay thế nếu TMDB bị lỗi.
- **Chiến Lược Dịch Thuật:** Nếu Frontend gọi API với ngôn ngữ Tiếng Việt (`vi-VN`), nhưng TMDB không có đoạn văn tóm tắt (Overview) bằng Tiếng Việt cho phim đó, hệ thống sẽ tự động bắt lỗi và gọi thêm 1 lượt để lấy đoạn văn bằng Tiếng Anh (`en-US`), đảm bảo dữ liệu không bị bỏ trống.

---

## 11. Xử Lý Lỗi (Error Handling)

API tuân thủ các mã trạng thái HTTP tiêu chuẩn:

- **400 Bad Request:** Truyền thiếu tham số (VD: gọi `/search` nhưng thiếu keyword) hoặc ID sai định dạng.
- **401 Unauthorized:** Quên truyền API Key.
- **403 Forbidden:** Truyền API Key nhưng bị sai.
- **404 Not Found:** Không tìm thấy bộ phim có ID tương ứng trên nguồn.
- **429 Too Many Requests:** Bị khóa do xả đạn gọi quá nhiều (Giới hạn: 50 requests/giây).
- **500 Internal Server Error:** Lỗi bất ngờ từ Backend hoặc không parse được dữ liệu của nhà cung cấp.
- **502 Bad Gateway / 504 Gateway Timeout:** Nhà cung cấp (TMDB) đang sập hoặc quá tải, không phản hồi.

---

## 12. Giới Hạn Tốc Độ (Rate Limiting)

Để bảo vệ Server chống lại các cuộc tấn công DDoS và tuân thủ luật của TMDB:
- **Giới Hạn:** Tối đa 50 requests / 1 giây / 1 địa chỉ IP.
- **Cơ Chế:** Quản lý qua `express-rate-limit`. Nếu vượt ngưỡng, Server trả mã `429 Too Many Requests`.
- **Retry:** Client (Frontend) nên áp dụng thuật toán `Exponential Backoff` để chờ một chút trước khi thử gọi lại.

---

## 13. Cơ Chế Bộ Nhớ Đệm (Caching)

- **Công Nghệ Sử Dụng:** Lưu trên RAM qua thư viện `node-cache`.
- **Dữ Liệu Bị Cache:** Tất cả các lệnh `GET` (Tìm kiếm, Trích xuất chi tiết, Thể loại).
- **Thời Gian Tồn Tại (TTL):** 3600 giây (1 tiếng).
- **Xóa Cache (Invalidation):** Dữ liệu tự động bốc hơi sau 1 tiếng. Bởi vì thông tin phim rất hiếm khi thay đổi theo từng phút, con số 1 tiếng là một chiến lược an toàn và tối ưu tuyệt đối.

---

## 14. Best Practices (Khuyên Dùng)

- **Chống Spam (Debounce):** Khi làm ô tìm kiếm, hãy luôn dùng Debounce (200ms - 500ms) để tránh bắn API liên tục mỗi khi user gõ 1 phím.
- **Dùng Preview thay cho Standalone:** Khi cần Auto-fill form, HÃY DÙNG `/preview/:id`. Đừng dại dột gọi riêng lẻ `/credits` và `/videos` vì nó làm tốn tài nguyên mạng, hãy để Server dùng `append_to_response` gom lại thành 1 cục cho bạn.
- **Xử Lý Sự Cố Khéo Léo:** Các API bên ngoài luôn có tỷ lệ sập. Nếu API trả về `502 / 504`, Frontend nên hiện thông báo lịch sự và cho phép Admin "Gõ Bằng Tay" thay vì làm tê liệt toàn bộ quy trình Thêm Phim.

---

## 15. Ví Dụ Cấu Hình Tích Hợp

### Dành cho JavaScript (Fetch API - Dùng cho VanillaJS/React)
```javascript
const fetchPreview = async (tmdbId) => {
  const response = await fetch(`http://localhost:9001/api/import/preview/${tmdbId}`, {
    headers: { 'x-api-key': 'your-api-key' }
  });
  const result = await response.json();
  if (result.success) {
    console.log("Tên Phim: ", result.data.movie.title);
  }
};
```

### Dành cho Axios (Vue/React/Angular)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:9001/api/import',
  headers: { 'x-api-key': 'your-api-key' }
});

api.get('/search?keyword=Inception').then(res => console.log(res.data));
```

### Dành cho Java Spring Boot (Backend Internal)
```java
HttpHeaders headers = new HttpHeaders();
headers.set("x-api-key", "your-api-key");
HttpEntity<String> entity = new HttpEntity<>(headers);

ResponseEntity<String> response = restTemplate.exchange(
    "http://localhost:9001/api/import/preview/27205",
    HttpMethod.GET, entity, String.class
);
```

---

## 16. Swagger & OpenAPI

Dự án có tích hợp sẵn giao diện OpenAPI (Swagger) siêu xịn để bạn Click & Test.
- **Truy cập:** Mở trình duyệt vào `http://localhost:9001/api-docs`
- **Hướng dẫn test:** Bấm vào nút **Authorize** (hình ổ khóa màu xanh lá cây góc trên bên phải), điền `x-api-key` vào. Xong xuôi thì xổ các API xuống và nhấn "Try it out".

---

## 17. Câu Hỏi Thường Gặp (FAQ)

**Q: API này có tự động Lưu phim vào Database hệ thống của mình không?**
A: Hoàn toàn không. Nó chỉ làm nhiệm vụ đi "xách" dữ liệu về và nhào nặn lại cho đẹp. Việc gửi dữ liệu này xuống Database phải do Frontend của bạn phụ trách gọi tới Backend nội bộ.

**Q: Vì sao phim tôi lấy Tóm tắt (Overview) lại ra Tiếng Anh trong khi tôi dùng tiếng Việt?**
A: TMDB là hệ thống đóng góp từ cộng đồng. Nếu một bộ phim chưa có ai dịch đoạn Overview sang Tiếng Việt, API của chúng tôi sẽ tự động kích hoạt hệ thống Fallback để móc đoạn Overview Tiếng Anh về thay thế để tránh việc Form của bạn bị trống rỗng.

**Q: Hệ thống có lấy được Show Truyền Hình (TV Series) không?**
A: Hệ thống hiện tại đang tối ưu hóa mạnh nhất cho đối tượng "Movie" (Phim Lẻ). Với Series dài tập, dữ liệu tìm kiếm sẽ bị hạn chế do đang filter theo endpoint `search/movie`.

---

## 18. Nhật Ký Cập Nhật (Changelog)

| Phiên Bản | Ngày       | Người Code | Ghi Chú                                                                 |
|-----------|------------|------------|-------------------------------------------------------------------------|
| 1.0.0     | 12-07-2026 | Team       | Phát hành bản đầu. Viết xong Search, Preview, Caching, Normalization.   |
| 1.1.0     | 12-07-2026 | Team       | Thêm lớp bảo mật bằng API Key. Xây thêm API Autocomplete cho Keywords.  |

---

## 19. Phụ Lục (Appendix)

### Các Nhà Cung Cấp Hỗ Trợ
- **TMDB (The Movie Database):** Hỗ trợ API v3

### Các Biến Môi Trường (Environment Variables)
Để Server API có thể khởi động, cần phải điền đủ các biến sau vào file `.env`:

| Tên Biến                 | Giá Trị Mặc Định               | Giải Thích Chức Năng                      |
|--------------------------|--------------------------------|-------------------------------------------|
| `NODE_ENV`               | development                    | Chế độ chạy (dev / prod).                 |
| `PORT`                   | 9001                           | Cổng chạy ứng dụng.                       |
| `API_KEY`                | lorafilm-secret-key              | Mật khẩu để các App khác có thể gọi vào.  |
| `TMDB_TOKEN`             | -                              | Mã xác thực JWT Bearer lấy từ cấp độ TMDB.|
| `TMDB_BASE_URL`          | https://api.themoviedb.org/3   | Domain gốc của TMDB API.                  |
| `TMDB_IMAGE_BASE`        | https://image.tmdb.org/t/p     | Link ghép đầu cho việc tải Poster ảnh.    |
| `TMDB_IMAGE_SIZE`        | original                       | Định dạng độ nét của ảnh (VD: w500).      |
| `CACHE_TTL`              | 3600                           | Tuổi thọ của RAM Cache (tính bằng giây).  |
