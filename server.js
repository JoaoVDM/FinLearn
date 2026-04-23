const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3004;

const DATA_FILE = path.join(__dirname, 'data.json');
const CONTENT_FILE = path.join(__dirname, 'content.json');

// ── SEGURANÇA ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── CONTEÚDO (carregado uma única vez) ────────────────────────────────────────
let content;
try {
  content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8'));
} catch (err) {
  console.error('FATAL: falha ao carregar content.json:', err.message);
  process.exit(1);
}

// Índice de lições para lookup O(1)
const lessonIndex = new Map();
const validLessonIds = new Set();
content.modules.forEach(m => {
  m.lessons.forEach(l => {
    lessonIndex.set(l.id, {
      ...l,
      moduleId: m.id,
      moduleTitle: m.title,
      moduleIcon: m.icon,
      lessons: m.lessons.map(x => ({ id: x.id, title: x.title }))
    });
    validLessonIds.add(l.id);
  });
});

const VALID_TYPES = new Set(['gasto', 'investimento', 'receita']);

// ── PERSISTÊNCIA COM CACHE ────────────────────────────────────────────────────
let _dataCache = null;

function readData() {
  if (_dataCache) return _dataCache;
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (!Array.isArray(raw.completedLessons)) raw.completedLessons = [];
    if (!raw.quizScores || typeof raw.quizScores !== 'object') raw.quizScores = {};
    if (!Array.isArray(raw.transactions)) raw.transactions = [];
    if (!raw.notes || typeof raw.notes !== 'object') raw.notes = {};
    if (!raw.budgets || typeof raw.budgets !== 'object') raw.budgets = {};
    if (!Array.isArray(raw.recurring)) raw.recurring = [];
    if (!Array.isArray(raw.recurringGenerated)) raw.recurringGenerated = [];
    if (!Array.isArray(raw.goals)) raw.goals = [];
    _dataCache = raw;
    return raw;
  } catch {
    const fresh = {
      completedLessons: [], quizScores: {}, transactions: [],
      notes: {}, budgets: {}, recurring: [], recurringGenerated: [], goals: []
    };
    _dataCache = fresh;
    return fresh;
  }
}

// Fila de escrita: garante que writes concorrentes não se sobrescrevam
let _writeQueue = Promise.resolve();

async function writeData(data) {
  _dataCache = data; // atualiza cache imediatamente para leituras subsequentes
  _writeQueue = _writeQueue.then(async () => {
    const tmp = DATA_FILE + '.tmp';
    await fs.promises.writeFile(tmp, JSON.stringify(data, null, 2));
    try {
      await fs.promises.rename(tmp, DATA_FILE);
    } catch {
      // Fallback para Windows (rename pode falhar se destino está bloqueado)
      await fs.promises.copyFile(tmp, DATA_FILE);
      await fs.promises.unlink(tmp).catch(() => {});
    }
  }).catch(err => console.error('[writeData] falha ao persistir:', err.message));
  return _writeQueue;
}

// Wrapper para rotas async — evita promessas não tratadas
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── PROGRESSO ─────────────────────────────────────────────────────────────────

// GET /api/progresso
app.get('/api/progresso', (req, res) => {
  const data = readData();
  const totalLessons = content.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = data.completedLessons.length;
  const overallPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const modulesProgress = content.modules.map(m => {
    const total = m.lessons.length;
    const completed = m.lessons.filter(l => data.completedLessons.includes(l.id)).length;
    const quizScore = data.quizScores[String(m.id)] || null;
    return {
      id: m.id, title: m.title, icon: m.icon, description: m.description,
      total, completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      quizScore,
      lessons: m.lessons.map(l => ({ id: l.id, title: l.title }))
    };
  });

  res.json({ completedLessons: data.completedLessons, quizScores: data.quizScores, totalLessons, completedCount, overallPercent, modulesProgress });
});

// POST /api/progresso
app.post('/api/progresso', wrap(async (req, res) => {
  const { lessonId, completed } = req.body;
  if (!lessonId) return res.status(400).json({ error: 'lessonId required' });
  if (!validLessonIds.has(lessonId)) return res.status(400).json({ error: 'lessonId inválido' });

  const data = readData();
  if (completed && !data.completedLessons.includes(lessonId)) {
    data.completedLessons.push(lessonId);
  } else if (!completed) {
    data.completedLessons = data.completedLessons.filter(id => id !== lessonId);
  }
  await writeData(data);
  res.json({ success: true, completedLessons: data.completedLessons });
}));

// POST /api/progresso/reset
app.post('/api/progresso/reset', wrap(async (req, res) => {
  const data = readData();
  // Preserva budgets, recorrentes e metas — reseta apenas progresso de aprendizado e transações
  await writeData({
    completedLessons: [],
    quizScores: {},
    transactions: [],
    notes: {},
    budgets: data.budgets || {},
    recurring: data.recurring || [],
    recurringGenerated: data.recurringGenerated || [],
    goals: data.goals || []
  });
  res.json({ success: true });
}));

// ── NOTAS ─────────────────────────────────────────────────────────────────────

// GET /api/notes  — todas as notas com metadados da lição
app.get('/api/notes', (req, res) => {
  const data = readData();
  const result = Object.entries(data.notes)
    .filter(([, text]) => text && text.trim())
    .map(([lessonId, text]) => {
      const meta = lessonIndex.get(lessonId);
      return {
        lessonId,
        text,
        lessonTitle:  meta?.title       || lessonId,
        moduleId:     meta?.moduleId    || null,
        moduleTitle:  meta?.moduleTitle || null,
      };
    })
    .sort((a, b) => String(a.moduleId).localeCompare(String(b.moduleId)));
  res.json(result);
});

// GET /api/notes/:lessonId
app.get('/api/notes/:lessonId', (req, res) => {
  const { lessonId } = req.params;
  if (!validLessonIds.has(lessonId)) return res.status(400).json({ error: 'lessonId inválido' });
  const data = readData();
  res.json({ lessonId, text: data.notes[lessonId] || '' });
});

// POST /api/notes/:lessonId
app.post('/api/notes/:lessonId', wrap(async (req, res) => {
  const { lessonId } = req.params;
  if (!validLessonIds.has(lessonId)) return res.status(400).json({ error: 'lessonId inválido' });
  const { text } = req.body;
  const data = readData();
  data.notes[lessonId] = String(text || '').slice(0, 2000);
  await writeData(data);
  res.json({ success: true });
}));

// DELETE /api/notes/:lessonId
app.delete('/api/notes/:lessonId', wrap(async (req, res) => {
  const { lessonId } = req.params;
  if (!validLessonIds.has(lessonId)) return res.status(400).json({ error: 'lessonId inválido' });
  const data = readData();
  delete data.notes[lessonId];
  await writeData(data);
  res.json({ success: true });
}));

// ── QUIZ ──────────────────────────────────────────────────────────────────────

// GET /api/quiz/:modulo
app.get('/api/quiz/:modulo', (req, res) => {
  const { modulo } = req.params;
  const questions = content.quizzes[modulo];
  if (!questions) return res.status(404).json({ error: 'Quiz não encontrado' });
  res.json({ modulo, questions });
});

// POST /api/quiz/:modulo
app.post('/api/quiz/:modulo', wrap(async (req, res) => {
  const { modulo } = req.params;
  const { score, total, answers, wrongItems } = req.body;
  if (score === undefined || total === undefined) {
    return res.status(400).json({ error: 'score e total são obrigatórios' });
  }
  if (typeof total !== 'number' || total <= 0) {
    return res.status(400).json({ error: 'total deve ser um número maior que zero' });
  }
  const data = readData();
  data.quizScores[modulo] = {
    score, total,
    percent: Math.round((score / total) * 100),
    answers: answers || [],
    wrongItems: Array.isArray(wrongItems) ? wrongItems : [],
    completedAt: new Date().toISOString()
  };
  await writeData(data);
  res.json({ success: true, quizScore: data.quizScores[modulo] });
}));

// GET /api/quiz/:modulo/review
app.get('/api/quiz/:modulo/review', (req, res) => {
  const { modulo } = req.params;
  const data = readData();
  const quizScore = data.quizScores[modulo];
  if (!quizScore) return res.status(404).json({ error: 'Nenhuma tentativa salva para este módulo' });
  res.json({
    modulo,
    score: quizScore.score,
    total: quizScore.total,
    percent: quizScore.percent,
    completedAt: quizScore.completedAt,
    wrongItems: quizScore.wrongItems || []
  });
});

// ── FLUXO DE CAIXA ────────────────────────────────────────────────────────────

// GET /api/fluxo
app.get('/api/fluxo', (req, res) => {
  const data = readData();
  const sorted = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date));
  res.json(sorted);
});

// POST /api/fluxo
app.post('/api/fluxo', wrap(async (req, res) => {
  const { type, description, value, date, category } = req.body;
  if (!type || !description || value === undefined) {
    return res.status(400).json({ error: 'type, description e value são obrigatórios' });
  }
  if (!VALID_TYPES.has(type)) {
    return res.status(400).json({ error: `type inválido. Use: ${[...VALID_TYPES].join(', ')}` });
  }
  const parsedValue = parseFloat(value);
  if (isNaN(parsedValue) || parsedValue <= 0) {
    return res.status(400).json({ error: 'value deve ser um número positivo' });
  }
  const data = readData();
  const dateStr = date || new Date().toISOString().split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({ error: 'date deve estar no formato YYYY-MM-DD' });
  }
  const transaction = {
    id: Date.now().toString(),
    type,
    description: String(description).trim().slice(0, 80),
    value: parsedValue,
    date: dateStr,
    category: category ? String(category).trim().slice(0, 40) : ''
  };
  data.transactions.push(transaction);
  await writeData(data);
  res.json({ success: true, transaction });
}));

// PUT /api/fluxo/:id
app.put('/api/fluxo/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const { type, description, value, date, category } = req.body;
  if (!type || !description || value === undefined) {
    return res.status(400).json({ error: 'type, description e value são obrigatórios' });
  }
  if (!VALID_TYPES.has(type)) {
    return res.status(400).json({ error: `type inválido. Use: ${[...VALID_TYPES].join(', ')}` });
  }
  const parsedValue = parseFloat(value);
  if (isNaN(parsedValue) || parsedValue <= 0) {
    return res.status(400).json({ error: 'value deve ser um número positivo' });
  }
  const dateStr = date || new Date().toISOString().split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({ error: 'date deve estar no formato YYYY-MM-DD' });
  }
  const data = readData();
  const idx = data.transactions.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Transação não encontrada' });
  data.transactions[idx] = {
    ...data.transactions[idx],
    type,
    description: String(description).trim().slice(0, 80),
    value: parsedValue,
    date: dateStr,
    category: category ? String(category).trim().slice(0, 40) : ''
  };
  await writeData(data);
  res.json({ success: true, transaction: data.transactions[idx] });
}));

// DELETE /api/fluxo/:id
app.delete('/api/fluxo/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const data = readData();
  const before = data.transactions.length;
  data.transactions = data.transactions.filter(t => t.id !== id);
  if (data.transactions.length === before) return res.status(404).json({ error: 'Transação não encontrada' });
  await writeData(data);
  res.json({ success: true });
}));

// ── CONTEÚDO ──────────────────────────────────────────────────────────────────
const CACHE_1_DAY = 'public, max-age=86400';

// GET /api/content/modules
app.get('/api/content/modules', (req, res) => {
  res.set('Cache-Control', CACHE_1_DAY);
  res.json(content.modules.map(m => ({
    id: m.id, title: m.title, icon: m.icon, description: m.description,
    lessons: m.lessons.map(l => ({ id: l.id, title: l.title }))
  })));
});

// GET /api/content/lesson/:id
app.get('/api/content/lesson/:id', (req, res) => {
  const lesson = lessonIndex.get(req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Lição não encontrada' });
  res.set('Cache-Control', CACHE_1_DAY);
  res.json(lesson);
});

// GET /api/content/glossary
app.get('/api/content/glossary', (req, res) => {
  res.set('Cache-Control', CACHE_1_DAY);
  res.json(content.glossary);
});

// ── ORÇAMENTOS ────────────────────────────────────────────────────────────────

// GET /api/budgets
app.get('/api/budgets', (req, res) => {
  const data = readData();
  res.json(data.budgets || {});
});

// POST /api/budgets
app.post('/api/budgets', wrap(async (req, res) => {
  const { budgets } = req.body;
  if (!budgets || typeof budgets !== 'object' || Array.isArray(budgets)) {
    return res.status(400).json({ error: 'budgets deve ser um objeto' });
  }
  const data = readData();
  data.budgets = budgets;
  await writeData(data);
  res.json({ success: true });
}));

// ── RECORRENTES ───────────────────────────────────────────────────────────────

// GET /api/recurring
app.get('/api/recurring', (req, res) => {
  const data = readData();
  res.json({ recurring: data.recurring || [], recurringGenerated: data.recurringGenerated || [] });
});

// POST /api/recurring
app.post('/api/recurring', wrap(async (req, res) => {
  const { type, description, value, category } = req.body;
  if (!type || !description || value === undefined) {
    return res.status(400).json({ error: 'type, description e value são obrigatórios' });
  }
  if (!VALID_TYPES.has(type)) {
    return res.status(400).json({ error: `type inválido. Use: ${[...VALID_TYPES].join(', ')}` });
  }
  const parsedValue = parseFloat(value);
  if (isNaN(parsedValue) || parsedValue <= 0) {
    return res.status(400).json({ error: 'value deve ser um número positivo' });
  }
  const data = readData();
  const template = {
    id: Date.now().toString(),
    type,
    description: String(description).trim().slice(0, 80),
    value: parsedValue,
    category: category ? String(category).trim().slice(0, 40) : ''
  };
  data.recurring.push(template);
  await writeData(data);
  res.json({ success: true, template });
}));

// DELETE /api/recurring/:id
app.delete('/api/recurring/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const data = readData();
  const before = data.recurring.length;
  data.recurring = data.recurring.filter(r => r.id !== id);
  if (data.recurring.length === before) return res.status(404).json({ error: 'Template não encontrado' });
  await writeData(data);
  res.json({ success: true });
}));

// POST /api/recurring/generate/:month  (month = "YYYY-MM")
app.post('/api/recurring/generate/:month', wrap(async (req, res) => {
  const { month } = req.params;
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month deve estar no formato YYYY-MM' });
  }
  const data = readData();
  if (data.recurringGenerated.includes(month)) {
    return res.status(409).json({ error: 'Recorrentes já lançados para este mês' });
  }

  // Data segura: usa o menor entre o dia atual e o último dia do mês alvo
  const [year, mon] = month.split('-').map(Number);
  const lastDayOfMonth = new Date(year, mon, 0).getDate();
  const todayDay = new Date().getDate();
  const safeDay = Math.min(todayDay, lastDayOfMonth);
  const date = `${month}-${safeDay.toString().padStart(2, '0')}`;

  const generated = data.recurring.map(r => ({
    id: `${r.id}-${month}`,
    type: r.type,
    description: r.description,
    value: r.value,
    date,
    category: r.category,
    fromRecurring: true
  }));

  data.transactions.push(...generated);
  data.recurringGenerated.push(month);
  await writeData(data);
  res.json({ success: true, count: generated.length, transactions: generated });
}));

// ── METAS ─────────────────────────────────────────────────────────────────────

// GET /api/goals
app.get('/api/goals', (req, res) => {
  const data = readData();
  res.json(data.goals || []);
});

// POST /api/goals
app.post('/api/goals', wrap(async (req, res) => {
  const { name, goal, initial, rate, months, skipPerYear, currentSaved, rateMode } = req.body;
  if (!name || goal === undefined) return res.status(400).json({ error: 'name e goal são obrigatórios' });
  const parsedGoal = parseFloat(goal);
  if (isNaN(parsedGoal) || parsedGoal <= 0) return res.status(400).json({ error: 'goal deve ser positivo' });
  const data = readData();
  const newGoal = {
    id: Date.now().toString(),
    name: String(name).trim().slice(0, 60),
    goal: parsedGoal,
    initial: parseFloat(initial) || 0,
    rate: parseFloat(rate) || 0,
    months: Math.max(1, parseInt(months) || 12),
    skipPerYear: Math.min(11, Math.max(0, parseInt(skipPerYear) || 0)),
    currentSaved: parseFloat(currentSaved) || 0,
    rateMode: rateMode === 'year' ? 'year' : 'month',
    createdAt: new Date().toISOString()
  };
  data.goals.push(newGoal);
  await writeData(data);
  res.json({ success: true, goal: newGoal });
}));

// PUT /api/goals/:id
app.put('/api/goals/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const { name, goal, initial, rate, months, skipPerYear, currentSaved, rateMode } = req.body;
  const data = readData();
  const idx = data.goals.findIndex(g => g.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Meta não encontrada' });
  const parsedGoal = parseFloat(goal);
  if (isNaN(parsedGoal) || parsedGoal <= 0) return res.status(400).json({ error: 'goal deve ser positivo' });
  data.goals[idx] = {
    ...data.goals[idx],
    name: String(name || data.goals[idx].name).trim().slice(0, 60),
    goal: parsedGoal,
    initial: parseFloat(initial) || 0,
    rate: parseFloat(rate) || 0,
    months: Math.max(1, parseInt(months) || 12),
    skipPerYear: Math.min(11, Math.max(0, parseInt(skipPerYear) || 0)),
    currentSaved: parseFloat(currentSaved) || 0,
    rateMode: rateMode === 'year' ? 'year' : 'month',
  };
  await writeData(data);
  res.json({ success: true, goal: data.goals[idx] });
}));

// DELETE /api/goals/:id
app.delete('/api/goals/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const data = readData();
  const before = data.goals.length;
  data.goals = data.goals.filter(g => g.id !== id);
  if (data.goals.length === before) return res.status(404).json({ error: 'Meta não encontrada' });
  await writeData(data);
  res.json({ success: true });
}));

// ── PESQUISA GLOBAL ───────────────────────────────────────────────────────────

// GET /api/search?q=termo
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q || q.length < 2) return res.json({ results: [] });

  const results = [];
  const data = readData();

  // Pesquisar lições (título + conteúdo)
  content.modules.forEach(m => {
    m.lessons.forEach(l => {
      const haystack = `${l.title} ${l.id} ${l.content || ''}`.toLowerCase();
      if (haystack.includes(q)) {
        results.push({ type: 'lesson', id: l.id, title: l.title, moduleId: m.id, moduleTitle: m.title });
      }
    });
  });

  // Pesquisar glossário
  if (Array.isArray(content.glossary)) {
    content.glossary.forEach(item => {
      const haystack = `${item.term} ${item.definition}`.toLowerCase();
      if (haystack.includes(q)) {
        results.push({ type: 'glossary', term: item.term, definition: item.definition });
      }
    });
  }

  // Pesquisar notas
  Object.entries(data.notes).forEach(([lessonId, text]) => {
    if (!text || !text.trim()) return;
    if (text.toLowerCase().includes(q)) {
      const meta = lessonIndex.get(lessonId);
      results.push({ type: 'note', lessonId, lessonTitle: meta?.title || lessonId, moduleTitle: meta?.moduleTitle || '', preview: text.slice(0, 120) });
    }
  });

  res.json({ results: results.slice(0, 30) });
});

// ── ERROR HANDLER GLOBAL ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`\n✅ FinLearn rodando em http://localhost:${PORT}\n`);
});
