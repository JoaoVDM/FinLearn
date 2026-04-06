import { TrendingUp, CreditCard, Trash2, SearchX } from 'lucide-react'
import { fmtCurrency, fmtDate, fmtMonth } from '../../utils/format.js'

export default function TransactionList({ transactions, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state-box">
        <SearchX size={36} className="empty-state-icon" style={{ opacity: 0.35, margin: '0 auto 12px' }} />
        <div className="empty-state-title">Nenhuma transação encontrada</div>
        <div className="empty-state-desc">Adicione um gasto ou investimento acima.</div>
      </div>
    )
  }

  // Agrupar por mês (YYYY-MM)
  const groups = []
  const seen = {}
  for (const t of transactions) {
    const key = t.date?.slice(0, 7) || ''
    if (!seen[key]) { seen[key] = true; groups.push({ key, items: [] }) }
    groups[groups.length - 1].items.push(t)
  }

  return (
    <div>
      {groups.map(({ key, items }) => (
        <div key={key}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 0 6px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
            {fmtMonth(key)}
          </div>
          {items.map(t => (
            <div key={t.id} className="card transaction-item">
              <span className={`transaction-icon ${t.type}`}>
                {t.type === 'gasto' ? <CreditCard size={16} /> : <TrendingUp size={16} />}
              </span>
              <div className="transaction-info">
                <div className="transaction-title">{t.description}</div>
                <div className="transaction-date">{fmtDate(t.date)}</div>
              </div>
              <span className={`transaction-value ${t.type}`}>
                {t.type === 'gasto' ? '−' : '+'}{fmtCurrency(t.value)}
              </span>
              <button className="btn-delete" onClick={() => onDelete(t.id)} title="Remover" aria-label="Remover">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
