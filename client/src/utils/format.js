export const fmt = (n) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const fmtCurrency = (n) => 'R$ ' + fmt(n)
export const fmtDate = (str) => {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return new Date(+y, +m - 1, +d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtMonth = (str) => {
  if (!str) return ''
  const [y, m] = str.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
