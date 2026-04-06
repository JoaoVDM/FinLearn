export function runCompound({ initial, monthly, rate, months }) {
  let balance = Number(initial)
  const monthlyRate = Number(rate) / 100
  const rows = []
  let totalInvested = balance
  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + Number(monthly)
    totalInvested += Number(monthly)
    if (m % 12 === 0 || m === months) {
      rows.push({ year: Math.ceil(m / 12), month: m, balance, totalInvested, earnings: balance - totalInvested })
    }
  }
  return rows
}

export function calcRequiredMonthly({ goal, initial, rate, months }) {
  const r = Number(rate) / 100
  const fv = Number(goal)
  const pv = Number(initial)
  const n = Number(months)
  if (r === 0) return (fv - pv) / n
  const fvFactor = Math.pow(1 + r, n)
  return (fv - pv * fvFactor) / ((fvFactor - 1) / r)
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
