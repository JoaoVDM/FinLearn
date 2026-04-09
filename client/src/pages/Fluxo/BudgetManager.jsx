import { useEffect, useState, useMemo, useCallback } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { getBudgets, saveBudgets } from '../../services/api.js'
import { fmtCurrency, fmtMonth } from '../../utils/format.js'

function BudgetBar({ spent, limit }) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
  const over = limit > 0 && spent > limit
  const warn = limit > 0 && pct >= 80 && !over
  const color = over ? 'var(--danger)' : warn ? 'var(--warning)' : 'var(--accent)'
  return (
    <div className="budget-bar-track">
      <div className="budget-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function BudgetManager({ transactions, monthFilter }) {
  const [budgets, setBudgets] = useState({})
  const [editing, setEditing] = useState(null) // category key being edited
  const [editVal, setEditVal] = useState('')

  useEffect(() => {
    getBudgets().then(data => setBudgets(data && typeof data === 'object' && !data.error ? data : {}))
  }, [])

  const monthLabel = monthFilter ? fmtMonth(monthFilter) : 'todos os meses'

  // categories with spending from filtered transactions (gastos only)
  const spendingByCategory = useMemo(() => {
    const map = {}
    for (const t of transactions) {
      if (t.type !== 'gasto') continue
      const key = t.category || 'Sem categoria'
      map[key] = (map[key] || 0) + t.value
    }
    return map
  }, [transactions])

  const categoriesWithBudget = useMemo(() => {
    const all = new Set([...Object.keys(spendingByCategory), ...Object.keys(budgets)])
    return [...all].sort()
  }, [spendingByCategory, budgets])

  const handleSave = useCallback(async (cat) => {
    const val = parseFloat(editVal)
    const updated = { ...budgets }
    if (!isNaN(val) && val > 0) {
      updated[cat] = val
    } else {
      delete updated[cat]
    }
    setBudgets(updated)
    await saveBudgets(updated)
    setEditing(null)
  }, [budgets, editVal])

  if (categoriesWithBudget.length === 0) return null

  return (
    <div className="card budget-manager-card">
      <div className="budget-manager-header">
        <span className="budget-manager-title">Metas de Orçamento</span>
        <span className="budget-manager-sub">{monthLabel}</span>
      </div>

      <div className="budget-list">
        {categoriesWithBudget.map(cat => {
          const spent = spendingByCategory[cat] || 0
          const limit = budgets[cat] || 0
          const isEditing = editing === cat
          const over = limit > 0 && spent > limit

          return (
            <div key={cat} className="budget-item">
              <div className="budget-item-top">
                <span className="budget-item-name">{cat}</span>
                <div className="budget-item-right">
                  {isEditing ? (
                    <div className="budget-edit-row">
                      <span className="budget-edit-prefix">R$</span>
                      <input
                        className="budget-edit-input"
                        type="number"
                        min="0"
                        step="10"
                        value={editVal}
                        autoFocus
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(cat); if (e.key === 'Escape') setEditing(null) }}
                      />
                      <button className="budget-icon-btn accent" onClick={() => handleSave(cat)}><Check size={14} /></button>
                      <button className="budget-icon-btn" onClick={() => setEditing(null)}><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="budget-display-row">
                      <span className={`budget-spent${over ? ' over' : ''}`}>{fmtCurrency(spent)}</span>
                      {limit > 0 && <span className="budget-limit">/ {fmtCurrency(limit)}</span>}
                      <button
                        className="budget-icon-btn"
                        title="Definir meta"
                        onClick={() => { setEditing(cat); setEditVal(limit > 0 ? String(limit) : '') }}
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {limit > 0 && <BudgetBar spent={spent} limit={limit} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
