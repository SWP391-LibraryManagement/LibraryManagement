import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  Search,
  BookOpen,
  ArrowRight,
  Menu,
  X,
  Calendar,
  User,
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  UserPlus,
  ShieldCheck,
  ListChecks,
  BadgeCheck,
  Code2,
  Database,
  BrainCircuit,
  BookHeart,
  Compass,
  Route,
} from 'lucide-react';
import { publicBrowseApi, resolveLibraryAssetUrl } from '../api/libraryFeatureApi';
import { fetchHeaderProfile } from '../api/profileApi';
import { getHomeBookAction } from '../utils/homeBookActions';
import { getRoleLabel } from '../utils/uiLabels';

const HERO_IMG = 'https://images.unsplash.com/photo-1514894780887-121968d00567?w=1400&h=800&fit=crop&auto=format';
const BOOK_COVER_FALLBACK = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&auto=format';

const CATEGORY_LABELS = {
  Programming: 'Lập trình',
  Database: 'Cơ sở dữ liệu',
  AI: 'Trí tuệ nhân tạo',
  Novel: 'Tiểu thuyết',
};

const CATEGORY_ICONS = {
  Programming: 'Mã',
  Database: 'CSDL',
  AI: 'AI',
  Novel: 'Tiểu thuyết',
};

const FOOTER_POLICIES = {
  privacy: {
    label: 'Quyền riêng tư',
    title: 'Chính sách quyền riêng tư',
    paragraphs: [
      'Hệ thống chỉ sử dụng thông tin tài khoản, hồ sơ và lịch sử giao dịch thư viện để cung cấp các chức năng quản lý, mượn trả và hỗ trợ người dùng.',
      'Dữ liệu được giới hạn theo vai trò và không được hiển thị trong khu vực tra cứu công khai. Khi cần hỗ trợ về dữ liệu cá nhân, bạn có thể liên hệ qua email dt9848630@gmail.com.',
    ],
  },
  terms: {
    label: 'Điều khoản',
    title: 'Điều khoản sử dụng',
    paragraphs: [
      'Khi sử dụng hệ thống, người dùng cần cung cấp thông tin chính xác, bảo vệ thông tin đăng nhập và sử dụng tài khoản đúng mục đích.',
      'Hoạt động mượn, trả, gia hạn, đặt trước và xử lý phí được thực hiện theo quy định thư viện đang áp dụng. Không sử dụng hệ thống để truy cập hoặc thay đổi dữ liệu khi chưa được cấp quyền.',
    ],
  },
  cookies: {
    label: 'Cookie',
    title: 'Thông tin lưu trữ trình duyệt',
    paragraphs: [
      'Phiên bản hiện tại sử dụng localStorage hoặc sessionStorage để duy trì phiên đăng nhập và lựa chọn ghi nhớ đăng nhập của người dùng.',
      'Giao diện hiện tại không sử dụng cookie quảng cáo. Bạn có thể đăng xuất để xóa thông tin phiên hoặc xóa dữ liệu trang web trong phần cài đặt của trình duyệt.',
    ],
  },
};

const getCategoryLabel = (category) => CATEGORY_LABELS[category] || category || 'Chưa phân loại';
const getCategoryIcon = (category) => CATEGORY_ICONS[category] || 'Sách';

const getStoredAuthState = () => {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

    if (raw && token) {
      return {
        isLoggedIn: true,
        authUser: JSON.parse(raw),
      };
    }
  } catch {
    // Ignore corrupted stored auth data.
  }

  return {
    isLoggedIn: false,
    authUser: null,
  };
};

const getHomeInitials = (name, email) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length) return parts.slice(-2).map((part) => part[0]?.toUpperCase() || '').join('');
  return String(email || 'TV').charAt(0).toUpperCase();
};


const textClamp = (lines) => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

const FooterPolicyDialog = ({ policy, onClose }) => {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="home-policy-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="home-policy-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-policy-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="home-policy-header">
          <div>
            <span>Quản Lý Thư Viện</span>
            <h2 id="home-policy-title">{policy.title}</h2>
          </div>
          <button type="button" aria-label="Đóng hộp thông tin" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="home-policy-content">
          {policy.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div className="home-policy-actions">
          <button type="button" onClick={onClose}>Đã hiểu</button>
        </div>
      </section>
    </div>
  );
};

// -- Book Information Panel (sidebar-style) --
const BookInfoPanel = ({ book, action, canViewAvailability, detailLoading, onClose, onViewDetails, onAction }) => (
  <div style={{
    position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, zIndex: 300,
    background: '#FFF', boxShadow: '-8px 0 40px rgba(78,52,46,0.12)',
    display: 'flex', flexDirection: 'column', overflowY: 'auto',
  }}>
    <div style={{ background: '#4E342E', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ color: '#FAF7F2', fontFamily: 'var(--heading)', fontSize: 17, fontWeight: 600 }}>
        Thông tin sách
      </span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4A882' }}>
        <X size={20} />
      </button>
    </div>

    <div style={{ padding: 24 }}>
      {/* Cover */}
      <div style={{ borderRadius: 10, overflow: 'hidden', height: 260, background: '#EDE0CE', marginBottom: 20 }}>
        <img src={resolveLibraryAssetUrl(book.coverUrl) || BOOK_COVER_FALLBACK} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* Badge */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {canViewAvailability && (
          <span style={{
            background: book.availabilityStatus === 'AVAILABLE' ? '#E8F5E9' : '#FFEBEE',
            color: book.availabilityStatus === 'AVAILABLE' ? '#388e3c' : '#c62828',
            padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
          }}>
            {book.availabilityStatus === 'AVAILABLE' ? 'Còn sách' : 'Không khả dụng'}
          </span>
        )}
        <span style={{ background: '#EDE0CE', color: '#7A5C44', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
          {getCategoryLabel(book.categoryName || 'Chưa phân loại')}
        </span>
      </div>

      <h2 style={{ fontFamily: 'var(--heading)', fontSize: 22, fontWeight: 700, color: '#2C1A0E', margin: '0 0 6px', lineHeight: 1.3 }}>
        {book.title}
      </h2>
      <p style={{ color: '#7A5C44', fontSize: 14, margin: '0 0 12px' }}>Tác giả: {book.authorName || 'Không rõ tác giả'}</p>

      <div style={{ height: 1, background: 'rgba(78,52,46,0.1)', margin: '20px 0' }} />

      {/* Info rows */}
      {[
        { icon: Calendar, label: 'Năm xuất bản', value: book.publishYear || 'Chưa cập nhật' },
      ].map(({ icon: Icon, label, value }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F0E8D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={16} color="#8B6B4A" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#A08060', marginBottom: 1 }}>{label}</div>
            <div style={{ fontSize: 14, color: '#2C1A0E', fontWeight: 500 }}>{value}</div>
          </div>
        </div>
      ))}

      <div style={{ height: 1, background: 'rgba(78,52,46,0.1)', margin: '20px 0' }} />

      <p style={{ fontSize: 14, color: '#5A3E36', lineHeight: 1.7, margin: '0 0 24px' }}>
        {book.description || 'Chưa có mô tả cho sách này.'}
      </p>

      <button
        onClick={onViewDetails}
        disabled={detailLoading}
        style={{
          width: '100%', padding: '12px', borderRadius: 8, border: 'none',
          background: '#C78A3B', color: '#FFF', cursor: detailLoading ? 'wait' : 'pointer',
          fontSize: 14, fontWeight: 700, transition: 'background 0.2s',
          fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#4E342E')}
        onMouseLeave={e => (e.currentTarget.style.background = '#C78A3B')}
      >
        {detailLoading ? 'Đang tải chi tiết...' : 'Xem chi tiết đầy đủ'} <ArrowRight size={16} />
      </button>
      <button
        onClick={onAction}
        style={{
          width: '100%', padding: '12px', borderRadius: 8, marginTop: 10,
          border: '1.5px solid #8B6B4A', background: 'transparent',
          color: '#8B6B4A', cursor: 'pointer', fontSize: 14, fontWeight: 700,
          transition: 'all 0.2s', fontFamily: 'var(--sans)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#8B6B4A'; e.currentTarget.style.color = '#FAF7F2'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B6B4A'; }}
      >
        {canViewAvailability ? action.label : 'Tiếp tục'}
      </button>
    </div>
  </div>
);

// -- Modal chi tiết sách --
const BookDetailsModal = ({ book, action, canViewAvailability, onClose, onBack, onAction }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 400,
    background: 'rgba(44,26,14,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  }} onClick={onClose}>
    <div
      style={{
        background: '#FAF7F2', borderRadius: 16, maxWidth: 780, width: '100%',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(44,26,14,0.3)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ background: '#4E342E', padding: '18px 28px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#C4A882', borderRadius: 6, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <ChevronLeft size={14} /> Quay lại
          </button>
          <span style={{ color: '#FAF7F2', fontFamily: 'var(--heading)', fontSize: 18, fontWeight: 600 }}>
            Chi tiết sách
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4A882' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32 }}>
        {/* Left */}
        <div>
          <div style={{ borderRadius: 12, overflow: 'hidden', height: 300, background: '#EDE0CE', marginBottom: 16 }}>
            <img src={resolveLibraryAssetUrl(book.coverUrl) || BOOK_COVER_FALLBACK} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {canViewAvailability && book.availabilityStatus !== 'AVAILABLE' && (
              <button style={{
                padding: '10px', borderRadius: 8, border: 'none', background: '#EDE0CE',
                color: '#A08060', cursor: 'not-allowed', fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--sans)',
              }} disabled>
                Không khả dụng
              </button>
            )}
            <button onClick={onAction} style={{
              padding: '10px', borderRadius: 8, border: '1.5px solid rgba(78,52,46,0.25)',
              background: 'transparent', color: '#7A5C44', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--sans)', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EDE0CE'; e.currentTarget.style.borderColor = '#8B6B4A'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(78,52,46,0.25)'; }}
            >
              {canViewAvailability ? action.label : 'Tiếp tục'}
            </button>
          </div>
        </div>

        {/* Right */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {canViewAvailability && (
              <span style={{
                background: book.availabilityStatus === 'AVAILABLE' ? '#E8F5E9' : '#FFEBEE',
                color: book.availabilityStatus === 'AVAILABLE' ? '#388e3c' : '#c62828',
                padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
              }}>
                {book.availabilityStatus === 'AVAILABLE' ? 'Còn sách' : 'Không khả dụng'}
              </span>
            )}
            <span style={{ background: '#EDE0CE', color: '#7A5C44', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
              {getCategoryLabel(book.categoryName || 'Chưa phân loại')}
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--heading)', fontSize: 28, fontWeight: 700, color: '#2C1A0E', margin: '0 0 8px', lineHeight: 1.2 }}>
            {book.title}
          </h2>
          <p style={{ color: '#7A5C44', fontSize: 15, margin: '0 0 14px' }}>Tác giả: {book.authorName || 'Không rõ tác giả'}</p>

          <div style={{ height: 1, background: 'rgba(78,52,46,0.1)', margin: '22px 0' }} />

          <h4 style={{ color: '#4E342E', fontSize: 14, fontWeight: 700, margin: '0 0 12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Giới thiệu sách
          </h4>
          <p style={{ fontSize: 15, color: '#5A3E36', lineHeight: 1.8, margin: '0 0 24px' }}>
            {book.description || 'Chưa có mô tả cho sách này.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: Calendar, label: 'Năm xuất bản', value: book.publishYear || 'Chưa cập nhật' },
              { icon: User, label: 'Tác giả', value: book.authorName || 'Không rõ tác giả' },
              { icon: BookOpen, label: 'Thể loại', value: getCategoryLabel(book.categoryName || 'Chưa phân loại') },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ background: '#FFF', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(78,52,46,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Icon size={14} color="#C78A3B" />
                  <span style={{ fontSize: 11, color: '#A08060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                </div>
                <div style={{ fontSize: 14, color: '#2C1A0E', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const footerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeFooterPolicy, setActiveFooterPolicy] = useState(null);
  const [footerVisible, setFooterVisible] = useState(
    () => typeof window === 'undefined' || !('IntersectionObserver' in window),
  );
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [authState, setAuthState] = useState(getStoredAuthState);
  const [headerProfile, setHeaderProfile] = useState(null);
  const isLoggedIn = authState.isLoggedIn;
  const authUser = authState.authUser;
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [bookError, setBookError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  const [showAll, setShowAll] = useState(false);
  const [toast, setToast] = useState(null);
  const displayName = headerProfile?.fullName || authUser?.email || 'Tài khoản';
  const storedRoles = authUser?.roles || [];
  const primaryRole = ['ADMIN', 'LIBRARIAN', 'MEMBER'].find((role) => storedRoles.includes(role));
  // @spec FR-FE01-018
  const canViewAvailability = ['ADMIN', 'LIBRARIAN'].includes(primaryRole);
  const roleLabel = getRoleLabel(primaryRole);
  const showMemberAccountActions = roleLabel === 'Thành viên';
  const showAdminConsoleAction = roleLabel === 'Quản trị viên';
  const showLibrarianConsoleAction = roleLabel === 'Thủ thư';
  const selectedBookAction = selectedBook
    ? getHomeBookAction({ book: selectedBook, isLoggedIn, roles: authUser?.roles || [] })
    : null;
  const avatarUrl = headerProfile?.avatarUrl || '';
  const initials = getHomeInitials(headerProfile?.fullName, authUser?.email);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return undefined;
    if (!('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setFooterVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.18 });

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll('[data-home-reveal]');
    if (!('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // @spec FR-FE01-016
  const handleHomeNavigation = (item) => {
    setMenuOpen(false);

    if (item.type === 'path') {
      navigate(item.value);
      return;
    }
    if (item.type === 'policy') {
      setActiveFooterPolicy(item.value);
      return;
    }
    if (item.type === 'external') {
      window.location.assign(item.value);
      return;
    }
    if (item.type === 'category') {
      setActiveCategory(item.value);
      setActiveSearch('');
      setShowAll(true);
      scrollTo('section-books');
      return;
    }
    scrollTo(item.value);
  };

  const goToLogin = () => {
    navigate('/login');
  };

  const goToRegister = () => {
    navigate('/register');
  };

  const handleBookAction = (book) => {
    const action = getHomeBookAction({ book, isLoggedIn, roles: authUser?.roles || [] });
    setShowDetails(false);
    setSelectedBook(null);
    navigate(action.path);
  };

  const handleViewDetails = async () => {
    if (!selectedBook?.bookId) return;

    try {
      setDetailLoading(true);
      const result = await publicBrowseApi.detail(selectedBook.bookId);
      if (!result?.book) throw new Error('Không thể tải chi tiết sách.');
      setSelectedBook(result.book);
      setShowDetails(true);
    } catch (error) {
      showToast(error.message || 'Không thể tải chi tiết sách.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleLogout = () => {
    for (const key of ['accessToken', 'refreshToken', 'authUser']) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    setAuthState({ isLoggedIn: false, authUser: null });
    setHeaderProfile(null);
    setShowUserMenu(false);
    setShowLogoutConfirm(false);
  };

  // @spec FR-FE01-001, FR-FE01-003, FR-FE01-008, FR-FE01-010
  useEffect(() => {
    if (!isLoggedIn) {
      return undefined;
    }

    let active = true;
    fetchHeaderProfile()
      .then((profile) => {
        if (active) setHeaderProfile(profile);
      })
      .catch(() => {
        // Stored authentication data keeps the account control usable.
      });

    return () => { active = false; };
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoadingBooks(true);
        setBookError('');

        const booksResult = await publicBrowseApi.list();

        if (!Array.isArray(booksResult.data)) {
          throw new Error(booksResult.error?.message || 'Không thể tải danh sách sách');
        }

        setBooks(booksResult.data || []);
        setCategories([]);
      } catch (error) {
        console.error('Fetch home data error:', error);
        setBookError(error.message || 'Đã xảy ra lỗi khi tải dữ liệu từ database');
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchHomeData();
  }, []);

  const fallbackCategories = Array.from(new Set(books.map((book) => book.categoryName).filter(Boolean))).map((category, index) => ({
    id: index + 1,
    name: category,
    count: books.filter((book) => book.categoryName === category).length,
    icon: getCategoryIcon(category),
  }));

  const displayCategories = categories.length > 0 ? categories : fallbackCategories;
  const filterTabs = ['Tất cả', ...displayCategories.filter((category) => category.name !== 'Tất cả').map((category) => category.name)];
  const roleHomePanel = !isLoggedIn
    ? {
      eyebrow: 'Dành cho khách',
      title: 'Bắt đầu hành trình cùng thư viện',
      description: 'Khám phá danh mục công khai, tạo tài khoản và đăng nhập để sử dụng các chức năng dành cho độc giả.',
      actions: [
        { label: 'Khám phá sách', type: 'scroll', value: 'section-books' },
        { label: 'Tạo tài khoản', type: 'path', value: '/register' },
        { label: 'Đăng nhập', type: 'path', value: '/login' },
      ],
    }
    : primaryRole === 'ADMIN'
      ? {
        eyebrow: 'Không gian quản trị',
        title: 'Điều hành hệ thống thư viện',
        description: 'Truy cập nhanh các khu vực quản lý người dùng, hội viên và báo cáo đang thuộc quyền Admin.',
        actions: [
          { label: 'Quản lý người dùng', type: 'path', value: '/admin/users' },
          { label: 'Duyệt hội viên', type: 'path', value: '/membership' },
          { label: 'Báo cáo người dùng', type: 'path', value: '/reports/users' },
          { label: 'Báo cáo kho sách', type: 'path', value: '/reports/inventory' },
        ],
      }
      : primaryRole === 'LIBRARIAN'
        ? {
          eyebrow: 'Không gian thủ thư',
          title: 'Vận hành nghiệp vụ hằng ngày',
          description: 'Tiếp nhận yêu cầu mượn, xử lý trả sách, kiểm tra kho và duyệt hồ sơ hội viên từ một điểm truy cập.',
          actions: [
            { label: 'Yêu cầu mượn sách', type: 'path', value: '/librarian/borrow-requests' },
            { label: 'Xử lý trả sách', type: 'path', value: '/librarian/returns' },
            { label: 'Quản lý kho sách', type: 'path', value: '/librarian/inventory' },
            { label: 'Duyệt hội viên', type: 'path', value: '/membership' },
          ],
        }
        : {
          eyebrow: 'Không gian thành viên',
          title: 'Tiếp tục hành trình đọc của bạn',
          description: 'Tạo yêu cầu mượn, theo dõi lịch sử, quản lý sách đặt trước và kiểm tra trạng thái hội viên.',
          actions: [
            { label: 'Đăng ký mượn sách', type: 'path', value: '/borrowing/new' },
            { label: 'Lịch sử mượn sách', type: 'path', value: '/borrowing/history' },
            { label: 'Sách đã đặt trước', type: 'path', value: '/reservations/mine' },
            { label: 'Trạng thái hội viên', type: 'path', value: '/membership' },
          ],
        };

  const filteredAll = activeCategory === 'Tất cả'
    ? books
    : books.filter((book) => book.categoryName === activeCategory);

  const filtered = showAll ? filteredAll : filteredAll.slice(0, 6);

  // @spec FR-FE01-002, FR-FE01-003, FR-FE01-007, FR-FE01-011
  const handleSearch = async () => {
    const keyword = searchQuery.trim();

    if (!keyword) {
      setActiveSearch('');
      setSearchResults([]);
      setSearchError('');
      try {
        setSearchingBooks(true);
        setBookError('');
        const result = await publicBrowseApi.list();

        if (!Array.isArray(result.data)) {
          throw new Error(result.error?.message || 'Không thể tải danh sách sách.');
        }

        setBooks(result.data || []);
        setActiveCategory('Tất cả');
        setShowAll(true);
        scrollTo('section-books');
      } catch (error) {
        setBookError(error.message || 'Không thể tải danh sách sách.');
      } finally {
        setSearchingBooks(false);
      }
      return;
    }

    if (keyword.length > 200) {
      setSearchError('Từ khóa tìm kiếm không được vượt quá 200 ký tự.');
      return;
    }

    try {
      setSearchingBooks(true);
      setSearchError('');
      setActiveSearch(keyword);

      const result = await publicBrowseApi.list({ q: keyword });

      if (!Array.isArray(result.data)) {
        throw new Error(result.error?.message || 'Không thể tìm kiếm sách.');
      }

      setSearchResults(result.data || []);
    } catch (error) {
      console.error('Search books error:', error);
      setSearchResults([]);
      setSearchError(error.message || 'Đã xảy ra lỗi khi tìm kiếm sách.');
    } finally {
      setSearchingBooks(false);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--sans)', background: '#FAF7F2', minHeight: '100vh', overflowX: 'hidden' }}>
      {loadingBooks && (
        <div style={{
          position: 'fixed',
          top: 80,
          right: 24,
          zIndex: 999,
          background: '#FFF8EE',
          border: '1px solid rgba(199,138,59,0.3)',
          color: '#7A5C44',
          padding: '10px 16px',
          borderRadius: 10,
          fontSize: 13,
          boxShadow: '0 8px 24px rgba(78,52,46,0.12)',
        }}>
          Đang tải dữ liệu sách từ database...
        </div>
      )}

      {bookError && (
        <div style={{
          position: 'fixed',
          top: 80,
          right: 24,
          zIndex: 999,
          background: '#FFEBEE',
          border: '1px solid rgba(198,40,40,0.25)',
          color: '#c62828',
          padding: '10px 16px',
          borderRadius: 10,
          fontSize: 13,
          boxShadow: '0 8px 24px rgba(78,52,46,0.12)',
        }}>
          {bookError}
        </div>
      )}

      {/* Overlay for info panel */}
      {selectedBook && !showDetails && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 299, background: 'rgba(44,26,14,0.3)' }}
          onClick={() => setSelectedBook(null)}
        />
      )}

      {/* @spec BR-FE01-017, FR-FE01-016 */}
      {/* -- NAV -- */}
      <nav className="home-nav" style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'rgba(250,247,242,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(78,52,46,0.1)',
        padding: '0 64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={22} color="#C78A3B" />
          <span style={{ fontFamily: 'var(--heading)', fontWeight: 700, fontSize: 21, color: '#4E342E' }}>
            Quản Lý Thư Viện
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isLoggedIn ? (
            <div className="home-nav-account" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {showUserMenu && <button type="button" aria-label="Đóng menu tài khoản" onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 240, border: 0, background: 'transparent', cursor: 'default' }} />}
              <button
                type="button"
                onClick={() => setShowUserMenu((open) => !open)}
                aria-label="Mở menu tài khoản"
                aria-expanded={showUserMenu}
                style={{ border: 0, background: 'transparent', display: 'flex', alignItems: 'center', gap: 10, color: '#4E342E', cursor: 'pointer', position: 'relative', zIndex: 260, padding: 0 }}
              >
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 0 }}>
                  <span style={{ maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{displayName}</span>
                  <span style={{ color: '#7A5C44', fontSize: 12 }}>{roleLabel}</span>
                </span>
                <span style={{ width: 38, height: 38, borderRadius: '50%', border: '1.5px solid rgba(199,138,59,0.35)', background: '#EDE0CE', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 13, fontWeight: 700, color: '#7A5C44', flexShrink: 0 }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials}
                </span>
              </button>
              {showUserMenu && (
                <div style={{ position: 'absolute', top: 46, right: 0, zIndex: 260, width: 220, background: '#FFFDF8', border: '1px solid rgba(78,52,46,0.14)', borderRadius: 12, boxShadow: '0 18px 48px rgba(44,26,14,0.18)', padding: 8 }}>
                  {[
                    { label: 'Thông tin cá nhân', action: () => navigate('/profile') },
                    ...(showAdminConsoleAction ? [
                      { label: 'Trang quản trị', action: () => navigate('/admin/users') },
                    ] : []),
                    ...(showLibrarianConsoleAction ? [
                      { label: 'Khu vực thủ thư', action: () => navigate('/home') },
                    ] : []),
                    ...(showMemberAccountActions ? [
                      { label: 'Lịch sử mượn sách', action: () => navigate('/borrowing/history') },
                      { label: 'Đăng kí hội viên', action: () => navigate('/membership') },
                    ] : []),
                    { label: 'Đăng xuất', action: () => setShowLogoutConfirm(true), danger: true },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        item.action();
                      }}
                      style={{ width: '100%', padding: '10px 12px', border: 0, borderRadius: 8, background: 'transparent', color: item.danger ? '#C1452F' : '#4E342E', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 600, fontFamily: 'var(--sans)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = item.danger ? '#FBE9E6' : '#F5EFE6'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="home-nav-desktop-action" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={goToLogin} style={{
                padding: '7px 18px', borderRadius: 6, border: '1.5px solid #8B6B4A',
                background: 'transparent', color: '#8B6B4A', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#8B6B4A'; e.currentTarget.style.color = '#FAF7F2'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B6B4A'; }}
              >Đăng nhập</button>
              <button onClick={goToRegister} style={{
                padding: '7px 18px', borderRadius: 6, border: 'none',
                background: '#C78A3B', color: '#FFF', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#4E342E')}
                onMouseLeave={e => (e.currentTarget.style.background = '#C78A3B')}
              >Đăng ký</button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            aria-controls="home-mobile-menu"
            aria-expanded={menuOpen}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#4E342E' }}
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          id="home-mobile-menu"
          className="home-mobile-menu"
          style={{
            position: 'sticky', top: 64, zIndex: 190, background: '#FFFDF8',
            borderBottom: '1px solid rgba(78,52,46,0.12)', padding: '14px 20px 18px',
            flexDirection: 'column', gap: 6, boxShadow: '0 12px 24px rgba(44,26,14,0.1)',
          }}
        >
          {isLoggedIn ? (
            <>
              <button type="button" onClick={() => { setMenuOpen(false); navigate('/profile'); }} style={{ padding: '11px 12px', border: 0, borderRadius: 8, background: '#F5EFE6', color: '#4E342E', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)' }}>
                Thông tin cá nhân
              </button>
              {showAdminConsoleAction && (
                <button type="button" onClick={() => { setMenuOpen(false); navigate('/admin/users'); }} style={{ padding: '11px 12px', border: 0, borderRadius: 8, background: '#F5EFE6', color: '#4E342E', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)' }}>
                  Trang quản trị
                </button>
              )}
              {showLibrarianConsoleAction && (
                <button type="button" onClick={() => { setMenuOpen(false); navigate('/home'); }} style={{ padding: '11px 12px', border: 0, borderRadius: 8, background: '#F5EFE6', color: '#4E342E', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)' }}>
                  Khu vực thủ thư
                </button>
              )}
              {showMemberAccountActions && (
                <>
                  <button type="button" onClick={() => { setMenuOpen(false); navigate('/borrowing/history'); }} style={{ padding: '11px 12px', border: 0, borderRadius: 8, background: '#F5EFE6', color: '#4E342E', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)' }}>
                    Lịch sử mượn sách
                  </button>
                  <button type="button" onClick={() => { setMenuOpen(false); navigate('/membership'); }} style={{ padding: '11px 12px', border: 0, borderRadius: 8, background: '#F5EFE6', color: '#4E342E', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)' }}>
                    Đăng kí hội viên
                  </button>
                </>
              )}
              <button type="button" onClick={() => { setMenuOpen(false); setShowLogoutConfirm(true); }} style={{ padding: '11px 12px', border: 0, borderRadius: 8, background: '#FBE9E6', color: '#C1452F', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)' }}>
                Đăng xuất
              </button>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button type="button" onClick={() => { setMenuOpen(false); goToLogin(); }} style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #8B6B4A', background: 'transparent', color: '#8B6B4A', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--sans)' }}>
                Đăng nhập
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); goToRegister(); }} style={{ padding: '10px 12px', borderRadius: 8, border: 0, background: '#C78A3B', color: '#FFF', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--sans)' }}>
                Đăng ký
              </button>
            </div>
          )}
        </div>
      )}

      {/* -- HERO -- */}
      <section className="home-hero" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 520 }}>
        <div className="home-hero-copy" style={{ padding: '72px 64px 72px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--heading)', fontSize: 52, fontWeight: 700,
            color: '#2C1A0E', lineHeight: 1.15, margin: '0 0 18px', letterSpacing: '-0.5px',
          }}>
            Nơi Mỗi<br />
            <em style={{ color: '#C78A3B' }}>Câu Chuyện</em> Tìm Thấy<br />
            Độc Giả Của Mình
          </h1>

          <p style={{ fontSize: 16, color: '#7A5C44', lineHeight: 1.75, margin: '0 0 32px', maxWidth: 420 }}>
            Khám phá, mượn và tìm kiếm hàng nghìn đầu sách thuộc nhiều thể loại. Cuốn sách tiếp theo dành cho bạn đang chờ sẵn.
          </p>

          <div className="home-hero-search" style={{
            display: 'flex', background: '#FFF', borderRadius: 10,
            border: '1.5px solid rgba(78,52,46,0.18)', overflow: 'hidden', maxWidth: 460,
            boxShadow: '0 4px 16px rgba(78,52,46,0.07)',
          }}>
            <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', color: '#A08060' }}>
              <Search size={17} />
            </div>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm theo tên sách hoặc tác giả..."
              style={{
                flex: 1, padding: '13px 0', border: 'none', outline: 'none',
                fontSize: 14, color: '#2C1A0E', background: 'transparent', fontFamily: 'var(--sans)',
              }}
            />
            <button className="home-hero-search-button" onClick={handleSearch} style={{
              padding: '0 22px', background: '#C78A3B', border: 'none', color: '#FFF',
              cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4E342E')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C78A3B')}
            >Tìm kiếm</button>
          </div>
        </div>

        <div className="home-hero-visual" style={{ position: 'relative', background: '#2C1A0E', overflow: 'hidden' }}>
          <img
            src={HERO_IMG}
            alt="Người đọc sách trong thư viện"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(250,247,242,0.25) 0%, transparent 30%)' }} />
        </div>
      </section>

      {/* -- Kết quả tìm kiếm -- */}
      {activeSearch && (
        <section className="home-search-results-section" style={{ padding: '48px 80px', background: '#FFF', borderBottom: '2px solid #EDE0CE' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <p style={{ fontSize: 11, color: '#C78A3B', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                {isLoggedIn ? 'Tìm kiếm thành viên' : 'Tìm kiếm khách'} - Cơ sở dùng {isLoggedIn ? '19' : '18'}
              </p>
              <h2 style={{ fontFamily: 'var(--heading)', fontSize: 28, fontWeight: 700, color: '#2C1A0E', margin: 0 }}>
                Kết quả cho "{activeSearch}"
                <span style={{ fontSize: 15, fontWeight: 400, color: '#A08060', marginLeft: 12 }}>
                  {searchResults.length} sách được tìm thấy
                </span>
              </h2>
            </div>
            <button onClick={() => { setActiveSearch(''); setSearchQuery(''); setSearchResults([]); setSearchError(''); }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8,
              border: '1.5px solid rgba(78,52,46,0.2)', background: 'transparent', color: '#7A5C44',
              cursor: 'pointer', fontSize: 13, fontFamily: 'var(--sans)',
            }}>
              <X size={14} /> Xóa tìm kiếm
            </button>
          </div>

          {!isLoggedIn && (
            <div style={{ background: '#FFF8EE', border: '1.5px solid #C78A3B', borderRadius: 10, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#7A5C44' }}>
                Bạn đang duyệt với tư cách <strong>khách</strong>. Hãy đăng nhập để mượn sách.
              </span>
              <button onClick={goToLogin} style={{
                padding: '7px 18px', borderRadius: 6, border: 'none', background: '#C78A3B',
                color: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--sans)',
              }}>Đăng nhập</button>
            </div>
          )}
          {isLoggedIn && (
            <div style={{ background: '#E8F5E9', border: '1.5px solid #388e3c', borderRadius: 10, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#2E7D32' }}>
                Đã đăng nhập với vai trò <strong>thành viên</strong> - bạn có thể mượn trực tiếp các sách còn sẵn.
              </span>
            </div>
          )}

          {searchError && (
            <div style={{
              background: '#FFEBEE',
              border: '1px solid rgba(198,40,40,0.25)',
              color: '#c62828',
              padding: '12px 16px',
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 20,
            }}>
              {searchError}
            </div>
          )}

          {searchingBooks ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>...</div>
              <p style={{ fontSize: 16, color: '#7A5C44', margin: 0, fontFamily: 'var(--heading)', fontWeight: 600 }}>Đang tìm kiếm sách...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>--</div>
              <p style={{ fontSize: 16, color: '#7A5C44', margin: '0 0 6px', fontFamily: 'var(--heading)', fontWeight: 600 }}>Không tìm thấy sách</p>
              <p style={{ fontSize: 13, color: '#A08060', margin: 0 }}>Hãy thử tên sách hoặc tên tác giả khác.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 22, alignItems: 'stretch' }}>
              {searchResults.map(book => (
                <div key={book.bookId} className="home-book-card home-book-card--search" style={{
                  background: '#FAF7F2', borderRadius: 12, overflow: 'hidden',
                  border: '1px solid rgba(78,52,46,0.07)', boxShadow: '0 2px 10px rgba(78,52,46,0.05)',
                  cursor: 'pointer', transition: 'all 0.25s',
                  display: 'flex', flexDirection: 'column', height: '100%',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(78,52,46,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(78,52,46,0.05)'; }}
                  onClick={() => { setSelectedBook(book); setShowDetails(false); }}
                >
                  <div style={{ position: 'relative', height: 210, background: '#EDE0CE' }}>
                    <img src={resolveLibraryAssetUrl(book.coverUrl) || BOOK_COVER_FALLBACK} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {canViewAvailability && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 4,
                        background: book.availabilityStatus === 'AVAILABLE' ? 'rgba(56,142,60,0.88)' : 'rgba(198,40,40,0.88)',
                        color: '#FFF', fontSize: 10, fontWeight: 700,
                      }}>
                        {book.availabilityStatus === 'AVAILABLE' ? 'CÒN SÁCH' : 'KHÔNG KHẢ DỤNG'}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <p style={{ fontSize: 10, color: '#C78A3B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px', minHeight: 13, ...textClamp(1) }}>{getCategoryLabel(book.categoryName || 'Chưa phân loại')}</p>
                    <h3 style={{ fontFamily: 'var(--heading)', fontSize: 14, fontWeight: 600, color: '#2C1A0E', margin: '0 0 3px', lineHeight: 1.3, minHeight: 36, ...textClamp(2) }}>{book.title}</h3>
                    <p style={{ fontSize: 12, color: '#7A5C44', margin: '0 0 8px', minHeight: 16, ...textClamp(1) }}>{book.authorName || 'Không rõ tác giả'}</p>
                    <button onClick={e => { e.stopPropagation(); handleBookAction(book); }}
                      style={{ marginTop: 'auto', width: '100%', padding: '7px 0', borderRadius: 6, border: '1.5px solid #C78A3B', background: canViewAvailability && book.availabilityStatus === 'AVAILABLE' ? '#C78A3B' : 'transparent', color: canViewAvailability && book.availabilityStatus === 'AVAILABLE' ? '#FFF' : '#8B6B4A', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--sans)', transition: 'all 0.2s' }}
                    >{canViewAvailability ? getHomeBookAction({ book, isLoggedIn, roles: authUser?.roles || [] }).label : 'Tiếp tục'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* -- Sách nổi bật -- */}
      <section id="section-books" className="home-books-section" style={{ padding: '72px 80px 78px' }}>
        <div className="home-books-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: '#C78A3B', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
              Tuyển chọn nổi bật
            </p>
            <h2 style={{ fontFamily: 'var(--heading)', fontSize: 32, fontWeight: 700, color: '#2C1A0E', margin: 0 }}>
              Sách nổi bật
            </h2>
          </div>
          <button onClick={() => { setShowAll(v => !v); setActiveCategory('Tất cả'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C78A3B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'var(--sans)', transition: 'gap 0.2s', padding: 0 }}
            onMouseEnter={e => (e.currentTarget.style.gap = '10px')}
            onMouseLeave={e => (e.currentTarget.style.gap = '6px')}
          >
            {showAll ? 'Thu gọn' : 'Xem tất cả'} <ArrowRight size={15} style={{ transform: showAll ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="home-book-filters" style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {filterTabs.map(tab => (
            <button className="home-book-filter" key={tab} onClick={() => { setActiveCategory(tab); setShowAll(false); }} style={{
              padding: '6px 16px', borderRadius: 100, border: '1.5px solid',
              borderColor: activeCategory === tab ? '#C78A3B' : 'rgba(78,52,46,0.18)',
              background: activeCategory === tab ? '#C78A3B' : 'transparent',
              color: activeCategory === tab ? '#FFF' : '#7A5C44',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              fontFamily: 'var(--sans)',
            }}>{getCategoryLabel(tab)}</button>
          ))}
        </div>

        {/* Lưới sách */}
        <div className="home-book-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 22, alignItems: 'stretch' }}>
          {filtered.map(book => (
            <div key={book.bookId} className="home-book-card"
              style={{
                background: '#FFF', borderRadius: 12, overflow: 'hidden',
                border: '1px solid rgba(78,52,46,0.07)',
                boxShadow: '0 2px 10px rgba(78,52,46,0.05)',
                cursor: 'pointer', transition: 'all 0.25s',
                display: 'flex', flexDirection: 'column', height: '100%',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(78,52,46,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(78,52,46,0.05)'; }}
              onClick={() => { setSelectedBook(book); setShowDetails(false); }}
            >
              <div style={{ position: 'relative', height: 210, background: '#EDE0CE' }}>
                <img src={resolveLibraryAssetUrl(book.coverUrl) || BOOK_COVER_FALLBACK} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {canViewAvailability && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    padding: '3px 8px', borderRadius: 4,
                    background: book.availabilityStatus === 'AVAILABLE' ? 'rgba(56,142,60,0.88)' : 'rgba(198,40,40,0.88)',
                    color: '#FFF', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                  }}>
                    {book.availabilityStatus === 'AVAILABLE' ? 'CÒN SÁCH' : 'KHÔNG KHẢ DỤNG'}
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <p style={{ fontSize: 10, color: '#C78A3B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px', minHeight: 13, ...textClamp(1) }}>
                  {getCategoryLabel(book.categoryName || 'Chưa phân loại')}
                </p>
                <h3 style={{ fontFamily: 'var(--heading)', fontSize: 14, fontWeight: 600, color: '#2C1A0E', margin: '0 0 3px', lineHeight: 1.3, minHeight: 36, ...textClamp(2) }}>
                  {book.title}
                </h3>
                <p style={{ fontSize: 12, color: '#7A5C44', margin: '0 0 8px', minHeight: 16, ...textClamp(1) }}>{book.authorName || 'Không rõ tác giả'}</p>
                <button
                  onClick={e => { e.stopPropagation(); setSelectedBook(book); setShowDetails(false); }}
                  style={{
                    marginTop: 22, width: '100%', padding: '7px 0', borderRadius: 6, border: '1.5px solid rgba(78,52,46,0.2)',
                    background: 'transparent', color: '#8B6B4A', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    fontFamily: 'var(--sans)', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#8B6B4A'; e.currentTarget.style.color = '#FAF7F2'; e.currentTarget.style.borderColor = '#8B6B4A'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B6B4A'; e.currentTarget.style.borderColor = 'rgba(78,52,46,0.2)'; }}
                >
                  Xem thông tin sách
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* @spec FR-FE01-017 */}
      {/* -- Khám phá theo chủ đề -- */}
      <section id="section-topics" className="home-topic-section home-reveal" data-home-reveal>
        <div className="home-section-heading">
          <div>
            <p>Khám phá theo chủ đề</p>
            <h2>Mỗi lĩnh vực, một thế giới mới</h2>
          </div>
          <span>Chọn một chủ đề để lọc trực tiếp danh mục sách công khai.</span>
        </div>
        <div className="home-topic-grid">
          {[
            { value: 'Programming', label: 'Lập trình', desc: 'Thuật toán, ngôn ngữ và kỹ thuật phát triển phần mềm.', icon: Code2, accent: '#B86B3D' },
            { value: 'Database', label: 'Cơ sở dữ liệu', desc: 'Thiết kế, quản trị và khai thác dữ liệu hiệu quả.', icon: Database, accent: '#6E7F55' },
            { value: 'AI', label: 'Trí tuệ nhân tạo', desc: 'Máy học, tư duy dữ liệu và công nghệ tương lai.', icon: BrainCircuit, accent: '#826B9D' },
            { value: 'Novel', label: 'Tiểu thuyết', desc: 'Những câu chuyện mở rộng trí tưởng tượng và cảm xúc.', icon: BookHeart, accent: '#A65B65' },
          ].map(({ value, label, desc, icon: TopicIcon, accent }) => (
            <button
              key={value}
              type="button"
              className="home-topic-card"
              style={{ '--topic-accent': accent }}
              onClick={() => handleHomeNavigation({ type: 'category', value })}
            >
              <span className="home-topic-icon"><TopicIcon size={24} aria-hidden="true" /></span>
              <span className="home-topic-copy">
                <strong>{label}</strong>
                <small>{desc}</small>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      {/* -- Hành trình sử dụng -- */}
      <section id="section-journey" className="home-journey-section home-reveal" data-home-reveal>
        <div className="home-journey-intro">
          <span className="home-journey-icon"><Route size={24} aria-hidden="true" /></span>
          <p>Hành trình tại thư viện</p>
          <h2>Từ tìm kiếm đến khi cuốn sách ở trong tay bạn</h2>
          <span>
            Các bước được kết nối với dữ liệu và nghiệp vụ thật của hệ thống.
          </span>
        </div>
        <div className="home-journey-steps">
          {[
            { number: '01', title: 'Khám phá đầu sách', desc: 'Tìm theo tên sách hoặc tác giả và mở thông tin công khai của đầu sách.' },
            { number: '02', title: 'Chọn luồng phù hợp', desc: 'Đăng nhập để mượn sách; hệ thống tự áp dụng đúng quyền và hạn mức hội viên.' },
            { number: '03', title: 'Theo dõi xuyên suốt', desc: 'Quản lý yêu cầu, lịch sử mượn, đặt trước và các khoản phí tại khu vực cá nhân.' },
          ].map((step) => (
            <article key={step.number} className="home-journey-step">
              <span>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* -- Truy cập theo vai trò -- */}
      <section id="section-role-space" className="home-role-section home-reveal" data-home-reveal>
        <div className="home-role-panel">
          <span className="home-role-ambient" aria-hidden="true" />
          <div className="home-role-copy">
            <span className="home-role-icon"><Compass size={25} aria-hidden="true" /></span>
            <p>{roleHomePanel.eyebrow}</p>
            <h2>{roleHomePanel.title}</h2>
            <span>{roleHomePanel.description}</span>
          </div>
          <div className="home-role-actions">
            {roleHomePanel.actions.map((action, index) => (
              <button key={action.label} type="button" onClick={() => handleHomeNavigation(action)}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{action.label}</strong>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* -- CTA -- */}
      {!isLoggedIn && <section id="section-cta" className="home-cta-section home-reveal" data-home-reveal>
        <div className="home-cta-grid">
          {/* Left */}
          <div className="home-cta-copy">
            <span className="home-cta-symbol" aria-hidden="true"><BookOpen size={23} /></span>
            <p className="home-cta-eyebrow">
              Trở thành thành viên
            </p>
            <h2>
              Mở Khóa Trọn Vẹn<br />
              Trải Nghiệm <em>Thư Viện</em>
            </h2>
            <p className="home-cta-description">
              Tham gia cùng cộng đồng độc giả để mượn, khám phá và kết nối với những tác phẩm giá trị trong cùng một hệ thống.
            </p>
            <div className="home-cta-actions">
              <button type="button" onClick={goToRegister}>
                <span>Tham gia miễn phí</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
              <small>Đăng ký trực tuyến · Xác thực qua email</small>
            </div>
          </div>

          {/* Right - benefit cards */}
          <div className="home-benefit-grid">
            {[
              { number: '01', icon: UserPlus, title: 'Đăng ký trực tuyến', desc: 'Tạo tài khoản và xác thực email để sử dụng hệ thống.' },
              { number: '02', icon: ShieldCheck, title: 'Mượn sách có kiểm soát', desc: 'Tối đa 5 sách đang mượn tại cùng một thời điểm.' },
              { number: '03', icon: ListChecks, title: 'Hạn mức rõ ràng', desc: 'Gửi tối đa 3 yêu cầu mỗi ngày khi chưa được duyệt hội viên.' },
              { number: '04', icon: BadgeCheck, title: 'Quyền lợi hội viên', desc: 'Gửi tối đa 5 yêu cầu mỗi ngày sau khi được duyệt hội viên.' },
            ].map(({ number, icon: BenefitIcon, title, desc }) => (
              <article key={title} className="home-benefit-card">
                <div className="home-benefit-card-top">
                  <span className="home-benefit-icon">
                    <BenefitIcon size={20} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="home-benefit-number" aria-hidden="true">{number}</span>
                </div>
                <h3>
                  {title}
                </h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>}

      {/* @spec FR-FE01-015 */}
      {/* -- FOOTER -- */}
      <footer
        id="section-footer"
        ref={footerRef}
        className={`home-footer${footerVisible ? ' is-visible' : ''}`}
      >
        <div className="home-footer-shell">
          <div className="home-footer-grid">
            <div id="section-about" className="home-footer-brand">
              <div className="home-footer-brand-mark">
                <span><BookOpen size={21} aria-hidden="true" /></span>
                <div>
                  <small>Không gian tri thức</small>
                  <strong>Quản Lý Thư Viện</strong>
                </div>
              </div>
              <p>
                Hệ thống quản lý thư viện hiện đại, kết nối độc giả với những đầu sách giá trị.
              </p>
            </div>
            <div id="footer-contact" className="home-footer-contact">
              <div className="home-footer-contact-heading">
                <span>Thông tin liên hệ</span>
              </div>
              <div className="home-footer-contact-list">
                <a className="home-footer-contact-item" href="tel:0348335508">
                  <span className="home-footer-contact-icon"><Phone size={18} aria-hidden="true" /></span>
                  <span className="home-footer-contact-copy">
                    <small>Điện thoại</small>
                    <strong>0348335508</strong>
                  </span>
                </a>
                <a className="home-footer-contact-item" href="mailto:dt9848630@gmail.com">
                  <span className="home-footer-contact-icon"><Mail size={18} aria-hidden="true" /></span>
                  <span className="home-footer-contact-copy">
                    <small>Email</small>
                    <strong>dt9848630@gmail.com</strong>
                  </span>
                </a>
                <div className="home-footer-contact-item home-footer-contact-item--address">
                  <span className="home-footer-contact-icon"><MapPin size={18} aria-hidden="true" /></span>
                  <span className="home-footer-contact-copy">
                    <small>Vị trí</small>
                    <strong>Thôn 3, Xã Thạch Hòa, Huyện Thạch Thất, Thành phố Hà Nội</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="home-footer-bottom">
            <p>© 2026 Quản Lý Thư Viện. Mọi quyền được bảo lưu.</p>
            <div className="home-footer-policy-links">
              {Object.entries(FOOTER_POLICIES).map(([key, policy]) => (
                <button key={key} type="button" onClick={() => setActiveFooterPolicy(key)}>
                  {policy.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {activeFooterPolicy && (
        <FooterPolicyDialog
          policy={FOOTER_POLICIES[activeFooterPolicy]}
          onClose={() => setActiveFooterPolicy(null)}
        />
      )}

      {showLogoutConfirm && (
        <div
          role="presentation"
          onClick={() => setShowLogoutConfirm(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(30,18,10,0.55)', display: 'grid', placeItems: 'center', padding: 24 }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            onClick={(event) => event.stopPropagation()}
            style={{ width: 'min(420px, 100%)', background: '#FAF7F2', borderRadius: 14, boxShadow: '0 24px 80px rgba(30,18,10,0.32)', overflow: 'hidden' }}
          >
            <div style={{ padding: '22px 24px', borderBottom: '1px solid rgba(78,52,46,0.12)' }}>
              <h2 id="logout-confirm-title" style={{ margin: '0 0 8px', fontFamily: 'var(--heading)', fontSize: 22, color: '#2C1A0E' }}>
                Xác nhận đăng xuất
              </h2>
              <p style={{ margin: 0, color: '#7A5C44', fontSize: 14, lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: 18 }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid rgba(78,52,46,0.2)', background: 'transparent', color: '#7A5C44', cursor: 'pointer', fontWeight: 700 }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#C78A3B', color: '#FFF', cursor: 'pointer', fontWeight: 700 }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- BOOK INFO PANEL -- */}
      {selectedBook && !showDetails && (
        <BookInfoPanel
          book={selectedBook}
          action={selectedBookAction}
          canViewAvailability={canViewAvailability}
          detailLoading={detailLoading}
          onClose={() => setSelectedBook(null)}
          onViewDetails={handleViewDetails}
          onAction={() => handleBookAction(selectedBook)}
        />
      )}

      {/* -- BOOK DETAILS MODAL -- */}
      {selectedBook && showDetails && (
        <BookDetailsModal
          book={selectedBook}
          action={selectedBookAction}
          canViewAvailability={canViewAvailability}
          onClose={() => { setSelectedBook(null); setShowDetails(false); }}
          onBack={() => setShowDetails(false)}
          onAction={() => handleBookAction(selectedBook)}
        />
      )}

      {/* -- TOAST -- */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 800, background: '#2C1A0E', color: '#FAF7F2',
          borderRadius: 10, padding: '13px 24px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeIn 0.2s ease',
        }}>
          <span style={{ color: '#C78A3B' }}>✓</span> {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes footerGlow {
          from { opacity: 0.2; transform: translate3d(3%, -5%, 0) scale(0.94); }
          to { opacity: 0.42; transform: translate3d(-2%, 2%, 0) scale(1.06); }
        }
        @keyframes footerModalFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes footerModalRise {
          from { opacity: 0; transform: translateY(18px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes homeHeroCopyIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes homeHeroVisualIn {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes homeHeroImageDrift {
          from { transform: scale(1.025); }
          to { transform: scale(1.075); }
        }
        .home-mobile-menu { display: none; }
        .home-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(115deg, #FCF9F4 0%, #F8F1E7 50%, #F2E6D5 100%);
          border-bottom: 1px solid rgba(78, 52, 46, 0.08);
        }
        .home-hero::before {
          content: '';
          position: absolute;
          top: -180px;
          left: -150px;
          width: 480px;
          height: 480px;
          border: 1px solid rgba(199, 138, 59, 0.1);
          border-radius: 50%;
          box-shadow: 0 0 0 54px rgba(199, 138, 59, 0.025), 0 0 0 108px rgba(199, 138, 59, 0.018);
          pointer-events: none;
        }
        .home-hero-copy {
          position: relative;
          z-index: 2;
          animation: homeHeroCopyIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .home-hero-copy h1 {
          text-shadow: 0 2px 0 rgba(255, 255, 255, 0.75);
        }
        .home-hero-search {
          transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
        }
        .home-hero-search:focus-within {
          border-color: #C78A3B !important;
          box-shadow: 0 10px 30px rgba(78, 52, 46, 0.12) !important;
          transform: translateY(-2px);
        }
        .home-hero-search-button {
          position: relative;
          overflow: hidden;
        }
        .home-hero-search-button::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 25%, rgba(255, 255, 255, 0.3) 48%, transparent 70%);
          transform: translateX(-130%);
          transition: transform 0.45s ease;
        }
        .home-hero-search-button:hover::after { transform: translateX(130%); }
        .home-hero-visual {
          z-index: 1;
          animation: homeHeroVisualIn 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both;
        }
        .home-hero-visual::before {
          content: '';
          position: absolute;
          z-index: 2;
          inset: 0;
          background: linear-gradient(90deg, rgba(44, 26, 14, 0.2), transparent 35%, rgba(44, 26, 14, 0.08));
          pointer-events: none;
        }
        .home-hero-visual img {
          animation: homeHeroImageDrift 14s ease-in-out infinite alternate;
        }
        .home-search-results-section {
          position: relative;
          background: linear-gradient(180deg, #FFF 0%, #FCF9F4 100%) !important;
          box-shadow: inset 0 18px 36px rgba(78, 52, 46, 0.025);
        }
        .home-books-section {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 88% 12%, rgba(199, 138, 59, 0.08), transparent 24%),
            linear-gradient(180deg, #FFFDF9 0%, #FAF7F2 100%);
        }
        .home-books-section::before,
        .home-topic-section::before,
        .home-role-section::before,
        .home-cta-section::before {
          content: '';
          position: absolute;
          top: 0;
          right: 80px;
          left: 80px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(199, 138, 59, 0.38), transparent);
        }
        .home-books-heading {
          position: relative;
          z-index: 1;
        }
        .home-books-heading h2 {
          position: relative;
          display: inline-block;
          padding-bottom: 10px;
        }
        .home-books-heading h2::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 56px;
          height: 3px;
          border-radius: 3px;
          background: linear-gradient(90deg, #C78A3B, #E1B067);
        }
        .home-book-filters {
          position: relative;
          z-index: 1;
          padding: 8px;
          border: 1px solid rgba(78, 52, 46, 0.08);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          box-shadow: 0 7px 20px rgba(78, 52, 46, 0.04);
          width: fit-content;
        }
        .home-book-filter {
          transition: transform 0.2s ease, color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease !important;
        }
        .home-book-filter:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(78, 52, 46, 0.08);
        }
        .home-book-grid {
          position: relative;
          z-index: 1;
        }
        .home-book-card {
          position: relative;
        }
        .home-book-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px solid transparent;
          border-radius: inherit;
          pointer-events: none;
          transition: border-color 0.25s ease;
        }
        .home-book-card:hover::after {
          border-color: rgba(199, 138, 59, 0.36);
        }
        .home-book-card img {
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .home-book-card:hover img { transform: scale(1.045); }
        .home-benefit-card {
          position: relative;
          min-height: 168px;
          overflow: hidden;
          padding: 22px 22px 20px;
          border: 1px solid rgba(78, 52, 46, 0.1);
          border-radius: 16px;
          background: linear-gradient(145deg, #FFFDF9 0%, #F8F2E9 100%);
          box-shadow: 0 8px 24px rgba(78, 52, 46, 0.045);
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        .home-benefit-card::before {
          content: '';
          position: absolute;
          inset: 0 0 auto;
          height: 3px;
          background: linear-gradient(90deg, #C78A3B, rgba(199, 138, 59, 0.08) 70%, transparent);
        }
        .home-benefit-card::after {
          content: '';
          position: absolute;
          top: -44px;
          right: -44px;
          width: 112px;
          height: 112px;
          border-radius: 50%;
          background: rgba(199, 138, 59, 0.055);
          pointer-events: none;
        }
        .home-benefit-card:hover {
          z-index: 1;
          transform: translateY(-4px);
          border-color: rgba(199, 138, 59, 0.3);
          box-shadow: 0 14px 34px rgba(78, 52, 46, 0.1);
        }
        .home-benefit-card-top {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .home-benefit-icon {
          width: 42px;
          height: 42px;
          display: inline-grid;
          place-items: center;
          border-radius: 50%;
          background: #F0E2CC;
          color: #B97826;
        }
        .home-benefit-number {
          color: rgba(78, 52, 46, 0.25);
          font-family: var(--heading);
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .home-benefit-card h3 {
          position: relative;
          z-index: 1;
          margin: 0 0 7px;
          color: #2C1A0E;
          font-family: var(--heading);
          font-size: 16px;
          font-weight: 700;
          line-height: 1.35;
        }
        .home-benefit-card p {
          position: relative;
          z-index: 1;
          margin: 0;
          color: #7A5C44;
          font-size: 12.5px;
          line-height: 1.65;
        }
        .home-reveal {
          opacity: 0;
          transform: translateY(34px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .home-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .home-topic-section {
          position: relative;
          overflow: hidden;
          padding: 78px 80px 84px;
          background:
            radial-gradient(circle at 8% 88%, rgba(199, 138, 59, 0.09), transparent 25%),
            #F6EFE4;
          border-top: 1px solid rgba(78, 52, 46, 0.07);
        }
        .home-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 40px;
          margin-bottom: 34px;
        }
        .home-section-heading p,
        .home-journey-intro > p,
        .home-role-copy > p {
          margin: 0 0 8px;
          color: #C78A3B;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }
        .home-section-heading h2,
        .home-journey-intro h2,
        .home-role-copy h2 {
          margin: 0;
          color: #2C1A0E;
          font-family: var(--heading);
          font-size: clamp(30px, 3vw, 42px);
          line-height: 1.15;
        }
        .home-section-heading > span {
          max-width: 390px;
          color: #7A5C44;
          font-size: 14px;
          line-height: 1.7;
        }
        .home-topic-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .home-topic-card {
          min-width: 0;
          min-height: 210px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 24px;
          border: 1px solid rgba(78, 52, 46, 0.1);
          border-radius: 16px;
          background: rgba(255, 253, 249, 0.86);
          color: #2C1A0E;
          cursor: pointer;
          text-align: left;
          box-shadow: 0 8px 24px rgba(78, 52, 46, 0.04);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .home-topic-icon {
          width: 46px;
          height: 46px;
          display: inline-grid;
          place-items: center;
          margin-bottom: 28px;
          border-radius: 50%;
          background: color-mix(in srgb, var(--topic-accent) 13%, #FFF);
          color: var(--topic-accent);
          transition: transform 0.25s ease, background 0.25s ease, color 0.25s ease;
        }
        .home-topic-copy {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 7px;
        }
        .home-topic-copy strong {
          font-family: var(--heading);
          font-size: 18px;
        }
        .home-topic-copy small {
          color: #7A5C44;
          font-size: 12.5px;
          line-height: 1.6;
        }
        .home-topic-card > svg {
          align-self: flex-end;
          color: var(--topic-accent);
          opacity: 0;
          transform: translateX(-8px);
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .home-topic-card:hover,
        .home-topic-card:focus-visible {
          transform: translateY(-6px);
          border-color: color-mix(in srgb, var(--topic-accent) 40%, transparent);
          box-shadow: 0 16px 36px rgba(78, 52, 46, 0.1);
        }
        .home-topic-card:hover .home-topic-icon,
        .home-topic-card:focus-visible .home-topic-icon {
          transform: rotate(-7deg) scale(1.08);
          background: var(--topic-accent);
          color: #FFF;
        }
        .home-topic-card:hover > svg,
        .home-topic-card:focus-visible > svg {
          opacity: 1;
          transform: translateX(0);
        }
        .home-journey-section {
          position: relative;
          display: grid;
          grid-template-columns: minmax(300px, 0.78fr) minmax(0, 1.22fr);
          gap: clamp(50px, 7vw, 110px);
          padding: 86px 80px;
          background: linear-gradient(120deg, #3D2922 0%, #25150D 100%);
        }
        .home-journey-section::before,
        .home-journey-section::after {
          content: '';
          position: absolute;
          right: 0;
          left: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(226, 168, 91, 0.68), transparent);
        }
        .home-journey-section::before { top: 0; }
        .home-journey-section::after { bottom: 0; }
        .home-journey-icon,
        .home-role-icon {
          width: 50px;
          height: 50px;
          display: inline-grid;
          place-items: center;
          margin-bottom: 24px;
          border: 1px solid rgba(217, 154, 72, 0.34);
          border-radius: 50%;
          background: rgba(199, 138, 59, 0.11);
          color: #E2A85B;
        }
        .home-journey-intro > p { color: #E2A85B; }
        .home-journey-intro h2 { max-width: 500px; color: #FFF8EE; }
        .home-journey-intro > span:last-child {
          display: block;
          max-width: 440px;
          margin-top: 22px;
          color: #BFA58F;
          font-size: 14px;
          line-height: 1.75;
        }
        .home-journey-steps {
          position: relative;
          display: grid;
          gap: 0;
        }
        .home-journey-steps::before {
          content: '';
          position: absolute;
          top: 31px;
          bottom: 31px;
          left: 30px;
          width: 1px;
          background: linear-gradient(#D99A48, rgba(217, 154, 72, 0.12));
        }
        .home-journey-step {
          position: relative;
          display: grid;
          grid-template-columns: 62px 1fr;
          gap: 22px;
          padding: 22px 0;
        }
        .home-journey-step > span {
          z-index: 1;
          width: 60px;
          height: 60px;
          display: inline-grid;
          place-items: center;
          border: 1px solid rgba(217, 154, 72, 0.34);
          border-radius: 50%;
          background: #2B1A12;
          color: #E2A85B;
          font-family: var(--heading);
          font-size: 14px;
          font-weight: 700;
          transition: transform 0.25s ease, background 0.25s ease;
        }
        .home-journey-step:hover > span {
          transform: scale(1.08);
          background: #C78A3B;
          color: #FFF;
        }
        .home-journey-step h3 {
          margin: 2px 0 7px;
          color: #FFF8EE;
          font-family: var(--heading);
          font-size: 19px;
        }
        .home-journey-step p {
          max-width: 590px;
          margin: 0;
          color: #BFA58F;
          font-size: 13px;
          line-height: 1.7;
        }
        .home-role-section {
          position: relative;
          overflow: hidden;
          padding: 88px 80px;
          background:
            radial-gradient(circle at 9% 16%, rgba(210, 151, 73, 0.1), transparent 22%),
            linear-gradient(180deg, #FFFCF7 0%, #F9F2E8 100%);
        }
        .home-role-panel {
          position: relative;
          display: grid;
          grid-template-columns: minmax(330px, 0.82fr) minmax(0, 1.18fr);
          gap: clamp(38px, 5vw, 78px);
          overflow: hidden;
          max-width: 1760px;
          margin: 0 auto;
          padding: clamp(38px, 4.6vw, 68px);
          border: 1px solid rgba(229, 180, 111, 0.24);
          border-radius: 28px;
          background:
            linear-gradient(112deg, rgba(255, 255, 255, 0.035), transparent 42%),
            linear-gradient(135deg, #2A180F 0%, #3B2417 54%, #26150D 100%);
          box-shadow: 0 30px 75px rgba(58, 34, 20, 0.2);
        }
        .home-role-panel::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 41%;
          width: 1px;
          background: linear-gradient(180deg, transparent, rgba(229, 180, 111, 0.28), transparent);
        }
        .home-role-panel::after {
          content: '';
          position: absolute;
          top: -210px;
          right: -100px;
          width: 470px;
          height: 470px;
          border: 1px solid rgba(229, 180, 111, 0.11);
          border-radius: 50%;
          box-shadow: 0 0 0 58px rgba(229, 180, 111, 0.025), 0 0 0 116px rgba(229, 180, 111, 0.018);
          pointer-events: none;
        }
        .home-role-ambient {
          position: absolute;
          top: 44%;
          right: 18%;
          width: 260px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(221, 156, 72, 0.15), transparent 70%);
          filter: blur(14px);
          pointer-events: none;
          animation: homeRoleAmbient 7s ease-in-out infinite alternate;
        }
        .home-role-copy,
        .home-role-actions { position: relative; z-index: 1; }
        .home-role-icon {
          width: 54px;
          height: 54px;
          display: inline-grid;
          place-items: center;
          margin-bottom: 23px;
          border: 1px solid rgba(229, 180, 111, 0.38);
          border-radius: 17px;
          background: rgba(229, 180, 111, 0.1);
          color: #EDB866;
          box-shadow: inset 0 0 20px rgba(229, 180, 111, 0.05);
          transition: transform 0.3s ease, background 0.3s ease;
        }
        .home-role-panel:hover .home-role-icon {
          transform: rotate(-7deg) scale(1.06);
          background: rgba(229, 180, 111, 0.17);
        }
        .home-role-copy > p {
          margin: 0 0 10px;
          color: #D9A358;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }
        .home-role-copy > h2 {
          max-width: 510px;
          margin: 0;
          color: #FFF8ED;
          font-family: var(--heading);
          font-size: clamp(30px, 3vw, 46px);
          line-height: 1.13;
        }
        .home-role-copy > span:last-child {
          display: block;
          max-width: 480px;
          margin-top: 18px;
          color: #C8AD96;
          font-size: 14px;
          line-height: 1.8;
        }
        .home-role-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
          align-content: center;
        }
        .home-role-actions button {
          min-width: 0;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
          min-height: 68px;
          padding: 18px 19px;
          border: 1px solid rgba(229, 180, 111, 0.16);
          border-radius: 14px;
          background: rgba(255, 249, 239, 0.065);
          color: #F8E9D6;
          cursor: pointer;
          font-family: var(--sans);
          text-align: left;
          backdrop-filter: blur(8px);
          transition: transform 0.24s ease, border-color 0.24s ease, background 0.24s ease, box-shadow 0.24s ease;
        }
        .home-role-actions button > span {
          width: 29px;
          height: 29px;
          display: inline-grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(222, 157, 72, 0.13);
          color: #E7AE60;
          font-family: var(--heading);
          font-size: 11px;
          font-weight: 700;
        }
        .home-role-actions button strong {
          overflow: hidden;
          font-size: 13px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .home-role-actions button svg {
          color: #E7AE60;
          opacity: 0.55;
          transform: translateX(-3px);
          transition: opacity 0.22s ease, transform 0.22s ease;
        }
        .home-role-actions button:hover,
        .home-role-actions button:focus-visible {
          transform: translateY(-4px);
          border-color: rgba(231, 174, 96, 0.48);
          background: rgba(255, 249, 239, 0.12);
          box-shadow: 0 16px 34px rgba(13, 7, 4, 0.22);
        }
        .home-role-actions button:hover svg,
        .home-role-actions button:focus-visible svg {
          opacity: 1;
          transform: translateX(0);
        }
        .home-cta-section {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          padding: 94px 80px;
          background:
            radial-gradient(circle at 4% 8%, rgba(255, 255, 255, 0.8), transparent 26%),
            linear-gradient(118deg, #F1DFC5 0%, #E8C995 48%, #F7ECDD 100%);
        }
        .home-cta-section::after {
          content: '';
          position: absolute;
          z-index: -1;
          top: -250px;
          right: -100px;
          width: 560px;
          height: 560px;
          border: 1px solid rgba(114, 65, 29, 0.12);
          border-radius: 50%;
          box-shadow: 0 0 0 62px rgba(255, 255, 255, 0.08), 0 0 0 124px rgba(114, 65, 29, 0.022);
          animation: homeCtaOrbit 10s ease-in-out infinite alternate;
        }
        .home-cta-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(320px, 0.78fr) minmax(0, 1.22fr);
          gap: clamp(54px, 7vw, 112px);
          align-items: center;
          max-width: 1760px;
          margin: 0 auto;
        }
        .home-cta-copy {
          position: relative;
          padding: 34px 0 34px 34px;
          border-left: 1px solid rgba(111, 65, 32, 0.28);
        }
        .home-cta-symbol {
          width: 48px;
          height: 48px;
          display: inline-grid;
          place-items: center;
          margin-bottom: 22px;
          border-radius: 15px;
          background: #4A2D1E;
          color: #F5C06E;
          box-shadow: 0 13px 28px rgba(74, 45, 30, 0.18);
        }
        .home-cta-eyebrow {
          margin: 0 0 12px;
          color: #9D641F;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }
        .home-cta-copy h2 {
          margin: 0 0 20px;
          color: #2B190F;
          font-family: var(--heading);
          font-size: clamp(36px, 3.5vw, 52px);
          line-height: 1.12;
        }
        .home-cta-copy h2 em {
          color: #B86F1F;
          font-style: normal;
        }
        .home-cta-description {
          max-width: 480px;
          margin: 0 0 32px;
          color: #6D4B36;
          font-size: 15px;
          line-height: 1.8;
        }
        .home-cta-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px 18px;
        }
        .home-cta-actions button {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          padding: 13px 18px 13px 22px;
          border: 1px solid #4A2D1E;
          border-radius: 100px;
          background: #4A2D1E;
          color: #FFF9EF;
          cursor: pointer;
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 750;
          box-shadow: 0 12px 28px rgba(74, 45, 30, 0.2);
          transition: transform 0.24s ease, background 0.24s ease, box-shadow 0.24s ease;
        }
        .home-cta-actions button svg {
          transition: transform 0.24s ease;
        }
        .home-cta-actions button:hover,
        .home-cta-actions button:focus-visible {
          transform: translateY(-4px);
          background: #A8611D;
          box-shadow: 0 18px 34px rgba(74, 45, 30, 0.25);
        }
        .home-cta-actions button:hover svg,
        .home-cta-actions button:focus-visible svg {
          transform: translateX(4px);
        }
        .home-cta-actions small {
          color: #7D5A41;
          font-size: 11px;
        }
        .home-benefit-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          perspective: 900px;
        }
        .home-cta-section .home-benefit-card {
          min-height: 188px;
          padding: 25px 24px 23px;
          border-color: rgba(92, 52, 26, 0.12);
          border-radius: 18px;
          background: rgba(255, 251, 244, 0.84);
          box-shadow: 0 16px 38px rgba(92, 52, 26, 0.085);
          backdrop-filter: blur(10px);
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .home-cta-section .home-benefit-card:nth-child(even) {
          transform: translateY(18px);
        }
        .home-cta-section .home-benefit-card:hover {
          transform: translateY(-7px) rotateX(1.5deg);
          border-color: rgba(168, 97, 29, 0.38);
          box-shadow: 0 23px 46px rgba(92, 52, 26, 0.15);
        }
        .home-cta-section .home-benefit-card:nth-child(even):hover {
          transform: translateY(11px) rotateX(1.5deg);
        }
        .home-cta-section .home-benefit-icon {
          border-radius: 14px;
          background: linear-gradient(145deg, #F3D7AE, #FAEBD5);
          box-shadow: inset 0 0 0 1px rgba(173, 103, 32, 0.1);
          transition: transform 0.3s ease;
        }
        .home-cta-section .home-benefit-card:hover .home-benefit-icon {
          transform: rotate(-7deg) scale(1.08);
        }
        @keyframes homeRoleAmbient {
          from { opacity: 0.45; transform: translate3d(-18px, -8px, 0) scale(0.94); }
          to { opacity: 0.9; transform: translate3d(24px, 12px, 0) scale(1.08); }
        }
        @keyframes homeCtaOrbit {
          from { transform: translate3d(0, -8px, 0) rotate(0deg); }
          to { transform: translate3d(-24px, 28px, 0) rotate(5deg); }
        }
        .home-footer {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          background:
            radial-gradient(circle at 82% 20%, rgba(226, 166, 95, 0.16), transparent 27%),
            linear-gradient(118deg, #2A1A12 0%, #3A2519 48%, #2D1B12 100%);
        }
        .home-footer::before {
          content: '';
          position: absolute;
          z-index: -1;
          top: -180px;
          right: 5%;
          width: 620px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(199, 138, 59, 0.18) 0%, rgba(199, 138, 59, 0.04) 45%, transparent 72%);
          opacity: 0;
          pointer-events: none;
        }
        .home-footer::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 4%, #C78A3B 35%, #E2B66E 52%, #C78A3B 70%, transparent 96%);
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .home-footer.is-visible::before {
          animation: footerGlow 8s ease-in-out 0.2s infinite alternate;
        }
        .home-footer.is-visible::after { transform: scaleX(1); }
        .home-footer-shell {
          position: relative;
          z-index: 1;
          padding: 62px 80px 28px;
        }
        .home-footer-grid {
          display: grid;
          grid-template-columns: minmax(260px, 0.72fr) minmax(0, 1.55fr);
          justify-content: space-between;
          gap: clamp(58px, 7vw, 118px);
          max-width: 1760px;
          margin: 0 auto 44px;
        }
        .home-footer-grid,
        .home-footer-bottom {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.65s ease, transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .home-footer.is-visible .home-footer-grid,
        .home-footer.is-visible .home-footer-bottom {
          opacity: 1;
          transform: translateY(0);
        }
        .home-footer.is-visible .home-footer-bottom { transition-delay: 0.34s; }
        .home-footer-brand {
          position: relative;
          padding-left: 22px;
        }
        .home-footer-brand::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 2px;
          border-radius: 10px;
          background: linear-gradient(180deg, #E1A84F, rgba(225, 168, 79, 0.08));
          transform-origin: top;
          transition: transform 0.4s ease;
        }
        .home-footer-brand:hover::before {
          transform: scaleY(0.72);
        }
        .home-footer-brand-mark {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }
        .home-footer-brand-mark > span {
          width: 47px;
          height: 47px;
          flex: 0 0 47px;
          display: inline-grid;
          place-items: center;
          border: 1px solid rgba(225, 168, 79, 0.28);
          border-radius: 15px;
          background: rgba(225, 168, 79, 0.08);
          color: #E1A84F;
        }
        .home-footer-brand-mark div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .home-footer-brand-mark small {
          color: #9E7358;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }
        .home-footer-brand-mark strong {
          color: #FFF5E9;
          font-family: var(--heading);
          font-size: 21px;
        }
        .home-footer-brand > p {
          max-width: 350px;
          margin: 0;
          color: #A88770;
          font-size: 13px;
          line-height: 1.8;
        }
        .home-footer-brand-mark svg {
          transition: transform 0.3s ease, filter 0.3s ease;
        }
        .home-footer-brand:hover .home-footer-brand-mark svg {
          transform: rotate(-8deg) scale(1.12);
          filter: drop-shadow(0 0 7px rgba(217, 154, 72, 0.5));
        }
        .home-footer-contact-heading {
          display: grid;
          grid-template-columns: minmax(180px, 0.75fr) minmax(300px, 1.15fr) minmax(360px, 1.55fr);
          margin-bottom: 26px;
          color: #FFF5E9;
          font-family: var(--heading);
          font-size: 17px;
          font-weight: 700;
        }
        .home-footer-contact-heading span {
          position: relative;
          grid-column: 2;
          text-align: center;
        }
        .home-footer-contact-heading span::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          width: 32px;
          height: 2px;
          border-radius: 10px;
          background: #D99A48;
          transform: translateX(-50%);
        }
        .home-footer-contact {
          width: 100%;
          max-width: 960px;
          justify-self: end;
        }
        .home-footer-contact-list {
          display: grid;
          grid-template-columns: minmax(180px, 0.75fr) minmax(300px, 1.15fr) minmax(360px, 1.55fr);
          align-items: start;
        }
        .home-footer-contact-item {
          min-width: 0;
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 9px 30px 12px;
          color: #FAF7F2;
          text-decoration: none;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.5s ease, transform 0.25s ease, color 0.2s ease;
        }
        .home-footer.is-visible .home-footer-contact-item { opacity: 1; transform: translateY(0); }
        .home-footer.is-visible .home-footer-contact-item:nth-child(1) { transition-delay: 0.18s; }
        .home-footer.is-visible .home-footer-contact-item:nth-child(2) { transition-delay: 0.26s; }
        .home-footer.is-visible .home-footer-contact-item:nth-child(3) { transition-delay: 0.34s; }
        .home-footer-contact-item:first-child { padding-left: 0; }
        .home-footer-contact-item + .home-footer-contact-item {
          border-left: 1px solid rgba(199, 138, 59, 0.2);
        }
        a.home-footer-contact-item:hover .home-footer-contact-copy strong,
        a.home-footer-contact-item:focus-visible .home-footer-contact-copy strong {
          color: #D99A48;
        }
        .home-footer-contact-item:hover {
          transform: translateY(-3px) !important;
        }
        .home-footer-contact-item:hover .home-footer-contact-icon {
          transform: translateY(-2px) scale(1.14);
          filter: drop-shadow(0 0 7px rgba(217, 154, 72, 0.45));
        }
        .home-footer-contact-item--address { grid-column: auto; }
        .home-footer-contact-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(217, 154, 72, 0.2);
          border-radius: 13px;
          background: rgba(217, 154, 72, 0.07);
          color: #D99A48;
          transition: transform 0.25s ease, filter 0.25s ease, background 0.25s ease;
        }
        .home-footer-contact-item:hover .home-footer-contact-icon {
          background: rgba(217, 154, 72, 0.14);
        }
        .home-footer-contact-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .home-footer-contact-copy small {
          color: #A47A5F;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .home-footer-contact-copy strong {
          color: #FFF2E3;
          font-size: 14.5px;
          font-weight: 600;
          line-height: 1.45;
          overflow-wrap: anywhere;
          transition: color 0.2s ease;
        }
        a.home-footer-contact-item .home-footer-contact-copy strong {
          overflow-wrap: normal;
          white-space: nowrap;
        }
        .home-footer-bottom {
          max-width: 1760px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0 auto;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .home-footer-bottom > p {
          margin: 0;
          color: #A67C64;
          font-size: 12px;
        }
        .home-footer-policy-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 18px;
        }
        .home-footer-policy-links button {
          position: relative;
          padding: 0;
          border: 0;
          background: transparent;
          color: #A67C64;
          cursor: pointer;
          font-family: var(--sans);
          font-size: 12px;
          transition: color 0.2s ease;
        }
        .home-footer-policy-links button::after {
          content: '';
          position: absolute;
          right: 0;
          bottom: -5px;
          left: 0;
          height: 1px;
          background: #D99A48;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.25s ease;
        }
        .home-footer-policy-links button:hover,
        .home-footer-policy-links button:focus-visible {
          color: #D99A48;
        }
        .home-footer-policy-links button:hover::after,
        .home-footer-policy-links button:focus-visible::after {
          transform: scaleX(1);
          transform-origin: left;
        }
        .home-policy-backdrop {
          position: fixed;
          inset: 0;
          z-index: 950;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(30, 18, 10, 0.66);
          animation: footerModalFade 0.18s ease-out;
        }
        .home-policy-dialog {
          width: min(560px, 100%);
          max-height: min(680px, calc(100vh - 48px));
          overflow: auto;
          border: 1px solid rgba(78, 52, 46, 0.14);
          border-radius: 16px;
          background: #FAF7F2;
          box-shadow: 0 24px 80px rgba(30, 18, 10, 0.35);
          animation: footerModalRise 0.24s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .home-policy-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 24px 26px 20px;
          border-bottom: 1px solid rgba(78, 52, 46, 0.1);
        }
        .home-policy-header span {
          display: block;
          margin-bottom: 6px;
          color: #C78A3B;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .home-policy-header h2 {
          margin: 0;
          color: #2C1A0E;
          font-family: var(--heading);
          font-size: 24px;
          line-height: 1.25;
        }
        .home-policy-header > button {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: inline-grid;
          place-items: center;
          border: 1px solid rgba(78, 52, 46, 0.14);
          border-radius: 10px;
          background: #FFF;
          color: #5A3E36;
          cursor: pointer;
        }
        .home-policy-content { padding: 22px 26px 8px; }
        .home-policy-content p {
          margin: 0 0 14px;
          color: #6F5241;
          font-size: 14px;
          line-height: 1.75;
        }
        .home-policy-actions {
          display: flex;
          justify-content: flex-end;
          padding: 8px 26px 24px;
        }
        .home-policy-actions button {
          padding: 10px 18px;
          border: 0;
          border-radius: 8px;
          background: #4E342E;
          color: #FFF;
          cursor: pointer;
          font-family: var(--sans);
          font-weight: 700;
        }
        @media (max-width: 1200px) {
          .home-footer-contact-heading {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .home-footer-contact-heading span {
            grid-column: 1 / -1;
            text-align: left;
          }
          .home-footer-contact-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .home-footer-contact-item--address {
            grid-column: 1 / -1;
            margin-top: 18px;
            padding: 18px 0 0;
            border-top: 1px solid rgba(199, 138, 59, 0.2);
            border-left: 0 !important;
          }
        }
        @media (max-width: 900px) {
          .home-nav { padding: 0 24px !important; }
          .home-nav-account, .home-nav-desktop-action { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .home-mobile-menu { display: flex; }
        }
        @media (max-width: 1050px) {
          .home-hero-copy { padding: 64px 42px !important; }
          .home-hero-copy h1 { font-size: 44px !important; }
          .home-topic-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .home-journey-section,
          .home-role-panel { grid-template-columns: 1fr; }
          .home-journey-section,
          .home-role-panel { gap: 42px; }
          .home-role-panel::before { display: none; }
          .home-cta-grid { grid-template-columns: 1fr; }
          .home-cta-copy { max-width: 720px; }
          .home-footer-grid { grid-template-columns: 1fr !important; gap: 30px !important; }
          .home-footer-contact { max-width: 820px; justify-self: start; }
        }
        @media (max-width: 768px) {
          section { grid-template-columns: 1fr !important; }
          .home-hero-copy { padding: 56px 24px !important; }
          .home-hero-copy h1 { font-size: clamp(38px, 11vw, 48px) !important; }
          .home-hero-visual { min-height: 330px; }
          .home-hero-search { max-width: none !important; }
          .home-books-section,
          .home-search-results-section { padding: 56px 24px 62px !important; }
          .home-books-heading {
            align-items: flex-start !important;
            flex-direction: column;
            gap: 18px;
          }
          .home-book-filters {
            width: 100%;
            border-radius: 18px;
          }
          .home-books-section::before,
          .home-topic-section::before,
          .home-role-section::before,
          .home-cta-section::before {
            right: 24px;
            left: 24px;
          }
          .home-nav { padding: 0 18px !important; }
          .home-nav > div:first-child span { font-size: 17px !important; }
          .home-footer-shell { padding: 40px 24px 24px !important; }
          .home-footer-grid { grid-template-columns: 1fr !important; gap: 30px !important; margin-bottom: 32px !important; }
          .home-footer-contact-list { grid-template-columns: 1fr; }
          .home-footer-contact-item,
          .home-footer-contact-item:first-child,
          .home-footer-contact-item--address {
            grid-column: auto;
            margin: 0;
            padding: 16px 0;
            border-left: 0 !important;
            border-top: 1px solid rgba(199, 138, 59, 0.18);
          }
          .home-footer-contact-item:first-child {
            padding-top: 0;
            border-top: 0;
          }
          .home-topic-section,
          .home-journey-section,
          .home-role-section,
          .home-cta-section {
            padding: 58px 24px;
          }
          .home-section-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 14px;
          }
          .home-topic-grid,
          .home-role-actions { grid-template-columns: 1fr; }
          .home-topic-card { min-height: 190px; }
          .home-role-panel {
            padding: 30px 22px;
            border-radius: 17px;
          }
          .home-cta-copy {
            padding: 18px 0 14px 18px;
          }
          .home-cta-copy h2 {
            font-size: clamp(34px, 10vw, 44px);
          }
          .home-cta-actions {
            align-items: flex-start;
            flex-direction: column;
          }
          .home-cta-section .home-benefit-card:nth-child(even),
          .home-cta-section .home-benefit-card:nth-child(even):hover {
            transform: none;
          }
          .home-journey-step {
            grid-template-columns: 52px 1fr;
            gap: 16px;
          }
          .home-journey-steps::before { left: 25px; }
          .home-journey-step > span {
            width: 50px;
            height: 50px;
          }
          .home-cta-grid, .home-benefit-grid { grid-template-columns: 1fr !important; }
          .home-footer-bottom { align-items: flex-start !important; flex-direction: column !important; gap: 14px !important; }
          .home-footer-bottom > div { flex-wrap: wrap; }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-footer::before,
          .home-footer::after,
          .home-role-ambient,
          .home-cta-section::after,
          .home-hero-copy,
          .home-hero-visual,
          .home-hero-visual img,
          .home-hero-search-button::after,
          .home-book-card img,
          .home-footer-grid,
          .home-footer-bottom,
          .home-footer-contact-item,
          .home-benefit-card,
          .home-reveal,
          .home-topic-card,
          .home-journey-step > span,
          .home-role-actions button,
          .home-footer-brand-mark svg,
          .home-footer-policy-links button::after,
          .home-policy-backdrop,
          .home-policy-dialog {
            animation: none !important;
            transition: none !important;
          }
          .home-footer::after { transform: scaleX(1); }
          .home-footer-grid,
          .home-footer-bottom,
          .home-footer-contact-item,
          .home-reveal {
            opacity: 1;
            transform: none !important;
          }
        }
        * { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default HomePage;
