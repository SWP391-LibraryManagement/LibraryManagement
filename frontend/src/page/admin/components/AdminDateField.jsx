export function AdminDateField({ id, label, value, onChange, min, max }) {
  return (
    <label className="admin-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
      />
    </label>
  );
}
