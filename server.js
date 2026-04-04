const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

const DATA_FILE = path.join(__dirname, 'data.json');
const CONTENT_FILE = path.join(__dirname, 'content.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conteúdo carregado uma única vez na inicialização (nunca muda em runtime)
const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8'));

function readData() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (!data.transactions) data.transactions = [];
    return data;
  } catch {
    return { completedLessons: [], quizScores: {}, transactions: [] };
  }
}

async function writeData(data) {
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

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
      id: m.id,
      title: m.title,
      icon: m.icon,
      description: m.description,
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      quizScore
    };
  });

  res.json({
    completedLessons: data.completedLessons,
    quizScores: data.quizScores,
    totalLessons,
    completedCount,
    overallPercent,
    modulesProgress
  });
});

// POST /api/progresso
app.post('/api/progresso', async (req, res) => {
  const { lessonId, completed } = req.body;
  if (!lessonId) return res.status(400).json({ error: 'lessonId required' });

  const data = readData();

  if (completed && !data.completedLessons.includes(lessonId)) {
    data.completedLessons.push(lessonId);
  } else if (!completed) {
    data.completedLessons = data.completedLessons.filter(id => id !== lessonId);
  }

  await writeData(data);
  res.json({ success: true, completedLessons: data.completedLessons });
});

// POST /api/progresso/reset
app.post('/api/progresso/reset', async (req, res) => {
  await writeData({ completedLessons: [], quizScores: {}, transactions: [] });
  res.json({ success: true });
});

// GET /api/quiz/:modulo
app.get('/api/quiz/:modulo', (req, res) => {
  const { modulo } = req.params;
  const questions = content.quizzes[modulo];

  if (!questions) return res.status(404).json({ error: 'Quiz não encontrado' });

  res.json({ modulo, questions });
});

// POST /api/quiz/:modulo
app.post('/api/quiz/:modulo', async (req, res) => {
  const { modulo } = req.params;
  const { score, total, answers } = req.body;

  if (score === undefined || total === undefined) {
    return res.status(400).json({ error: 'score e total são obrigatórios' });
  }

  const data = readData();

  data.quizScores[modulo] = {
    score,
    total,
    percent: Math.round((score / total) * 100),
    answers: answers || [],
    completedAt: new Date().toISOString()
  };

  await writeData(data);
  res.json({ success: true, quizScore: data.quizScores[modulo] });
});

// ── FLUXO DE CAIXA ──────────────────────────────────────────────────────────

// GET /api/fluxo
app.get('/api/fluxo', (req, res) => {
  const data = readData();
  const sorted = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date));
  res.json(sorted);
});

// POST /api/fluxo
app.post('/api/fluxo', async (req, res) => {
  const { type, description, value, date } = req.body;
  if (!type || !description || value === undefined) {
    return res.status(400).json({ error: 'type, description e value são obrigatórios' });
  }
  const parsedValue = parseFloat(value);
  if (isNaN(parsedValue) || parsedValue <= 0) {
    return res.status(400).json({ error: 'value deve ser um número positivo' });
  }
  const data = readData();
  const transaction = {
    id: Date.now().toString(),
    type,
    description: String(description).trim().slice(0, 80),
    value: parsedValue,
    date: date || new Date().toISOString().split('T')[0]
  };
  data.transactions.push(transaction);
  await writeData(data);
  res.json({ success: true, transaction });
});

// DELETE /api/fluxo/:id
app.delete('/api/fluxo/:id', async (req, res) => {
  const { id } = req.params;
  const data = readData();
  data.transactions = data.transactions.filter(t => t.id !== id);
  await writeData(data);
  res.json({ success: true });
});

// ── CONTEÚDO ─────────────────────────────────────────────────────────────────

// GET /api/content/modules — lista de módulos com lições
app.get('/api/content/modules', (req, res) => {
  res.json(content.modules.map(m => ({
    id: m.id,
    title: m.title,
    icon: m.icon,
    description: m.description,
    lessons: m.lessons.map(l => ({ id: l.id, title: l.title }))
  })));
});

// GET /api/content/lesson/:id — conteúdo de uma lição
app.get('/api/content/lesson/:id', (req, res) => {
  const { id } = req.params;

  for (const module of content.modules) {
    const lesson = module.lessons.find(l => l.id === id);
    if (lesson) {
      return res.json({
        ...lesson,
        moduleId: module.id,
        moduleTitle: module.title,
        moduleIcon: module.icon,
        lessons: module.lessons.map(l => ({ id: l.id, title: l.title }))
      });
    }
  }

  res.status(404).json({ error: 'Lição não encontrada' });
});

// GET /api/content/glossary
app.get('/api/content/glossary', (req, res) => {
  res.json(content.glossary);
});

app.listen(PORT, () => {
  console.log(`\n✅ FinLearn rodando em http://localhost:${PORT}\n`);
});
