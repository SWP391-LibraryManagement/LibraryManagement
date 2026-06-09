import { Paper } from '@mui/material';
import RegisterForm from './RegisterForm.jsx';

export default function AuthCard() {
  return (
    <Paper className="register-card" elevation={0}>
      <RegisterForm />
    </Paper>
  );
}
