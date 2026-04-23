import { useState, useMemo, useCallback, useEffect } from 'react'
import { Check, Plus, Pencil, Trash2, Target, TrendingUp, Clock, Loader } from 'lucide-react'
import { calcRequiredMonthly, runCompound, convertRate } from '../../utils/finance.js'
import { fmtCurrency } from '../../utils/format.js'
import { getGoals, addGoal, updateGoal, deleteGoal } from '../../services/api.js'
import { showToast } from '../../components/Toast.jsx'
import CompoundChart from '../Simulador/CompoundChart.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Spinner from '../../components/Spinner.jsx'

function rateMonthly(g) {
  return g.rateMode === 'year' ? convertRate(g.rate, 'year', 'month') : g.rate
}
function goalRequired(g) {
  return calcRequiredMonthly({ goal: g.goal, initial: g.initial, rate: rateMonthly(g), months: g.months, skipPerYear: g.skipPerYear })
}
function goalStatus(g) {
  const saved = g.currentSaved || 0
  if (saved >= g.goal) return 'completed'
  const req = goalRequired(g)
  if (!g.createdAt || req <= 0) return 'in_progress'
  const monthsElapsed = Math.floor((Date.now() - new Date(g.createdAt)) / (1000 * 60 * 60 * 24 * 30.5))
  const expected = g.initial + req * Math.min(monthsElapsed, g.months)
  return saved >= expected * 0.92 ? 'on_track' : 'behind'
}
const STATUS_LABEL = { completed: 'Concluída', on_track: 'No prazo', behind: 'Atrasada', in_progress: 'Em andamento' }
function motivationMsg(pct) {
  if (pct >= 100) return 'Meta atingida! Parabéns pelo comprometimento.'
  if (pct >= 75) return 'Você está na reta final! Só mais um pouco.'
  if (pct >= 50) return 'Mais da metade do caminho percorrido!'
  if (pct >= 25) return 'Ótimo começo. Mantenha o ritmo!'
  return 'Toda grande jornada começa com o primeiro passo.'
}

const EMPTY_FORM = { name: '', goal: 100000, initial: 1000, rate: 0.9, months: 120, skipPerYear: 0, currentSaved: 0 }

function SavedInput({ goalId, initialValue, onSave }) {
  const [val, setVal] = useState(initialValue)
  const [busy, setBusy] = useState(false)

  useEffect(() => { setVal(initialValue) }, [initialValue])

  const handleSave = async () => {
    if (val === initialValue) return
    setBusy(true)
    await onSave(goalId, val)
    setBusy(false)
  }

  return (
    <div className="sim-input-prefix" style={{ marginTop: 6 }}>
      <span>R$</span>
      <input
        type="number" className="input" min={0} value={val}
        onChange={e => setVal(+e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        disabled={busy}
      />
    </div>
  )
}

export default function Meta() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [rateMode, setRateMode] = useState('month')
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getGoals().then(data => {
      if (!data.error) setGoals(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const monthlyRate = rateMode === 'year' ? convertRate(form.rate, 'year', 'month') : form.rate
  const required = useMemo(
    () => calcRequiredMonthly({ ...form, rate: monthlyRate }),
    [form, monthlyRate]
  )
  const rows = useMemo(() => {
    if (form.initial >= form.goal) return []
    return runCompound({ initial: form.initial, monthly: required, rate: monthlyRate, months: form.months, skipPerYear: form.skipPerYear })
  }, [form, required, monthlyRate])

  const toggleRate = () => {
    const next = rateMode === 'month' ? 'year' : 'month'
    set('rate', +convertRate(form.rate, rateMode, next).toFixed(4))
    setRateMode(next)
  }

  const handleSave = useCallback(async () => {
    if (!form.name.trim() || form.goal <= 0) return
    setSaving(true)
    const payload = { ...form, rateMode }

    if (editId) {
      const res = await updateGoal(editId, payload)
      setSaving(false)
      if (res.error) { showToast(res.message || 'Erro ao atualizar meta', 'error'); return }
      setGoals(prev => prev.map(g => g.id === editId ? res.goal : g))
      showToast('Meta atualizada')
    } else {
      const res = await addGoal(payload)
      setSaving(false)
      if (res.error) { showToast(res.message || 'Erro ao criar meta', 'error'); return }
      setGoals(prev => [...prev, res.goal])
      showToast('Meta criada')
    }
    setForm(EMPTY_FORM); setRateMode('month'); setEditId(null); setShowForm(false)
  }, [form, rateMode, editId])

  const handleEdit = (g) => {
    setForm({ name: g.name, goal: g.goal, initial: g.initial, rate: g.rate, months: g.months, skipPerYear: g.skipPerYear, currentSaved: g.currentSaved || 0 })
    setRateMode(g.rateMode || 'month')
    setEditId(g.id); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = useCallback(async () => {
    const res = await deleteGoal(confirmDelete)
    if (res.error) { showToast(res.message || 'Erro ao remover meta', 'error'); setConfirmDelete(null); return }
    setGoals(prev => prev.filter(g => g.id !== confirmDelete))
    setConfirmDelete(null)
    showToast('Meta removida')
  }, [confirmDelete])

  const updateSaved = useCallback(async (id, val) => {
    const goal = goals.find(g => g.id === id)
    if (!goal) return
    const res = await updateGoal(id, { ...goal, currentSaved: val })
    if (res.error) { showToast('Erro ao atualizar valor', 'error'); return }
    setGoals(prev => prev.map(g => g.id === id ? res.goal : g))
  }, [goals])

  const totalTarget = goals.reduce((s, g) => s + g.goal, 0)
  const totalSaved  = goals.reduce((s, g) => s + (g.currentSaved || 0), 0)
  const overallPct  = totalTarget > 0 ? Math.min(100, Math.round(totalSaved / totalTarget * 100)) : 0

  if (loading) return <Spinner />

  return (
    <div className="page-content fade-in">
      <ConfirmDialog
        open={!!confirmDelete}
        title="Remover meta"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="page-header page-header-row">
        <div>
          <h1>Calculadora de Metas</h1>
          <p>Planeje e acompanhe seus objetivos financeiros.</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(v => !v) }}
        >
          <Plus size={14} /> Nova meta
        </button>
      </div>

      {goals.length > 0 && (
        <div className="meta-summary-banner">
          <div className="meta-summary-item">
            <span className="meta-summary-label"><Target size={12} /> Metas ativas</span>
            <span className="meta-summary-value">{goals.filter(g => (g.currentSaved || 0) < g.goal).length}</span>
          </div>
          <div className="meta-summary-item">
            <span className="meta-summary-label"><TrendingUp size={12} /> Total acumulado</span>
            <span className="meta-summary-value accent">{fmtCurrency(totalSaved)}</span>
          </div>
          <div className="meta-summary-item">
            <span className="meta-summary-label"><Clock size={12} /> Total das metas</span>
            <span className="meta-summary-value">{fmtCurrency(totalTarget)}</span>
          </div>
          <div className="meta-summary-progress">
            <div className="meta-summary-progress-header">
              <span>Progresso geral</span>
              <span>{overallPct}%</span>
            </div>
            <div className="meta-overall-bar">
              <div className="meta-overall-fill" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="meta-calc-section">
          <div className="meta-calc-header">
            <h2 className="section-title" style={{ margin: 0 }}>{editId ? 'Editar meta' : 'Nova meta'}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }}>Cancelar</button>
          </div>
          <div className="sim-layout">
            <div className="sim-form card">
              <p className="sim-form-title">Parâmetros</p>

              <div className="form-group">
                <label>Nome da meta</label>
                <input type="text" className="input" placeholder="Ex: Reserva de emergência" maxLength={60}
                  value={form.name} onChange={e => set('name', e.target.value)} />
              </div>

              <div className="form-group">
                <label>Valor objetivo</label>
                <div className="sim-input-prefix">
                  <span>R$</span>
                  <input type="number" className="input" value={form.goal} min={1} onChange={e => set('goal', +e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Capital inicial</label>
                <div className="sim-input-prefix">
                  <span>R$</span>
                  <input type="number" className="input" value={form.initial} min={0} onChange={e => set('initial', +e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Já acumulei</label>
                <div className="sim-input-prefix">
                  <span>R$</span>
                  <input type="number" className="input" value={form.currentSaved} min={0} onChange={e => set('currentSaved', +e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Taxa de juros</label>
                <div className="sim-rate-toggle">
                  <button className={rateMode === 'month' ? 'active' : ''} onClick={() => rateMode !== 'month' && toggleRate()}>a.m.</button>
                  <button className={rateMode === 'year'  ? 'active' : ''} onClick={() => rateMode !== 'year'  && toggleRate()}>a.a.</button>
                </div>
                <div className="sim-input-suffix">
                  <input type="number" step="0.01" className="input" value={form.rate} min={0} onChange={e => set('rate', +e.target.value)} />
                  <span>%</span>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Prazo
                  <span className="sim-period-hint">{Math.round(form.months / 12 * 10) / 10} anos</span>
                </label>
                <input type="number" className="input" value={form.months} min={1} max={600} onChange={e => set('months', +e.target.value)} />
              </div>

              <div className="form-group">
                <label>
                  Meses sem aporte/ano
                  <span className="sim-period-hint">{form.skipPerYear === 0 ? '12/ano' : `${12 - form.skipPerYear}/ano`}</span>
                </label>
                <input type="range" min={0} max={11} value={form.skipPerYear}
                  onChange={e => set('skipPerYear', +e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent)' }} />
              </div>

              {form.initial >= form.goal ? (
                <div className="meta-result-badge success"><Check size={14} /> Capital inicial já suficiente!</div>
              ) : (
                <div className="meta-result-highlight">
                  <span className="meta-result-label">
                    Aporte necessário{form.skipPerYear > 0 ? ` (${12 - form.skipPerYear}×/ano)` : ''}
                  </span>
                  <span className="meta-result-value">{required > 0 ? fmtCurrency(required) : '—'}</span>
                </div>
              )}

              <button
                className="btn btn-primary w-full"
                style={{ marginTop: 16 }}
                onClick={handleSave}
                disabled={!form.name.trim() || form.goal <= 0 || saving}
              >
                {saving
                  ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</>
                  : <><Check size={14} /> {editId ? 'Salvar alterações' : 'Criar meta'}</>
                }
              </button>
            </div>

            <div className="sim-results">
              {rows.length > 0 && (
                <>
                  <div className="sim-stats-grid">
                    <div className="sim-stat-card featured">
                      <span className="sim-stat-label">Aporte necessário</span>
                      <span className="sim-stat-value">{fmtCurrency(required)}</span>
                      <span className="sim-stat-sub">{form.skipPerYear > 0 ? `${12 - form.skipPerYear} meses/ano` : 'por mês'}</span>
                    </div>
                    <div className="sim-stat-card">
                      <span className="sim-stat-label">Total a investir</span>
                      <span className="sim-stat-value muted">{fmtCurrency(rows[rows.length - 1]?.totalInvested || 0)}</span>
                      <span className="sim-stat-sub">capital + aportes</span>
                    </div>
                    <div className="sim-stat-card">
                      <span className="sim-stat-label">Rendimentos</span>
                      <span className="sim-stat-value accent">{fmtCurrency(rows[rows.length - 1]?.earnings || 0)}</span>
                      <span className="sim-stat-sub">juros compostos</span>
                    </div>
                  </div>
                  <div className="sim-chart-card card">
                    <div className="sim-chart-header">
                      <span>Projeção — {form.name || 'nova meta'}</span>
                    </div>
                    <CompoundChart rows={rows} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {goals.length === 0 && !showForm ? (
        <div className="empty-state-box" style={{ marginTop: 40 }}>
          <Target size={40} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Nenhuma meta criada</p>
          <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)', marginBottom: 20 }}>
            Defina objetivos e acompanhe seu progresso mês a mês.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Criar primeira meta
          </button>
        </div>
      ) : goals.length > 0 && (
        <div style={{ marginTop: showForm ? 40 : 0 }}>
          {!showForm && <h2 className="section-title">Suas metas</h2>}
          <div className="meta-goals-grid">
            {goals.map(g => {
              const req   = goalRequired(g)
              const saved = g.currentSaved || 0
              const pct   = Math.min(100, g.goal > 0 ? Math.round(saved / g.goal * 100) : 0)
              const status = goalStatus(g)

              return (
                <div key={g.id} className={`meta-goal-card card ${status}`}>
                  <div className="meta-goal-header">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="meta-goal-name">{g.name}</div>
                      <span className={`meta-goal-badge ${status}`}>{STATUS_LABEL[status]}</span>
                    </div>
                    <div className="meta-goal-actions">
                      <button className="budget-icon-btn" title="Editar" onClick={() => handleEdit(g)}><Pencil size={13} /></button>
                      <button className="budget-icon-btn danger" title="Remover" onClick={() => setConfirmDelete(g.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>

                  <div className="meta-goal-amounts">
                    <span className="meta-goal-current">{fmtCurrency(saved)}</span>
                    <span className="meta-goal-sep">de</span>
                    <span className="meta-goal-target">{fmtCurrency(g.goal)}</span>
                  </div>

                  <div className="meta-goal-progress-wrap">
                    <div className="meta-goal-bar">
                      <div className={`meta-goal-fill ${status}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="meta-goal-pct">{pct}%</span>
                  </div>

                  {pct > 0 && (
                    <p className="meta-motivation">{motivationMsg(pct)}</p>
                  )}

                  <div className="meta-goal-details">
                    <div className="meta-goal-detail">
                      <span>Aporte sugerido</span>
                      <strong>{req > 0 ? `${fmtCurrency(req)}/mês` : '—'}</strong>
                    </div>
                    <div className="meta-goal-detail">
                      <span>Faltam</span>
                      <strong>{fmtCurrency(Math.max(0, g.goal - saved))}</strong>
                    </div>
                    <div className="meta-goal-detail">
                      <span>Prazo</span>
                      <strong>{g.months} meses</strong>
                    </div>
                  </div>

                  <div className="meta-goal-update">
                    <label>Atualizar acumulado</label>
                    <SavedInput key={g.id} goalId={g.id} initialValue={saved} onSave={updateSaved} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
