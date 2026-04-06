import { useState, useMemo } from 'react'
import { runCompound, convertRate } from '../../utils/finance.js'
import { fmt, fmtCurrency } from '../../utils/format.js'
import CompoundChart from './CompoundChart.jsx'

const PRESETS = [
  { label: 'Conservador', initial: 1000, monthly: 500, rate: 0.8, months: 120 },
  { label: 'Moderado', initial: 5000, monthly: 1000, rate: 1.0, months: 180 },
  { label: 'Arrojado', initial: 10000, monthly: 2000, rate: 1.2, months: 240 },
]

export default function Simulador() {
  const [form, setForm] = useState({ initial: 1000, monthly: 500, rate: 0.8, months: 120 })
  const [rateMode, setRateMode] = useState('month')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const rows = useMemo(() => {
    const monthlyRate = rateMode === 'year' ? convertRate(form.rate, 'year', 'month') : form.rate
    return runCompound({ ...form, rate: monthlyRate })
  }, [form, rateMode])

  const last = rows[rows.length - 1]
  const applyPreset = (p) => { setForm(p); setRateMode('month') }

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h1>Simulador de Juros Compostos</h1>
        <p>Visualize o crescimento do seu patrimônio com aportes mensais.</p>
      </div>
      <div className="preset-btns" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {PRESETS.map(p => (
          <button key={p.label} className="btn btn-secondary" onClick={() => applyPreset(p)}>{p.label}</button>
        ))}
      </div>
      <div className="sim-layout">
        <div className="sim-form card">
          <div className="form-group">
            <label>Capital inicial (R$)</label>
            <input type="number" className="input" value={form.initial} onChange={e => set('initial', +e.target.value)} />
          </div>
          <div className="form-group">
            <label>Aporte mensal (R$)</label>
            <input type="number" className="input" value={form.monthly} onChange={e => set('monthly', +e.target.value)} />
          </div>
          <div className="form-group">
            <label>
              Taxa ({rateMode === 'month' ? 'ao mês' : 'ao ano'} %)
              <button className="btn-link" style={{ marginLeft: 8 }} onClick={() => {
                const next = rateMode === 'month' ? 'year' : 'month'
                const converted = convertRate(form.rate, rateMode, next)
                setRateMode(next)
                set('rate', +converted.toFixed(4))
              }}>
                Trocar para {rateMode === 'month' ? 'ano' : 'mês'}
              </button>
            </label>
            <input type="number" step="0.01" className="input" value={form.rate} onChange={e => set('rate', +e.target.value)} />
          </div>
          <div className="form-group">
            <label>Período (meses)</label>
            <input type="number" className="input" value={form.months} onChange={e => set('months', +e.target.value)} min={1} max={600} />
          </div>
          {last && (
            <div className="result-summary" style={{ marginTop: 16 }}>
              <div className="result-item"><span>Patrimônio final</span><strong>{fmtCurrency(last.balance)}</strong></div>
              <div className="result-item"><span>Total investido</span><strong>{fmtCurrency(last.totalInvested)}</strong></div>
              <div className="result-item"><span>Rendimentos</span><strong style={{ color: 'var(--accent)' }}>{fmtCurrency(last.earnings)}</strong></div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <CompoundChart rows={rows} />
          {rows.length > 0 && (
            <div style={{ overflowX: 'auto', marginTop: 24 }}>
              <table className="data-table">
                <thead><tr><th>Ano</th><th>Investido</th><th>Rendimentos</th><th>Patrimônio</th></tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.year}>
                      <td>{r.year}</td>
                      <td>{fmtCurrency(r.totalInvested)}</td>
                      <td style={{ color: 'var(--accent)' }}>{fmtCurrency(r.earnings)}</td>
                      <td><strong>{fmtCurrency(r.balance)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
