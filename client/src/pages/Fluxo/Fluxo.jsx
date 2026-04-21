import { useEffect, useState, useMemo, useCallback } from 'react'
import { CreditCard, TrendingUp, Wallet, Scale, Download, SlidersHorizontal, X } from 'lucide-react'
import { getFluxo, deleteFluxo } from '../../services/api.js'
import { showToast } from '../../components/Toast.jsx'
import { fmtCurrency, fmtMonth } from '../../utils/format.js'
import TransactionForm from './TransactionForm.jsx'
import TransactionList from './TransactionList.jsx'
import FluxoChart from './FluxoChart.jsx'
import EvolutionChart from './EvolutionChart.jsx'
import BudgetManager from './BudgetManager.jsx'
import RecurringManager from './RecurringManager.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Spinner from '../../components/Spinner.jsx'

function exportCSV(transactions) {
  const header = 'Data,Tipo,Categoria,Descrição,Valor'
  const rows = transactions.map(t =>
    `${t.date},${t.type},${t.category || ''},"${(t.description || '').replace(/"/g, '""')}",${t.value}`
  )
  const csv = '\uFEFF' + [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fluxo-finlearn-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function Fluxo() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('todos')
  const [monthFilter, setMonthFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    getFluxo().then(data => {
      if (data.error) {
        showToast('Erro ao carregar transações', 'error')
        setLoading(false)
        return
      }
      setTransactions(Array.isArray(data) ? data.sort((a, b) => new Date(b.date) - new Date(a.date)) : [])
      setLoading(false)
    })
  }, [])

  const months = useMemo(() => [...new Set(transactions.map(t => t.date?.slice(0, 7)))].sort().reverse(), [transactions])

  const categories = useMemo(() =>
    [...new Set(transactions.map(t => t.category).filter(Boolean))].sort()
  , [transactions])

  const filtered = useMemo(() => transactions.filter(t => {
    if (typeFilter !== 'todos' && t.type !== typeFilter) return false
    if (monthFilter && !t.date?.startsWith(monthFilter)) return false
    if (categoryFilter && t.category !== categoryFilter) return false
    return true
  }), [transactions, typeFilter, monthFilter, categoryFilter])

  const totals = useMemo(() => ({
    gastos: filtered.filter(t => t.type === 'gasto').reduce((s, t) => s + t.value, 0),
    investimentos: filtered.filter(t => t.type === 'investimento').reduce((s, t) => s + t.value, 0),
    receitas: filtered.filter(t => t.type === 'receita').reduce((s, t) => s + t.value, 0),
  }), [filtered])

  const saldo = totals.receitas - totals.gastos

  const handleAdd = useCallback((t) => {
    setTransactions(prev => [t, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)))
  }, [])

  const handleDelete = useCallback(async () => {
    await deleteFluxo(confirmId)
    setTransactions(prev => prev.filter(t => t.id !== confirmId))
    setConfirmId(null)
    showToast('Transação removida')
  }, [confirmId])

  const hasActiveFilters = typeFilter !== 'todos' || monthFilter || categoryFilter
  const clearFilters = () => { setTypeFilter('todos'); setMonthFilter(''); setCategoryFilter('') }

  if (loading) return <Spinner />

  return (
    <div className="page-content fade-in">
      <ConfirmDialog
        open={!!confirmId}
        title="Remover transação"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />

      <div className="page-header page-header-row">
        <div>
          <h1>Fluxo de Caixa</h1>
          <p>Registre e acompanhe seus gastos e investimentos.</p>
        </div>
        {transactions.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(transactions)} title="Exportar todas as transações como CSV">
            <Download size={14} /> Exportar CSV
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="summary-cards">
        <div className="summary-card receitas">
          <div className="summary-card-label"><Wallet size={14} /> Receitas</div>
          <div className="summary-card-value" style={{ color: 'rgb(99,102,241)' }}>{fmtCurrency(totals.receitas)}</div>
        </div>
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
            {saldo >= 0 ? '+' : ''}{fmtCurrency(saldo)}
          </div>
        </div>
      </div>

      {/* Filters bar — standalone, full width */}
      <div className="fluxo-filters-bar">
        <SlidersHorizontal size={14} className="fluxo-filters-icon" />
        <select className="fluxo-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="todos">Todos os tipos</option>
          <option value="gasto">Gastos</option>
          <option value="investimento">Investimentos</option>
          <option value="receita">Receitas</option>
        </select>
        <select className="fluxo-filter-select" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
          <option value="">Todos os meses</option>
          {months.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
        </select>
        {categories.length > 0 && (
          <select className="fluxo-filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {hasActiveFilters && (
          <button className="btn btn-ghost btn-sm fluxo-filter-clear" onClick={clearFilters}>
            <X size={13} /> Limpar
          </button>
        )}
        <span className="fluxo-filter-count">
          {filtered.length} transaç{filtered.length === 1 ? 'ão' : 'ões'}
        </span>
      </div>

      {/* Main grid: list (primary) | tools (aside) */}
      <div className="fluxo-layout">
        <div className="fluxo-col-left">
          <div className="card fluxo-list-card">
            <div className="fluxo-list-header">
              <span className="fluxo-list-title">Transações</span>
              {filtered.length > 0 && (
                <span className="fluxo-list-count">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <TransactionList transactions={filtered} onDelete={(id) => setConfirmId(id)} />
          </div>
        </div>

        <div className="fluxo-col-right">
          <TransactionForm onAdd={handleAdd} />
          <FluxoChart
            gastos={totals.gastos}
            investimentos={totals.investimentos}
            receitas={totals.receitas}
          />
          <BudgetManager transactions={transactions} activeMonthFilter={monthFilter} />
          <RecurringManager onGenerate={(newTxs) => {
            setTransactions(prev => [...newTxs, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)))
          }} />
        </div>
      </div>

      {/* Evolução Mensal — full width abaixo do grid */}
      <EvolutionChart transactions={transactions} />
    </div>
  )
}
