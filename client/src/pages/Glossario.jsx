import { useEffect, useState, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, X, SearchX } from 'lucide-react'
import { getGlossary } from '../services/api.js'
import Spinner from '../components/Spinner.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function Glossario() {
  const location = useLocation()
  const [terms, setTerms] = useState([])
  const [query, setQuery] = useState(location.state?.term || '')
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
          aria-label="Buscar no glossário"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="glossary-clear-btn"
            aria-label="Limpar busca"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {!query && letters.length > 0 && (
        <div className="glossary-letters">
          {letters.map(l => (
            <button key={l} onClick={() => scrollTo(l)} className="glossary-letter-btn">
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
        <EmptyState icon={SearchX} title="Nenhum termo encontrado" description="Tente buscar por outro termo ou definição." />
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
            <div key={l} ref={el => letterRefs.current[l] = el} className="glossary-letter-section">
              <div className="glossary-letter-heading">{l}</div>
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
