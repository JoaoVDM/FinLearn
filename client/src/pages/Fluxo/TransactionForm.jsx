import { useState } from 'react'
import { CreditCard, TrendingUp, Plus, Loader } from 'lucide-react'
import { postFluxo } from '../../services/api.js'
import { showToast } from '../../components/Toast.jsx'

export default function TransactionForm({ onAdd }) {
  const [form, setForm] = useState({ type: 'gasto', description: '', value: '', date: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description || !form.value || !form.date) return
    setSaving(true)
    const result = await postFluxo(form.type, form.description, +form.value, form.date)
    setSaving(false)
    const transaction = result.transaction || (result.id ? result : null)
    if (transaction) {
      onAdd(transaction)
      setForm(f => ({ ...f, description: '', value: '' }))
      showToast('Transação adicionada')
    }
  }

  return (
    <form className="card transaction-form" onSubmit={handleSubmit}>
      <h3 className="transaction-form-title">Nova Transação</h3>
      <div className="transaction-type-group">
        <button
          type="button"
          className={`btn btn-sm ${form.type === 'gasto' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => set('type', 'gasto')}
        >
          <CreditCard size={14} /> Gasto
        </button>
        <button
          type="button"
          className={`btn btn-sm ${form.type === 'investimento' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => set('type', 'investimento')}
        >
          <TrendingUp size={14} /> Investimento
        </button>
      </div>
      <div className="form-group">
        <input className="input" placeholder="Descrição" value={form.description} onChange={e => set('description', e.target.value)} required aria-label="Descrição" />
      </div>
      <div className="transaction-row">
        <input className="input" type="number" placeholder="Valor (R$)" step="0.01" min="0.01" value={form.value} onChange={e => set('value', e.target.value)} required aria-label="Valor" />
        <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} aria-label="Data" />
      </div>
      <button className="btn btn-primary w-full" style={{ marginTop: 12 }} disabled={saving}>
        {saving ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</> : <><Plus size={14} /> Adicionar</>}
      </button>
    </form>
  )
}
