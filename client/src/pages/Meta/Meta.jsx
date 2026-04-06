import { useState, useMemo } from 'react'
import { calcRequiredMonthly, runCompound, convertRate } from '../../utils/finance.js'
import { fmtCurrency } from '../../utils/format.js'
import CompoundChart from '../Simulador/CompoundChart.jsx'

export default function Meta() {
  const [form, setForm] = useState({ goal: 100000, initial: 1000, rate: 0.9, months: 120 })
  const [rateMode, setRateMode] = useState('month')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const monthlyRate = rateMode === 'year' ? convertRate(form.rate, 'year', 'month') : form.rate
  const required = useMemo(() => calcRequiredMonthly({ ...form, rate: monthlyRate }), [form, monthlyRate])
  const rows = useMemo(() => runCompound({ initial: form.initial, monthly: required, rate: monthlyRate, months: form.months }), [form, required, monthlyRate])

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h1>Calculadora de Metas</h1>
        <p>Descubra quanto você precisa poupar por mês para atingir seu objetivo.</p>
      </div>
      <div className="sim-layout">
        <div className="sim-form card">
          <div className="form-group">
            <label>Objetivo (R$)</label>
            <input type="number" className="input" value={form.goal} onChange={e => set('goal', +e.target.value)} />
          </div>
          <div className="form-group">
            <label>Capital inicial (R$)</label>
            <input type="number" className="input" value={form.initial} onChange={e => set('initial', +e.target.value)} />
          </div>
          <div className="form-group">
            <label>
              Taxa ({rateMode === 'month' ? 'ao mês' : 'ao ano'} %)
              <button className="btn-link" style={{ marginLeft: 8 }} onClick={() => {
                const next = rateMode === 'month' ? 'year' : 'month'
                const converted = convertRate(form.rate, rateMode, next)
                setRateMode(next)
                set('rate', +converted.toFixed(4))
              }}>Trocar</button>
            </label>
            <input type="number" step="0.01" className="input" value={form.rate} onChange={e => set('rate', +e.target.value)} />
          </div>
          <div className="form-group">
            <label>Prazo (meses)</label>
            <input type="number" className="input" value={form.months} onChange={e => set('months', +e.target.value)} min={1} />
          </div>
          <div className="result-summary" style={{ marginTop: 16 }}>
            <div className="result-item highlight">
              <span>Aporte mensal necessário</span>
              <strong style={{ color: 'var(--accent)', fontSize: '1.1rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{required > 0 ? fmtCurrency(required) : '—'}</strong>
            </div>
            {rows.length > 0 && <>
              <div className="result-item"><span>Meta</span><strong>{fmtCurrency(form.goal)}</strong></div>
              <div className="result-item"><span>Total investido</span><strong>{fmtCurrency(rows[rows.length-1].totalInvested)}</strong></div>
            </>}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <CompoundChart rows={rows} />
        </div>
      </div>
    </div>
  )
}
