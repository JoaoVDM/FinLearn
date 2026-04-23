import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, Check, X } from 'lucide-react'
import { getRecurring, addRecurring, deleteRecurring, generateRecurring } from '../../services/api.js'
import { fmtCurrency, fmtMonth } from '../../utils/format.js'
import { showToast } from '../../components/Toast.jsx'
import { CATEGORIES } from '../../utils/categories.js'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'

const EMPTY_FORM = { type: 'gasto', description: '', value: '', category: '' }

const TYPE_LABELS = { gasto: 'Gasto', investimento: 'Investimento', receita: 'Receita' }

export default function RecurringManager({ onGenerate }) {
  const [templates, setTemplates] = useState([])
  const [generated, setGenerated] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [loadingGenerate, setLoadingGenerate] = useState(false)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentMonthLabel = fmtMonth(currentMonth)
  const alreadyGenerated = generated.includes(currentMonth)

  useEffect(() => {
    getRecurring().then(data => {
      if (data.recurring) setTemplates(data.recurring)
      if (data.recurringGenerated) setGenerated(data.recurringGenerated)
    })
  }, [])

  const handleAdd = useCallback(async () => {
    const val = parseFloat(form.value)
    if (!form.description.trim() || isNaN(val) || val <= 0) return
    const res = await addRecurring(form.type, form.description.trim(), val, form.category.trim())
    if (res.error) {
      showToast(res.message || 'Erro ao salvar recorrente', 'error')
      return
    }
    if (res.template) {
      setTemplates(prev => [...prev, res.template])
      setForm(EMPTY_FORM)
      setShowForm(false)
    }
  }, [form])

  const handleDelete = useCallback(async () => {
    const res = await deleteRecurring(confirmDelete)
    if (res.error) { showToast(res.message || 'Erro ao remover recorrente', 'error'); setConfirmDelete(null); return }
    setTemplates(prev => prev.filter(t => t.id !== confirmDelete))
    setConfirmDelete(null)
    showToast('Recorrente removido')
  }, [confirmDelete])

  const handleGenerate = useCallback(async () => {
    if (alreadyGenerated || templates.length === 0) return
    setLoadingGenerate(true)
    const res = await generateRecurring(currentMonth)
    setLoadingGenerate(false)
    if (res.success) {
      setGenerated(prev => [...prev, currentMonth])
      showToast(`${res.count} transação(ões) lançada(s) para ${currentMonthLabel}`)
      if (onGenerate) onGenerate(res.transactions)
    } else if (res.error) {
      showToast(res.error)
    }
  }, [alreadyGenerated, templates.length, currentMonth, currentMonthLabel, onGenerate])

  return (
    <div className="card recurring-card">
      <ConfirmDialog
        open={!!confirmDelete}
        title="Remover recorrente"
        message="O template será removido. Transações já lançadas não são afetadas."
        confirmLabel="Remover"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="recurring-header">
        <div>
          <span className="recurring-title">Recorrentes</span>
          <span className="recurring-sub">Templates mensais</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {templates.length > 0 && (
            <button
              className={`btn btn-sm${alreadyGenerated ? ' btn-secondary' : ' btn-primary'}`}
              onClick={handleGenerate}
              disabled={alreadyGenerated || loadingGenerate}
              title={alreadyGenerated ? `Já lançado em ${currentMonthLabel}` : `Lançar em ${currentMonthLabel}`}
            >
              {alreadyGenerated
                ? <><Check size={13} /> Lançado</>
                : <><RefreshCw size={13} /> Lançar {currentMonthLabel}</>
              }
            </button>
          )}
          <button className="btn btn-sm btn-secondary" onClick={() => setShowForm(v => !v)}>
            <Plus size={14} /> Novo
          </button>
        </div>
      </div>

      {showForm && (
        <div className="recurring-form">
          <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, category: '' }))}>
            <option value="gasto">Gasto</option>
            <option value="investimento">Investimento</option>
            <option value="receita">Receita</option>
          </select>
          <input
            className="input"
            type="text"
            placeholder="Descrição"
            value={form.description}
            maxLength={80}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <input
            className="input"
            type="number"
            placeholder="Valor (R$)"
            value={form.value}
            min="0"
            step="0.01"
            onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
          />
          <input
            className="input"
            list="recurring-cat-list"
            type="text"
            placeholder="Categoria (opcional)"
            value={form.category}
            maxLength={40}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          />
          <datalist id="recurring-cat-list">
            {(CATEGORIES[form.type] || []).map(c => <option key={c} value={c} />)}
          </datalist>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleAdd}>
              <Check size={14} /> Salvar
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <p className="recurring-empty">Nenhum template. Adicione transações que se repetem todo mês.</p>
      ) : (
        <div className="recurring-list">
          {templates.map(t => (
            <div key={t.id} className="recurring-item">
              <div className="recurring-item-info">
                <span className={`recurring-type-dot ${t.type}`} />
                <div>
                  <span className="recurring-item-desc">{t.description}</span>
                  {t.category && <span className="transaction-category">{t.category}</span>}
                </div>
              </div>
              <div className="recurring-item-right">
                <span className={`recurring-item-value ${t.type}`}>{fmtCurrency(t.value)}</span>
                <span className="recurring-item-type">{TYPE_LABELS[t.type]}</span>
              </div>
              <button
                className="budget-icon-btn danger"
                title="Remover template"
                onClick={() => setConfirmDelete(t.id)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
