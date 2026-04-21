import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { PieChart } from 'lucide-react'
import { fmtCurrency } from '../../utils/format.js'

export default function FluxoChart({ gastos, investimentos, receitas }) {
  const total = gastos + investimentos + receitas
  // Saldo livre = receitas - gastos (investimentos são positivos, não subtraem)
  const saldo = receitas - gastos
  const saldoPositivo = saldo >= 0

  const data = useMemo(() => ({
    labels: ['Gastos', 'Investimentos', 'Receitas'],
    datasets: [{
      data: [gastos || 0, investimentos || 0, receitas || 0],
      backgroundColor: ['rgba(239,68,68,0.85)', 'rgba(0,229,180,0.85)', 'rgba(99,102,241,0.85)'],
      borderColor: ['rgb(239,68,68)', 'rgb(0,229,180)', 'rgb(99,102,241)'],
      borderWidth: 2,
      hoverOffset: 8,
    }],
  }), [gastos, investimentos, receitas])

  const options = useMemo(() => ({
    cutout: '72%',
    layout: { padding: 8 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => total > 0
            ? ` ${ctx.label}: ${fmtCurrency(ctx.raw)} (${Math.round(ctx.raw / total * 100)}%)`
            : ` ${ctx.label}: ${fmtCurrency(ctx.raw)}`,
        },
      },
    },
  }), [total])

  return (
    <div className="card fluxo-chart-card">
      <div className="fluxo-chart-header">
        <PieChart size={14} />
        <span>Distribuição</span>
      </div>

      {total > 0 ? (
        <>
          <div className="fluxo-chart-donut-wrap">
            <Doughnut data={data} options={options} />
            <div className="fluxo-chart-center">
              <span className="fluxo-chart-center-label">Saldo livre</span>
              <span className="fluxo-chart-center-value" style={{ color: saldoPositivo ? 'var(--accent)' : 'var(--danger)' }}>
                {saldoPositivo ? '+' : ''}{fmtCurrency(saldo)}
              </span>
            </div>
          </div>

          <div className="fluxo-chart-legend">
            {[
              { label: 'Gastos',        value: gastos,        sign: '−', color: 'rgb(239,68,68)',  textColor: 'var(--danger)' },
              { label: 'Investimentos', value: investimentos, sign: '+', color: 'rgb(0,229,180)',  textColor: 'var(--accent)' },
              { label: 'Receitas',      value: receitas,      sign: '+', color: 'rgb(99,102,241)', textColor: 'rgb(99,102,241)' },
            ].map(({ label, value, sign, color, textColor }) => (
              <div key={label} className="fluxo-legend-item">
                <span className="fluxo-legend-dot" style={{ background: color }} />
                <div className="fluxo-legend-info">
                  <span className="fluxo-legend-label">
                    {label}{total > 0 ? ` · ${Math.round(value / total * 100)}%` : ''}
                  </span>
                  <span className="fluxo-legend-value" style={{ color: textColor }}>
                    {sign}{fmtCurrency(value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="fluxo-chart-empty">Nenhuma transação no período selecionado.</p>
      )}
    </div>
  )
}
