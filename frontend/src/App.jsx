import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ReportRouteGuard from './component/report/ReportRouteGuard';
import BorrowingRouteGuard from './component/borrowing/BorrowingRouteGuard';

const LoginPage = lazy(() => import('./page/LoginPage'));
const RegisterPage = lazy(() => import('./page/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./page/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./page/ForgotPasswordPage'));
const HomeRoutePage = lazy(() => import('./page/dashboard/HomeRoutePage'));
const UserManagement = lazy(() => import('./page/UserManagement'));
const FineManagement = lazy(() => import('./page/FineManagement'));
const MemberFinesPage = lazy(() => import('./page/fine/MemberFinesPage'));
const UserProfilePage = lazy(() => import('./page/UserProfilePage'));
const InventoryPage = lazy(() => import('./page/InventoryPage'));
const BookManagementPage = lazy(() => import('./page/BookManagementPage'));
const MembershipPage = lazy(() => import('./page/MembershipPage'));
const HomePage = lazy(() => import('./page/HomePage'));
const ForbiddenPage = lazy(() => import('./page/error/ForbiddenPage'));

// FE07 · Borrowing Management
const BorrowRequestPage = lazy(() => import('./page/borrowing/BorrowRequestPage'));
const BorrowingHistoryPage = lazy(() => import('./page/borrowing/BorrowingHistoryPage'));
const BorrowRequestsAdminPage = lazy(() => import('./page/borrowing/BorrowRequestsAdminPage'));
const ProcessReturnsPage = lazy(() => import('./page/borrowing/ProcessReturnsPage'));
const MemberBorrowingDetailsPage = lazy(() => import('./page/borrowing/MemberBorrowingDetailsPage'));
// FE08 · Reservation Management
const MyReservationsPage = lazy(() => import('./page/reservation/MyReservationsPage'));
const ReservationsLibrarianPage = lazy(() => import('./page/reservation/ReservationsLibrarianPage'));
// FE12 · Reporting & Statistics
const BorrowingReportPage = lazy(() => import('./page/report/BorrowingReportPage'));
const InventoryReportPage = lazy(() => import('./page/report/InventoryReportPage'));
const UserStatisticsPage = lazy(() => import('./page/report/UserStatisticsPage'));

function RouteLoadingFallback() {
  return (
    <div
      className="d-flex min-vh-100 align-items-center justify-content-center gap-3"
      role="status"
      aria-live="polite"
    >
      <span className="spinner-border" aria-hidden="true" />
      <span>Đang tải trang...</span>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route path="/home" element={<HomeRoutePage />} />
      <Route path="/homepage" element={<HomePage />} />

      <Route path="/admin/users" element={<UserManagement />} />
      <Route path="/librarian/fines" element={<FineManagement />} />
      <Route path="/librarian/inventory" element={<InventoryPage />} />
      <Route path="/librarian/books" element={<BookManagementPage />} />

      {/* FE07 · Borrowing Management */}
      <Route path="/borrowing/new" element={<BorrowingRouteGuard audience="member"><BorrowRequestPage /></BorrowingRouteGuard>} />
      <Route path="/borrowing/history" element={<BorrowingRouteGuard audience="member"><BorrowingHistoryPage /></BorrowingRouteGuard>} />
      <Route path="/fines/mine" element={<BorrowingRouteGuard audience="member"><MemberFinesPage /></BorrowingRouteGuard>} />
      <Route path="/librarian/borrow-requests" element={<BorrowingRouteGuard audience="staff"><BorrowRequestsAdminPage /></BorrowingRouteGuard>} />
      <Route path="/librarian/returns" element={<BorrowingRouteGuard audience="staff"><ProcessReturnsPage /></BorrowingRouteGuard>} />
      <Route path="/librarian/members" element={<BorrowingRouteGuard audience="staff"><MemberBorrowingDetailsPage /></BorrowingRouteGuard>} />

      {/* FE08 · Reservation Management */}
      <Route path="/reservations/mine" element={<BorrowingRouteGuard audience="member"><MyReservationsPage /></BorrowingRouteGuard>} />
      <Route path="/librarian/reservations" element={<BorrowingRouteGuard audience="staff"><ReservationsLibrarianPage /></BorrowingRouteGuard>} />

      {/* FE12 · Reporting & Statistics */}
      <Route path="/reports/borrowing" element={<ReportRouteGuard><BorrowingReportPage /></ReportRouteGuard>} />
      <Route path="/reports/inventory" element={<ReportRouteGuard><InventoryReportPage /></ReportRouteGuard>} />
      <Route path="/reports/users" element={<ReportRouteGuard><UserStatisticsPage /></ReportRouteGuard>} />
      <Route path="/profile" element={<UserProfilePage />} />
      <Route path="/membership" element={<MembershipPage />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
