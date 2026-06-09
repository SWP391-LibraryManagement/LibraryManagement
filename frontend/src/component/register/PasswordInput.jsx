import { useState } from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  error = false,
  helperText = '',
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      fullWidth
      required={required}
      type={showPassword ? 'text' : 'password'}
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      variant="outlined"
      className="form-field"
      error={error}
      helperText={helperText}
      InputProps={{
        endAdornment: (
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
        ),
      }}
    />
  );
}