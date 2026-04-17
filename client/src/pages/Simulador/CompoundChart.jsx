import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { useThemeChart } from '../../hooks/useThemeChart.js'
import { fmt } from '../../utils/format.js'

export default function CompoundChart({ rows }) {
  const c = useThemeChart()
  if (!rows || rows.length === 0) return null

  const data = useMemo(() => ({
    labels: rows.map(r => `Ano ${r.year}`),
    datasets: [
      {
        label: 'Patrimônio Total',
        data: rows.map(r => r.balance),
        borderColor: c.accentColor,
        backgroundColor: c.accentLight,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Total Investido',
        data: rows.map(r => r.totalInvested),
        borderColor: c.secondaryColor,
        backgroundColor: c.secondaryLight,
        fill: true,
        tension: 0.4,
      },
    ],
  }), [rows, c.accentColor, c.accentLight, c.secondaryColor, c.secondaryLight])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: c.legendColor } },
      tooltip: {
        backgroundColor: c.tooltipBg,
        titleColor: c.tooltipText,
        bodyColor: c.tooltipText,
        callbacks: { label: ctx => ` R$ ${fmt(ctx.raw)}` }
      }
    },
    scales: {
      x: { ticks: { color: c.tickColor }, grid: { color: c.gridColor } },
      y: { ticks: { color: c.tickColor, callback: v => 'R$ ' + fmt(v) }, grid: { color: c.gridColor } },
    }
  }), [c.legendColor, c.tooltipBg, c.tooltipText, c.tickColor, c.gridColor])

  return (
    <div style={{ height: 320, marginTop: 24 }}>
      <Line data={data} options={options} />
    </div>
  )
}
