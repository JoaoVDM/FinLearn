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
    if (!data.studyDays) data.studyDays = [];
    return data;
  } catch {
    return { completedLessons: [], quizScores: {}, studyDays: [] };
  }
}

function calculateStreak(studyDays) {
  if (!studyDays || studyDays.length === 0) return 0;

  const unique = [...new Set(studyDays)].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < unique.length - 1; i++) {
    const diff = (new Date(unique[i]) - new Date(unique[i + 1])) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
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
    modulesProgress,
    streak: calculateStreak(data.studyDays)
  });
});

// POST /api/progresso
app.post('/api/progresso', async (req, res) => {
  const { lessonId, completed } = req.body;
  if (!lessonId) return res.status(400).json({ error: 'lessonId required' });

  const data = readData();

  if (completed && !data.completedLessons.includes(lessonId)) {
    data.completedLessons.push(lessonId);
    const today = new Date().toISOString().split('T')[0];
    if (!data.studyDays.includes(today)) data.studyDays.push(today);
  } else if (!completed) {
    data.completedLessons = data.completedLessons.filter(id => id !== lessonId);
  }

  await writeData(data);
  res.json({ success: true, completedLessons: data.completedLessons });
});

// POST /api/progresso/reset
app.post('/api/progresso/reset', async (req, res) => {
  await writeData({ completedLessons: [], quizScores: {}, studyDays: [] });
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
