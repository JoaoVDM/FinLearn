import { BookOpen, Landmark, TrendingUp, Target, Zap, Receipt } from 'lucide-react'

const MODULE_ICONS = {
  book: BookOpen,
  landmark: Landmark,
  'trending-up': TrendingUp,
  target: Target,
  zap: Zap,
  receipt: Receipt,
}

export default function ModuleIcon({ icon, size = 22 }) {
  const Icon = MODULE_ICONS[icon]
  return Icon ? <Icon size={size} color="var(--accent)" /> : null
}
