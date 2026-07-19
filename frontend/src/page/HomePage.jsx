import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Search, BookOpen, ArrowRight, Menu, X, Calendar, User, Tag, ChevronLeft } from 'lucide-react';
import { publicBrowseApi } from '../api/libraryFeatureApi';
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
  Programming: 'Code',
  Database: 'DB',
  AI: 'AI',
  Novel: 'Novel',
};

const getCategoryLabel = (category) => CATEGORY_LABELS[category] || category || 'Chưa phân loại';
const getCategoryIcon = (category) => CATEGORY_ICONS[category] || 'Book';

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

// -- Book Information Panel (sidebar-style) --
const BookInfoPanel = ({ book, action, detailLoading, onClose, onViewDetails, onAction }) => (
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
        <img src={book.coverUrl || BOOK_COVER_FALLBACK} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* Badge */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{
          background: book.availabilityStatus === 'AVAILABLE' ? '#E8F5E9' : '#FFEBEE',
          color: book.availabilityStatus === 'AVAILABLE' ? '#388e3c' : '#c62828',
          padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
        }}>
          {book.availabilityStatus === 'AVAILABLE' ? 'Còn sách' : 'Không khả dụng'}
        </span>
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
        { icon: Tag, label: 'ISBN', value: book.isbn || 'Chưa cập nhật' },
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
        {action.label}
      </button>
    </div>
  </div>
);

// -- Modal quyền lợi thành viên --
const MembershipModal = ({ onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 400,
    background: 'rgba(30,18,10,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  }} onClick={onClose}>
    <div
      style={{
        background: '#FAF7F2', borderRadius: 16, maxWidth: 720, width: '100%',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(30,18,10,0.35)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ background: '#4E342E', padding: '22px 32px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, color: '#C78A3B', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>Gói thành viên</p>
          <span style={{ fontFamily: 'var(--heading)', fontSize: 20, fontWeight: 700, color: '#FAF7F2' }}>
            Quyền lợi dành cho thành viên
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#C4A882', borderRadius: 8, padding: 8 }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '32px 32px 36px' }}>
        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 36 }}>
          {[
            {
              name: 'Cơ bản',
              price: 'Miễn phí',
              desc: 'Phù hợp với người đọc cơ bản',
              color: '#8B6B4A',
              features: ['Mượn tối đa 2 sách/tháng', 'Truy cập danh mục sách cơ bản', 'Xem lịch sử đọc/mượn', 'Nhận thông báo qua email'],
            },
            {
              name: 'Cao cấp',
              price: '99.000 VND/tháng',
              desc: 'Dành cho người yêu sách thường xuyên',
              color: '#C78A3B',
              highlight: true,
              features: ['Mượn sách không giới hạn', 'Ưu tiên sách mới', 'Danh sách đọc được cá nhân hóa', 'Sự kiện dành riêng cho thành viên', 'Sách điện tử và sách nói', 'Ưu tiên đặt trước sách'],
            },
          ].map(plan => (
            <div key={plan.name} style={{
              borderRadius: 12, padding: '28px 24px',
              border: plan.highlight ? '2px solid #C78A3B' : '1.5px solid rgba(78,52,46,0.15)',
              background: plan.highlight ? '#FFF8EE' : '#FFF',
              position: 'relative',
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#C78A3B', color: '#FFF', fontSize: 11, fontWeight: 700,
                  padding: '3px 14px', borderRadius: 100, letterSpacing: '0.06em', whiteSpace: 'nowrap',
                }}>PHỔ BIẾN NHẤT</div>
              )}
              <p style={{ fontSize: 11, color: plan.color, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>{plan.name}</p>
              <div style={{ fontFamily: 'var(--heading)', fontSize: 28, fontWeight: 700, color: '#2C1A0E', margin: '0 0 4px' }}>{plan.price}</div>
              <p style={{ fontSize: 13, color: '#7A5C44', margin: '0 0 20px' }}>{plan.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#3A2416' }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: plan.highlight ? '#C78A3B' : '#EDE0CE', color: plan.highlight ? '#FFF' : '#8B6B4A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, marginTop: 1, fontWeight: 700 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button style={{
                width: '100%', padding: '11px', borderRadius: 8, border: 'none',
                background: plan.highlight ? '#C78A3B' : '#4E342E',
                color: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--sans)', transition: 'background 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#4E342E')}
                onMouseLeave={e => (e.currentTarget.style.background = plan.highlight ? '#C78A3B' : '#4E342E')}
              >
                {plan.price === 'Miễn phí' ? 'Bắt đầu miễn phí' : 'Chọn gói cao cấp'}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h3 style={{ fontFamily: 'var(--heading)', fontSize: 18, fontWeight: 700, color: '#2C1A0E', margin: '0 0 16px' }}>
          Câu hỏi thường gặp
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { q: 'Tôi có thể giữ sách trong bao lâu?', a: 'Thời hạn mượn tiêu chuẩn là 14 ngày. Thành viên cao cấp có thể gia hạn đến 28 ngày.' },
            { q: 'Tôi có thể hủy gói cao cấp không?', a: 'Có. Bạn có thể hủy bất cứ lúc nào. Quyền lợi vẫn có hiệu lực đến hết chu kỳ thanh toán.' },
            { q: 'Có bao gồm sách điện tử không?', a: 'Sách điện tử và sách nói chỉ dành cho thành viên cao cấp.' },
          ].map(item => (
            <div key={item.q} style={{ background: '#FFF', borderRadius: 10, padding: '16px 20px', border: '1px solid rgba(78,52,46,0.09)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', margin: '0 0 6px' }}>{item.q}</p>
              <p style={{ fontSize: 13, color: '#7A5C44', margin: 0, lineHeight: 1.65 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// -- Modal chi tiết sách --
const BookDetailsModal = ({ book, action, onClose, onBack, onAction }) => (
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
            <img src={book.coverUrl || BOOK_COVER_FALLBACK} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {book.availabilityStatus !== 'AVAILABLE' && (
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
              {action.label}
            </button>
          </div>
        </div>

        {/* Right */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{
              background: book.availabilityStatus === 'AVAILABLE' ? '#E8F5E9' : '#FFEBEE',
              color: book.availabilityStatus === 'AVAILABLE' ? '#388e3c' : '#c62828',
              padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
            }}>
              {book.availabilityStatus === 'AVAILABLE' ? 'Còn sách' : 'Không khả dụng'}
            </span>
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
              { icon: Tag, label: 'ISBN', value: book.isbn || 'Chưa cập nhật' },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showMembership, setShowMembership] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
  const roleLabel = getRoleLabel(primaryRole);
  const showMemberAccountActions = roleLabel === 'Thành viên';
  const showAdminConsoleAction = roleLabel === 'Quản trị viên';
  const showLibrarianConsoleAction = roleLabel === 'Thủ thư';
  const selectedBookAction = selectedBook
    ? getHomeBookAction({ book: selectedBook, isLoggedIn, roles: authUser?.roles || [] })
    : null;
  const avatarUrl = headerProfile?.avatarUrl || '';
  const initials = getHomeInitials(headerProfile?.fullName, authUser?.email);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const goToMembership = () => {
    navigate(isLoggedIn ? '/membership' : '/login');
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
      showToast('Vui lòng nhập từ khóa tìm kiếm.');
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

      {/* -- NAV -- */}
      <nav style={{
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

        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {[
            { label: 'Danh mục sách', id: 'section-books' },
            { label: 'Thành viên', id: 'section-cta' },
            { label: 'Giới thiệu', id: 'section-footer' },
            { label: 'Liên hệ', id: 'section-footer' },
          ].filter((item) => !isLoggedIn || item.id !== 'section-cta').map(item => (
            <button key={item.label} onClick={() => scrollTo(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A3E36', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s', fontFamily: 'var(--sans)', padding: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C78A3B')}
              onMouseLeave={e => (e.currentTarget.style.color = '#5A3E36')}
            >{item.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isLoggedIn ? (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
            <>
              <button onClick={goToLogin} style={{
                padding: '7px 18px', borderRadius: 6, border: '1.5px solid #8B6B4A',
                background: 'transparent', color: '#8B6B4A', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#8B6B4A'; e.currentTarget.style.color = '#FAF7F2'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B6B4A'; }}
              >Đăng nhập</button>
              <button onClick={goToMembership} style={{
                padding: '7px 18px', borderRadius: 6, border: 'none',
                background: '#C78A3B', color: '#FFF', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#4E342E')}
                onMouseLeave={e => (e.currentTarget.style.background = '#C78A3B')}
              >Đăng ký</button>
            </>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#4E342E' }}
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* -- HERO -- */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 520 }}>
        <div style={{ padding: '72px 64px 72px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

          <div style={{
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
              placeholder="Tìm theo tên sách, tác giả hoặc ISBN..."
              style={{
                flex: 1, padding: '13px 0', border: 'none', outline: 'none',
                fontSize: 14, color: '#2C1A0E', background: 'transparent', fontFamily: 'var(--sans)',
              }}
            />
            <button onClick={handleSearch} style={{
              padding: '0 22px', background: '#C78A3B', border: 'none', color: '#FFF',
              cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4E342E')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C78A3B')}
            >Tìm kiếm</button>
          </div>
        </div>

        <div style={{ position: 'relative', background: '#2C1A0E', overflow: 'hidden' }}>
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
        <section style={{ padding: '48px 80px', background: '#FFF', borderBottom: '2px solid #EDE0CE' }}>
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
                <div key={book.bookId} style={{
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
                    <img src={book.coverUrl || BOOK_COVER_FALLBACK} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{
                      position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 4,
                      background: book.availabilityStatus === 'AVAILABLE' ? 'rgba(56,142,60,0.88)' : 'rgba(198,40,40,0.88)',
                      color: '#FFF', fontSize: 10, fontWeight: 700,
                    }}>
                      {book.availabilityStatus === 'AVAILABLE' ? 'CÒN SÁCH' : 'KHÔNG KHẢ DỤNG'}
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <p style={{ fontSize: 10, color: '#C78A3B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px', minHeight: 13, ...textClamp(1) }}>{getCategoryLabel(book.categoryName || 'Chưa phân loại')}</p>
                    <h3 style={{ fontFamily: 'var(--heading)', fontSize: 14, fontWeight: 600, color: '#2C1A0E', margin: '0 0 3px', lineHeight: 1.3, minHeight: 36, ...textClamp(2) }}>{book.title}</h3>
                    <p style={{ fontSize: 12, color: '#7A5C44', margin: '0 0 8px', minHeight: 16, ...textClamp(1) }}>{book.authorName || 'Không rõ tác giả'}</p>
                    <button onClick={e => { e.stopPropagation(); handleBookAction(book); }}
                      style={{ marginTop: 'auto', width: '100%', padding: '7px 0', borderRadius: 6, border: '1.5px solid #C78A3B', background: book.availabilityStatus === 'AVAILABLE' ? '#C78A3B' : 'transparent', color: book.availabilityStatus === 'AVAILABLE' ? '#FFF' : '#8B6B4A', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--sans)', transition: 'all 0.2s' }}
                    >{getHomeBookAction({ book, isLoggedIn, roles: authUser?.roles || [] }).label}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* -- Sách nổi bật -- */}
      <section id="section-books" style={{ padding: '64px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
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
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {filterTabs.map(tab => (
            <button key={tab} onClick={() => { setActiveCategory(tab); setShowAll(false); }} style={{
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 22, alignItems: 'stretch' }}>
          {filtered.map(book => (
            <div key={book.bookId}
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
                <img src={book.coverUrl || BOOK_COVER_FALLBACK} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  padding: '3px 8px', borderRadius: 4,
                  background: book.availabilityStatus === 'AVAILABLE' ? 'rgba(56,142,60,0.88)' : 'rgba(198,40,40,0.88)',
                  color: '#FFF', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                }}>
                  {book.availabilityStatus === 'AVAILABLE' ? 'CÒN SÁCH' : 'KHÔNG KHẢ DỤNG'}
                </div>
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

      {/* -- CTA -- */}
      {!isLoggedIn && <section id="section-cta" style={{ background: '#EDE0CE', padding: '72px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <p style={{ fontSize: 11, color: '#C78A3B', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>
              Trở thành thành viên
            </p>
            <h2 style={{
              fontFamily: 'var(--heading)', fontSize: 42, fontWeight: 700,
              color: '#2C1A0E', margin: '0 0 18px', lineHeight: 1.18,
            }}>
              Mở Khóa Trọn Vẹn<br />
              Trải Nghiệm <em style={{ color: '#C78A3B' }}>Thư Viện</em>
            </h2>
            <p style={{ fontSize: 15, color: '#7A5C44', lineHeight: 1.75, margin: '0 0 36px', maxWidth: 400 }}>
              Tham gia cùng cộng đồng độc giả để mượn, khám phá và kết nối với những tác phẩm giá trị trong cùng một hệ thống.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={goToRegister} style={{
                padding: '13px 28px', borderRadius: 8, border: 'none',
                background: '#4E342E', color: '#FAF7F2', cursor: 'pointer',
                fontWeight: 700, fontSize: 14, transition: 'background 0.2s',
                fontFamily: 'var(--sans)',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#C78A3B')}
                onMouseLeave={e => (e.currentTarget.style.background = '#4E342E')}
              >
                Tham gia miễn phí - Đăng ký ngay
              </button>
            </div>
          </div>

          {/* Right - benefit cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: '01', title: 'Mượn sách linh hoạt', desc: 'Mượn tối đa 5 cuốn cùng lúc theo quy định thư viện.' },
              { icon: '02', title: 'Thông báo sách mới', desc: 'Nhận thông báo sớm khi có đầu sách mới.' },
              { icon: '03', title: 'Danh sách đọc', desc: 'Tạo và quản lý bộ sưu tập sách cá nhân.' },
              { icon: '04', title: 'Sự kiện riêng', desc: 'Tham gia các buổi giao lưu tác giả và câu lạc bộ đọc sách dành cho thành viên.' },
            ].map(item => (
              <div key={item.title} style={{
                background: '#FAF7F2', borderRadius: 12, padding: '22px 20px',
                border: '1px solid rgba(78,52,46,0.1)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(78,52,46,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: 24, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontFamily: 'var(--heading)', fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 6 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: '#7A5C44', lineHeight: 1.65 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* -- FOOTER -- */}
      <footer id="section-footer" style={{ background: '#1E120A' }}>
        <div style={{ padding: '52px 80px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <BookOpen size={20} color="#C78A3B" />
                <span style={{ fontFamily: 'var(--heading)', fontSize: 19, fontWeight: 700, color: '#FAF7F2' }}>Quản Lý Thư Viện</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260, color: '#7A6050', margin: 0 }}>
                Hệ thống quản lý thư viện hiện đại, kết nối độc giả với những đầu sách giá trị.
              </p>
            </div>
            {[
              { title: 'Thư viện', links: [
                { label: 'Duyệt danh mục', action: () => scrollTo('section-books') },
                { label: 'Sách mới', action: () => scrollTo('section-books') },
                { label: 'Sách phổ biến', action: () => scrollTo('section-books') },
                { label: 'Bộ sưu tập số', action: () => showToast('Bộ sưu tập số sẽ sớm ra mắt!') },
              ]},
              { title: 'Tài khoản', links: [
                { label: 'Đăng nhập', action: () => {} },
                { label: 'Đăng ký', action: () => {} },
                { label: 'Sách đang mượn', action: () => navigate(isLoggedIn ? '/borrowing/history' : '/login') },
                { label: 'Lịch sử đọc', action: () => navigate(isLoggedIn ? '/borrowing/history' : '/login') },
              ]},
              { title: 'Hỗ trợ', links: [
                { label: 'Trung tâm trợ giúp', action: () => showToast('Trung tâm trợ giúp sẽ sớm ra mắt!') },
                { label: 'Liên hệ', action: () => showToast('Vui lòng gửi email đến library@example.com') },
                { label: 'Quy định thư viện', action: () => showToast('Quy định thư viện có tại quầy lễ tân.') },
                { label: 'Khả năng truy cập', action: () => showToast('Tùy chọn hỗ trợ truy cập có trong phần cài đặt.') },
              ]},
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontFamily: 'var(--heading)', color: '#FAF7F2', margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {col.links.map(link => (
                    <li key={link.label}>
                      <button onClick={link.action} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A6050', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s', fontFamily: 'var(--sans)', padding: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#C78A3B')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#7A6050')}
                      >{link.label}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 12, color: '#4A3428', margin: 0 }}>© 2026 Quản Lý Thư Viện. Mọi quyền được bảo lưu.</p>
            <div style={{ display: 'flex', gap: 18 }}>
              {['Quyền riêng tư', 'Điều khoản', 'Cookie'].map(item => (
                <a key={item} href="#" style={{ fontSize: 12, color: '#4A3428', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#C78A3B')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4A3428')}
                >{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* -- MEMBERSHIP MODAL -- */}
      {showMembership && <MembershipModal onClose={() => setShowMembership(false)} />}

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
        @media (max-width: 900px) {
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 768px) {
          section { grid-template-columns: 1fr !important; }
          footer > div:first-child { grid-template-columns: 1fr 1fr !important; }
        }
        * { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default HomePage;
