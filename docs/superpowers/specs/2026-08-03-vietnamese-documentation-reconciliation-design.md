# Thiết kế đối soát tài liệu tiếng Việt

Ngày: 2026-08-03
Trạng thái: ĐÃ ĐƯỢC NGƯỜI DÙNG PHÊ DUYỆT TRONG HỘI THOẠI

## 1. Bối cảnh

Checkout hiện tại chứa một batch Việt hóa tài liệu quy mô lớn. Phần lớn thay đổi là Markdown trong
`.sdd/` và `docs/`, nhưng kết quả dịch tự động đã làm thay đổi một số chuỗi kỹ thuật, tên riêng và
câu vận hành mà kiểm thử deployment sử dụng như hợp đồng chống drift. Bốn trong 20 kiểm thử
deployment hiện thất bại vì `docs/deployment/azure-staging-guide.md` không còn các technical anchor
tiếng Anh được phê duyệt.

Batch cũng đang xóa các artifact trình bày cũ. Người dùng đã xác nhận xóa vĩnh viễn các artifact này
thay vì khôi phục chúng.

## 2. Mục tiêu

- Hoàn thiện tài liệu tiếng Việt dễ đọc mà không làm sai business rule, bằng chứng, lệnh vận hành hoặc
  hợp đồng kỹ thuật.
- Đưa bộ kiểm thử deployment từ 16/20 về 20/20 bằng cách sửa tài liệu, không làm yếu kiểm thử.
- Xóa vĩnh viễn các artifact trình bày đã được người dùng xác nhận và đối soát mọi tài liệu hiện hành
  đang tuyên bố rằng các artifact đó còn khả dụng.
- Loại các lỗi dịch máy rõ ràng như từ ghép hỏng, tên riêng bị dịch, identifier bị đổi nghĩa và câu
  tiếng Việt không còn truyền đạt đúng hành động vận hành.
- Giữ thay đổi giới hạn ở tài liệu và công cụ kiểm tra tài liệu; không thay đổi hành vi production.

## 3. Ngoài phạm vi

- Không thay đổi workflow GitHub Actions, API, schema, role, business rule hoặc mã nguồn ứng dụng.
- Không thay đổi deployment tests chỉ để chấp nhận bản dịch yếu hơn.
- Không tạo lại PPTX, DOCX, ảnh sơ đồ hoặc artifact nhị phân thay thế.
- Không công bố `scripts/translate_docs_to_vi.py` như công cụ dự án trong batch này; script và cache
  Python cục bộ chỉ là dữ liệu hỗ trợ chưa được review độc lập.
- Không viết lại lịch sử bằng chứng. Tài liệu review lịch sử vẫn có thể ghi rằng artifact từng tồn tại;
  chỉ các tuyên bố về khả năng truy cập hiện tại mới phải được đối soát.

## 4. Artifact được xóa vĩnh viễn

- `docs/briefing-thuyet-trinh-du-an-vi.docx`
- `docs/phase_1_foundation/04_context_diagram.drawio (2).png`
- `docs/presentation/phase3-defense-deck-source.md`
- `docs/presentation/phase3-defense-deck.pptx`

Artifact kiểm tra `docs/presentation/phase3-defense-deck.pptx.inspect.ndjson` đã được xử lý trong batch
cleanup riêng và tiếp tục bị loại khỏi Git bằng `*.inspect.ndjson`.

## 5. Quy tắc Việt hóa

### 5.1 Nội dung được dịch

- Tiêu đề mô tả, đoạn văn giải thích, ghi chú, checklist và hướng dẫn dành cho người đọc Việt Nam.
- Tên vai trò và thuật ngữ nghiệp vụ khi bản dịch không làm thay đổi nghĩa chuẩn.
- Nội dung trình bày có thể đọc độc lập mà không cần đối chiếu bản tiếng Anh.

### 5.2 Nội dung phải giữ nguyên

- Đường dẫn file, URL, command, code fence, biến môi trường, tên workflow/job, endpoint, enum, ID yêu
  cầu, mã lỗi, commit SHA, số PR và số run CI.
- Tên sản phẩm và nền tảng như Azure App Service, Azure Static Web Apps, Azure SQL, GitHub Actions,
  Playwright, Node.js, Express.js, React và SQL Server.
- Technical anchor được kiểm thử hoặc được dùng làm hợp đồng vận hành.

### 5.3 Technical anchor song ngữ

`docs/deployment/azure-staging-guide.md` giữ nội dung giải thích bằng tiếng Việt nhưng phải chứa nguyên
văn các anchor sau ở vị trí có nghĩa:

- `## Free-Tier Staging Keepalive`
- `best-effort`
- ``manual `Staging keepalive` run succeeds``
- `scale the plan back to B1`
- `LF and CRLF byte renderings`
- `hash of the bytes actually applied`
- `## CI-Gated Continuous Deployment`
- ``successful `main` CI run``
- `exact migration file hash`
- ``table count `21```

Các anchor có thể nằm trong tiêu đề song ngữ, câu chú thích hoặc đoạn giải thích kỹ thuật. Không được
đặt anchor vào đoạn vô nghĩa chỉ để làm kiểm thử đạt.

## 6. Đối soát tài liệu bàn giao

- Tài liệu hiện hành như final report, checklist và hướng dẫn nộp bài phải nói rõ artifact nhị phân đã
  được xóa theo quyết định của người dùng và chỉ ra tài liệu Markdown thay thế khi có.
- Liên kết Markdown tới file đã xóa phải được loại bỏ hoặc thay bằng nguồn còn tồn tại.
- Review record lịch sử được giữ nguyên sự kiện đã xảy ra. Nếu record đồng thời đóng vai trò mục lục
  hiện hành, thêm ghi chú ngắn rằng artifact không còn được lưu trong repository.
- Không được biến việc xóa artifact thành tuyên bố rằng buổi demo, review hoặc bằng chứng lịch sử chưa
  từng tồn tại.

## 7. Quy trình đối soát batch

1. Chụp danh sách file thay đổi và chia thành các nhóm: SDD/spec, API/architecture, deployment,
   release/testing và historical plans/designs.
2. Chạy các kiểm tra hiện có để ghi nhận baseline RED cho deployment documentation.
3. Sửa `azure-staging-guide.md` trước bằng technical anchor song ngữ và xác nhận 20/20 deployment tests.
4. Audit từng nhóm tài liệu để phát hiện identifier bị dịch, câu sai nghĩa, liên kết chết và tuyên bố
   trạng thái không còn đúng.
5. Đối soát các tham chiếu tới artifact đã xóa.
6. Chạy các gate toàn repository và review diff theo nhóm trước khi commit.

## 8. Kiểm thử và xác thực

Các lệnh bắt buộc trước khi chấp nhận batch:

```powershell
npm run test:deployment
npm run test:secrets
npm run trace:enforce
node --test scripts/fe07-fe12-vietnamese-semantics.test.js
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend test -- --silent
```

Ngoài kiểm thử tự động, diff phải vượt qua:

- `git diff --check`
- quét liên kết tới bốn artifact đã xóa;
- quét các lỗi dịch máy đã biết và identifier quan trọng;
- review riêng các file SPEC/TASKS/CHANGELOG để không thay đổi nghĩa requirement hoặc trạng thái hoàn
  thành ngoài bằng chứng đã có.

## 9. Tiêu chí hoàn thành

- Deployment tests đạt 20/20 mà không sửa yếu assertion.
- Không còn liên kết hiện hành bị hỏng tới các artifact đã xóa.
- Không còn lỗi dịch máy rõ ràng trong các file thuộc batch đã stage.
- Mọi technical anchor, command, identifier và bằng chứng định lượng vẫn chính xác.
- Toàn bộ gate bắt buộc đạt trên một nhánh sạch được tạo từ `origin/main`.
- PR chỉ chứa batch tài liệu đã review; không chứa script dịch cục bộ, cache hoặc thay đổi production.

## 10. Chiến lược tích hợp

Các thay đổi hiện đang nằm trong checkout có nhiều file chưa commit, vì vậy quá trình tích hợp dùng hai
giai đoạn:

1. Hoàn thiện và commit các lát tài liệu có phạm vi rõ ràng bằng danh sách path tường minh.
2. Tạo worktree sạch từ `origin/main` trên nhánh `docs/vietnamese-documentation-reconciliation-pr`, áp
   dụng các commit đã review, chạy lại toàn bộ gate, sau đó mới push và mở PR.

Không dùng `git add .`, `git add -A` hoặc commit toàn bộ working tree mà chưa phân loại.
