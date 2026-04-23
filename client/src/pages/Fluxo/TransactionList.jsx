import { TrendingUp, CreditCard, Wallet, Trash2, Pencil, SearchX } from 'lucide-react'
import { fmtCurrency, fmtDate, fmtMonth } from '../../utils/format.js'

const TYPE_ICON = {
  gasto: <CreditCard size={15} />,
  investimento: <TrendingUp size={15} />,
  receita: <Wallet size={15} />,
}

export default function TransactionList({ transactions, editId, onEdit, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state-box">
        <SearchX size={36} className="empty-state-icon" style={{ opacity: 0.35, margin: '0 auto 12px' }} />
        <div className="empty-state-title">Nenhuma transação encontrada</div>
        <div className="empty-state-desc">Adicione uma transação ou ajuste os filtros.</div>
      </div>
    )
  }

  const groupMap = new Map()
  for (const t of transactions) {
    const key = t.date?.slice(0, 7) || ''
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key).push(t)
  }
  const groups = [...groupMap.entries()].map(([key, items]) => ({ key, items }))

  return (
    <div className="fluxo-list-wrap">
      {groups.map(({ key, items }) => {
        const groupTotal = items.reduce((sum, t) => {
          if (t.type === 'gasto') return sum - t.value
          return sum + t.value
        }, 0)

        return (
          <div key={key} className="fluxo-group">
            <div className="fluxo-group-header">
              <span className="fluxo-group-month">{fmtMonth(key)}</span>
              <span className="fluxo-group-meta">
                {items.length} item{items.length !== 1 ? 's' : ''}
                <span
                  className="fluxo-group-balance"
                  style={{ color: groupTotal >= 0 ? 'var(--accent)' : 'var(--danger)' }}
                >
                  {groupTotal >= 0 ? '+' : ''}{fmtCurrency(groupTotal)}
                </span>
              </span>
            </div>

            {items.map(t => (
              <div key={t.id} className={`card transaction-item${editId === t.id ? ' editing' : ''}`}>
                <span className={`transaction-icon ${t.type}`}>
                  {TYPE_ICON[t.type]}
                </span>
                <div className="transaction-info">
                  <div className="transaction-title">{t.description}</div>
                  <div className="transaction-date">
                    {fmtDate(t.date)}
                    {t.category && <span className="transaction-category">{t.category}</span>}
                  </div>
                </div>
                <span className={`transaction-value ${t.type}`}>
                  {t.type === 'gasto' ? '−' : '+'}{fmtCurrency(t.value)}
                </span>
                <button
                  className={`btn-icon-action${editId === t.id ? ' active' : ''}`}
                  onClick={() => onEdit(t.id)}
                  title={editId === t.id ? 'Cancelar edição' : 'Editar'}
                  aria-label={`Editar ${t.description}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="btn-delete"
                  onClick={() => onDelete(t.id)}
                  title="Remover"
                  aria-label={`Remover ${t.description}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
