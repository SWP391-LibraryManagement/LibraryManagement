# PLAN.md - FE01 Công Khai / Duyệt Sách

Phiên bản: 0.5.0

Trạng thái: v0.5.0 ĐÃ QUA H2 BAN ĐẦU VÀ CI PR #102; CHỜ H2 BỔ SUNG SAU KHẮC PHỤC H3

Chủ sở hữu: Dung

Cập nhật: 2026-08-03

Trạng thái quy trình: HOÀN THÀNH đối với phạm vi Giai đoạn 2 đã được phê duyệt; H3, merge và CI `main` chính xác sau merge được ghi nhận trong `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Các tuyên bố gate đang chờ/còn mở được giữ lại bên dưới là snapshot triển khai lịch sử đã được bằng chứng đó thay thế.

> **Dành cho tác nhân triển khai:** Thực hiện `TASKS.md` theo thứ tự. FE01 chỉ có quyền đọc. Không tạo hoặc cập nhật sách, bản sao, hồ sơ mượn, đặt chỗ, khoản phạt, người dùng hoặc hồ sơ audit nghiệp vụ.

---

## 1. Mục Tiêu

Duy trì trải nghiệm trang chủ, tìm kiếm và chi tiết công khai theo hợp đồng FE01 v0.3.7 đã được phê duyệt: bộ lọc công khai chính xác, phân trang/thứ tự xác định, ẩn sách không hoạt động, DTO an toàn, tình trạng có sẵn hiện tại do FE06 sở hữu, cách hiển thị an toàn theo vai trò, điều hướng được kết nối, các phần Homepage responsive và lỗi an toàn hướng tới người dùng.

## 2. Tài Liệu Nguồn

- `.sdd/specs/feat-public-browse/SPEC.md` v0.3.7.
- `.sdd/specs/feat-public-browse/CONTEXT.md` v0.1.1.
- `.sdd/specs/feat-public-browse/TASKS.md`.
- `.sdd/specs/feat-public-browse/TEST_PLAN.md`.
- `.sdd/specs/feat-book-management/SPEC.md` cho quyền sở hữu danh mục công khai dùng chung.
- `.sdd/specs/feat-inventory-book-copy/SPEC.md` cho quyền sở hữu `BookCopies.Status`.
- `.sdd/constraints/global.md`, `.sdd/constraints/business.md` và `.sdd/constraints/safety.md`.

## 3. Sai Lệch Lịch Sử Đã Được Đối Soát

Bảng sau ghi nhận sai lệch ban đầu của Giai đoạn 2. FE01-T001 đến FE01-T008 đã giải quyết các hạng mục này; đây không phải mô tả phần triển khai hiện tại.

| Hợp đồng đã phê duyệt | Sai lệch cần đối soát |
| --- | --- |
| Các trường query công khai chính xác là `q`, `categoryId`, `authorId`, `publisherId`, `page` và `limit`. | Đã đối soát: repository công khai chấp nhận các trường đã được phê duyệt; trường tìm kiếm chỉ dành cho nhân viên vẫn được cô lập trong FE05. |
| `q` khớp tên sách hoặc tên tác giả không phân biệt hoa thường và được giới hạn 1..200 ký tự khi được cung cấp. | Đã đối soát: SQL công khai chỉ khớp tên sách/tác giả và không khớp nội dung ISBN/thể loại/nhà xuất bản. |
| Kết quả công khai sử dụng `page=1`, `limit=20`, ranh giới `page>=1`, `limit=1..100` và `Title ASC, BookId ASC`. | Query trang chủ hiện tại trả về danh sách không phân trang, sắp xếp theo `BookId DESC`. |
| Chi tiết công khai ẩn sách không hoạt động và chỉ trả về trường an toàn cho công khai. | `getBookById` hiện trả về hàng không hoạt động và ánh xạ trường trạng thái/số lượng bản sao nội bộ vào DTO sách dùng chung. |
| Tình trạng có sẵn là `AVAILABLE` khi có ít nhất một `BookCopies.Status = AVAILABLE` hiện tại, nếu không là `UNAVAILABLE`. | Phản hồi hiện tại làm lộ số lượng bản sao chính xác và giao diện hiển thị nhãn cũ `ĐÃ MƯỢN` thay cho `Không khả dụng`. |
| Metadata tùy chọn vẫn nằm trong phản hồi dưới dạng `null`. | Ánh xạ hiện tại thay giá trị bị thiếu bằng chuỗi hiển thị như `Không rõ tác giả`, `Chưa phân loại` và ảnh mặc định trước khi áp dụng hợp đồng công khai. |
| FE01 chỉ có quyền đọc và sử dụng `/api/books` cùng `/api/books/{bookId}`. | `HomePage.jsx` sở hữu thao tác fetch trực tiếp, việc dùng endpoint thể loại, hành động mock cục bộ và luồng mượn thành công giả không được trình bày như hành vi FE01. |
| Hành vi công khai có bằng chứng chuyên biệt. | Chưa có file kiểm thử hợp đồng backend/frontend chuyên biệt cho FE01. |

## 4. Quyền Sở Hữu Và Ranh Giới File Dùng Chung

- FE01 sở hữu thao tác đọc an toàn cho công khai, validation query tên sách/tác giả, DTO công khai loại trừ ISBN và các trạng thái duyệt sách hướng tới Khách.
- FE05 sở hữu ISBN và các mutation metadata danh mục khác cùng chế độ xem quản lý dành cho nhân viên. FE01 không được thay đổi route mutation FE05 hoặc trường chỉ dành cho quản lý.
- FE06 sở hữu trạng thái bản sao vật lý và các chuyển tiếp tình trạng có sẵn. FE01 có thể đọc dữ liệu tổng hợp đã commit mới nhất nhưng không được ghi `BookCopies`.
- FE07 và FE08 sở hữu các chuyển tiếp mượn/đặt chỗ. FE01 chỉ phản ánh kết quả tình trạng có sẵn đã commit trong lần đọc sau.
- Các file backend dùng chung như `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js`, `backend/src/services/bookService.js` và `backend/src/repositories/bookRepository.js` cần phối hợp với chủ sở hữu FE05. Thay đổi công khai phải được cô lập khỏi các đường mutation quản lý.
- API FE01 chuẩn không có alias `/api/public/*` và không có endpoint `/api/books/categories` do FE01 sở hữu. Không được thêm bộ chọn thể loại trừ khi một hợp đồng riêng đã được phê duyệt cung cấp nguồn dữ liệu; `categoryId` vẫn là bộ lọc API được chấp nhận.

## 5. Giao Diện Công Khai Chuẩn

| Phương thức | Endpoint | Hành vi bắt buộc |
| --- | --- | --- |
| `GET` | `/api/books` | Truy cập an toàn cho công khai dành cho Khách/Thành viên/Thủ thư/Quản trị viên; `q` chỉ khớp tên sách/tác giả; trả về bản tóm tắt được phân trang không có ISBN, với thứ tự xác định và tình trạng có sẵn hiện tại. |
| `GET` | `/api/books/{bookId}` | Khách/Thành viên nhận chi tiết đang hoạt động an toàn cho công khai, không có ISBN; Thủ thư/Quản trị viên được server cấp quyền có thể nhận trường quản lý FE05 gồm ISBN; kiểm tra ID số nguyên dương và trả về `404` đối với sách công khai bị thiếu/bị ẩn. |

Envelope phản hồi phải tuân theo quy ước API dùng chung đã được phê duyệt mà hợp đồng đọc công khai FE05 sử dụng. Envelope phải chứa metadata phân trang cho phản hồi danh sách và tuyệt đối không được bao gồm ISBN, barcode, vị trí, dữ liệu người mượn/thành viên, hàng đặt chỗ, dữ liệu khoản phạt, dữ liệu audit hoặc trường chỉ dành cho nhân viên khác. Nếu envelope dùng chung thay đổi, đặc tả FE01 và FE05 phải được review cùng nhau trước khi tiếp tục triển khai.

## 6. Phạm Vi

### Trong Phạm Vi

- Validation query danh sách/tìm kiếm công khai và lọc phía cơ sở dữ liệu.
- Phân trang ổn định và thứ tự `Title ASC, BookId ASC`.
- Phép chiếu danh sách/chi tiết an toàn cho công khai với metadata tùy chọn `null`.
- Lọc sách không hoạt động/bị ẩn và hành vi `400`/`404`/`500` an toàn.
- Bản tóm tắt tình trạng có sẵn hiện tại được suy ra từ hồ sơ sách hoạt động và trạng thái bản sao do FE06 sở hữu.
- Trạng thái đang tải, trống, không có kết quả của trang chủ/tìm kiếm/chi tiết cho Khách/Thành viên, cách hiển thị tình trạng có sẵn an toàn theo vai trò và render fallback an toàn.
- Điều hướng desktop/thiết bị di động nhận biết vai trò, kết nối tới các route sở hữu hiện có.
- Các phần chủ đề danh mục, hành trình, tiếp tục, tư cách thành viên và footer responsive với phản hồi an toàn về chuyển động.
- Số điện thoại, email, địa chỉ ở footer và thông tin Quyền riêng tư/Điều khoản/lưu trữ trình duyệt có thể truy cập.
- Bằng chứng backend/frontend/SQL chuyên biệt và truy vết đầy đủ.

### Ngoài Phạm Vi

- Quy trình tạo/cập nhật/ngừng kích hoạt/kích hoạt lại sách.
- Endpoint metadata thể loại hoặc alias `/api/public/*`.
- Bản sao vật lý, barcode, vị trí hoặc chuyển tiếp trạng thái bản sao.
- Quyền sở hữu hành vi mượn, đặt chỗ, tư cách thành viên, xác thực, khoản phạt, review, danh sách đọc hoặc thanh toán; FE01 chỉ có thể định tuyến tới các quy trình hiện có đó.
- Số lượng bản sao chính xác, danh tính người mượn, vị trí hàng đợi, chi tiết kho dành cho nhân viên hoặc hồ sơ được bảo vệ trong phản hồi công khai.

## 7. Bản Đồ File Và Giao Diện

| Khu vực | File | Trách nhiệm |
| --- | --- | --- |
| Ranh giới công khai backend | `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js` | Giữ các route GET công khai chuẩn và hành vi lỗi an toàn ở cấp route; không mở rộng truy cập công khai tới route mutation. |
| Quy tắc nghiệp vụ backend | `backend/src/services/bookService.js` | Kiểm tra quy tắc query/ID FE01, chọn phép chiếu công khai và bảo toàn quyền sở hữu chỉ đọc. |
| Lưu trữ backend | `backend/src/repositories/bookRepository.js` | Áp dụng bộ lọc phía cơ sở dữ liệu, khả năng hiển thị hoạt động, tổng hợp tình trạng có sẵn, thứ tự ổn định và phân trang với dữ liệu đầu vào có tham số. |
| Tài liệu API | `backend/src/docs/openapi.yaml` | Ghi lại tham số, trường, phân trang, lỗi an toàn và việc không yêu cầu xác thực của danh sách/chi tiết công khai chuẩn. |
| Kiểm thử backend | Tạo `backend/tests/publicBrowseRoutes.test.js`, `backend/tests/publicBrowseRepository.test.js` và `backend/tests/sql/publicBrowseAvailability.sqltest.js` | Bao phủ hợp đồng route, che dữ liệu công khai, validation query, lọc/thứ tự SQL và tình trạng có sẵn đã commit mới nhất. |
| API frontend | `frontend/src/api/libraryFeatureApi.js` | Thêm wrapper API duyệt sách công khai nhỏ cho yêu cầu danh sách/chi tiết mà không cần access token. |
| Trang frontend | `frontend/src/page/HomePage.jsx` | Sử dụng dữ liệu server chuẩn, ẩn tình trạng có sẵn khỏi Khách/Thành viên, định tuyến từ vai trò duy nhất của tài khoản và render trải nghiệm Homepage/điều hướng/footer responsive được kết nối. |
| Kiểm thử frontend | `frontend/test/publicBrowseFrontend.test.js`, `frontend/test/appShellFrontend.test.js`, `frontend/test/homeBookActions.test.js` | Khóa việc dùng endpoint/query, render/định tuyến an toàn theo vai trò, hành vi điều hướng/footer, hợp đồng responsive, fallback null và không có mutation FE01 giả. |
| Chiến lược/lịch sử kiểm thử | `.sdd/specs/feat-public-browse/TEST_PLAN.md`, `.sdd/specs/feat-public-browse/CHANGELOG.md` | Ghi nhận lệnh tập trung, bằng chứng và trạng thái triển khai. |

## 8. Chiến Lược Triển Khai Theo Thứ Tự

1. Thêm kiểm thử hợp đồng route, repository, SQL và frontend FE01 đang thất bại.
2. Đối soát validation query công khai và ranh giới route/controller chuẩn.
3. Đối soát lọc repository, phân trang, thứ tự ổn định và tổng hợp tình trạng có sẵn FE06.
4. Triển khai phép chiếu danh sách/chi tiết an toàn cho công khai và hành vi sách bị ẩn/lỗi.
5. Tích hợp HomePage dành cho Khách với API công khai và xóa hành vi mutation giả do FE01 sở hữu.
6. Hoàn tất OpenAPI, truy vết, xác thực tập trung và review của con người.
7. Hoàn thiện thông tin liên hệ footer và thay liên kết chính sách trống bằng hộp thoại có thể truy cập.
8. Kết nối nhóm điều hướng desktop/thiết bị di động tới đích do vai trò sở hữu (triển khai lịch sử, được bước 11 thay thế).
9. Thêm các phần chủ đề danh mục, hành trình, tiếp tục theo vai trò và tư cách thành viên trung thực với cách hiển thị an toàn về chuyển động.
10. Ẩn cách hiển thị tình trạng có sẵn khỏi Khách/Thành viên trong khi giữ trạng thái cho Thủ thư/Quản trị viên và lựa chọn route Thành viên nội bộ.
11. Xóa bốn nhóm điều hướng header trên desktop/thiết bị di động trong khi giữ thương hiệu, điều khiển tài khoản và hành động tiếp tục theo vai trò.

## 9. Phụ Thuộc Và Trình Tự

1. Chủ sở hữu FE05 xác nhận envelope phản hồi sách công khai dùng chung và ranh giới chỉnh sửa file dùng chung.
2. Chủ sở hữu FE06 xác nhận dữ liệu tổng hợp tình trạng có sẵn chỉ dùng các giá trị `BookCopies.Status` đã commit mới nhất.
3. FE01-T001 đến FE01-T004 hoàn thành trước khi tích hợp frontend.
4. Công việc frontend FE01 có thể tiếp tục sau khi hình dạng phản hồi danh sách/chi tiết chuẩn ổn định.
5. FE01 phải được xác thực sau khi có hợp đồng đọc công khai FE05/FE06 hoặc bằng fixture trong bộ nhớ/SQL xác định, đại diện cho các hợp đồng đó.

## 10. Các Gate Xác Minh

| Gate | Lệnh | Kết quả mong đợi |
| --- | --- | --- |
| Route backend FE01 | `npm.cmd --prefix backend test -- --runTestsByPath tests/publicBrowseRoutes.test.js` | Các trường hợp danh sách/chi tiết công khai, validation, sách bị ẩn, che dữ liệu và chỉ đọc đều đạt. |
| Repository FE01 | `npm.cmd --prefix backend test -- --runTestsByPath tests/publicBrowseRepository.test.js` | Các trường hợp bộ lọc phía cơ sở dữ liệu, phân trang/thứ tự, metadata null và phép chiếu tình trạng có sẵn đều đạt. |
| Tình trạng có sẵn SQL FE01 | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/publicBrowseAvailability.sqltest.js` | Việc phản ánh trạng thái bản sao đã commit mới nhất và ẩn sách không hoạt động đạt khi có cấu hình SQL. |
| Frontend FE01 | `node --test frontend/test/publicBrowseFrontend.test.js frontend/test/appShellFrontend.test.js frontend/test/homeBookActions.test.js` | Việc dùng API trang chủ/tìm kiếm/chi tiết, tình trạng có sẵn an toàn theo vai trò, đích điều hướng/footer đã đăng ký, fallback null và không có mutation giả đều đạt. |
| Chất lượng frontend | `npm.cmd --prefix frontend run lint` và `npm.cmd --prefix frontend run build` | Lint và build production đạt. |
| Truy vết | `npm.cmd run trace:enforce` | Các file triển khai FE01 đã thay đổi đáp ứng ngưỡng truy vết của repository. |
| Vệ sinh diff | `git diff --check` | Không có lỗi khoảng trắng. |

## 11. Gate Review Của Con Người

- [x] Nhat đã phê duyệt các trường query công khai, phân trang, khả năng hiển thị, tình trạng có sẵn và hợp đồng trường an toàn FE01 vào 2026-07-17.
- [ ] Chủ sở hữu FE05 xác nhận envelope phản hồi công khai dùng chung và quyền sở hữu file dùng chung trước khi thay đổi mã nguồn.
- [ ] Chủ sở hữu FE06 xác nhận việc tổng hợp tình trạng có sẵn và hành vi commit mới nhất trước khi thay đổi mã nguồn.
- [x] Bằng chứng backend tập trung 9/9 và tình trạng có sẵn SQL dùng một lần của FE01 đã được ghi nhận cho baseline.
- [x] Bằng chứng Homepage hiện tại đạt: frontend duyệt sách công khai 14/14, frontend tập trung kết hợp 39/39, truy vết 18/18, lint, build production và kiểm tra diff.
- [ ] Dung và Nhat review DTO an toàn cho công khai cuối cùng và ranh giới không mutation trước khi merge.

## 12. Đợt circulation action v0.5.0 (H1 2026-08-03)

1. FE01-T015 bắt đầu bằng RED cho SQL/read model, phép chiếu public-safe và OpenAPI;
   GREEN bổ sung `circulationAction` nhưng giữ nguyên `availabilityStatus`.
2. FE01-T016 bắt đầu bằng RED cho bốn hành động Thành viên; GREEN vô hiệu hóa
   `WAIT`/`UNAVAILABLE`, giữ Khách và route quản lý nhân viên hiện có.
3. FE01-T017 chạy hồi quy FE07/FE08, Chromium có kiểm soát, truy vết và bằng chứng
   H2. Không commit/push trước H2; không merge/deploy trước H3.
4. Không đổi route, schema, enum, giới hạn hoặc phép lọc ứng viên FE07/FE08.

Gate tập trung:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/publicBrowseRepository.test.js tests/bookAvailabilityRepository.test.js tests/bookRoutes.test.js tests/publicBrowseRoutes.test.js
node --test frontend/test/homeBookActions.test.js frontend/test/publicBrowseFrontend.test.js
npm.cmd run trace:enforce
```
