import { Doughnut } from 'react-chartjs-2'
import { fmtCurrency, fmtMonth } from '../../utils/format.js'

export default function FluxoChart({ gastos, investimentos, typeFilter, monthFilter, months, onTypeChange, onMonthChange, categoryFilter, categories, onCategoryChange }) {
  const total = gastos + investimentos
  const saldo = investimentos - gastos
  const saldoPositivo = saldo >= 0

  const data = {
    labels: ['Gastos', 'Investimentos'],
    datasets: [{
      data: [gastos || 0, investimentos || 0],
      backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(0,200,150,0.8)'],
      borderColor: ['rgb(239,68,68)', 'rgb(0,200,150)'],
      borderWidth: 2,
      hoverOffset: 8,
    }],
  }

  const options = {
    cutout: '72%',
    layout: { padding: 12 },
    plugins: {
      legend: { display: false },
      tooltip: {
        position: 'nearest',
        callbacks: {
          label: (ctx) => total > 0
            ? ` ${ctx.label}: ${fmtCurrency(ctx.raw)} (${Math.round(ctx.raw / total * 100)}%)`
            : ` ${ctx.label}: ${fmtCurrency(ctx.raw)}`,
        },
      },
    },
  }

  return (
    <div className="card" style={{ padding: 24, overflow: 'visible' }}>
      {/* Filtros no topo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={typeFilter} onChange={e => onTypeChange(e.target.value)} style={{ flex: 1, minWidth: 130 }}>
          <option value="todos">Todos os tipos</option>
          <option value="gasto">Gastos</option>
          <option value="investimento">Investimentos</option>
        </select>
        <select value={monthFilter} onChange={e => onMonthChange(e.target.value)} style={{ flex: 1, minWidth: 130 }}>
          <option value="">Todos os meses</option>
          {months.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
        </select>
        {categories.length > 0 && (
          <select value={categoryFilter} onChange={e => onCategoryChange(e.target.value)} style={{ flex: 1, minWidth: 130 }}>
            <option value="">Todas as categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Gráfico */}
      {total > 0 ? (
        <>
          <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
            <Doughnut data={data} options={options} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>Saldo</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 400, color: saldoPositivo ? 'var(--accent)' : 'var(--danger)' }}>
                {saldoPositivo ? '+' : ''}{fmtCurrency(saldo)}
              </span>
            </div>
          </div>

          {/* Legenda abaixo */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgb(239,68,68)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gastos {total > 0 ? `· ${Math.round(gastos / total * 100)}%` : ''}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 400, color: 'var(--danger)' }}>{fmtCurrency(gastos)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgb(0,200,150)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Investimentos {total > 0 ? `· ${Math.round(investimentos / total * 100)}%` : ''}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 400, color: 'var(--accent)' }}>{fmtCurrency(investimentos)}</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: '16px 0' }}>
          Nenhuma transação no período selecionado.
        </p>
      )}
    </div>
  )
}
