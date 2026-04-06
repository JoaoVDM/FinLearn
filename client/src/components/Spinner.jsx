export default function Spinner({ text = 'Carregando...' }) {
  return (
    <div className="loading">
      <div className="spinner" />
      {text && <span>{text}</span>}
    </div>
  )
}
