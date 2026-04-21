import { useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { fmtCurrency, fmtMonth } from '../../utils/format.js'
import { useThemeChart } from '../../hooks/useThemeChart.js'

const PERIODS = [
  { label: '3 meses', value: 3 },
  { label: '6 meses', value: 6 },
  { label: '12 meses', value: 12 },
  { label: 'Tudo', value: 0 },
]

export default function EvolutionChart({ transactions }) {
  const [period, setPeriod] = useState(6)
  const { tickColor, gridColor, legendColor, tooltipBg, tooltipText, tooltipBorder } = useThemeChart()

  const monthlyData = useMemo(() => {
    const map = {}
    for (const t of transactions) {
      const m = t.date?.slice(0, 7)
      if (!m) continue
      if (!map[m]) map[m] = { gastos: 0, investimentos: 0, receitas: 0 }
      if (t.type === 'gasto') map[m].gastos += t.value
      else if (t.type === 'investimento') map[m].investimentos += t.value
      else if (t.type === 'receita') map[m].receitas += t.value
    }
    let months = Object.keys(map).sort()
    if (period > 0) months = months.slice(-period)
    return months.map(m => ({ month: m, ...map[m] }))
  }, [transactions, period])

  const data = useMemo(() => ({
    labels: monthlyData.map(d => fmtMonth(d.month)),
    datasets: [
      {
        label: 'Receitas',
        data: monthlyData.map(d => d.receitas),
        borderColor: 'rgb(99,102,241)',
        backgroundColor: 'rgba(99,102,241,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(99,102,241)',
      },
      {
        label: 'Gastos',
        data: monthlyData.map(d => d.gastos),
        borderColor: 'rgb(239,68,68)',
        backgroundColor: 'rgba(239,68,68,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(239,68,68)',
      },
      {
        label: 'Investimentos',
        data: monthlyData.map(d => d.investimentos),
        borderColor: 'rgb(0,200,150)',
        backgroundColor: 'rgba(0,200,150,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(0,200,150)',
      },
    ],
  }), [monthlyData])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        labels: {
          boxWidth: 10,
          padding: 16,
          color: legendColor,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipText,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${fmtCurrency(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: tickColor,
          font: { size: 11 },
          maxRotation: 40,
        },
        grid: { color: gridColor },
      },
      y: {
        ticks: {
          color: tickColor,
          font: { size: 11 },
          callback: (v) => fmtCurrency(v),
        },
        grid: { color: gridColor },
      },
    },
  }), [legendColor, tooltipBg, tooltipText, tooltipBorder, tickColor, gridColor])

  if (monthlyData.length === 0) return null

  return (
    <div className="card evolution-chart-card">
      <div className="evolution-chart-header">
        <span className="evolution-chart-title">Evolução Mensal</span>
        <div className="evolution-period-tabs">
          {PERIODS.map(p => (
            <button
              key={p.value}
              className={`evolution-tab${period === p.value ? ' active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 220 }}>
        <Line data={data} options={{ ...options, maintainAspectRatio: false }} />
      </div>
    </div>
  )
}
