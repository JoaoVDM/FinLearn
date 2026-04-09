export function runCompound({ initial, monthly, rate, months, skipPerYear = 0 }) {
  let balance = Number(initial)
  const monthlyRate = Number(rate) / 100
  const rows = []
  let totalInvested = balance
  for (let m = 1; m <= months; m++) {
    const monthInYear = ((m - 1) % 12) + 1
    const contributes = monthInYear > Number(skipPerYear)
    balance = balance * (1 + monthlyRate) + (contributes ? Number(monthly) : 0)
    if (contributes) totalInvested += Number(monthly)
    if (m % 12 === 0 || m === months) {
      rows.push({ year: Math.ceil(m / 12), month: m, balance, totalInvested, earnings: balance - totalInvested })
    }
  }
  return rows
}

export function calcRequiredMonthly({ goal, initial, rate, months, skipPerYear = 0 }) {
  const fv = Number(goal)
  const pv = Number(initial)
  const n = Number(months)

  // Capital inicial já suficiente ou prazo inválido
  if (pv >= fv || n <= 0) return 0

  if (Number(skipPerYear) === 0) {
    const r = Number(rate) / 100
    if (r === 0) return (fv - pv) / n
    const fvFactor = Math.pow(1 + r, n)
    const result = (fv - pv * fvFactor) / ((fvFactor - 1) / r)
    return Math.max(0, result)
  }

  // Busca binária para aportes com meses de pausa
  let lo = 0, hi = fv
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const rows = runCompound({ initial, monthly: mid, rate, months, skipPerYear })
    const finalBalance = rows[rows.length - 1]?.balance || 0
    if (finalBalance < fv) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function convertRate(rate, from, to) {
  if (from === 'year' && to === 'month') return (Math.pow(1 + rate / 100, 1 / 12) - 1) * 100
  if (from === 'month' && to === 'year') return (Math.pow(1 + rate / 100, 12) - 1) * 100
  return rate
}

export function shuffleOptions(questions) {
  return questions.map(q => {
    const opts = q.options.map((text, i) => ({ text, isCorrect: i === q.correct }))
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]]
    }
    const correct = opts.findIndex(o => o.isCorrect)
    return { ...q, options: opts.map(o => o.text), correct }
  })
}
