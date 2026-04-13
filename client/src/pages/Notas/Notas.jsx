import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { NotebookPen, Search, Trash2, ExternalLink, FileX } from 'lucide-react'
import { getAllNotas, saveNota, deleteNota } from '../../services/api.js'
import { showToast } from '../../components/Toast.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Spinner from '../../components/Spinner.jsx'

function NotaCard({ nota, onDelete, onSave }) {
  const [text, setText] = useState(nota.text)
  const [saved, setSaved] = useState(false)
  const timer = useRef(null)

  const handleChange = useCallback((e) => {
    const val = e.target.value
    setText(val)
    setSaved(false)
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      await onSave(nota.lessonId, val)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 800)
  }, [nota.lessonId, onSave])

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className="nota-card card">
      <div className="nota-card-header">
        <div className="nota-card-meta">
          <span className="nota-module-badge">Módulo {nota.moduleId}</span>
          <Link to={`/licao/${nota.lessonId}`} className="nota-lesson-link">
            {nota.lessonTitle}
            <ExternalLink size={11} />
          </Link>
        </div>
        <div className="nota-card-actions">
          {saved && <span className="nota-saved-indicator">Salvo ✓</span>}
          <button
            className="btn-delete"
            onClick={() => onDelete(nota.lessonId)}
            title="Excluir anotação"
            aria-label="Excluir anotação"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <textarea
        className="nota-card-textarea"
        value={text}
        onChange={handleChange}
        rows={4}
        placeholder="Anotação vazia..."
      />
    </div>
  )
}

export default function Notas() {
  const [notas, setNotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    getAllNotas().then(data => {
      if (!data.error) setNotas(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  const modules = useMemo(() =>
    [...new Map(notas.map(n => [n.moduleId, n.moduleTitle])).entries()]
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
  , [notas])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return notas.filter(n => {
      if (moduleFilter && String(n.moduleId) !== moduleFilter) return false
      if (q && !n.text.toLowerCase().includes(q) && !n.lessonTitle.toLowerCase().includes(q)) return false
      return true
    })
  }, [notas, search, moduleFilter])

  const handleSave = useCallback(async (lessonId, text) => {
    await saveNota(lessonId, text)
    setNotas(prev => prev.map(n => n.lessonId === lessonId ? { ...n, text } : n))
  }, [])

  const handleDelete = useCallback(async () => {
    await deleteNota(confirmId)
    setNotas(prev => prev.filter(n => n.lessonId !== confirmId))
    setConfirmId(null)
    showToast('Anotação excluída')
  }, [confirmId])

  if (loading) return <Spinner />

  return (
    <div className="page-content fade-in">
      <ConfirmDialog
        open={!!confirmId}
        title="Excluir anotação"
        message="A anotação será removida permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />

      <div className="page-header page-header-row">
        <div>
          <h1>Minhas Anotações</h1>
          <p>Todas as suas anotações de lições em um só lugar.</p>
        </div>
        {notas.length > 0 && (
          <span className="nota-total-badge">{notas.length} {notas.length === 1 ? 'anotação' : 'anotações'}</span>
        )}
      </div>

      {notas.length === 0 ? (
        <div className="notas-empty">
          <FileX size={40} style={{ opacity: 0.25, marginBottom: 16 }} />
          <p>Você ainda não tem anotações.</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
            Escreva anotações enquanto estuda as <Link to="/trilha" style={{ color: 'var(--accent)' }}>lições</Link>.
          </p>
        </div>
      ) : (
        <>
          <div className="notas-toolbar">
            <div className="notas-search-wrap">
              <Search size={14} className="notas-search-icon" />
              <input
                className="input notas-search-input"
                placeholder="Buscar por texto ou lição..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Buscar anotações"
              />
            </div>
            <select
              className="input notas-filter-select"
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              aria-label="Filtrar por módulo"
            >
              <option value="">Todos os módulos</option>
              {modules.map(([id, title]) => (
                <option key={id} value={String(id)}>Módulo {id} — {title}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="notas-empty">
              <Search size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p>Nenhuma anotação encontrada para esse filtro.</p>
            </div>
          ) : (
            <div className="notas-grid">
              {filtered.map(nota => (
                <NotaCard
                  key={nota.lessonId}
                  nota={nota}
                  onSave={handleSave}
                  onDelete={(id) => setConfirmId(id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
