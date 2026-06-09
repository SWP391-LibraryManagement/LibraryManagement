import { useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function FormField({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  icon,
  error = false,
  helperText = '',
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = type === 'password';
  const displayType = isPasswordField
    ? showPassword
      ? 'text'
      : 'password'
    : type;

  return (
    <TextField
      fullWidth
      required={required}
      type={displayType}
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      variant="outlined"
      className="form-field"
      error={error}
      helperText={helperText}
      InputProps={{
        startAdornment: icon ? (
          <InputAdornment position="start">
            {icon}
          </InputAdornment>
        ) : undefined,
        endAdornment: isPasswordField ? (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword(!showPassword)}
              edge="end"
              sx={{ color: '#8B4513' }}
            >
              {showPassword ? (
                <VisibilityOff />
              ) : (
                <Visibility />
              )}
            </IconButton>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
}
