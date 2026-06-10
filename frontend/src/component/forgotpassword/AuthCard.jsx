import Paper from '@mui/material/Paper';
import '../../styles/forgot-password.css';

const AuthCard = ({ children }) => {
  return (
    <Paper
      elevation={8}
      className="auth-card"
      sx={{
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '24px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        boxShadow: '0 8px 32px rgba(139, 107, 74, 0.15)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 12px 48px rgba(139, 107, 74, 0.25)',
          transform: 'translateY(-4px)',
        },
      }}
    >
      {children}
    </Paper>
  );
};

export default AuthCard;
