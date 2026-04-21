import { useEffect, useState, useMemo, useCallback } from 'react'
import { Pencil, Check, X, Trash2, Target } from 'lucide-react'
import { getBudgets, saveBudgets } from '../../services/api.js'
import { fmtCurrency, fmtMonth } from '../../utils/format.js'

function statusInfo(spent, limit) {
  if (limit <= 0) return { label: 'Sem limite', color: 'var(--text-3)', bg: 'var(--bg-elevated)' }
  const pct = (spent / limit) * 100
  if (pct > 100) return { label: 'Estourado', color: 'var(--danger)', bg: 'var(--danger-dim)', pct }
  if (pct >= 80) return { label: 'Atenção', color: 'var(--warning)', bg: 'rgba(255,184,48,0.12)', pct }
  return { label: 'OK', color: 'var(--accent)', bg: 'var(--success-dim)', pct }
}

function BudgetBar({ spent, limit }) {
  if (limit <= 0) return null
  const pct = Math.min((spent / limit) * 100, 100)
  const { color } = statusInfo(spent, limit)
  return (
    <div className="bm-bar-wrap">
      <div className="budget-bar-track">
        <div className="budget-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="bm-bar-pct" style={{ color }}>{Math.round(pct)}%</span>
    </div>
  )
}

const CURRENT_MONTH = new Date().toISOString().slice(0, 7)

export default function BudgetManager({ transactions, activeMonthFilter }) {
  const [budgets, setBudgets] = useState({})
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')

  useEffect(() => {
    getBudgets().then(data => setBudgets(data && typeof data === 'object' && !data.error ? data : {}))
  }, [])

  // Always use a specific month — prefer the active filter, fall back to current month
  const effectiveMonth = activeMonthFilter || CURRENT_MONTH
  const monthLabel = fmtMonth(effectiveMonth)
  const usingDefault = !activeMonthFilter

  const spendingByCategory = useMemo(() => {
    const map = {}
    for (const t of transactions) {
      if (t.type !== 'gasto') continue
      if (!t.date?.startsWith(effectiveMonth)) continue
      const key = t.category || 'Sem categoria'
      map[key] = (map[key] || 0) + t.value
    }
    return map
  }, [transactions, effectiveMonth])

  const categoriesWithBudget = useMemo(() => {
    const all = new Set([...Object.keys(spendingByCategory), ...Object.keys(budgets)])
    return [...all].sort()
  }, [spendingByCategory, budgets])

  const handleSave = useCallback(async (cat) => {
    const val = parseFloat(editVal)
    const updated = { ...budgets }
    if (!isNaN(val) && val > 0) updated[cat] = val
    else delete updated[cat]
    setBudgets(updated)
    await saveBudgets(updated)
    setEditing(null)
  }, [budgets, editVal])

  const handleDelete = useCallback(async (cat) => {
    const updated = { ...budgets }
    delete updated[cat]
    setBudgets(updated)
    await saveBudgets(updated)
  }, [budgets])

  if (categoriesWithBudget.length === 0) return null

  return (
    <div className="card budget-manager-card">
      <div className="budget-manager-header">
        <div className="bm-header-left">
          <Target size={13} />
          <span className="budget-manager-title">Metas de Orçamento</span>
        </div>
        <span className="budget-manager-sub" title={usingDefault ? 'Usando mês atual pois nenhum mês está filtrado' : ''}>
          {monthLabel}{usingDefault && ' ·  atual'}
        </span>
      </div>
      <p className="bm-subtitle">Limite mensal de gastos por categoria</p>

      <div className="budget-list">
        {categoriesWithBudget.map(cat => {
          const spent = spendingByCategory[cat] || 0
          const limit = budgets[cat] || 0
          const isEditing = editing === cat
          const { label, color, bg, pct } = statusInfo(spent, limit)

          return (
            <div key={cat} className="budget-item">
              {/* Row 1: name + status + actions */}
              <div className="budget-item-top">
                <span className="budget-item-name">{cat}</span>
                <div className="bm-item-actions">
                  {!isEditing && limit > 0 && (
                    <span className="bm-status-badge" style={{ color, background: bg }}>{label}</span>
                  )}
                  {!isEditing && (
                    <>
                      <button
                        className="budget-icon-btn"
                        title={limit > 0 ? 'Editar limite' : 'Definir limite'}
                        onClick={() => { setEditing(cat); setEditVal(limit > 0 ? String(limit) : '') }}
                      >
                        <Pencil size={12} />
                      </button>
                      {limit > 0 && (
                        <button
                          className="budget-icon-btn danger"
                          title="Remover limite"
                          onClick={() => handleDelete(cat)}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Edit mode */}
              {isEditing && (
                <div className="budget-edit-row" style={{ marginTop: 6 }}>
                  <span className="budget-edit-prefix">R$</span>
                  <input
                    className="budget-edit-input"
                    type="number"
                    min="0"
                    step="10"
                    placeholder="Limite"
                    value={editVal}
                    autoFocus
                    onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(cat); if (e.key === 'Escape') setEditing(null) }}
                  />
                  <button className="budget-icon-btn accent" onClick={() => handleSave(cat)}><Check size={14} /></button>
                  <button className="budget-icon-btn" onClick={() => setEditing(null)}><X size={14} /></button>
                </div>
              )}

              {/* Row 2: progress bar */}
              {!isEditing && <BudgetBar spent={spent} limit={limit} />}

              {/* Row 3: gasto / limite labels */}
              {!isEditing && (
                <div className="bm-amounts">
                  <span className="bm-amount-item">
                    <span className="bm-amount-label">Gasto</span>
                    <span className="bm-amount-value" style={{ color: limit > 0 && spent > limit ? 'var(--danger)' : 'var(--text-1)' }}>
                      {fmtCurrency(spent)}
                    </span>
                  </span>
                  {limit > 0 ? (
                    <span className="bm-amount-item bm-amount-right">
                      <span className="bm-amount-label">Limite</span>
                      <span className="bm-amount-value">{fmtCurrency(limit)}</span>
                    </span>
                  ) : (
                    <button
                      className="bm-set-limit-btn"
                      onClick={() => { setEditing(cat); setEditVal('') }}
                    >
                      + Definir limite
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
