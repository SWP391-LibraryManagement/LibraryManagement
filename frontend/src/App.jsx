import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './page/LoginPage';
import RegisterPage from './page/RegisterPage';
import ForgotPasswordPage from './page/ForgotPasswordPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App
