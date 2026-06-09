import { TextField, InputAdornment } from '@mui/material';

export default function FormInput({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  icon,
  endAdornment,
  error = false,
  helperText = '',
}) {
  return (
    <TextField
      fullWidth
      required={required}
      type={type}
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
        endAdornment: endAdornment ? (
          <InputAdornment position="end">
            {endAdornment}
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
}