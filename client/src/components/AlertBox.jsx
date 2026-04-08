export default function AlertBox({ children, variant = 'success', icon: Icon }) {
  return (
    <div className={`alert alert-${variant}`}>
      {Icon && <Icon size={18} className="alert-icon" />}
      <div className="alert-body">{children}</div>
    </div>
  )
}
