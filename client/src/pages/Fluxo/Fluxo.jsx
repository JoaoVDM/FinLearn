import { useEffect, useState, useMemo } from 'react'
import { CreditCard, TrendingUp, Scale } from 'lucide-react'
import { getFluxo, deleteFluxo } from '../../services/api.js'
import { showToast } from '../../components/Toast.jsx'
import { fmtCurrency } from '../../utils/format.js'
import TransactionForm from './TransactionForm.jsx'
import TransactionList from './TransactionList.jsx'
import Spinner from '../../components/Spinner.jsx'

export default function Fluxo() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('todos')
  const [monthFilter, setMonthFilter] = useState('')

  useEffect(() => {
    getFluxo().then(data => {
      setTransactions(Array.isArray(data) ? data.sort((a, b) => new Date(b.date) - new Date(a.date)) : [])
      setLoading(false)
    })
  }, [])

  const months = useMemo(() => [...new Set(transactions.map(t => t.date?.slice(0, 7)))].sort().reverse(), [transactions])

  const filtered = useMemo(() => transactions.filter(t => {
    if (typeFilter !== 'todos' && t.type !== typeFilter) return false
    if (monthFilter && !t.date?.startsWith(monthFilter)) return false
    return true
  }), [transactions, typeFilter, monthFilter])

  const totals = useMemo(() => ({
    gastos: filtered.filter(t => t.type === 'gasto').reduce((s, t) => s + t.value, 0),
    investimentos: filtered.filter(t => t.type === 'investimento').reduce((s, t) => s + t.value, 0),
  }), [filtered])

  const saldo = totals.investimentos - totals.gastos

  const handleAdd = (t) => {
    setTransactions(prev => [t, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remover esta transação?')) return
    await deleteFluxo(id)
    setTransactions(prev => prev.filter(t => t.id !== id))
    showToast('Transação removida')
  }

  if (loading) return <Spinner />

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h1>Fluxo de Caixa</h1>
        <p>Registre e acompanhe seus gastos e investimentos.</p>
      </div>
      <div className="fluxo-layout">
        <TransactionForm onAdd={handleAdd} />

        <div className="summary-cards">
          <div className="summary-card gastos">
            <div className="summary-card-label"><CreditCard size={14} /> Gastos</div>
            <div className="summary-card-value">{fmtCurrency(totals.gastos)}</div>
          </div>
          <div className="summary-card investimentos">
            <div className="summary-card-label"><TrendingUp size={14} /> Investimentos</div>
            <div className="summary-card-value">{fmtCurrency(totals.investimentos)}</div>
          </div>
          <div className={`summary-card saldo ${saldo >= 0 ? 'positive' : ''}`}>
            <div className="summary-card-label"><Scale size={14} /> Saldo</div>
            <div className="summary-card-value" style={{ color: saldo >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
              {fmtCurrency(saldo)}
            </div>
          </div>
        </div>

        <div className="filters-row">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="todos">Todos os tipos</option>
            <option value="gasto">Gastos</option>
            <option value="investimento">Investimentos</option>
          </select>
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
            <option value="">Todos os meses</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <TransactionList transactions={filtered} onDelete={handleDelete} />
      </div>
    </div>
  )
}
