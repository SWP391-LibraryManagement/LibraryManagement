import { Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from './page/LoginPage';
import RegisterPage from './page/RegisterPage';
import ForgotPasswordPage from './page/ForgotPasswordPage';
import HomePage from './page/HomePage';
import UserManagement from './page/UserManagement';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route path="/home" element={<HomePage />} />
      
      <Route path="/admin/users" element={<UserManagement />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;