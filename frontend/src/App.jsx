import { Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from './page/LoginPage';
import RegisterPage from './page/RegisterPage';
import ForgotPasswordPage from './page/ForgotPasswordPage';
import HomePage from './page/HomePage';
import UserManagement from './page/UserManagement';
import FineManagement from './page/FineManagement';
import UserProfilePage from './page/UserProfilePage';

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

      <Route path="/home" element={<HomePage />} />

      <Route path="/admin/users" element={<UserManagement />} />
      <Route path="/librarian/fines" element={<FineManagement />} />
      <Route path="/librarian/books" element={<Navigate to="/librarian/fines" replace />} />

      {/* FE07 · Borrowing Management */}
      <Route path="/borrowing/new" element={<BorrowRequestPage />} />
      <Route path="/borrowing/history" element={<BorrowingHistoryPage />} />
      <Route path="/librarian/borrow-requests" element={<BorrowRequestsAdminPage />} />
      <Route path="/librarian/returns" element={<ProcessReturnsPage />} />
      <Route path="/librarian/members" element={<MemberBorrowingDetailsPage />} />

      {/* FE08 · Reservation Management */}
      <Route path="/reservations/mine" element={<MyReservationsPage />} />
      <Route path="/librarian/reservations" element={<ReservationsLibrarianPage />} />

      {/* FE12 · Reporting & Statistics */}
      <Route path="/reports/borrowing" element={<BorrowingReportPage />} />
      <Route path="/reports/inventory" element={<InventoryReportPage />} />
      <Route path="/reports/users" element={<UserStatisticsPage />} />
      <Route path="/profile" element={<UserProfilePage />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
