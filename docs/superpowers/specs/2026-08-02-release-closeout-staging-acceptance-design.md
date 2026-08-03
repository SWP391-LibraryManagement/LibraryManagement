# Kết thúc phát hành và chấp nhận giai đoạn — Thiết kế

- Ngày: 2026-08-02
- mốc cơ sở: `main@e01585a9aa7d603daf932f7ac6459eaa0752746c`
- Lô: `RELEASE-CLOSEOUT-STAGING-ACCEPTANCE-2026-08-02`
- Nhánh thiết kế: `codex/release-closeout-staging-acceptance-design`
- Phương thức phân phối: Lai SDD + ADD
- Độ sâu: Tiêu chuẩn/Đầy đủ cho lõi; Ánh sáng cho lớp bao
- Tình trạng: Đã phê duyệt thiết kế; kế hoạch thực hiện và thực hiện yêu cầu cổng tiếp theo của con người

## 1. kết quả

lô này đóng ba khoảng trống còn lại của đợt phát hành bằng bằng chứng kiểm chứng được:

1. Đồng bộ Nhiệm vụ, changelog và biên bản rà soát với những gì đã hợp nhất ở PR #95 và những gì thật sự vượt qua môi trường tiền sản xuất acceptance.
2. Chạy một acceptance luồng có đăng nhập trên Azure môi trường tiền sản xuất bằng tài khoản và dữ liệu tổng hợp tạm thời, phủ chuỗi nghiệp vụ liên vai trò.
3. Dọn các cây làm việc Git cũ theo cách không làm mất 31 tệp đang thay đổi, đồng thời tái xác nhận ngoại lệ bảo mật React Router hiện có.

Kết quả mong muốn không phải là “mọi checkbox đều xanh”. Mỗi Nhiệm vụ chỉ được đóng khi có bằng chứng
đúng với tiêu chí chấp nhận của chính Nhiệm vụ đó; phần chưa được kiểm chứng vẫn giữ trạng thái mở.

## 2. Không có mục tiêu

lô này không:

- thêm điểm cuối, tuyến, vai trò, lược đồ, di chuyển dữ liệu hay quy tắc nghiệp vụ mới;
- tạo tài khoản dùng chung lâu dài hoặc lưu mật khẩu trong repo/log/artifact;
- chạy trên môi trường sản xuất hoặc tạo quy trình sản xuất;
- nâng cấp/hạ cấp React Router một cách tự động;
- xóa vĩnh viễn người dùng, nhật ký kiểm toán hay lịch sử nghiệp vụ;
- xóa thay đổi chưa bản ghi Git trong cây làm việc Git;
- dùng `/health`, CI xanh hoặc smoke không đăng nhập thay thế cho kiểm thử nghiệp vụ thật.

## 3. Phân loại bàn giao

### 3.1 Cốt lõi

Các phần sau có blast radius cao và dùng mức tiêu chuẩn/đầy đủ:

- xác thực, session và token revocation;
- vai trò/permission của thành viên, thủ thư và quản trị viên;
- seed/dọn dẹp trực tiếp trên Azure SQL môi trường tiền sản xuất;
- mượn sách, hàng đợi đặt chỗ, trả sách, khoản phạt, thông báo và dấu vết kiểm toán;
- điều kiện đóng Nhiệm vụ dựa trên nghiệm thu thực tế.

lõi phải có khả năng truy vết, negative ủy quyền kiểm tra, dọn dẹp điều kiện bất biến và bằng chứng L1-L4.

### 3.2 Vỏ

Các phần sau có thể hoàn tác và dùng mức Light:

- cập nhật Nhiệm vụ/changelog/biên bản rà soát;
- tái xác nhận bảo mật exception đã tồn tại;
- lưu bằng chứng QA không chứa bí mật;
- đồng bộ bản làm việc gốc và dọn cây làm việc Git sau khi tạo recovery bản ghi Git.

lớp bao vẫn phải qua khác biệt rà soát, link được tới nguồn bằng chứng và không được đưa tuyên bố
rộng hơn kết quả thực tế.

## 4. Khoảng cách cơ bản và hiện tại đã được xác minh

mốc cơ sở trước khi thiết kế:

- môi trường tiền sản xuất đang chạy đúng revision `e01585a9aa7d603daf932f7ac6459eaa0752746c`;
- Lượt chạy CI `30711057582` và lượt triển khai môi trường tiền sản xuất `30711210037` đã thành công;
- Giao diện công khai, `/health`, mức sẵn sàng lược đồ, danh mục SQL, CORS và kiểm thử nhanh tuyến được bảo vệ đều đạt;
- Máy chủ có 1.175/1.175 kiểm thử, hệ thống 11/11, E2E 12/12 và triển khai 20/20;
- Khả năng truy vết hiện có 9 chức năng hoàn tất và 3 chức năng `PARTIAL`: xác thực, quản lý tư cách thành viên, quản lý người dùng-vai trò;
- Kiểm toán phụ thuộc máy chủ/gốc không có phát hiện; giao diện còn cảnh báo đã được kiểm soát cho `react-router` và `react-router-dom` 7.18.1;
- cây làm việc Git `h3-fe07-fe12-governance` có 31 tệp thay đổi chưa bản ghi Git và tuyệt đối không được xóa trực tiếp.

Khoảng trống còn lại:

- chưa có bằng chứng nghiệm thu có đăng nhập theo từng vai trò trên môi trường tiền sản xuất hiện tại;
- Nhiệm vụ/changelog chưa phản ánh đầy đủ PR #95;
- một số Nhiệm vụ cần nghiệm thu của con người/thời gian chạy nên chưa thể đóng chỉ bằng kiểm thử tự động;
- advisory bản ghi React Router cần gắn hiện tại bằng chứng, owner và rà soát trigger;
- cây làm việc Git cũ cần được hợp nhất về trạng thái dễ khôi phục mà không làm mất nội dung.

## 5. Kiến trúc chấp nhận phía nhà điều hành

Không tạo đường seed trong ứng dụng. Acceptance dùng một operator harness tạm thời ở máy cục bộ và một lần thực thi giới hạn qua Azure Kudu/SCM:

```text
Quy trình của người vận hành cục bộ
  |-- generates runId + four random passwords in memory
  |-- sends parameterized seed/cleanup commands to staging Kudu
  |-- drives staging UI with Playwright/browser automation
  |-- records only non-secret IDs, observations and screenshots
`-- luôn thực hiện dọn dẹp/xác minh cuối

Azure staging app/Kudu
  |-- reuses deployed runtime and staging connection configuration
`-- chỉ được thay đổi các bản ghi gắn với đúng runId/ID trong bảng kê khai
```

Hạn chế:

- harness là tệp tạm, nằm ngoài quản lý phiên bản và bị xóa sau lượt chạy;
- không có permanent API, backdoor, quản trị viên page hay CI quy trình mới;
- mọi SQL value phải parameterized; object names phải lấy từ lược đồ đã kiểm tra, không ghép từ input;
- lệnh bắt buộc khai báo rõ `environment=staging` và đúng Azure resource;
- mật khẩu chỉ tồn tại trong memory/environment của operator process, không xuất stdout/stderr;
- tệp kê khai chỉ chứa định danh không bí mật, dấu thời gian lượt chạy và trạng thái dọn dẹp;
- artifact có token, cookie, connection string, mật khẩu hoặc phản hồi header nhạy cảm phải bị loại bỏ/redact.

## 6. Hợp đồng cố định tổng hợp

### 6.1 Chạy danh tính

Mỗi lượt chạy có dấu nhận diện duy nhất:

```text
runId = lms-acceptance-20260802-<random-suffix>
```

Mọi tài khoản, membership application, book/copy và nghiệp vụ được tạo phải truy ngược được về
`runId` hoặc tệp kê khai ID chính xác. dọn dẹp không dùng wildcard theo tên/email.

### 6.2 Tài khoản

Bốn tài khoản tổng hợp:

| Bí danh | Vai trò | Mục đích |
|---|---|---|
| `member-a` | Thành viên | phê duyệt thành viên, vay, trả sách/phạt |
| `member-b` | Thành viên | hàng đợi đặt chỗ và thông báo |
| `librarian` | Thủ thư | phê duyệt lượt mượn, xử lý hoàn trả |
| `admin` | Quản trị viên | phê duyệt thành viên, kiểm tra Audit/report |

Hợp đồng tài khoản:

- email dùng domain `.invalid` và có `runId`;
- tên, địa chỉ và dữ liệu hồ sơ đều là tổng hợp, không sao chép người thật;
- mỗi tài khoản có mật khẩu ngẫu nhiên riêng, chỉ giữ trong memory;
- gán vai trò là tối thiểu, không cấp vai trò phụ để “cho kiểm thử chạy”;
- initial trạng thái chỉ đủ để UI/API thực hiện luồng thật; các trạng thái nghiệp vụ phải chuyển qua product luồng khi có thể.

### 6.3 Danh mục lịch thi đấu

Tạo đúng một book và một copy chuyên dụng, có dấu nhận diện `runId`, không dùng danh mục đang có. Copy này
là đối tượng duy nhất được mượn sách/reserve/trả sách trong lượt chạy, giúp tránh cạnh tranh với dữ liệu demo
hoặc người dùng môi trường tiền sản xuất khác.

### 6.4 Thiết lập phụ thuộc vào thời gian

Nếu cần kiểm tra quá hạn/khoản phạt, operator chỉ được điều chỉnh hạn trả của mượn sách detail thuộc
tệp kê khai sau khi mượn sách đã được phê duyệt qua product luồng. Không sửa clock hệ thống, policy
chung hoặc bản ghi ngoài tệp kê khai.

## 7. Kịch bản chấp nhận

### 7.1 Kiểm tra thiết lập

Trước khi seed:

1. xác nhận frontend/API host và deployed revision;
2. xác nhận cơ sở dữ liệu là môi trường tiền sản xuất target;
3. xác nhận không tồn tại `runId` trùng;
4. chạy lược đồ-readiness và kiểm tra các bảng/cột cần dùng;
5. khởi tạo cục bộ tệp kê khai không chứa secret.

Nếu bất kỳ kiểm tra nào không khớp, không seed.

### 7.2 Kiểm tra vai trò và xác thực

Với từng tài khoản:

- đăng nhập bằng UI;
- xác nhận identity/vai trò từ product UI hoặc authenticated `/me` hợp đồng;
- xác nhận tuyến hợp lệ của vai trò;
- đăng xuất và xác nhận session kết thúc.

Negative kiểm tra tối thiểu:

- thành viên không truy cập được Quản trị viên/Thủ thư operation;
- thủ thư không có quản trị viên-chỉ membership/vai trò operation;
- unauthenticated yêu cầu không truy cập protected operation;
- từ chối quyền phải là phản hồi mong đợi, không phải giao diện chỉ bị ẩn ở phía máy khách.

### 7.3 Luồng kinh doanh đa vai trò

luồng chuẩn:

```text
Quản trị viên phê duyệt tư cách thành viên tổng hợp
-> Thành viên A yêu cầu mượn bản sao tổng hợp
-> Thủ thư phê duyệt yêu cầu mượn
-> Thành viên B đặt chỗ đầu sách vừa chuyển sang không sẵn có
-> người vận hành chỉ thay đổi ngày đến hạn của dữ liệu kiểm thử
-> Thủ thư xử lý việc trả sách của Thành viên A
-> hệ thống tính khoản phạt/chuyển đổi trạng thái áp dụng
-> hàng đợi đặt chỗ chuyển tiếp cho Thành viên B
-> màn hình thông báo/kiểm toán/báo cáo phản ánh trạng thái kết quả
```

bằng chứng cho mỗi bước phải ghi:

- tác nhân và tuyến UI;
- hành động/nhấp chuột;
- API method/path quan sát được;
- yêu cầu identifiers nhưng không chứa credential/token;
- server-derived trạng thái trước/sau;
- kết quả mong đợi và kết quả thực tế;
- screenshot hoặc structured observation khi hữu ích.

### 7.4 Bất biến bắt buộc

lượt chạy chỉ đạt khi tất cả điều kiện sau đúng:

- vai trò isolation đúng ở cả UI và server phản hồi;
- thành viên A không tự phê duyệt mượn sách của mình;
- thành viên B có queue trạng thái nhất quán khi copy không available;
- trả sách không tạo xử lý hai lần khi lặp yêu cầu/refresh;
- khoản phạt, mượn sách trạng thái và tình trạng sẵn có của bản sao không mâu thuẫn;
- queue advancement/notification xuất hiện đúng người nhận;
- audit/report view không để vai trò ngoài phạm vi xem hoặc sửa dữ liệu;
- không có row nghiệp vụ ngoài tệp kê khai bị thay đổi.

## 8. Kiểm tra dọn dẹp và xóa dữ liệu tổng hợp

> Sửa đổi 2026-08-04: Phần này thay thế chính sách terminalize/giữ lại cho mọi lần chạy mới. Các
> lần chạy lịch sử ngày 2026-08-02 đã terminalize dữ liệu theo thiết kế cũ và phải được xử lý bằng
> công cụ operator exact-run đã review.

dọn dẹp chạy trong `finally`, kể cả khi setup hoặc acceptance thất bại giữa chừng.

Thứ tự:

1. đăng xuất browser contexts và xóa cục bộ cookies/storage;
2. xác minh chính xác bốn người dùng `.invalid`, một sách có tiêu đề theo run ID và một bản sao có barcode theo run ID;
3. xóa `NotificationAttempts`, `Notifications`, `Fines`, `Reservations`, `BorrowDetails`, `BorrowRequests`, membership/auth/audit liên quan theo thứ tự khóa ngoại;
4. xóa chính xác bản sao, sách, hồ sơ/vai trò và bốn tài khoản tổng hợp trong cùng transaction;
5. rollback nếu graph không đầy đủ, có tham chiếu ngoài dự kiến hoặc còn residue sau xóa;
6. chạy post-dọn dẹp queries theo run ID và xác nhận không còn hàng người dùng/sách/bản sao tổng hợp.

Bất biến sau dọn dẹp:

- không còn tài khoản tổng hợp;
- không còn phiên, thông báo, lượt mượn, đặt chỗ, phạt hoặc hồ sơ membership của run;
- không còn sách/bản sao tổng hợp trong danh mục quản lý;
- không còn audit row do tác nhân tổng hợp hoặc target exact-run tạo ra;
- tệp kê khai ghi `CLEANED`, `PARTIAL_CLEANUP` hoặc `FAILED_CLEANUP` cho từng đối tượng.

Nếu dọn dẹp không hoàn tất:

- không chạy lại bằng runId mới;
- không đóng các Nhiệm vụ phụ thuộc nghiệm thu thực tế;
- báo chính xác non-secret IDs còn sót và bước khắc phục;
- giữ tệp kê khai cho tới khi xác nhận sạch.

## 9. Bằng chứng và kết thúc nhiệm vụ

### 9.1 Hồ sơ chứng cứ

Tạo một biên bản rà soát mới tại:

`.sdd/reviews/release-closeout-staging-acceptance-2026-08-02.md`

bản ghi phải chứa:

- mốc cơ sở bản ghi Git, deployment/CI lượt chạy và môi trường tiền sản xuất hosts;
- runId đã redact phần ngẫu nhiên nếu cần;
- ma trận kịch bản ĐẠT/THẤT BẠI;
- vai trò/tuyến đường/API/bằng chứng trạng thái;
- kết quả dọn dẹp;
- link tới Nhiệm vụ/spec/changelog liên quan;
- unresolved items và owner;
- không chứa secret, token, cookie hoặc PII.

Screenshot/raw artifact nếu có được giữ ngoài Git trong output tạm; biên bản rà soát chỉ giữ bằng
chứng đã redact và đủ tái kiểm tra.

### 9.2 Kết thúc PR #95 hiện tại

Các Nhiệm vụ đã có hợp nhất/kiểm thử bằng chứng từ PR #95 được đối chiếu lại tiêu chí chấp nhận rồi
mới cập nhật:

- FE02-T067;
- FE05-T019;
- FE11-CAT01.

Việc cập nhật phải link tới bản ghi Git/PR/lượt chạy cụ thể, không dùng mô tả chung “đã hoàn thành”.

### 9.3 Kết thúc phụ thuộc vào sự chấp nhận trực tiếp

Các Nhiệm vụ FE04/FE11 chỉ được đóng nếu scenario thật sự phủ toàn bộ criteria của Nhiệm vụ. Đặc biệt, các
item về quản trị viên phê duyệt, cross-chức năng convergence, vai trò UX, personal-data operation hoặc
danh mục thời gian chạy chỉ được chuyển trạng thái khi bằng chứng bản ghi có mapping trực tiếp.

Các item chỉ yêu cầu human rà soát/owner confirmation nhưng chưa có phê duyệt tương ứng vẫn để mở.
Không tự động đóng FE02-T049, FE09-B7 hoặc item tương tự chỉ vì luồng chính đạt.

### 9.4 Tài liệu cần cập nhật

Phạm vi tối thiểu:

- chức năng `TASKS.md` bị ảnh hưởng;
- chức năng `CHANGELOG.md`/xác thực rà soát tương ứng;
- `.sdd/traceability.yaml` chỉ khi bằng chứng mới thật sự thay đổi trạng thái chức năng;
- phát hành-khóa sổ biên bản rà soát mới;
- không sửa yêu cầu text để phù hợp với triển khai hiện tại.

## 10. Xác nhận lại tư vấn bộ định tuyến React

Không tạo một ngoại lệ trùng lặp. Cập nhật bản ghi hiện có:

`docs/security/react-router-rsc-audit-exception-2026-07-25.md`

Bằng chứng cần thiết:

- chạy lại đầy đủ giao diện audit trên lockfile hiện tại;
- kiểm tra advisory ID/range từ nguồn upstream/official hiện hành;
- xác nhận app vẫn dùng Declarative `BrowserRouter`/`Routes`/`Route`;
- xác nhận không có RSC, Framework Mode, server hành động hoặc data-router APIs bị chặn;
- xác nhận `frontend/scripts/audit-high.js` vẫn không đạt với finding khác, phiên bản drift hoặc blocked API;
- ghi owner, rà soát date và trigger để gỡ exception.

Nếu có phiên bản ổn định đã vá và tương thích, việc nâng cấp là một lô riêng có kế hoạch hồi quy. lô
này không thay đổi phụ thuộc chỉ để làm kết quả kiểm toán xanh.

## 11. Bảo quản và dọn dẹp cây làm việc Git

### 11.1 cây làm việc bẩn

Đối với `.worktrees/h3-fe07-fe12-governance`:

1. xác nhận absolute path, nhánh, HEAD và 31 tệp thay đổi;
2. chạy secret quét và khác biệt rà soát phạm vi;
3. tạo cục bộ recovery nhánh có dấu thời gian từ đúng HEAD;
4. ghi nhận toàn bộ thay đổi hiện tại vào nhánh khôi phục bằng thông điệp chỉ rõ nguồn;
5. xác nhận bản ghi Git chứa đủ tệp và cây làm việc Git sạch;
6. không đẩy lên kho từ xa recovery nhánh;
7. chỉ sau đó mới remove cây làm việc Git bằng Git;
8. xác nhận recovery nhánh/bản ghi Git còn đọc được từ bản làm việc gốc.

Nếu quét bí mật có phát hiện thật, không ghi nhận/xóa thay đổi; dừng và báo vị trí đã che, không in bí mật.

### 11.2 Làm sạch các cây làm việc đã hợp nhất

Đối với `audit-hardening` và `connected-circulation-flow`:

- xác nhận cây làm việc Git sạch;
- xác nhận bản ghi Git/PR tương ứng đã nằm trong `main` (kể cả squash mapping);
- remove từng chính xác path;
- không xóa nhánh nếu chưa có bằng chứng hợp nhất/recovery rõ ràng.

### 11.3 Kiểm tra gốc

Root đã được tiến thẳng tới mốc cơ sở trước khi tạo thiết kế nhánh. Sau lô, root phải:

- không có untracked secret/artifact;
- có nhánh/bản ghi Git rõ ràng;
- không tham chiếu cây làm việc Git path đã remove;
- giữ recovery nhánh cục bộ cho tới khi người dùng chủ động yêu cầu xóa.

## 12. Xử lý lỗi

| Thất bại | Phản hồi bắt buộc |
|---|---|
| Máy chủ/sửa đổi/cơ sở dữ liệu sai | Phá thai trước khi gieo hạt |
| Hạt giống một phần | Dọn dẹp các ID được tạo chính xác; đánh dấu chạy không thành công |
| Xác nhận trình duyệt/API không thành công | Thu thập bằng chứng đã được biên tập lại; tiếp tục dọn dẹp |
| Ủy quyền thành công bất ngờ | Coi như lỗi bảo mật; dừng dòng chảy hạ lưu; dọn dẹp |
| Dọn dẹp chưa hoàn thành | Đánh dấu `FAILED_CLEANUP`; không đóng các nhiệm vụ phụ thuộc |
| Các giả định tư vấn trôi dạt | Giữ ngoại lệ chưa được giải quyết; không tự động chỉnh sửa phần phụ thuộc |
| Tìm kiếm bí mật cây làm việc Git | Không cam kết hoặc xóa cây làm việc Git |
| Xác minh cam kết khôi phục không thành công | Không xóa cây làm việc Git |

Không hoàn tác bằng cách xóa hàng loạt hoặc đặt lại kho mã nguồn. Mọi khắc phục phải giới hạn theo
chính xác tệp kê khai IDs hoặc chính xác cây làm việc Git path đã xác minh.

## 13. Mô hình xác thực

### L1 - Tính chính xác tự động

- đơn vị/hệ thống/E2E/bộ triển khai hiện có;
- truy vết và kiểm tra hợp đồng;
- người bảo vệ kiểm toán giao diện;
- xác nhận hạt giống/dọn dẹp được tham số hóa;
- truy vấn bất biến sau dọn dẹp;
- `git diff --check` và xem xét tệp đã thay đổi.

### L2 - Tuân thủ đặc tả và nhiệm vụ

- map từng Nhiệm vụ được đóng tới tiêu chí chấp nhận và bằng chứng;
- xác nhận không sửa nghiệp vụ yêu cầu;
- xác nhận 3 việc ban đầu đều có kết quả riêng, không gộp bằng một CI trạng thái.

### L3 - Bảo mật và quyền riêng tư

- danh tính/dữ liệu chỉ tổng hợp;
- không có rò rỉ thông tin xác thực/mã thông báo/nhật ký;
- ủy quyền phủ định phía máy chủ;
- phân công vai trò có đặc quyền ít nhất;
- thu hồi mã thông báo và vô hiệu hóa tài khoản;
- kiểm toán được giữ lại mà không cần xóa cứng.

### L4 - Chấp nhận môi trường tiền sản xuất trực tiếp

- UI đăng nhập và vai trò navigation trên real môi trường tiền sản xuất hosts;
- luồng kinh doanh đa vai trò từ đầu đến cuối;
- quan sát sự chuyển đổi trạng thái/API;
- đã xác minh dọn dẹp theo dàn database/runtime.

## 14. Cổng con người và ranh giới cam kết

1. **Cổng thiết kế:** tài liệu này được bản ghi Git riêng và người dùng duyệt trước khi lập triển khai kế hoạch.
2. **Cổng kế hoạch/H1:** triển khai kế hoạch phải liệt kê chính xác tệp, commands, Azure targets, lượt chạy order và hoàn tác. Phê duyệt kế hoạch mới cho phép tạo dữ liệu kiểm thử, chạy nghiệm thu thực tế và tạo cục bộ recovery bản ghi Git.
3. **Cổng H2:** sau khi chạy xác minh, rà soát toàn bộ generated khóa sổ khác biệt và bằng chứng trước khi bản ghi Git/đẩy lên kho từ xa triển khai changes.
4. **H3 cổng:** hợp nhất PR chỉ sau CI/bảo mật/khả năng truy vết kiểm tra và human phê duyệt theo project quản trị.

môi trường tiền sản xuất dữ liệu kiểm thử/dọn dẹp là external trạng thái change nhưng nằm trong phạm
vi đã thiết
kế; nó vẫn không được thực thi ở thiết kế-chỉ bản ghi Git này.

## 15. Tiêu chí chấp nhận cho lô này

lô hoàn thành khi và chỉ khi:

- PR #95 Nhiệm vụ/changelog khóa sổ phản ánh đúng bằng chứng;
- authenticated môi trường tiền sản xuất luồng có kết quả đạt, hoặc không đạt được ghi trung thực kèm dọn dẹp đầy đủ;
- mọi tổng hợp tài khoản/token/dữ liệu kiểm thử đã không hoạt động/terminal theo dọn dẹp hợp đồng;
- Nhiệm vụ chỉ đóng đúng phần có bằng chứng, phần khác vẫn mở;
- React Router exception có hiện tại bằng chứng, owner và rà soát trigger;
- dirty cây làm việc Git được bảo toàn bằng verified cục bộ recovery bản ghi Git trước khi remove;
- clean merged cây làm việc Git được remove an toàn;
- đầy đủ xác minh sau thay đổi không tạo regression;
- final báo cáo nêu chính xác nhánh/bản ghi Git/PR/lượt chạy và các rủi ro còn lại.

Nếu live scenario không đạt nhưng dọn dẹp đạt, lô có thể hoàn thành về mặt điều tra/bằng chứng
nhưng không được tuyên bố khóa sổ phát hành thành công và không được đóng Nhiệm vụ phụ thuộc scenario.
