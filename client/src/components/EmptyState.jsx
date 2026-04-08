export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state-box">
      {Icon && <Icon size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.35 }} />}
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-desc">{description}</div>}
    </div>
  )
}
