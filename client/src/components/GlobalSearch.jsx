import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, BookMarked, NotebookPen, X } from 'lucide-react'
import { searchGlobal } from '../services/api.js'

const TYPE_ICON = {
  lesson:   <BookOpen size={14} />,
  glossary: <BookMarked size={14} />,
  note:     <NotebookPen size={14} />,
}

const TYPE_LABEL = {
  lesson:   'Lição',
  glossary: 'Glossário',
  note:     'Anotação',
}

function resultHref(item) {
  if (item.type === 'lesson')   return `/licao/${item.id}`
  if (item.type === 'glossary') return `/glossario`
  if (item.type === 'note')     return `/licao/${item.lessonId}`
  return '/'
}

export default function GlobalSearch() {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [active, setActive]   = useState(0)
  const inputRef              = useRef(null)
  const debounceRef           = useRef(null)
  const navigate              = useNavigate()

  // Ctrl+K / Cmd+K opens, or custom event
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    const openHandler = () => setOpen(true)
    window.addEventListener('keydown', handler)
    window.addEventListener('finlearn:search', openHandler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('finlearn:search', openHandler)
    }
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Escape closes
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const doSearch = useCallback((q) => {
    clearTimeout(debounceRef.current)
    if (!q || q.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const res = await searchGlobal(q)
      setResults(res.results || [])
      setActive(0)
      setLoading(false)
    }, 250)
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    doSearch(val)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && results[active]) { go(results[active]) }
  }

  const go = (item) => {
    const href = resultHref(item)
    if (item.type === 'glossary') {
      navigate('/glossario', { state: { term: item.term } })
    } else {
      navigate(href)
    }
    setOpen(false)
  }

  if (!open) return null

  return createPortal(
    <div className="search-backdrop" onClick={() => setOpen(false)} role="presentation">
      <div className="search-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Pesquisa global">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Pesquisar lições, glossário, anotações..."
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {query && (
            <button className="search-clear" onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }} aria-label="Limpar">
              <X size={14} />
            </button>
          )}
        </div>

        {(results.length > 0 || loading || query.length >= 2) && (
          <div className="search-results">
            {loading && <div className="search-empty">Pesquisando...</div>}
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="search-empty">Nenhum resultado para "{query}"</div>
            )}
            {!loading && results.map((item, i) => (
              <button
                key={item.type === 'glossary' ? `glossary-${item.term}` : `${item.type}-${item.id || item.lessonId}`}
                className={`search-result-item${i === active ? ' active' : ''}`}
                onClick={() => go(item)}
                onMouseEnter={() => setActive(i)}
              >
                <span className="search-result-type">
                  {TYPE_ICON[item.type]}
                  {TYPE_LABEL[item.type]}
                </span>
                <span className="search-result-title">
                  {item.type === 'lesson'   && item.title}
                  {item.type === 'glossary' && item.term}
                  {item.type === 'note'     && item.lessonTitle}
                </span>
                <span className="search-result-sub">
                  {item.type === 'lesson'   && `Módulo ${item.moduleId} · ${item.moduleTitle}`}
                  {item.type === 'glossary' && item.definition.slice(0, 60) + (item.definition.length > 60 ? '…' : '')}
                  {item.type === 'note'     && item.preview.slice(0, 60) + (item.preview.length > 60 ? '…' : '')}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="search-footer">
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
          <span><kbd>Esc</kbd> fechar</span>
          <span style={{ marginLeft: 'auto' }}><kbd>Ctrl K</kbd> pesquisar</span>
        </div>
      </div>
    </div>,
    document.body
  )
}
