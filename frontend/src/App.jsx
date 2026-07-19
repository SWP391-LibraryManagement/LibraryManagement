import { Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from './page/LoginPage';
import RegisterPage from './page/RegisterPage';
import ForgotPasswordPage from './page/ForgotPasswordPage';
import HomeRoutePage from './page/dashboard/HomeRoutePage';
import UserManagement from './page/UserManagement';
import FineManagement from './page/FineManagement';
import UserProfilePage from './page/UserProfilePage';
import InventoryPage from './page/InventoryPage';
import BookManagementPage from './page/BookManagementPage';
import ForbiddenPage from './page/error/ForbiddenPage';
import ReportRouteGuard from './component/report/ReportRouteGuard';
import BorrowingRouteGuard from './component/borrowing/BorrowingRouteGuard';
import MembershipPage from './page/MembershipPage';
import HomePage from './page/HomePage';

// FE07 · Borrowing Management
import BorrowRequestPage from './page/borrowing/BorrowRequestPage';
import BorrowingHistoryPage from './page/borrowing/BorrowingHistoryPage';
import BorrowRequestsAdminPage from './page/borrowing/BorrowRequestsAdminPage';
import ProcessReturnsPage from './page/borrowing/ProcessReturnsPage';
import MemberBorrowingDetailsPage from './page/borrowing/MemberBorrowingDetailsPage';
// FE08 · Reservation Management
import MyReservationsPage from './page/reservation/MyReservationsPage';
import ReservationsLibrarianPage from './page/reservation/ReservationsLibrarianPage';
// FE12 · Reporting & Statistics
import BorrowingReportPage from './page/report/BorrowingReportPage';
import InventoryReportPage from './page/report/InventoryReportPage';
import UserStatisticsPage from './page/report/UserStatisticsPage';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
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
  );
}

export default App;
