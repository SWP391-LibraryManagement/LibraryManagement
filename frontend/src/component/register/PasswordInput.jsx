import { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  error = false,
  helperText = '',
  disabled = false,
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
      onChange={(event) => onChange(event.target.value)}
      variant="outlined"
      className="form-field"
      error={error}
      helperText={helperText}
      disabled={disabled}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                edge="end"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
