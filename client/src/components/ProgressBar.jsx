import { memo } from 'react'

const ProgressBar = memo(function ProgressBar({ percent, style }) {
  return (
    <div className="progress-bar" style={style}>
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  )
})

export default ProgressBar
