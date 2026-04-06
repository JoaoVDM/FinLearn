import { useEffect, useState, useMemo } from 'react'
import { Search, X, SearchX } from 'lucide-react'
import { getGlossary } from '../services/api.js'
import Spinner from '../components/Spinner.jsx'

export default function Glossario() {
  const [terms, setTerms] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGlossary().then(data => {
      setTerms(Array.isArray(data) ? data.sort((a, b) => a.term.localeCompare(b.term)) : [])
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return q ? terms.filter(t => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)) : terms
  }, [terms, query])

  if (loading) return <Spinner />

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h1>Glossário</h1>
        <p>Termos e conceitos do mercado financeiro</p>
      </div>

      <div className="glossary-search" style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          className="search-input"
          style={{ paddingLeft: 42 }}
          placeholder="Buscar termo ou definição..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4 }}
            aria-label="Limpar busca"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="results-count">
        {query
          ? <>{filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'} para "<strong>{query}</strong>"</>
          : <>{filtered.length} termos</>
        }
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state-box">
          <SearchX size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.35 }} />
          <div className="empty-state-title">Nenhum termo encontrado</div>
          <div className="empty-state-desc">Tente buscar por outro termo ou definição.</div>
        </div>
      ) : (
        <div className="glossary-grid">
          {filtered.map(t => (
            <div key={t.term} className="glossary-card card">
              <h3 className="glossary-term">{t.term}</h3>
              <p className="glossary-def">{t.definition}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
