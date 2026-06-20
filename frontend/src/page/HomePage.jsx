import { useNavigate } from 'react-router-dom';
import React, { useEffect, useMemo, useState } from 'react';
import { Search, BookOpen, Star, ArrowRight, Menu, X, Calendar, User, Tag, Hash, Clock, ChevronLeft } from 'lucide-react';
import {
  addBorrowRecord,
  getMemberUnpaidFineSummary,
} from '../utils/libraryWorkflow';

const HERO_IMG = 'https://images.unsplash.com/photo-1514894780887-121968d00567?w=1400&h=800&fit=crop&auto=format';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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


const StarRating = ({ rating, size = 12 }) => {
  const score = Number(rating) || 0;

  return (
    <div
      aria-label={`Đánh giá ${score.toFixed(1)} trên 5`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: size + 8 }}
    >
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', lineHeight: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#C78A3B' }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={size}
              strokeWidth={2.2}
              style={{ flexShrink: 0, fill: 'transparent' }}
            />
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${Math.min(Math.max(score, 0), 5) * 20}%`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            color: '#C78A3B',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={size}
            strokeWidth={2.2}
            style={{
              flexShrink: 0,
              fill: '#C78A3B',
            }}
          />
        ))}
        </div>
      </div>
      <span
        style={{
          minWidth: 28,
          padding: '2px 6px',
          borderRadius: 5,
          background: '#F5EFE6',
          color: '#6F4D2D',
          fontSize: Math.max(size - 2, 10),
          fontWeight: 700,
          lineHeight: 1.2,
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
};

// -- Trang đăng ký mượn sách --
const REVIEW_NAMES = ['Minh Anh', 'Bao Long', 'Thao Vy', 'Gia Han', 'Quoc Huy'];
const REVIEW_COMMENTS = [
  'Noi dung de theo doi, phu hop de doc va tra cuu.',
  'Sach co nhieu y hay, minh se gioi thieu cho ban be.',
  'Ban in sach ro, thong tin huu ich cho viec hoc tap.',
  'Tac gia trinh bay mach lac, diem tru nho la mot vai phan hoi dai.',
  'Trai nghiem doc tot, rat dang muon lai lan sau.',
];

function getBookReviews(book) {
  const baseScore = Number(book?.rating) || 4;
  const seed = Number(book?.id) || 1;

  return [0, 1, 2].map((index) => {
    const score = Math.max(3.5, Math.min(5, baseScore + ((seed + index) % 3 - 1) * 0.2));
    return {
      id: `${book?.id || 'book'}-${index}`,
      name: REVIEW_NAMES[(seed + index) % REVIEW_NAMES.length],
      rating: Number(score.toFixed(1)),
      comment: REVIEW_COMMENTS[(seed + index) % REVIEW_COMMENTS.length],
    };
  });
}

const ReviewModal = ({ book, onClose }) => {
  if (!book) return null;

  const reviews = getBookReviews(book);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 850, background: 'rgba(44,26,14,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 520, background: '#FFF', borderRadius: 14, boxShadow: '0 24px 80px rgba(44,26,14,0.3)', overflow: 'hidden' }} onClick={event => event.stopPropagation()}>
        <div style={{ background: '#4E342E', color: '#FAF7F2', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ margin: '0 0 4px', color: '#C78A3B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Danh gia doc gia</p>
            <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 20 }}>{book.title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 0, color: '#C4A882', borderRadius: 8, padding: 8, cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 22, display: 'grid', gap: 14 }}>
          {reviews.map((review) => (
            <div key={review.id} style={{ border: '1px solid rgba(78,52,46,0.12)', borderRadius: 10, padding: 14, background: '#FAF7F2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ color: '#2C1A0E', fontSize: 14 }}>{review.name}</strong>
                <StarRating rating={review.rating} size={12} />
              </div>
              <p style={{ margin: 0, color: '#5A3E36', fontSize: 13, lineHeight: 1.6 }}>{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const textClamp = (lines) => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

const BorrowModal = ({ book, onClose, onConfirm }) => {
  const [step, setStep] = React.useState('book');
  const [duration, setDuration] = React.useState(14);
  const [agreed, setAgreed] = React.useState(false);
  const [pickupDate, setPickupDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [borrowerInfo, setBorrowerInfo] = React.useState({
    name: '',
    memberId: '',
    email: '',
    phone: '',
  });
  const [borrowNote, setBorrowNote] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState({});
  const stepOrder = ['book', 'borrower', 'options'];
  const stepLabels = ['Thông tin sách', 'Thông tin người mượn', 'Tùy chọn mượn'];
  const currentStepIndex = Math.max(stepOrder.indexOf(step), 0);

  const todayValue = useMemo(() => new Date().toISOString().slice(0, 10), []);

const dueDate = useMemo(() => {
  const baseDate = pickupDate || todayValue;
  const due = new Date(`${baseDate}T00:00:00`);
  due.setDate(due.getDate() + duration);
  return due;
}, [pickupDate, duration, todayValue]);

const canConfirm =
  step === 'options' &&
  agreed &&
  pickupDate >= todayValue &&
  borrowNote.trim().length <= 500;

  const validateBorrowerInfo = () => {
    const errors = {};
    const name = borrowerInfo.name.trim();
    const memberId = borrowerInfo.memberId.trim();
    const email = borrowerInfo.email.trim();
    const phone = borrowerInfo.phone.trim();

    if (!name) {
      errors.name = 'Vui lòng nhập họ và tên.';
    } else if (name.length < 2) {
      errors.name = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    if (!memberId) {
      errors.memberId = 'Vui lòng nhập mã thành viên.';
    } else if (!/^USR-\d{4,}$/i.test(memberId)) {
      errors.memberId = 'Mã thành viên cần có dạng USR-1001.';
    }

    if (!email) {
      errors.email = 'Vui lòng nhập email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email không hợp lệ.';
    }

    if (!phone) {
      errors.phone = 'Vui lòng nhập số điện thoại.';
    } else if (!/^(0|\+84)[0-9\s.-]{8,13}$/.test(phone)) {
      errors.phone = 'Số điện thoại không hợp lệ.';
    }

    return errors;
  };

  const validateLoanOptions = () => {
    const errors = {};

    if (!pickupDate) {
      errors.pickupDate = 'Vui lòng chọn ngày nhận sách.';
    } else if (pickupDate < todayValue) {
      errors.pickupDate = 'Ngày nhận sách không được trước hôm nay.';
    }

    if (borrowNote.trim().length > 500) {
      errors.note = 'Ghi chú không được vượt quá 500 ký tự.';
    }

    if (!agreed) {
      errors.agreed = 'Vui lòng đồng ý với quy định mượn sách.';
    }

    return errors;
  };

  const handleConfirm = () => {
    const errors = validateLoanOptions();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const unpaidFineSummary = getMemberUnpaidFineSummary(borrowerInfo.memberId);
    if (unpaidFineSummary.count > 0) {
      setFieldErrors({
        agreed: `Thanh vien ${borrowerInfo.memberId} dang co ${unpaidFineSummary.count} phieu phat chua thanh toan.`,
      });
      return;
    }

    const loanInfo = {
      borrowerInfo,
      pickupDate,
      dueDate: dueDate.toISOString().slice(0, 10),
      duration,
      note: borrowNote.trim(),
    };

    addBorrowRecord({
      memberId: Number(String(borrowerInfo.memberId).replace(/\D/g, '')) || Date.now(),
      memberName: borrowerInfo.name.trim(),
      memberCode: borrowerInfo.memberId.trim().toUpperCase(),
      email: borrowerInfo.email.trim(),
      bookId: book.id,
      bookTitle: book.title,
      barcode: `HOME-${book.id}-${Date.now().toString().slice(-5)}`,
      borrowDate: pickupDate,
      dueDate: loanInfo.dueDate,
      returnDate: '',
      status: 'BORROWED',
      note: loanInfo.note,
    });

    setStep('success');
    setTimeout(() => onConfirm(loanInfo), 3000);
  };

  const goNextStep = () => {
    if (step === 'borrower') {
      const errors = validateBorrowerInfo();

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }

    setFieldErrors({});
    setStep(stepOrder[Math.min(currentStepIndex + 1, stepOrder.length - 1)]);
  };

  const goPreviousStep = () => {
    setFieldErrors({});
    setStep(stepOrder[Math.max(currentStepIndex - 1, 0)]);
  };

  if (step === 'success') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: 40 }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 40 }}>✓</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#2C1A0E', margin: '0 0 12px' }}>Gửi yêu cầu mượn sách thành công!</h2>
          <p style={{ fontSize: 15, color: '#7A5C44', lineHeight: 1.75, margin: '0 0 28px' }}>
            Yêu cầu mượn <strong style={{ color: '#2C1A0E' }}>"{book.title}"</strong> đã được ghi nhận. Vui lòng nhận sách tại quầy thư viện trước ngày <strong style={{ color: '#C78A3B' }}>{new Date(pickupDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
          </p>
          <div style={{ background: '#FFF', borderRadius: 12, padding: '20px 24px', border: '1px solid rgba(78,52,46,0.1)', marginBottom: 28, textAlign: 'left' }}>
            {[
              { label: 'Sách', value: book.title },
              { label: 'Thời hạn mượn', value: `${duration} ngày` },
              { label: 'Ngày nhận sách', value: new Date(pickupDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'Ngày trả sách', value: dueDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(78,52,46,0.07)' }}>
                <span style={{ fontSize: 13, color: '#A08060' }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>{r.value}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#A08060' }}>Đang quay lại danh mục sách...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#FAF7F2', overflowY: 'auto', fontFamily: 'Lato, sans-serif' }}>
      {/* Top bar */}
      <div style={{ background: '#4E342E', padding: '0 48px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={20} color="#C78A3B" />
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#FAF7F2' }}>Đăng ký mượn sách</span>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#C4A882', borderRadius: 8, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, fontFamily: 'Lato, sans-serif' }}>
          <X size={15} /> Hủy
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 60px' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 36 }}>
          {stepLabels.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: i <= currentStepIndex ? '#C78A3B' : '#EDE0CE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: i <= currentStepIndex ? '#FFF' : '#8B6B4A' }}>{i + 1}</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: i === currentStepIndex ? '#4E342E' : '#A08060' }}>{s}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1, background: i < currentStepIndex ? '#C78A3B' : 'rgba(78,52,46,0.15)', maxWidth: 60 }} />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>
          {/* Left - form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Section 1: Book */}
            {step === 'book' && (
            <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid rgba(78,52,46,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(78,52,46,0.08)', background: '#F5EFE6' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#C78A3B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Bước 1 - Thông tin sách</p>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', gap: 20 }}>
                <img src={book.cover} alt={book.title} style={{ width: 80, height: 112, objectFit: 'cover', borderRadius: 8, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10, background: '#EDE0CE', color: '#7A5C44', padding: '3px 10px', borderRadius: 100, fontWeight: 700 }}>{getCategoryLabel(book.category)}</span>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#2C1A0E', margin: '10px 0 4px', lineHeight: 1.3 }}>{book.title}</h3>
                  <p style={{ fontSize: 14, color: '#7A5C44', margin: '0 0 10px' }}>Tác giả: {book.author}</p>
                  <StarRating rating={book.rating} size={14} />
                  <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                    <span style={{ fontSize: 12, color: '#A08060' }}>{book.pages} trang</span>
                    <span style={{ fontSize: 12, color: '#A08060' }}>{book.year}</span>
                    <span style={{ fontSize: 12, color: '#A08060' }}>ISBN {book.isbn}</span>
                  </div>
                  <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8F5E9', color: '#388e3c', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100 }}>
                    Còn có thể mượn
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Section 2: Borrower info */}
            {step === 'borrower' && (
            <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid rgba(78,52,46,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(78,52,46,0.08)', background: '#F5EFE6' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#C78A3B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Bước 2 - Thông tin người mượn</p>
              </div>
              <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Họ và tên', placeholder: 'Ví dụ: Nguyễn Văn A', key: 'name', type: 'text' },
                  { label: 'Mã thành viên', placeholder: 'Ví dụ: USR-1001', key: 'memberId', type: 'text' },
                  { label: 'Địa chỉ email', placeholder: 'ban@email.com', key: 'email', type: 'email' },
                  { label: 'Số điện thoại', placeholder: '+84 xxx xxx xxx', key: 'phone', type: 'tel' },
                ].map(f => (
                  <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4E342E', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={borrowerInfo[f.key]}
                      placeholder={f.placeholder}
                      onChange={e => {
                        setBorrowerInfo(current => ({ ...current, [f.key]: e.target.value }));
                        setFieldErrors(current => ({ ...current, [f.key]: undefined }));
                      }}
                      style={{ padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${fieldErrors[f.key] ? '#C62828' : 'rgba(78,52,46,0.18)'}`, fontSize: 13, color: '#2C1A0E', background: '#FAF7F2', fontFamily: 'Lato, sans-serif', outline: 'none' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#C78A3B')}
                      onBlur={e => (e.currentTarget.style.borderColor = fieldErrors[f.key] ? '#C62828' : 'rgba(78,52,46,0.18)')}
                    />
                    {fieldErrors[f.key] && (
                      <span style={{ fontSize: 11, color: '#C62828', lineHeight: 1.4 }}>{fieldErrors[f.key]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Section 3: Loan options */}
            {step === 'options' && (
            <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid rgba(78,52,46,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(78,52,46,0.08)', background: '#F5EFE6' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#C78A3B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Bước 3 - Tùy chọn mượn</p>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#4E342E', margin: '0 0 12px' }}>Thời hạn mượn</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[14, 21, 28].map(d => (
                      <button key={d} onClick={() => setDuration(d)} style={{
                        flex: 1, padding: '14px 0', borderRadius: 10, cursor: 'pointer', border: '2px solid',
                        fontFamily: 'Lato, sans-serif', transition: 'all 0.15s', textAlign: 'center',
                        borderColor: duration === d ? '#C78A3B' : 'rgba(78,52,46,0.15)',
                        background: duration === d ? '#FFF8EE' : '#FAF7F2',
                      }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: duration === d ? '#C78A3B' : '#2C1A0E', fontFamily: 'Playfair Display, serif' }}>{d}</div>
                         <div style={{ fontSize: 11, color: '#A08060', marginTop: 2 }}>ngày</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#4E342E', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Ngày nhận sách mong muốn</label>
                  <input type="date" value={pickupDate} min={todayValue}
                    onChange={e => {
                      setPickupDate(e.target.value);
                      setFieldErrors(current => ({ ...current, pickupDate: undefined }));
                    }}
                    style={{ padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${fieldErrors.pickupDate ? '#C62828' : 'rgba(78,52,46,0.18)'}`, fontSize: 13, color: '#2C1A0E', background: '#FAF7F2', fontFamily: 'Lato, sans-serif', outline: 'none', width: '100%' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C78A3B')}
                    onBlur={e => (e.currentTarget.style.borderColor = fieldErrors.pickupDate ? '#C62828' : 'rgba(78,52,46,0.18)')}
                  />
                  {fieldErrors.pickupDate && (
                    <span style={{ display: 'block', fontSize: 11, color: '#C62828', lineHeight: 1.4, marginTop: 6 }}>{fieldErrors.pickupDate}</span>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#4E342E', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Ghi chú (không bắt buộc)</label>
                  <textarea rows={3} value={borrowNote} maxLength={500} placeholder="Yêu cầu đặc biệt hoặc ghi chú cho thủ thư"
                    onChange={e => {
                      setBorrowNote(e.target.value);
                      setFieldErrors(current => ({ ...current, note: undefined }));
                    }}
                    style={{ padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${fieldErrors.note ? '#C62828' : 'rgba(78,52,46,0.18)'}`, fontSize: 13, color: '#2C1A0E', background: '#FAF7F2', fontFamily: 'Lato, sans-serif', outline: 'none', resize: 'none', width: '100%' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C78A3B')}
                    onBlur={e => (e.currentTarget.style.borderColor = fieldErrors.note ? '#C62828' : 'rgba(78,52,46,0.18)')}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
                    {fieldErrors.note ? (
                      <span style={{ fontSize: 11, color: '#C62828', lineHeight: 1.4 }}>{fieldErrors.note}</span>
                    ) : <span />}
                    <span style={{ fontSize: 11, color: '#A08060' }}>{borrowNote.length}/500</span>
                  </div>
                </div>
              </div>
            </div>

            )}
            {step === 'options' && (
            <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid rgba(78,52,46,0.1)', padding: '20px 24px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <div
                  onClick={() => {
                    setAgreed(v => !v);
                    setFieldErrors(current => ({ ...current, agreed: undefined }));
                  }}
                  style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${fieldErrors.agreed ? '#C62828' : agreed ? '#C78A3B' : 'rgba(78,52,46,0.25)'}`, background: agreed ? '#C78A3B' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  {agreed && <span style={{ color: '#FFF', fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: '#5A3E36', lineHeight: 1.65 }}>
                  Tôi đồng ý với <span style={{ color: '#C78A3B', fontWeight: 600 }}>quy định mượn sách của thư viện</span>. Tôi sẽ trả sách đúng hạn và chịu trách nhiệm nếu sách bị hư hỏng hoặc thất lạc.
                </span>
              </label>
              {fieldErrors.agreed && (
                <p style={{ fontSize: 11, color: '#C62828', margin: '10px 0 0 32px', lineHeight: 1.4 }}>{fieldErrors.agreed}</p>
              )}
            </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
              {step !== 'book' && (
                <button onClick={goPreviousStep} style={{ minWidth: 118, padding: '11px 18px', borderRadius: 8, border: '1.5px solid rgba(78,52,46,0.18)', background: 'transparent', color: '#7A5C44', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Lato, sans-serif', textAlign: 'center' }}>
                  {'Quay l\u1ea1i'}
                </button>
              )}
              {step !== 'options' && (
                <button onClick={goNextStep} style={{ minWidth: 118, padding: '12px 24px', borderRadius: 8, border: 'none', background: '#C78A3B', color: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Lato, sans-serif', textAlign: 'center' }}>
                  {'Ti\u1ebfp t\u1ee5c'}
                </button>
              )}
            </div>
          </div>

          {/* Right - summary */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid rgba(78,52,46,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', background: '#4E342E' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#C78A3B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Tóm tắt mượn sách</p>
                <p style={{ fontSize: 13, color: '#C4A882', margin: 0 }}>Kiểm tra trước khi xác nhận</p>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(78,52,46,0.08)' }}>
                  <img src={book.cover} alt={book.title} style={{ width: 52, height: 72, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, color: '#2C1A0E', margin: '0 0 3px', lineHeight: 1.3 }}>{book.title}</p>
                    <p style={{ fontSize: 12, color: '#7A5C44', margin: 0 }}>Tác giả: {book.author}</p>
                  </div>
                </div>

                {[
                  { label: 'Thời hạn mượn', value: `${duration} ngày` },
                  { label: 'Ngày nhận sách', value: pickupDate ? new Date(pickupDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' },
                  { label: 'Ngày trả sách', value: dueDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                  { label: 'Phí trễ hạn', value: '5.000 VND / ngày' },
                  { label: 'Phí mượn', value: 'Miễn phí' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(78,52,46,0.06)' }}>
                    <span style={{ fontSize: 12, color: '#A08060' }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: r.label === 'Phí mượn' ? '#2E7D32' : '#2C1A0E' }}>{r.value}</span>
                  </div>
                ))}

                <div style={{ background: '#FFF8EE', borderRadius: 8, padding: '10px 14px', margin: '14px 0', border: '1px solid rgba(199,138,59,0.2)', display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>i</span>
                  <p style={{ fontSize: 12, color: '#7A5C44', margin: 0, lineHeight: 1.6 }}>
                    Vui lòng mang theo <strong>thẻ thành viên</strong> khi nhận sách tại quầy thư viện.
                  </p>
                </div>

                <button onClick={handleConfirm} disabled={!canConfirm}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                    background: canConfirm ? '#C78A3B' : '#EDE0CE',
                    color: canConfirm ? '#FFF' : '#A08060',
                    cursor: canConfirm ? 'pointer' : 'not-allowed',
                    fontSize: 14, fontWeight: 700, fontFamily: 'Lato, sans-serif',
                    transition: 'background 0.2s', marginTop: 4,
                  }}
                  onMouseEnter={e => { if (canConfirm) e.currentTarget.style.background = '#4E342E'; }}
                  onMouseLeave={e => { if (canConfirm) e.currentTarget.style.background = '#C78A3B'; }}
                >
                  Xác nhận yêu cầu mượn
                </button>
                {!canConfirm && (
                  <p style={{ fontSize: 11, color: '#A08060', textAlign: 'center', marginTop: 8 }}>
                    Vui lòng đồng ý với quy định mượn sách để tiếp tục.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -- Book Information Panel (sidebar-style) --
const BookInfoPanel = ({ book, isLoggedIn, onClose, onViewDetails, onBorrow, onSignIn }) => (
  <div style={{
    position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, zIndex: 300,
    background: '#FFF', boxShadow: '-8px 0 40px rgba(78,52,46,0.12)',
    display: 'flex', flexDirection: 'column', overflowY: 'auto',
  }}>
    <div style={{ background: '#4E342E', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ color: '#FAF7F2', fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600 }}>
        Thông tin sách
      </span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4A882' }}>
        <X size={20} />
      </button>
    </div>

    <div style={{ padding: 24 }}>
      {/* Cover */}
      <div style={{ borderRadius: 10, overflow: 'hidden', height: 260, background: '#EDE0CE', marginBottom: 20 }}>
        <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* Badge */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{
          background: book.available ? '#E8F5E9' : '#FFEBEE',
          color: book.available ? '#388e3c' : '#c62828',
          padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
        }}>
          {book.available ? 'Còn sách' : 'Đã mượn'}
        </span>
        <span style={{ background: '#EDE0CE', color: '#7A5C44', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
          {getCategoryLabel(book.category)}
        </span>
      </div>

      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#2C1A0E', margin: '0 0 6px', lineHeight: 1.3 }}>
        {book.title}
      </h2>
      <p style={{ color: '#7A5C44', fontSize: 14, margin: '0 0 12px' }}>Tác giả: {book.author}</p>
      <StarRating rating={book.rating} size={14} />

      <div style={{ height: 1, background: 'rgba(78,52,46,0.1)', margin: '20px 0' }} />

      {/* Info rows */}
      {[
        { icon: Calendar, label: 'Năm xuất bản', value: book.year },
        { icon: Hash, label: 'Số trang', value: book.pages },
        { icon: Tag, label: 'ISBN', value: book.isbn },
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
        {book.description}
      </p>

      <button
        onClick={onViewDetails}
        style={{
          width: '100%', padding: '12px', borderRadius: 8, border: 'none',
          background: '#C78A3B', color: '#FFF', cursor: 'pointer',
          fontSize: 14, fontWeight: 700, transition: 'background 0.2s',
          fontFamily: 'Lato, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#4E342E')}
        onMouseLeave={e => (e.currentTarget.style.background = '#C78A3B')}
      >
        Xem chi tiết đầy đủ <ArrowRight size={16} />
      </button>
      {book.available && (
        isLoggedIn ? (
          <button
            onClick={onBorrow}
            style={{
              width: '100%', padding: '12px', borderRadius: 8, marginTop: 10,
              border: '1.5px solid #8B6B4A', background: 'transparent',
              color: '#8B6B4A', cursor: 'pointer', fontSize: 14, fontWeight: 700,
              transition: 'all 0.2s', fontFamily: 'Lato, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#8B6B4A'; e.currentTarget.style.color = '#FAF7F2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B6B4A'; }}
          >
            Mượn sách này
          </button>
        ) : (
          <button
            onClick={onSignIn}
            style={{
              width: '100%', padding: '12px', borderRadius: 8, marginTop: 10,
              border: '1.5px solid #C78A3B', background: 'transparent',
              color: '#C78A3B', cursor: 'pointer', fontSize: 14, fontWeight: 700,
              transition: 'all 0.2s', fontFamily: 'Lato, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#C78A3B'; e.currentTarget.style.color = '#FFF'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C78A3B'; }}
          >
            Đăng nhập để mượn
          </button>
        )
      )}
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
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#FAF7F2' }}>
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
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#2C1A0E', margin: '0 0 4px' }}>{plan.price}</div>
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
                fontFamily: 'Lato, sans-serif', transition: 'background 0.2s',
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
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E', margin: '0 0 16px' }}>
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
const BookDetailsModal = ({ book, isLoggedIn, onClose, onBack, onBorrow, onSignIn, onReadingList }) => (
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
          <span style={{ color: '#FAF7F2', fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600 }}>
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
            <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {book.available ? (
              isLoggedIn ? (
                <button onClick={onBorrow} style={{
                  padding: '10px', borderRadius: 8, border: 'none', background: '#C78A3B',
                  color: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  fontFamily: 'Lato, sans-serif', transition: 'background 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#4E342E')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#C78A3B')}
                >
                  Mượn ngay
                </button>
              ) : (
                <button onClick={onSignIn} style={{
                  padding: '10px', borderRadius: 8, border: '1.5px solid #C78A3B', background: 'transparent',
                  color: '#C78A3B', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  fontFamily: 'Lato, sans-serif', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#C78A3B'; e.currentTarget.style.color = '#FFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C78A3B'; }}
                >
                  Đăng nhập để mượn
                </button>
              )
            ) : (
              <button style={{
                padding: '10px', borderRadius: 8, border: 'none', background: '#EDE0CE',
                color: '#A08060', cursor: 'not-allowed', fontSize: 13, fontWeight: 700,
                fontFamily: 'Lato, sans-serif',
              }} disabled>
                Hiện đã được mượn
              </button>
            )}
            <button onClick={onReadingList} style={{
              padding: '10px', borderRadius: 8, border: '1.5px solid rgba(78,52,46,0.25)',
              background: 'transparent', color: '#7A5C44', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'Lato, sans-serif', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EDE0CE'; e.currentTarget.style.borderColor = '#8B6B4A'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(78,52,46,0.25)'; }}
            >
              + Thêm vào danh sách đọc
            </button>
          </div>
        </div>

        {/* Right */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{
              background: book.available ? '#E8F5E9' : '#FFEBEE',
              color: book.available ? '#388e3c' : '#c62828',
              padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
            }}>
              {book.available ? 'Còn sách' : 'Đã mượn'}
            </span>
            <span style={{ background: '#EDE0CE', color: '#7A5C44', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
              {getCategoryLabel(book.category)}
            </span>
          </div>

          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#2C1A0E', margin: '0 0 8px', lineHeight: 1.2 }}>
            {book.title}
          </h2>
          <p style={{ color: '#7A5C44', fontSize: 15, margin: '0 0 14px' }}>Tác giả: {book.author}</p>
          <StarRating rating={book.rating} size={16} />

          <div style={{ height: 1, background: 'rgba(78,52,46,0.1)', margin: '22px 0' }} />

          <h4 style={{ color: '#4E342E', fontSize: 14, fontWeight: 700, margin: '0 0 12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Giới thiệu sách
          </h4>
          <p style={{ fontSize: 15, color: '#5A3E36', lineHeight: 1.8, margin: '0 0 24px' }}>
            {book.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: Calendar, label: 'Năm xuất bản', value: book.year },
              { icon: Hash, label: 'Số trang', value: `${book.pages} trang` },
              { icon: Tag, label: 'ISBN', value: book.isbn },
              { icon: Clock, label: 'Thời gian đọc ước tính', value: `${Math.round(book.pages / 50)} giờ` },
              { icon: User, label: 'Tác giả', value: book.author },
              { icon: BookOpen, label: 'Thể loại', value: getCategoryLabel(book.category) },
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
  const [showBorrow, setShowBorrow] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [bookError, setBookError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [showAll, setShowAll] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedReviewBook, setSelectedReviewBook] = useState(null);

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

  const openReviews = (event, book) => {
    event.stopPropagation();
    setSelectedReviewBook(book);
  };


  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoadingBooks(true);
        setBookError('');

        const [booksResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/books`),
          fetch(`${API_BASE_URL}/books/categories`),
        ]);

        const booksResult = await booksResponse.json();
        const categoriesResult = await categoriesResponse.json();

        if (!booksResponse.ok || !booksResult.success) {
          throw new Error(booksResult.message || 'Không thể tải danh sách sách');
        }

        setBooks(booksResult.data || []);

        if (categoriesResponse.ok && categoriesResult.success) {
          setCategories(categoriesResult.data || []);
        }
      } catch (error) {
        console.error('Fetch home data error:', error);
        setBookError(error.message || 'Đã xảy ra lỗi khi tải dữ liệu từ database');
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchHomeData();
  }, []);

  const fallbackCategories = Array.from(new Set(books.map((book) => book.category).filter(Boolean))).map((category, index) => ({
    id: index + 1,
    name: category,
    count: books.filter((book) => book.category === category).length,
    icon: getCategoryIcon(category),
  }));

  const displayCategories = categories.length > 0 ? categories : fallbackCategories;
  const filterTabs = ['Tất cả', ...displayCategories.filter((category) => category.name !== 'Tất cả').map((category) => category.name)];

  const filteredAll = activeCategory === 'Tất cả'
    ? books
    : books.filter((book) => book.category === activeCategory);

  const filtered = showAll ? filteredAll : filteredAll.slice(0, 6);

  const handleSearch = async () => {
    const keyword = searchQuery.trim();

    if (!keyword) {
      setActiveSearch('');
      setSearchResults([]);
      setSearchError('');
      showToast('Vui lòng nhập từ khóa tìm kiếm.');
      return;
    }

    if (keyword.length > 100) {
      setSearchError('Từ khóa tìm kiếm không được vượt quá 100 ký tự.');
      return;
    }

    try {
      setSearchingBooks(true);
      setSearchError('');
      setActiveSearch(keyword);

      const params = new URLSearchParams({ q: keyword });
      const response = await fetch(`${API_BASE_URL}/books?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error?.message || 'Không thể tìm kiếm sách.');
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
    <div style={{ fontFamily: 'Lato, sans-serif', background: '#FAF7F2', minHeight: '100vh', overflowX: 'hidden' }}>
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
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 21, color: '#4E342E' }}>
            Quản Lý Thư Viện
          </span>
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {[
            { label: 'Danh mục sách', id: 'section-books' },
            { label: 'Thành viên', id: 'section-cta' },
            { label: 'Giới thiệu', id: 'section-footer' },
            { label: 'Liên hệ', id: 'section-footer' },
          ].map(item => (
            <button key={item.label} onClick={() => scrollTo(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A3E36', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s', fontFamily: 'Lato, sans-serif', padding: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C78A3B')}
              onMouseLeave={e => (e.currentTarget.style.color = '#5A3E36')}
            >{item.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EDE0CE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>TV</div>
              <span style={{ fontSize: 13, color: '#4E342E', fontWeight: 600 }}>Thành viên</span>
              <button onClick={() => setIsLoggedIn(false)} style={{ padding: '5px 12px', borderRadius: 6, border: '1.5px solid rgba(78,52,46,0.2)', background: 'transparent', color: '#7A5C44', cursor: 'pointer', fontSize: 12, fontFamily: 'Lato, sans-serif' }}>
                Đăng xuất
              </button>
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
              <button onClick={goToRegister} style={{
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
            fontFamily: 'Playfair Display, serif', fontSize: 52, fontWeight: 700,
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
                fontSize: 14, color: '#2C1A0E', background: 'transparent', fontFamily: 'Lato, sans-serif',
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
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#2C1A0E', margin: 0 }}>
                Kết quả cho "{activeSearch}"
                <span style={{ fontSize: 15, fontWeight: 400, color: '#A08060', marginLeft: 12 }}>
                  {searchResults.length} sách được tìm thấy
                </span>
              </h2>
            </div>
            <button onClick={() => { setActiveSearch(''); setSearchQuery(''); setSearchResults([]); setSearchError(''); }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8,
              border: '1.5px solid rgba(78,52,46,0.2)', background: 'transparent', color: '#7A5C44',
              cursor: 'pointer', fontSize: 13, fontFamily: 'Lato, sans-serif',
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
                color: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Lato, sans-serif',
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
              <p style={{ fontSize: 16, color: '#7A5C44', margin: 0, fontFamily: 'Playfair Display, serif', fontWeight: 600 }}>Đang tìm kiếm sách...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>--</div>
              <p style={{ fontSize: 16, color: '#7A5C44', margin: '0 0 6px', fontFamily: 'Playfair Display, serif', fontWeight: 600 }}>Không tìm thấy sách</p>
              <p style={{ fontSize: 13, color: '#A08060', margin: 0 }}>Hãy thử tên sách hoặc tên tác giả khác.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 22, alignItems: 'stretch' }}>
              {searchResults.map(book => (
                <div key={book.id} style={{
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
                    <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{
                      position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 4,
                      background: book.available ? 'rgba(56,142,60,0.88)' : 'rgba(198,40,40,0.88)',
                      color: '#FFF', fontSize: 10, fontWeight: 700,
                    }}>
                      {book.available ? 'CÒN SÁCH' : 'ĐÃ MƯỢN'}
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <p style={{ fontSize: 10, color: '#C78A3B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px', minHeight: 13, ...textClamp(1) }}>{getCategoryLabel(book.category)}</p>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: '#2C1A0E', margin: '0 0 3px', lineHeight: 1.3, minHeight: 36, ...textClamp(2) }}>{book.title}</h3>
                    <p style={{ fontSize: 12, color: '#7A5C44', margin: '0 0 8px', minHeight: 16, ...textClamp(1) }}>{book.author}</p>
                    <button
                      type="button"
                      onClick={(event) => openReviews(event, book)}
                      style={{ background: 'transparent', border: 0, padding: 0, alignSelf: 'flex-start', cursor: 'pointer' }}
                    >
                      <StarRating rating={book.rating} />
                    </button>
                    {isLoggedIn ? (
                      book.available ? (
                        <button onClick={e => { e.stopPropagation(); setSelectedBook(book); setShowBorrow(true); }}
                          style={{ marginTop: 'auto', width: '100%', padding: '7px 0', borderRadius: 6, border: 'none', background: '#C78A3B', color: '#FFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'Lato, sans-serif', transition: 'background 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#4E342E')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#C78A3B')}
                        >Mượn sách này</button>
                      ) : (
                        <button style={{ marginTop: 'auto', width: '100%', padding: '7px 0', borderRadius: 6, border: '1.5px solid rgba(78,52,46,0.2)', background: 'transparent', color: '#A08060', cursor: 'not-allowed', fontSize: 12, fontWeight: 600, fontFamily: 'Lato, sans-serif' }} disabled>
                          Không còn sách
                        </button>
                      )
                    ) : (
                      <button onClick={e => { e.stopPropagation(); goToLogin(); }}
                        style={{ marginTop: 'auto', width: '100%', padding: '7px 0', borderRadius: 6, border: '1.5px solid #C78A3B', background: 'transparent', color: '#C78A3B', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'Lato, sans-serif', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#C78A3B'; e.currentTarget.style.color = '#FFF'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C78A3B'; }}
                      >Đăng nhập để mượn</button>
                    )}
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
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: '#2C1A0E', margin: 0 }}>
              Sách nổi bật
            </h2>
          </div>
          <button onClick={() => { setShowAll(v => !v); setActiveCategory('Tất cả'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C78A3B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'Lato, sans-serif', transition: 'gap 0.2s', padding: 0 }}
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
              fontFamily: 'Lato, sans-serif',
            }}>{getCategoryLabel(tab)}</button>
          ))}
        </div>

        {/* Lưới sách */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 22, alignItems: 'stretch' }}>
          {filtered.map(book => (
            <div key={book.id}
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
                <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  padding: '3px 8px', borderRadius: 4,
                  background: book.available ? 'rgba(56,142,60,0.88)' : 'rgba(198,40,40,0.88)',
                  color: '#FFF', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                }}>
                  {book.available ? 'CÒN SÁCH' : 'ĐÃ MƯỢN'}
                </div>
              </div>
              <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <p style={{ fontSize: 10, color: '#C78A3B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px', minHeight: 13, ...textClamp(1) }}>
                  {getCategoryLabel(book.category)}
                </p>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: '#2C1A0E', margin: '0 0 3px', lineHeight: 1.3, minHeight: 36, ...textClamp(2) }}>
                  {book.title}
                </h3>
                <p style={{ fontSize: 12, color: '#7A5C44', margin: '0 0 8px', minHeight: 16, ...textClamp(1) }}>{book.author}</p>
                <button
                  type="button"
                  onClick={(event) => openReviews(event, book)}
                  style={{ background: 'transparent', border: 0, padding: 0, alignSelf: 'flex-start', cursor: 'pointer' }}
                >
                  <StarRating rating={book.rating} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setSelectedBook(book); setShowDetails(false); }}
                  style={{
                    marginTop: 22, width: '100%', padding: '7px 0', borderRadius: 6, border: '1.5px solid rgba(78,52,46,0.2)',
                    background: 'transparent', color: '#8B6B4A', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    fontFamily: 'Lato, sans-serif', transition: 'all 0.2s',
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
      <section id="section-cta" style={{ background: '#EDE0CE', padding: '72px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <p style={{ fontSize: 11, color: '#C78A3B', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>
              Trở thành thành viên
            </p>
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontSize: 42, fontWeight: 700,
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
                fontFamily: 'Lato, sans-serif',
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
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 6 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: '#7A5C44', lineHeight: 1.65 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- FOOTER -- */}
      <footer id="section-footer" style={{ background: '#1E120A' }}>
        <div style={{ padding: '52px 80px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <BookOpen size={20} color="#C78A3B" />
                <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 19, fontWeight: 700, color: '#FAF7F2' }}>Quản Lý Thư Viện</span>
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
                { label: 'Sách đang mượn', action: () => isLoggedIn ? showToast('Chưa có sách đang mượn.') : setIsLoggedIn(true) },
                { label: 'Lịch sử đọc', action: () => isLoggedIn ? showToast('Chưa có lịch sử đọc.') : setIsLoggedIn(true) },
              ]},
              { title: 'Hỗ trợ', links: [
                { label: 'Trung tâm trợ giúp', action: () => showToast('Trung tâm trợ giúp sẽ sớm ra mắt!') },
                { label: 'Liên hệ', action: () => showToast('Vui lòng gửi email đến library@example.com') },
                { label: 'Quy định thư viện', action: () => showToast('Quy định thư viện có tại quầy lễ tân.') },
                { label: 'Khả năng truy cập', action: () => showToast('Tùy chọn hỗ trợ truy cập có trong phần cài đặt.') },
              ]},
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontFamily: 'Playfair Display, serif', color: '#FAF7F2', margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {col.links.map(link => (
                    <li key={link.label}>
                      <button onClick={link.action} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A6050', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s', fontFamily: 'Lato, sans-serif', padding: 0 }}
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

      {/* -- BOOK INFO PANEL -- */}
      {selectedBook && !showDetails && !showBorrow && (
        <BookInfoPanel
          book={selectedBook}
          isLoggedIn={isLoggedIn}
          onClose={() => setSelectedBook(null)}
          onViewDetails={() => setShowDetails(true)}
          onBorrow={() => setShowBorrow(true)}
          onSignIn={goToLogin}
        />
      )}

      {/* -- BORROW MODAL -- */}
      {selectedBook && showBorrow && (
        <BorrowModal
          book={selectedBook}
          onClose={() => setShowBorrow(false)}
          onConfirm={() => { setShowBorrow(false); setSelectedBook(null); showToast(`Mượn "${selectedBook.title}" thành công!`); }}
        />
      )}

      {/* -- BOOK DETAILS MODAL -- */}
      {selectedBook && showDetails && (
        <BookDetailsModal
          book={selectedBook}
          isLoggedIn={isLoggedIn}
          onClose={() => { setSelectedBook(null); setShowDetails(false); }}
          onBack={() => setShowDetails(false)}
          onBorrow={() => { setShowDetails(false); setShowBorrow(true); }}
          onSignIn={() => { setIsLoggedIn(true); showToast('Đã đăng nhập! Bạn có thể mượn sách ngay bây giờ.'); }}
          onReadingList={() => showToast(`Đã thêm "${selectedBook.title}" vào danh sách đọc!`)}
        />
      )}

      <ReviewModal book={selectedReviewBook} onClose={() => setSelectedReviewBook(null)} />

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
