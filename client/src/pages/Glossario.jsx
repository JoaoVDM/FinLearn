import { useEffect, useState, useMemo, useRef } from 'react'
import { Search, X, SearchX } from 'lucide-react'
import { getGlossary } from '../services/api.js'
import Spinner from '../components/Spinner.jsx'

export default function Glossario() {
  const [terms, setTerms] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const letterRefs = useRef({})

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

  const letters = useMemo(() => {
    const ls = [...new Set(filtered.map(t => t.term[0].toUpperCase()))].sort()
    return ls
  }, [filtered])

  const grouped = useMemo(() => {
    const map = {}
    for (const t of filtered) {
      const l = t.term[0].toUpperCase()
      if (!map[l]) map[l] = []
      map[l].push(t)
    }
    return map
  }, [filtered])

  const scrollTo = (letter) => {
    letterRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

      {!query && letters.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '16px 0' }}>
          {letters.map(l => (
            <button
              key={l}
              onClick={() => scrollTo(l)}
              style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {l}
            </button>
          ))}
        </div>
      )}

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
      ) : query ? (
        <div className="glossary-grid">
          {filtered.map(t => (
            <div key={t.term} className="glossary-card card">
              <h3 className="glossary-term">{t.term}</h3>
              <p className="glossary-def">{t.definition}</p>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {letters.map(l => (
            <div key={l} ref={el => letterRefs.current[l] = el} style={{ marginBottom: 32 }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginBottom: 16, display: 'inline-block', minWidth: 28 }}>{l}</div>
              <div className="glossary-grid">
                {grouped[l].map(t => (
                  <div key={t.term} className="glossary-card card">
                    <h3 className="glossary-term">{t.term}</h3>
                    <p className="glossary-def">{t.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
