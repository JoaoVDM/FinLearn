import { useState, useMemo } from 'react'
import { Bookmark, Trash2 } from 'lucide-react'
import { runCompound, convertRate } from '../../utils/finance.js'
import { fmt, fmtCurrency } from '../../utils/format.js'
import CompoundChart from './CompoundChart.jsx'

const PRESETS = [
  { label: 'Conservador', desc: 'Renda fixa · baixo risco',       initial: 1000,  monthly: 500,  rate: 0.8, months: 120 },
  { label: 'Moderado',    desc: 'Mix de ativos · médio prazo',    initial: 5000,  monthly: 1000, rate: 1.0, months: 180 },
  { label: 'Arrojado',    desc: 'Renda variável · longo prazo',   initial: 10000, monthly: 2000, rate: 1.2, months: 240 },
]

function loadScenarios() {
  try { return JSON.parse(localStorage.getItem('fl_scenarios') || '[]') } catch { return [] }
}
function persistScenarios(list) {
  try { localStorage.setItem('fl_scenarios', JSON.stringify(list)) } catch {}
}
function isActive(form, rateMode, p) {
  return rateMode === 'month' && form.initial === p.initial &&
    form.monthly === p.monthly && form.rate === p.rate && form.months === p.months
}

export default function Simulador() {
  const [form, setForm] = useState({ initial: 1000, monthly: 500, rate: 0.8, months: 120 })
  const [rateMode, setRateMode] = useState('month')
  const [scenarios, setScenarios] = useState(loadScenarios)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const rows = useMemo(() => {
    const monthlyRate = rateMode === 'year' ? convertRate(form.rate, 'year', 'month') : form.rate
    return runCompound({ ...form, rate: monthlyRate })
  }, [form, rateMode])

  const last = rows[rows.length - 1]
  const roi        = last && last.totalInvested > 0 ? ((last.earnings / last.totalInvested) * 100).toFixed(1) : '0.0'
  const multiplier = last && last.totalInvested > 0 ? (last.balance / last.totalInvested).toFixed(2) : '1.00'

  const applyPreset = (p) => { setForm({ initial: p.initial, monthly: p.monthly, rate: p.rate, months: p.months }); setRateMode('month') }

  const toggleRate = () => {
    const next = rateMode === 'month' ? 'year' : 'month'
    const converted = convertRate(form.rate, rateMode, next)
    setRateMode(next)
    set('rate', +converted.toFixed(4))
  }

  const buildScenario = () => {
    const monthlyRate = rateMode === 'year' ? convertRate(form.rate, 'year', 'month') : form.rate
    const r = runCompound({ ...form, rate: monthlyRate })
    const l = r[r.length - 1]
    return {
      id: Date.now(),
      label: `Cenário ${scenarios.length + 1}`,
      initial: form.initial, monthly: form.monthly,
      rate: form.rate, rateMode, months: form.months,
      balance: l?.balance || 0,
      totalInvested: l?.totalInvested || 0,
      earnings: l?.earnings || 0,
    }
  }

  const saveScenario = () => {
    const s = buildScenario()
    const updated = scenarios.length >= 3 ? [...scenarios.slice(1), s] : [...scenarios, s]
    setScenarios(updated)
    persistScenarios(updated)
  }

  const removeScenario = (id) => {
    const updated = scenarios.filter(s => s.id !== id)
    setScenarios(updated)
    persistScenarios(updated)
  }

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h1>Simulador de Juros Compostos</h1>
        <p>Visualize o crescimento do seu patrimônio com aportes mensais.</p>
      </div>

      <div className="sim-presets">
        {PRESETS.map(p => (
          <button
            key={p.label}
            className={`sim-preset-btn${isActive(form, rateMode, p) ? ' active' : ''}`}
            onClick={() => applyPreset(p)}
          >
            <span className="sim-preset-label">{p.label}</span>
            <span className="sim-preset-desc">{p.desc}</span>
          </button>
        ))}
      </div>

      <div className="sim-layout">
        {/* ── Coluna esquerda: formulário ── */}
        <div className="sim-form card">
          <p className="sim-form-title">Parâmetros</p>

          <div className="form-group">
            <label>Capital inicial</label>
            <div className="sim-input-prefix">
              <span>R$</span>
              <input type="number" className="input" value={form.initial} min={0}
                onChange={e => set('initial', +e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Aporte mensal</label>
            <div className="sim-input-prefix">
              <span>R$</span>
              <input type="number" className="input" value={form.monthly} min={0}
                onChange={e => set('monthly', +e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Taxa de juros</label>
            <div className="sim-rate-toggle">
              <button className={rateMode === 'month' ? 'active' : ''} onClick={() => rateMode !== 'month' && toggleRate()}>a.m.</button>
              <button className={rateMode === 'year'  ? 'active' : ''} onClick={() => rateMode !== 'year'  && toggleRate()}>a.a.</button>
            </div>
            <div className="sim-input-suffix">
              <input type="number" step="0.01" className="input" value={form.rate} min={0}
                onChange={e => set('rate', +e.target.value)} />
              <span>%</span>
            </div>
          </div>

          <div className="form-group">
            <label>
              Período
              <span className="sim-period-hint">{Math.round(form.months / 12 * 10) / 10} anos</span>
            </label>
            <input type="number" className="input" value={form.months} min={1} max={600}
              onChange={e => set('months', +e.target.value)} />
          </div>

          <button className="btn btn-secondary w-full" style={{ marginTop: 8 }} onClick={saveScenario} disabled={!last}>
            <Bookmark size={14} />
            {scenarios.length >= 3 ? 'Salvar (substitui mais antigo)' : 'Salvar cenário'}
          </button>
        </div>

        {/* ── Coluna direita: resultados ── */}
        <div className="sim-results">
          {last && (
            <div className="sim-stats-grid">
              <div className="sim-stat-card featured">
                <span className="sim-stat-label">Patrimônio final</span>
                <span className="sim-stat-value">{fmtCurrency(last.balance)}</span>
                <span className="sim-stat-sub">{multiplier}× o valor investido</span>
              </div>
              <div className="sim-stat-card">
                <span className="sim-stat-label">Total investido</span>
                <span className="sim-stat-value muted">{fmtCurrency(last.totalInvested)}</span>
                <span className="sim-stat-sub">capital + aportes</span>
              </div>
              <div className="sim-stat-card">
                <span className="sim-stat-label">Rendimentos</span>
                <span className="sim-stat-value accent">{fmtCurrency(last.earnings)}</span>
                <span className="sim-stat-sub">ROI {roi}%</span>
              </div>
            </div>
          )}

          <div className="sim-chart-card card">
            <div className="sim-chart-header">
              <span>Evolução patrimonial</span>
              {last && <span className="sim-multiplier-badge">{multiplier}×</span>}
            </div>
            <CompoundChart rows={rows} />
          </div>

          {rows.length > 0 && (
            <details className="sim-table-details card">
              <summary>Tabela por ano ({rows.length} {rows.length === 1 ? 'ano' : 'anos'})</summary>
              <div style={{ overflowX: 'auto', marginTop: 12 }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Ano</th><th>Investido</th><th>Rendimentos</th><th>Patrimônio</th></tr>
                  </thead>
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
            </details>
          )}
        </div>
      </div>

      {scenarios.length > 0 && (
        <section style={{ marginTop: 'var(--space-10)' }}>
          <h2 className="section-title">Comparação de cenários</h2>
          <div className="sim-scenarios-grid">
            {scenarios.map(s => (
              <div key={s.id} className="sim-scenario-card card">
                <div className="sim-scenario-header">
                  <span className="sim-scenario-label">{s.label}</span>
                  <button className="btn-delete" onClick={() => removeScenario(s.id)} title="Remover" aria-label="Remover cenário">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="sim-scenario-balance">{fmtCurrency(s.balance)}</div>
                <div className="sim-scenario-meta">
                  <span>{fmtCurrency(s.initial)} inicial · {fmtCurrency(s.monthly)}/mês</span>
                  <span>{fmt(s.rate)}% {s.rateMode === 'year' ? 'a.a.' : 'a.m.'} · {s.months} meses</span>
                </div>
                <div className="sim-scenario-breakdown">
                  <span>Investido <strong>{fmtCurrency(s.totalInvested)}</strong></span>
                  <span style={{ color: 'var(--accent)' }}>Rendimentos <strong>{fmtCurrency(s.earnings)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
