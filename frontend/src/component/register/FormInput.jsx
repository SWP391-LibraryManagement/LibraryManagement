import { InputAdornment, TextField } from '@mui/material';

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
  inputRef,
  inputProps,
  autoFocus = false,
  disabled = false,
}) {
  return (
    <TextField
      fullWidth
      required={required}
      type={type}
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      variant="outlined"
      className="form-field"
      error={error}
      helperText={helperText}
      inputRef={inputRef}
      autoFocus={autoFocus}
      disabled={disabled}
      slotProps={{
        input: {
          startAdornment: icon ? (
            <InputAdornment position="start">{icon}</InputAdornment>
          ) : undefined,
          endAdornment: endAdornment ? (
            <InputAdornment position="end">{endAdornment}</InputAdornment>
          ) : undefined,
        },
        htmlInput: inputProps,
      }}
    />
  );
}
