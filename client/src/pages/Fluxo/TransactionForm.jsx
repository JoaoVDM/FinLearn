import { useState, useEffect } from 'react'
import { CreditCard, TrendingUp, Wallet, Plus, Loader, Pencil, X } from 'lucide-react'
import { postFluxo, editFluxo } from '../../services/api.js'
import { showToast } from '../../components/Toast.jsx'
import { CATEGORIES } from '../../utils/categories.js'

const EMPTY = { type: 'gasto', description: '', value: '', date: new Date().toISOString().slice(0, 10), category: '' }

export default function TransactionForm({ onAdd, editTransaction, onUpdate, onCancelEdit }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const isEditing = !!editTransaction

  useEffect(() => {
    if (editTransaction) {
      setForm({
        type: editTransaction.type,
        description: editTransaction.description,
        value: String(editTransaction.value),
        date: editTransaction.date,
        category: editTransaction.category || ''
      })
      setErrors({})
    } else {
      setForm(EMPTY)
      setErrors({})
    }
  }, [editTransaction])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }))
  }

  const handleTypeChange = (type) => {
    setForm(f => ({ ...f, type, category: '' }))
    if (errors.type) setErrors(e => ({ ...e, type: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.description.trim()) e.description = 'Descrição obrigatória'
    const v = parseFloat(form.value)
    if (!form.value || isNaN(v) || v <= 0) e.value = 'Informe um valor positivo'
    if (!form.date) e.date = 'Data obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const parsedValue = parseFloat(form.value)
    setSaving(true)

    if (isEditing) {
      const result = await editFluxo(editTransaction.id, form.type, form.description, parsedValue, form.date, form.category)
      setSaving(false)
      if (result.error) { showToast(result.message || 'Erro ao atualizar transação', 'error'); return }
      onUpdate(result.transaction || { ...editTransaction, ...form, value: parsedValue })
    } else {
      const result = await postFluxo(form.type, form.description, parsedValue, form.date, form.category)
      setSaving(false)
      if (result.error) { showToast(result.message || 'Erro ao salvar transação', 'error'); return }
      const transaction = result.transaction || (result.id ? result : null)
      if (transaction) {
        onAdd(transaction)
        setForm(f => ({ ...f, description: '', value: '', category: '' }))
        setErrors({})
        showToast('Transação adicionada')
      }
    }
  }

  const datalistId = `cat-${form.type}`

  return (
    <form className="card transaction-form" onSubmit={handleSubmit}>
      <div className="transaction-form-header">
        <h3 className="transaction-form-title">
          {isEditing ? <><Pencil size={14} /> Editar Transação</> : 'Nova Transação'}
        </h3>
        {isEditing && (
          <button type="button" className="btn-delete" onClick={onCancelEdit} aria-label="Cancelar edição">
            <X size={15} />
          </button>
        )}
      </div>

      <div className="transaction-type-group">
        {[
          { val: 'gasto', Icon: CreditCard, label: 'Gasto' },
          { val: 'investimento', Icon: TrendingUp, label: 'Investimento' },
          { val: 'receita', Icon: Wallet, label: 'Receita' },
        ].map(({ val, Icon, label }) => (
          <button
            key={val}
            type="button"
            className={`btn btn-sm ${form.type === val ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleTypeChange(val)}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="form-group">
        <input
          className={`input${errors.description ? ' input-error' : ''}`}
          placeholder="Descrição"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          aria-label="Descrição"
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      <div className="form-group">
        <input
          className="input"
          list={datalistId}
          placeholder="Categoria (opcional)"
          value={form.category}
          onChange={e => set('category', e.target.value)}
          aria-label="Categoria"
        />
        <datalist id={datalistId}>
          {CATEGORIES[form.type].map(c => <option key={c} value={c} />)}
        </datalist>
      </div>

      <div className="transaction-row">
        <div style={{ flex: 1 }}>
          <input
            className={`input${errors.value ? ' input-error' : ''}`}
            type="number"
            placeholder="Valor (R$)"
            step="0.01"
            min="0.01"
            value={form.value}
            onChange={e => set('value', e.target.value)}
            aria-label="Valor"
          />
          {errors.value && <span className="field-error">{errors.value}</span>}
        </div>
        <div style={{ flex: 1 }}>
          <input
            className={`input${errors.date ? ' input-error' : ''}`}
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            aria-label="Data"
          />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn btn-primary w-full" disabled={saving}>
          {saving
            ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</>
            : isEditing
              ? <><Pencil size={14} /> Salvar alterações</>
              : <><Plus size={14} /> Adicionar</>
          }
        </button>
        {isEditing && (
          <button type="button" className="btn btn-secondary" onClick={onCancelEdit} style={{ flexShrink: 0 }}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
