import React from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

const FormInput = ({
  label,
  type = 'text',
  placeholder,
  helperText,
  icon: Icon,
  required = false,
  value,
  onChange,
  error = false,
  errorText = '',
  fullWidth = true,
}) => {
  return (
    <TextField
      label={label}
      type={type}
      placeholder={placeholder}
      helperText={error ? errorText : helperText}
      required={required}
      value={value}
      onChange={onChange}
      error={error}
      fullWidth={fullWidth}
      variant="outlined"
      slotProps={{
        input: {
          startAdornment: Icon && (
            <InputAdornment position="start">
              <Icon sx={{ color: '#8B6B4A' }} />
            </InputAdornment>
          ),
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
            '& fieldset': {
              borderColor: '#C78A3B',
              borderWidth: '2px',
              boxShadow: '0 0 12px rgba(199, 138, 59, 0.2)',
            },
          },
          '& fieldset': {
            borderColor: '#E8DCCB',
            transition: 'all 0.3s ease',
          },
        },
        '& .MuiInputLabel-root': {
          color: '#7A7A7A',
          '&.Mui-focused': {
            color: '#8B6B4A',
          },
        },
        '& .MuiFormHelperText-root': {
          marginLeft: '4px',
          fontSize: '0.875rem',
          color: '#7A7A7A',
        },
      }}
    />
  );
};

export default FormInput;