import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('FE01 HomePage reads the canonical public envelope without category endpoint', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  assert.match(source, /publicBrowseApi\.list\(\)/);
  assert.match(source, /Array\.isArray\(booksResult\.data\)/);
  assert.doesNotMatch(source, /\/books\/categories/);
  assert.doesNotMatch(source, /booksResult\.success/);
  assert.doesNotMatch(source, /API_BASE_URL/);
});

test('FE01 search uses the canonical public envelope and approved query', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  assert.match(source, /publicBrowseApi\.list\(\{ q: keyword \}\)/);
  assert.match(source, /Array\.isArray\(result\.data\)/);
  assert.match(source, /keyword\.length > 200/);
});

test('FE01 blank search reloads the default catalog without an error toast', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  const blankBranch = source.match(/if \(!keyword\) \{([\s\S]*?)\n[ ]{4}\}/)?.[1] || '';

  assert.match(blankBranch, /await publicBrowseApi\.list\(\)/);
  assert.match(blankBranch, /setBooks\(result\.data \|\| \[\]\)/);
  assert.match(blankBranch, /setActiveSearch\(''\)/);
  assert.match(blankBranch, /setActiveCategory\('Tất cả'\)/);
  assert.match(blankBranch, /setShowAll\(true\)/);
  assert.match(blankBranch, /scrollTo\('section-books'\)/);
  assert.doesNotMatch(blankBranch, /Vui lòng nhập từ khóa tìm kiếm/);
});

test('FE01 API adapter owns canonical unauthenticated list and detail reads', async () => {
  const source = await readFile(new URL('../src/api/libraryFeatureApi.js', import.meta.url), 'utf8');
  assert.match(source, /export const publicBrowseApi =/);
  assert.match(source, /api\.get\('\/books', \{ params \}\)/);
  assert.match(source, /api\.get\(`\/books\/\$\{bookId\}`\)/);
});

test('FE01 renders canonical public fields and removes fake local borrowing', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  assert.match(source, /book\.bookId/);
  assert.match(source, /book\.authorName \|\| 'Không rõ tác giả'/);
  assert.match(source, /book\.categoryName \|\| 'Chưa phân loại'/);
  assert.match(source, /book\.availabilityStatus === 'AVAILABLE'/);
  assert.match(source, /Không khả dụng/);
  assert.doesNotMatch(source, /ĐÃ MƯỢN/);
  assert.doesNotMatch(source, /BorrowModal/);
  assert.doesNotMatch(source, /addBorrowRecord/);
  assert.doesNotMatch(source, /Mượn "\$\{selectedBook\.title\}" thành công/);
});

test('FE01 keeps Homepage availability private from Guest and Member roles', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');

  assert.match(source, /const canViewAvailability = \['ADMIN', 'LIBRARIAN'\]\.includes\(primaryRole\)/);
  assert.match(source, /@spec FR-FE01-018/);
  assert.match(source, /canViewAvailability && book\.availabilityStatus !== 'AVAILABLE'/);
  assert.match(source, /canViewAvailability \? action\.label : 'Tiếp tục'/);
  assert.match(source, /canViewAvailability \? getHomeBookAction\(\{ book, isLoggedIn, roles: authUser\?\.roles \|\| \[\] \}\)\.label : 'Tiếp tục'/);
  assert.match(source, /canViewAvailability=\{canViewAvailability\}/);
});

test('FE01 footer presents responsive library contact information without legacy link columns', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  const footer = source.match(/<footer\b[\s\S]*?id="section-footer"[\s\S]*?<\/footer>/)?.[0] || '';

  assert.match(footer, /href="tel:0348335508"/);
  assert.match(footer, /<strong>0348335508<\/strong>/);
  assert.match(footer, /href="mailto:dt9848630@gmail\.com"/);
  assert.match(footer, /Thôn 3, Xã Thạch Hòa, Huyện Thạch Thất, Thành phố Hà Nội/);
  assert.match(footer, /className="home-footer-grid"/);
  assert.match(source, /\.home-footer-grid \{[\s\S]*?grid-template-columns: minmax\(260px, 0\.72fr\) minmax\(0, 1\.55fr\)/);
  assert.match(source, /\.home-footer-contact \{[\s\S]*?max-width: 960px/);
  assert.match(source, /\.home-footer-contact-list \{[\s\S]*?grid-template-columns: minmax\(180px, 0\.75fr\) minmax\(300px, 1\.15fr\) minmax\(360px, 1\.55fr\)/);
  assert.match(source, /a\.home-footer-contact-item \.home-footer-contact-copy strong \{[\s\S]*?white-space: nowrap/);
  assert.match(source, /@media \(max-width: 1200px\)[\s\S]*?\.home-footer-contact-list \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
  assert.match(source, /@media \(max-width: 1050px\)[\s\S]*?\.home-footer-grid \{ grid-template-columns: 1fr !important;/);
  assert.match(source, /@media \(max-width: 768px\)[\s\S]*?\.home-footer-contact-list \{ grid-template-columns: 1fr; \}/);
  assert.match(footer, /className="home-footer-contact-item"/);
  assert.match(source, /\.home-footer-contact-item \+ \.home-footer-contact-item \{[\s\S]*?border-left:/);
  assert.doesNotMatch(source, /\.home-footer-contact-card/);
  assert.doesNotMatch(footer, /title: 'Thư viện'|title: 'Tài khoản'|title: 'Hỗ trợ'/);
});

test('FE01 footer policy controls open accessible, dismissible information dialogs', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  const footer = source.match(/<footer\b[\s\S]*?id="section-footer"[\s\S]*?<\/footer>/)?.[0] || '';

  assert.match(source, /const FOOTER_POLICIES = \{/);
  assert.match(source, /label: 'Quyền riêng tư'/);
  assert.match(source, /label: 'Điều khoản'/);
  assert.match(source, /label: 'Cookie'/);
  assert.match(footer, /onClick=\{\(\) => setActiveFooterPolicy\(key\)\}/);
  assert.doesNotMatch(footer, /href="#"/);
  assert.match(source, /className="home-policy-dialog"[\s\S]*?role="dialog"[\s\S]*?aria-modal="true"/);
  assert.match(source, /if \(event\.key === 'Escape'\) onClose\(\)/);
  assert.match(source, /aria-label="Đóng hộp thông tin"/);
});

test('FE01 membership benefits use distinct icons and responsive editorial cards', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');

  assert.match(source, /number: '01', icon: UserPlus/);
  assert.match(source, /number: '02', icon: ShieldCheck/);
  assert.match(source, /number: '03', icon: ListChecks/);
  assert.match(source, /number: '04', icon: BadgeCheck/);
  assert.match(source, /<article key=\{title\} className="home-benefit-card">/);
  assert.match(source, /\.home-benefit-card::before \{[\s\S]*?linear-gradient/);
  assert.match(source, /\.home-benefit-card:hover \{[\s\S]*?translateY\(-4px\)/);
  assert.match(source, /@media \(max-width: 768px\)[\s\S]*?\.home-cta-grid, \.home-benefit-grid \{ grid-template-columns: 1fr !important; \}/);
});

test('FE01 footer reveals on view and provides motion-safe interaction feedback', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');

  assert.match(source, /const footerRef = useRef\(null\)/);
  assert.match(source, /new IntersectionObserver/);
  assert.match(source, /className=\{`home-footer\$\{footerVisible \? ' is-visible' : ''\}`\}/);
  assert.match(source, /\.home-footer\.is-visible::before \{[\s\S]*?footerGlow/);
  assert.match(source, /\.home-footer\.is-visible \.home-footer-contact-item:nth-child\(3\)/);
  assert.match(source, /\.home-footer-contact-item:hover \.home-footer-contact-icon/);
  assert.match(source, /\.home-footer-policy-links button::after/);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);
});

test('FE01 header omits removed navigation groups while connected page actions remain available', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /const getHomeNavigationItems/);
  assert.doesNotMatch(source, /className="home-nav-links"/);
  assert.doesNotMatch(source, /className="home-mobile-nav-group"/);
  assert.match(source, /primaryRole === 'ADMIN'[\s\S]*?Quản lý người dùng[\s\S]*?\/admin\/users/);
  assert.match(source, /primaryRole === 'LIBRARIAN'[\s\S]*?Yêu cầu mượn sách[\s\S]*?\/librarian\/borrow-requests/);
  assert.match(source, /Đăng ký mượn sách[\s\S]*?\/borrowing\/new/);
  assert.match(source, /Trạng thái hội viên[\s\S]*?\/membership/);
  assert.match(source, /id="section-about"/);
  assert.match(source, /id="footer-contact"/);
  assert.match(source, /\.home-footer-contact-heading span \{[\s\S]*?grid-column: 2;[\s\S]*?text-align: center/);
  assert.doesNotMatch(source, /home-footer-contact-heading > div/);
});

test('FE01 role-aware Homepage destinations are registered by the application router', async () => {
  const [homepage, app, bookActions, appNavigation] = await Promise.all([
    readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/utils/homeBookActions.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/utils/appNavigation.js', import.meta.url), 'utf8'),
  ]);
  const connectedSource = `${homepage}\n${bookActions}\n${appNavigation}`;
  const registeredPaths = [
    '/home',
    '/homepage',
    '/login',
    '/register',
    '/membership',
    '/admin/users',
    '/reports/users',
    '/reports/inventory',
    '/librarian/borrow-requests',
    '/librarian/returns',
    '/librarian/inventory',
    '/librarian/books',
    '/borrowing/new',
    '/borrowing/history',
    '/reservations/mine',
    '/profile',
  ];

  for (const path of registeredPaths) {
    assert.ok(connectedSource.includes(path), `Homepage contract should connect ${path}`);
    assert.ok(app.includes(`path="${path}"`), `App router should register ${path}`);
  }
});

test('FE01 homepage adds useful catalog, journey, and role-aware continuation sections', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');

  assert.match(source, /id="section-topics"/);
  assert.match(source, /value: 'Programming'[\s\S]*?value: 'Database'[\s\S]*?value: 'AI'[\s\S]*?value: 'Novel'/);
  assert.match(source, /onClick=\{\(\) => handleHomeNavigation\(\{ type: 'category', value \}\)\}/);
  assert.match(source, /id="section-journey"/);
  assert.match(source, /Khám phá đầu sách[\s\S]*?Chọn luồng phù hợp[\s\S]*?Theo dõi xuyên suốt/);
  assert.match(source, /const roleHomePanel = !isLoggedIn/);
  assert.match(source, /Không gian quản trị[\s\S]*?Không gian thủ thư[\s\S]*?Không gian thành viên/);
  assert.match(source, /id="section-role-space"/);
  assert.match(source, /querySelectorAll\('\[data-home-reveal\]'\)/);
  assert.match(source, /\.home-topic-grid \{[\s\S]*?repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(source, /@media \(max-width: 768px\)[\s\S]*?\.home-topic-grid,[\s\S]*?\.home-role-actions \{ grid-template-columns: 1fr; \}/);
});

test('FE01 homepage uses distinct visual bands and motion-safe section interactions', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');

  assert.match(source, /className="home-hero"/);
  assert.match(source, /className="home-hero-search"/);
  assert.match(source, /id="section-books" className="home-books-section"/);
  assert.match(source, /className="home-book-filters"/);
  assert.match(source, /className="home-book-card"/);
  assert.match(source, /id="section-cta" className="home-cta-section home-reveal"/);
  assert.match(source, /@keyframes homeHeroCopyIn/);
  assert.match(source, /\.home-books-section \{[\s\S]*?radial-gradient/);
  assert.match(source, /\.home-journey-section \{[\s\S]*?linear-gradient/);
  assert.match(source, /\.home-cta-section::after \{/);
  assert.match(source, /\.home-book-card:hover img \{ transform: scale\(1\.045\); \}/);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.home-hero-visual img/);
});
