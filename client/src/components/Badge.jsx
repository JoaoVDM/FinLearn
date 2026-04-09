import { memo } from 'react'

const Badge = memo(function Badge({ children, variant = 'neutral' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
})

export default Badge
