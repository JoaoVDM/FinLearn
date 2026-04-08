export default function FormField({ label, type = 'text', value, onChange, required, placeholder, step, min, max, style, hint, ...props }) {
  return (
    <div className="form-group" style={style}>
      {label && <label>{label}</label>}
      <input
        type={type}
        className="input"
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        aria-label={label || placeholder}
        {...props}
      />
      {hint && <div className="text-xs text-muted" style={{ marginTop: 4 }}>{hint}</div>}
    </div>
  )
}
